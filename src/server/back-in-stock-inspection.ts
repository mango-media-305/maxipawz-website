import {
    getDatabase,
} from '@netlify/database';

import {
    products,
} from '../data/products';

import type {
    AdminBackInStockData,
    AdminBackInStockSubscription,
    AdminBackInStockSummary,
} from '../types/admin-back-in-stock';

import type {
    BackInStockSubscriptionSource,
    BackInStockSubscriptionStatus,
} from '../types/back-in-stock';

const BACK_IN_STOCK_DISPLAY_LIMIT =
    200;

/*
 * This must stay aligned with the notification worker's automatic retry
 * safety window.
 *
 * A processing claim older than this window is intentionally not retried
 * automatically because the Resend idempotency guarantee may no longer
 * safely cover another delivery attempt.
 */
const AUTOMATIC_RETRY_WINDOW_HOURS =
    20;

interface SubscriptionDatabaseRow {
    id: string;

    product_slug: string;

    variant_id:
    | string
    | null;

    sku: string;

    email: string;

    email_hash: string;

    status:
    BackInStockSubscriptionStatus;

    source:
    BackInStockSubscriptionSource;

    request_count:
    | string
    | number;

    notification_count:
    | string
    | number;

    first_requested_at:
    | string
    | Date;

    last_requested_at:
    | string
    | Date;

    last_attempt_at:
    | string
    | Date
    | null;

    last_notified_at:
    | string
    | Date
    | null;

    cancelled_at:
    | string
    | Date
    | null;

    claim_expires_at:
    | string
    | Date
    | null;

    last_error:
    | string
    | null;

    created_at:
    | string
    | Date;

    updated_at:
    | string
    | Date;

    on_hand:
    | string
    | number;

    reserved:
    | string
    | number;
}

interface SummaryDatabaseRow {
    total:
    | string
    | number;

    active:
    | string
    | number;

    processing:
    | string
    | number;

    notified:
    | string
    | number;

    cancelled:
    | string
    | number;

    manual_review:
    | string
    | number;
}

interface CatalogSelectionLabel {
    productName: string;

    variantLabel?: string;
}

function normalizeInteger(
    value:
        | string
        | number,

    fieldName:
        string,
): number {
    const normalized =
        typeof value ===
            'number'
            ? value
            : Number(
                value,
            );

    if (
        !Number.isSafeInteger(
            normalized,
        )
    ) {
        throw new Error(
            `Back-in-stock inspection field "${fieldName}" contains an invalid integer.`,
        );
    }

    return normalized;
}

function normalizeTimestamp(
    value:
        | string
        | Date,
): string {
    const timestamp =
        value instanceof
            Date
            ? value
            : new Date(
                value,
            );

    if (
        Number.isNaN(
            timestamp.getTime(),
        )
    ) {
        throw new Error(
            'Back-in-stock inspection contains an invalid timestamp.',
        );
    }

    return timestamp
        .toISOString();
}

function normalizeOptionalTimestamp(
    value:
        | string
        | Date
        | null,
): string | undefined {
    if (
        value ===
        null
    ) {
        return undefined;
    }

    return normalizeTimestamp(
        value,
    );
}

function selectionKey(
    productSlug:
        string,

    variantId?:
        string,
): string {
    return `${productSlug}\u0000${variantId ?? ''}`;
}

function buildCatalogLabelMap():
    Map<
        string,
        CatalogSelectionLabel
    > {
    const labels =
        new Map<
            string,
            CatalogSelectionLabel
        >();

    products.forEach(
        (
            product,
        ) => {
            if (
                product.variants
                    ?.length
            ) {
                product.variants.forEach(
                    (
                        variant,
                    ) => {
                        labels.set(
                            selectionKey(
                                product.slug,
                                variant.id,
                            ),
                            {
                                productName:
                                    product.name,

                                variantLabel:
                                    variant.label,
                            },
                        );
                    },
                );

                return;
            }

            labels.set(
                selectionKey(
                    product.slug,
                ),
                {
                    productName:
                        product.name,
                },
            );
        },
    );

    return labels;
}

