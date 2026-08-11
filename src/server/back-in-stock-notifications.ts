import { randomUUID } from 'node:crypto';

import { getDatabase } from '@netlify/database';

import { Resend } from 'resend';

import { products } from '../data/products';

import {
    getEffectiveProductAvailability,
    getInventorySku,
    isInventoryTrackingEnabledForSelection,
} from '../utils/product-inventory';

import { buildBackInStockEmail } from './email/back-in-stock-template';

const MAXIMUM_ERROR_LENGTH = 500;

const DEFAULT_BATCH_LIMIT = 8;

const MAXIMUM_BATCH_LIMIT = 20;

/*
 * Resend currently retains an email idempotency key for 24 hours.
 *
 * We intentionally stop automatic recovery before that boundary.
 * Anything older remains in "processing" for later administrative review
 * instead of risking a duplicate customer email.
 */
const AUTOMATIC_RETRY_WINDOW_HOURS = 20;

const CLAIM_MINUTES = 5;

const SEND_DELAY_MILLISECONDS = 250;

export type BackInStockNotificationMode = 'test' | 'live';

export interface BackInStockNotificationRuntimeConfig {
    enabled: boolean;

    mode: BackInStockNotificationMode;

    apiKey: string;

    fromName: string;

    fromEmail: string;

    replyToEmail?: string;

    sandboxRecipientEmail?: string;

    siteUrl: string;
}

export interface BackInStockNotificationSummary {
    enabled: boolean;

    claimed: number;

    sent: number;

    failed: number;

    cancelled: number;

    manualReview: number;
}

interface NotificationCandidateRow {
    id: string;

    inventory_item_id:
    | string
    | number;

    product_slug: string;

    variant_id:
    | string
    | null;

    sku: string;

    email: string;

    email_hash: string;

    status:
    | 'active'
    | 'processing';

    notification_count:
    | string
    | number;
}

interface CountRow {
    count:
    | string
    | number;
}

interface BackInStockNotificationClaim {
    subscriptionId: string;

    inventoryItemId: string;

    productSlug: string;

    variantId?: string;

    sku: string;

    email: string;

    emailHash: string;

    deliverySequence: number;

    claimToken: string;
}

interface ResolvedNotificationSelection {
    productName: string;

    variantLabel?: string;

    productUrl: string;
}

type DatabaseClient =
    Awaited<
        ReturnType<
            ReturnType<
                typeof getDatabase
            >['pool']['connect']
        >
    >;

class PermanentBackInStockNotificationError
    extends Error {
    constructor(
        message: string,
    ) {
        super(message);

        this.name =
            'PermanentBackInStockNotificationError';
    }
}

function normalizeDatabaseInteger(
    value:
        | string
        | number,

    fieldName: string,
): number {
    const normalized =
        typeof value === 'number'
            ? value
            : Number(value);

    if (
        !Number.isSafeInteger(
            normalized,
        )
    ) {
        throw new Error(
            `Back-in-stock field "${fieldName}" contains an invalid integer.`,
        );
    }

    return normalized;
}

function getSafeErrorMessage(
    error: unknown,
): string {
    if (
        error instanceof Error
    ) {
        return error.message.slice(
            0,
            MAXIMUM_ERROR_LENGTH,
        );
    }

    return 'Unknown back-in-stock notification error.';
}

function delay(
    milliseconds: number,
): Promise<void> {
    return new Promise(
        (
            resolve,
        ) => {
            setTimeout(
                resolve,
                milliseconds,
            );
        },
    );
}

async function withTransaction<T>(
    operation:
        (
            client: DatabaseClient,
        ) => Promise<T>,
): Promise<T> {
    const db =
        getDatabase();

    const client =
        await db.pool.connect();

    try {
        await client.query(
            'BEGIN',
        );

        const result =
            await operation(
                client,
            );

        await client.query(
            'COMMIT',
        );

        return result;
    } catch (
    error
    ) {
        await client
            .query(
                'ROLLBACK',
            )
            .catch(
                () =>
                    undefined,
            );

        throw error;
    } finally {
        client.release();
    }
}

async function claimNextEligibleNotification():
    Promise<
        BackInStockNotificationClaim |
        null
    > {
    return await withTransaction(
        async (
            client,
        ) => {
            const result =
                await client.query(
                    `
            SELECT
              subscription.id,
              subscription.inventory_item_id,
              subscription.product_slug,
              subscription.variant_id,
              subscription.sku,
              subscription.email,
              subscription.email_hash,
              subscription.status,
              subscription.notification_count
            FROM back_in_stock_subscriptions
              AS subscription
            INNER JOIN inventory_items
              AS inventory
              ON inventory.id =
                subscription.inventory_item_id
            WHERE
              (
                subscription.status = 'active'
                OR (
                  subscription.status = 'processing'
                  AND subscription.claim_expires_at <= NOW()
                  AND subscription.last_attempt_at IS NOT NULL
                  AND subscription.last_attempt_at >=
                    NOW() - INTERVAL '${AUTOMATIC_RETRY_WINDOW_HOURS} hours'
                )
              )
              AND inventory.product_slug =
                subscription.product_slug
              AND inventory.variant_id
                IS NOT DISTINCT FROM
                subscription.variant_id
              AND inventory.sku =
                subscription.sku
              AND (
                inventory.on_hand -
                inventory.reserved
              ) > 0
            ORDER BY
              subscription.last_requested_at ASC,
              subscription.created_at ASC
            LIMIT 1
            FOR UPDATE OF subscription
            SKIP LOCKED
          `,
                );

            const row =
                result.rows[0] as
                | NotificationCandidateRow
                | undefined;

            if (
                !row
            ) {
                return null;
            }

            if (
                row.status !==
                'active' &&
                row.status !==
                'processing'
            ) {
                throw new Error(
                    'An invalid back-in-stock subscription state was selected.',
                );
            }

            const notificationCount =
                normalizeDatabaseInteger(
                    row.notification_count,
                    'notification_count',
                );

            if (
                notificationCount <
                0
            ) {
                throw new Error(
                    'Back-in-stock notification count cannot be negative.',
                );
            }

            const claimToken =
                randomUUID();

            const updateResult =
                await client.query(
                    `
            UPDATE back_in_stock_subscriptions
            SET
              status = 'processing',

              claim_token = $2,

              claim_expires_at =
                NOW() + INTERVAL '${CLAIM_MINUTES} minutes',

              last_attempt_at =
                CASE
                  WHEN $3 = 'active'
                    THEN NOW()
                  ELSE last_attempt_at
                END,

              last_error = NULL
            WHERE id = $1
            RETURNING id
          `,
                    [
                        row.id,

                        claimToken,

                        row.status,
                    ],
                );

            if (
                updateResult.rows.length !==
                1
            ) {
                throw new Error(
                    'The back-in-stock notification claim could not be created.',
                );
            }

            return {
                subscriptionId:
                    row.id,

                inventoryItemId:
                    String(
                        row.inventory_item_id,
                    ),

                productSlug:
                    row.product_slug,

                ...(row.variant_id
                    ? {
                        variantId:
                            row.variant_id,
                    }
                    : {}),

                sku:
                    row.sku,

                email:
                    row.email,

                emailHash:
                    row.email_hash,

                deliverySequence:
                    notificationCount +
                    1,

                claimToken,
            };
        },
    );
}

function resolveNotificationSelection(
    claim:
        BackInStockNotificationClaim,

    siteUrl:
        string,
): ResolvedNotificationSelection {
    const product =
        products.find(
            (
                candidate,
            ) =>
                candidate.slug ===
                claim.productSlug,
        );

    if (
        !product
    ) {
        throw new PermanentBackInStockNotificationError(
            'The subscribed product no longer exists in the catalog.',
        );
    }

    const variant =
        claim.variantId
            ? product.variants
                ?.find(
                    (
                        candidate,
                    ) =>
                        candidate.id ===
                        claim.variantId,
                )
            : undefined;

    if (
        claim.variantId &&
        !variant
    ) {
        throw new PermanentBackInStockNotificationError(
            'The subscribed product variant no longer exists in the catalog.',
        );
    }

    if (
        product.variants
            ?.length &&
        !claim.variantId
    ) {
        throw new PermanentBackInStockNotificationError(
            'The subscribed catalog selection is missing its required variant.',
        );
    }

    if (
        product.status !==
        'active'
    ) {
        throw new PermanentBackInStockNotificationError(
            'The subscribed product is no longer active.',
        );
    }

    if (
        getEffectiveProductAvailability(
            product,
            variant,
        ) !==
        'in-stock'
    ) {
        throw new PermanentBackInStockNotificationError(
            'The subscribed selection is no longer eligible for runtime stock notifications.',
        );
    }

    if (
        !isInventoryTrackingEnabledForSelection(
            product,
            variant,
        )
    ) {
        throw new PermanentBackInStockNotificationError(
            'Runtime inventory tracking is no longer enabled for the subscribed selection.',
        );
    }

    const catalogSku =
        getInventorySku(
            product,
            variant,
        )?.trim();

    if (
        !catalogSku ||
        catalogSku !==
        claim.sku
    ) {
        throw new PermanentBackInStockNotificationError(
            'The subscribed inventory SKU no longer matches the catalog.',
        );
    }

    const productUrl =
        new URL(
            `/shop/${encodeURIComponent(product.slug)}`,
            `${siteUrl}/`,
        ).toString();

    return {
        productName:
            product.name,

        ...(variant
            ? {
                variantLabel:
                    variant.label,
            }
            : {}),

        productUrl,
    };
}