function maskEmail(
    email:
        string,
): string {
    const normalized =
        email.trim();

    const atIndex =
        normalized.lastIndexOf(
            '@',
        );

    if (
        atIndex <=
        0 ||
        atIndex ===
        normalized.length -
        1
    ) {
        return '***';
    }

    const localPart =
        normalized.slice(
            0,
            atIndex,
        );

    const domain =
        normalized.slice(
            atIndex +
            1,
        );

    const visiblePrefix =
        localPart.charAt(
            0,
        ) ||
        '*';

    return `${visiblePrefix}***@${domain}`;
}

function isManualReview(
    row:
        SubscriptionDatabaseRow,
): boolean {
    if (
        row.status !==
        'processing' ||
        !row.claim_expires_at
    ) {
        return false;
    }

    const claimExpiresAt =
        new Date(
            row.claim_expires_at,
        );

    if (
        Number.isNaN(
            claimExpiresAt.getTime(),
        ) ||
        claimExpiresAt.getTime() >
        Date.now()
    ) {
        return false;
    }

    if (
        !row.last_attempt_at
    ) {
        return true;
    }

    const lastAttemptAt =
        new Date(
            row.last_attempt_at,
        );

    if (
        Number.isNaN(
            lastAttemptAt.getTime(),
        )
    ) {
        return true;
    }

    const retryWindowMilliseconds =
        AUTOMATIC_RETRY_WINDOW_HOURS *
        60 *
        60 *
        1000;

    return (
        lastAttemptAt.getTime() <
        Date.now() -
        retryWindowMilliseconds
    );
}

function mapSubscription(
    row:
        SubscriptionDatabaseRow,

    labels:
        Map<
            string,
            CatalogSelectionLabel
        >,
): AdminBackInStockSubscription {
    const variantId =
        row.variant_id ??
        undefined;

    const catalogLabel =
        labels.get(
            selectionKey(
                row.product_slug,
                variantId,
            ),
        );

    const onHand =
        normalizeInteger(
            row.on_hand,
            'on_hand',
        );

    const reserved =
        normalizeInteger(
            row.reserved,
            'reserved',
        );

    if (
        onHand <
        0 ||
        reserved <
        0 ||
        reserved >
        onHand
    ) {
        throw new Error(
            'Back-in-stock inspection found an invalid inventory state.',
        );
    }

    const lastAttemptAt =
        normalizeOptionalTimestamp(
            row.last_attempt_at,
        );

    const lastNotifiedAt =
        normalizeOptionalTimestamp(
            row.last_notified_at,
        );

    const cancelledAt =
        normalizeOptionalTimestamp(
            row.cancelled_at,
        );

    const claimExpiresAt =
        normalizeOptionalTimestamp(
            row.claim_expires_at,
        );

    return {
        id:
            row.id,

        productSlug:
            row.product_slug,

        productName:
            catalogLabel
                ?.productName ??
            row.product_slug,

        ...(variantId
            ? {
                variantId,
            }
            : {}),

        ...(catalogLabel
            ?.variantLabel
            ? {
                variantLabel:
                    catalogLabel.variantLabel,
            }
            : {}),

        sku:
            row.sku,

        maskedEmail:
            maskEmail(
                row.email,
            ),

        emailHashSuffix:
            row.email_hash.slice(
                -8,
            ),

        status:
            row.status,

        source:
            row.source,

        requestCount:
            normalizeInteger(
                row.request_count,
                'request_count',
            ),

        notificationCount:
            normalizeInteger(
                row.notification_count,
                'notification_count',
            ),

        currentAvailable:
            onHand -
            reserved,

        manualReview:
            isManualReview(
                row,
            ),

        firstRequestedAt:
            normalizeTimestamp(
                row.first_requested_at,
            ),

        lastRequestedAt:
            normalizeTimestamp(
                row.last_requested_at,
            ),

        ...(lastAttemptAt
            ? {
                lastAttemptAt,
            }
            : {}),

        ...(lastNotifiedAt
            ? {
                lastNotifiedAt,
            }
            : {}),

        ...(cancelledAt
            ? {
                cancelledAt,
            }
            : {}),

        ...(claimExpiresAt
            ? {
                claimExpiresAt,
            }
            : {}),

        ...(row.last_error
            ? {
                lastError:
                    row.last_error,
            }
            : {}),

        createdAt:
            normalizeTimestamp(
                row.created_at,
            ),

        updatedAt:
            normalizeTimestamp(
                row.updated_at,
            ),
    };
}