async function markNotificationSent(
    claim:
        BackInStockNotificationClaim,
): Promise<void> {
    const db =
        getDatabase();

    const previousNotificationCount =
        claim.deliverySequence -
        1;

    const result =
        await db.sql`
      UPDATE back_in_stock_subscriptions
      SET
        status = 'notified',

        notification_count =
          ${claim.deliverySequence},

        last_notified_at =
          NOW(),

        claim_token =
          NULL,

        claim_expires_at =
          NULL,

        last_error =
          NULL
      WHERE
        id =
          ${claim.subscriptionId}

        AND status =
          'processing'

        AND claim_token =
          ${claim.claimToken}

        AND notification_count =
          ${previousNotificationCount}
      RETURNING id
    `;

    if (
        result.length !==
        1
    ) {
        throw new Error(
            'The delivered back-in-stock notification could not be committed.',
        );
    }
}

async function markNotificationFailed(
    claim:
        BackInStockNotificationClaim,

    error:
        unknown,
): Promise<void> {
    const db =
        getDatabase();

    await db.sql`
    UPDATE back_in_stock_subscriptions
    SET
      last_error =
        ${getSafeErrorMessage(error)}
    WHERE
      id =
        ${claim.subscriptionId}

      AND status =
        'processing'

      AND claim_token =
        ${claim.claimToken}
  `;
}

async function cancelNotificationClaim(
    claim:
        BackInStockNotificationClaim,

    error:
        unknown,
): Promise<void> {
    const db =
        getDatabase();

    const result =
        await db.sql`
      UPDATE back_in_stock_subscriptions
      SET
        status =
          'cancelled',

        cancelled_at =
          NOW(),

        claim_token =
          NULL,

        claim_expires_at =
          NULL,

        last_error =
          ${getSafeErrorMessage(error)}
      WHERE
        id =
          ${claim.subscriptionId}

        AND status =
          'processing'

        AND claim_token =
          ${claim.claimToken}
      RETURNING id
    `;

    if (
        result.length !==
        1
    ) {
        throw new Error(
            'The obsolete back-in-stock notification could not be cancelled.',
        );
    }
}

async function countNotificationsNeedingManualReview():
    Promise<number> {
    const db =
        getDatabase();

    const rows =
        await db.sql<CountRow>`
      SELECT
        COUNT(*) AS count
      FROM back_in_stock_subscriptions
      WHERE
        status =
          'processing'

        AND claim_expires_at <=
          NOW()

        AND (
          last_attempt_at IS NULL
          OR last_attempt_at <
            NOW() - INTERVAL '${AUTOMATIC_RETRY_WINDOW_HOURS} hours'
        )
    `;

    const row =
        rows[0];

    if (
        !row
    ) {
        return 0;
    }

    return normalizeDatabaseInteger(
        row.count,
        'manual_review_count',
    );
}

function validateRuntimeConfig(
    config:
        BackInStockNotificationRuntimeConfig,
): void {
    if (
        !config.enabled
    ) {
        return;
    }

    if (
        !config.apiKey ||
        !config.apiKey.startsWith(
            're_',
        )
    ) {
        throw new Error(
            'A valid Resend API key is required for back-in-stock notifications.',
        );
    }

    if (
        !config.fromName.trim()
    ) {
        throw new Error(
            'A sender name is required for back-in-stock notifications.',
        );
    }

    if (
        !config.fromEmail.includes(
            '@',
        )
    ) {
        throw new Error(
            'A valid sender email is required for back-in-stock notifications.',
        );
    }

    if (
        config.replyToEmail &&
        !config.replyToEmail.includes(
            '@',
        )
    ) {
        throw new Error(
            'The back-in-stock reply-to email is invalid.',
        );
    }

    if (
        config.mode ===
        'test' &&
        !config.sandboxRecipientEmail
    ) {
        throw new Error(
            'A sandbox recipient is required when back-in-stock email mode is test.',
        );
    }

    const parsedSiteUrl =
        new URL(
            config.siteUrl,
        );

    if (
        parsedSiteUrl.protocol !==
        'https:' &&
        parsedSiteUrl.protocol !==
        'http:'
    ) {
        throw new Error(
            'The back-in-stock site URL must use HTTP or HTTPS.',
        );
    }
}

export async function processBackInStockNotifications(
    config:
        BackInStockNotificationRuntimeConfig,

    batchLimit =
        DEFAULT_BATCH_LIMIT,
): Promise<BackInStockNotificationSummary> {
    validateRuntimeConfig(
        config,
    );

    if (
        !config.enabled
    ) {
        return {
            enabled:
                false,

            claimed:
                0,

            sent:
                0,

            failed:
                0,

            cancelled:
                0,

            manualReview:
                await countNotificationsNeedingManualReview(),
        };
    }

    const normalizedBatchLimit =
        Math.min(
            Math.max(
                Math.trunc(
                    batchLimit,
                ),
                1,
            ),
            MAXIMUM_BATCH_LIMIT,
        );

    const resend =
        new Resend(
            config.apiKey,
        );

    const from =
        `${config.fromName} <${config.fromEmail}>`;

    let claimed =
        0;

    let sent =
        0;

    let failed =
        0;

    let cancelled =
        0;

    for (
        let index = 0;
        index < normalizedBatchLimit;
        index += 1
    ) {
        const claim =
            await claimNextEligibleNotification();

        if (
            !claim
        ) {
            break;
        }

        claimed +=
            1;

        try {
            const selection =
                resolveNotificationSelection(
                    claim,
                    config.siteUrl,
                );

            const recipient =
                config.mode ===
                    'test'
                    ? config.sandboxRecipientEmail
                    : claim.email;

            if (
                !recipient
            ) {
                throw new Error(
                    'The back-in-stock notification recipient could not be resolved.',
                );
            }

            const content =
                buildBackInStockEmail({
                    productName:
                        selection.productName,

                    ...(selection.variantLabel
                        ? {
                            variantLabel:
                                selection.variantLabel,
                        }
                        : {}),

                    productUrl:
                        selection.productUrl,

                    siteUrl:
                        config.siteUrl,

                    testMode:
                        config.mode ===
                        'test',
                });

            const result =
                await resend.emails.send(
                    {
                        from,

                        to:
                            recipient,

                        ...(config.replyToEmail
                            ? {
                                replyTo:
                                    config.replyToEmail,
                            }
                            : {}),

                        subject:
                            content.subject,

                        html:
                            content.html,

                        text:
                            content.text,

                        tags: [
                            {
                                name:
                                    'category',

                                value:
                                    'back-in-stock',
                            },

                            {
                                name:
                                    'storefront',

                                value:
                                    'maxipawz',
                            },

                            {
                                name:
                                    'mode',

                                value:
                                    config.mode,
                            },

                            {
                                name:
                                    'subscription_id',

                                value:
                                    claim.subscriptionId,
                            },

                            {
                                name:
                                    'recipient_hash',

                                value:
                                    claim.emailHash,
                            },
                        ],
                    },
                    {
                        idempotencyKey:
                            `back-in-stock/${claim.subscriptionId}/${claim.deliverySequence}`,
                    },
                );

            if (
                result.error
            ) {
                throw new Error(
                    result.error.message,
                );
            }

            if (
                !result.data?.id
            ) {
                throw new Error(
                    'Resend did not return an email ID for the back-in-stock notification.',
                );
            }

            /*
             * Commit only after Resend confirms the request.
             *
             * If the process dies after Resend accepts the email but before this
             * update commits, the next claim uses the same deliverySequence and
             * therefore the same Resend idempotency key.
             */
            await markNotificationSent(
                claim,
            );

            sent +=
                1;
        } catch (
        error
        ) {
            if (
                error instanceof
                PermanentBackInStockNotificationError
            ) {
                await cancelNotificationClaim(
                    claim,
                    error,
                );

                cancelled +=
                    1;
            } else {
                await markNotificationFailed(
                    claim,
                    error,
                );

                failed +=
                    1;
            }

            console.error(
                'Back-in-stock notification delivery failed.',
                {
                    subscriptionId:
                        claim.subscriptionId,

                    productSlug:
                        claim.productSlug,

                    variantId:
                        claim.variantId,

                    error:
                        getSafeErrorMessage(
                            error,
                        ),
                },
            );
        }

        if (
            index <
            normalizedBatchLimit -
            1
        ) {
            await delay(
                SEND_DELAY_MILLISECONDS,
            );
        }
    }

    return {
        enabled:
            true,

        claimed,

        sent,

        failed,

        cancelled,

        manualReview:
            await countNotificationsNeedingManualReview(),
    };
}