function mapSummary(
    row:
        SummaryDatabaseRow,
): AdminBackInStockSummary {
    return {
        total:
            normalizeInteger(
                row.total,
                'total',
            ),

        active:
            normalizeInteger(
                row.active,
                'active',
            ),

        processing:
            normalizeInteger(
                row.processing,
                'processing',
            ),

        notified:
            normalizeInteger(
                row.notified,
                'notified',
            ),

        cancelled:
            normalizeInteger(
                row.cancelled,
                'cancelled',
            ),

        manualReview:
            normalizeInteger(
                row.manual_review,
                'manual_review',
            ),
    };
}

export async function inspectBackInStockSubscriptions():
    Promise<
        AdminBackInStockData
    > {
    const db =
        getDatabase();

    const [
        subscriptionRows,
        summaryRows,
    ] =
        await Promise.all([
            db.sql`
        SELECT
          subscription.id,
          subscription.product_slug,
          subscription.variant_id,
          subscription.sku,
          subscription.email,
          subscription.email_hash,
          subscription.status,
          subscription.source,
          subscription.request_count,
          subscription.notification_count,
          subscription.first_requested_at,
          subscription.last_requested_at,
          subscription.last_attempt_at,
          subscription.last_notified_at,
          subscription.cancelled_at,
          subscription.claim_expires_at,
          subscription.last_error,
          subscription.created_at,
          subscription.updated_at,

          inventory.on_hand,
          inventory.reserved

        FROM back_in_stock_subscriptions
          AS subscription

        INNER JOIN inventory_items
          AS inventory
          ON inventory.id =
            subscription.inventory_item_id

        ORDER BY
          subscription.last_requested_at DESC,
          subscription.created_at DESC

        LIMIT ${BACK_IN_STOCK_DISPLAY_LIMIT}
      `,

            db.sql`
        SELECT
          COUNT(*) AS total,

          COUNT(*) FILTER (
            WHERE status =
              'active'
          ) AS active,

          COUNT(*) FILTER (
            WHERE status =
              'processing'
          ) AS processing,

          COUNT(*) FILTER (
            WHERE status =
              'notified'
          ) AS notified,

          COUNT(*) FILTER (
            WHERE status =
              'cancelled'
          ) AS cancelled,

          COUNT(*) FILTER (
            WHERE
              status =
                'processing'

              AND claim_expires_at <=
                NOW()

              AND (
                last_attempt_at IS NULL

                OR last_attempt_at <
                  NOW() -
                  make_interval(
                    hours =>
                      ${AUTOMATIC_RETRY_WINDOW_HOURS}
                  )
              )
          ) AS manual_review

        FROM back_in_stock_subscriptions
      `,
        ]);

    const summaryRow =
        summaryRows[0] as
        | SummaryDatabaseRow
        | undefined;

    if (
        !summaryRow
    ) {
        throw new Error(
            'Back-in-stock summary could not be loaded.',
        );
    }

    const labels =
        buildCatalogLabelMap();

    const subscriptions =
        subscriptionRows.map(
            (
                rawRow,
            ) =>
                mapSubscription(
                    rawRow as
                    SubscriptionDatabaseRow,
                    labels,
                ),
        );

    const summary =
        mapSummary(
            summaryRow,
        );

    return {
        subscriptions,

        summary,

        displayLimit:
            BACK_IN_STOCK_DISPLAY_LIMIT,

        truncated:
            summary.total >
            subscriptions.length,
    };
}