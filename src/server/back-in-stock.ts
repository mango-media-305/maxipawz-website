import {
    createHash,
    randomUUID,
} from 'node:crypto';

import {
    getDatabase,
} from '@netlify/database';

import {
    products,
} from '../data/products';

import type {
    BackInStockErrorCode,
    BackInStockSubscriptionInput,
} from '../types/back-in-stock';

import type {
    Product,
    ProductVariant,
} from '../types/product';

import {
    getEffectiveProductAvailability,
    getInventorySku,
    isInventoryTrackingEnabledForSelection,
} from '../utils/product-inventory';

const EMAIL_PATTERN =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAXIMUM_EMAIL_LENGTH =
    254;

interface CatalogInventorySelection {
    product: Product;

    variant?: ProductVariant;

    sku: string;
}

interface LockedInventoryRow {
    id:
    | string
    | number;

    product_slug: string;

    variant_id:
    | string
    | null;

    sku: string;

    on_hand:
    | string
    | number;

    reserved:
    | string
    | number;
}

type DatabaseClient =
    Awaited<
        ReturnType<
            ReturnType<
                typeof getDatabase
            >['pool']['connect']
        >
    >;

export class BackInStockError
    extends Error {
    readonly code:
        BackInStockErrorCode;

    readonly status:
        number;

    constructor(
        code:
            BackInStockErrorCode,

        status:
            number,

        message:
            string,
    ) {
        super(
            message,
        );

        this.name =
            'BackInStockError';

        this.code =
            code;

        this.status =
            status;
    }
}

function normalizeRequiredString(
    value:
        string,

    message:
        string,
): string {
    const normalized =
        value.trim();

    if (
        !normalized
    ) {
        throw new BackInStockError(
            'invalid-request',
            400,
            message,
        );
    }

    return normalized;
}

function normalizeEmail(
    value:
        string,
): string {
    const normalized =
        value
            .trim()
            .toLowerCase();

    if (
        !normalized ||
        normalized.length >
        MAXIMUM_EMAIL_LENGTH ||
        !EMAIL_PATTERN.test(
            normalized,
        )
    ) {
        throw new BackInStockError(
            'invalid-email',
            400,
            'Please enter a valid email address.',
        );
    }

    return normalized;
}

function hashEmail(
    email:
        string,
): string {
    return createHash(
        'sha256',
    )
        .update(
            email,
            'utf8',
        )
        .digest(
            'hex',
        );
}

function resolveCatalogSelection(
    productSlugValue:
        string,

    variantIdValue?:
        string,
): CatalogInventorySelection {
    const productSlug =
        normalizeRequiredString(
            productSlugValue,
            'A product is required.',
        );

    const variantId =
        variantIdValue
            ?.trim() ||
        undefined;

    const product =
        products.find(
            (
                candidate,
            ) =>
                candidate.slug ===
                productSlug,
        );

    if (
        !product
    ) {
        throw new BackInStockError(
            'product-not-found',
            404,
            'This product could not be found.',
        );
    }

    const hasVariants =
        Boolean(
            product.variants
                ?.length,
        );

    let variant:
        ProductVariant |
        undefined;

    if (
        hasVariants
    ) {
        if (
            !variantId
        ) {
            throw new BackInStockError(
                'variant-required',
                400,
                'Select an option before requesting a back-in-stock alert.',
            );
        }

        variant =
            product.variants
                ?.find(
                    (
                        candidate,
                    ) =>
                        candidate.id ===
                        variantId,
                );

        if (
            !variant
        ) {
            throw new BackInStockError(
                'variant-not-found',
                404,
                'This product option could not be found.',
            );
        }
    } else if (
        variantId
    ) {
        throw new BackInStockError(
            'invalid-request',
            400,
            'This product does not use inventory variants.',
        );
    }

    /*
     * Back-in-stock alerts are only for runtime inventory depletion.
     *
     * Static "coming-soon", "out-of-stock", or "discontinued"
     * merchandising states must not accidentally become notification
     * subscriptions.
     */
    if (
        getEffectiveProductAvailability(
            product,
            variant,
        ) !==
        'in-stock'
    ) {
        throw new BackInStockError(
            'not-eligible',
            409,
            'Back-in-stock alerts are not available for this selection.',
        );
    }

    if (
        !isInventoryTrackingEnabledForSelection(
            product,
            variant,
        )
    ) {
        throw new BackInStockError(
            'not-eligible',
            409,
            'Back-in-stock alerts are not available for this selection.',
        );
    }

    const sku =
        getInventorySku(
            product,
            variant,
        )?.trim();

    if (
        !sku
    ) {
        throw new BackInStockError(
            'inventory-error',
            503,
            'Stock could not be verified right now. Please try again.',
        );
    }

    return {
        product,

        ...(variant
            ? {
                variant,
            }
            : {}),

        sku,
    };
}

function normalizeDatabaseInteger(
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
        throw new BackInStockError(
            'inventory-error',
            503,
            `Inventory field "${fieldName}" is invalid.`,
        );
    }

    return normalized;
}

async function withTransaction<T>(
    operation:
        (
            client:
                DatabaseClient,
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

async function lockInventorySelection(
    client:
        DatabaseClient,

    productSlug:
        string,

    variantId?:
        string,
): Promise<LockedInventoryRow> {
    const result =
        await client.query(
            `
        SELECT
            id,
            product_slug,
            variant_id,
            sku,
            on_hand,
            reserved
            FROM inventory_items
            WHERE
            product_slug = $1
            AND variant_id
                IS NOT DISTINCT FROM $2
            FOR SHARE
        `,
            [
                productSlug,

                variantId ??
                null,
            ],
        );

    const row =
        result.rows[0] as
        | LockedInventoryRow
        | undefined;

    if (
        !row
    ) {
        throw new BackInStockError(
            'inventory-error',
            503,
            'Stock could not be verified right now. Please try again.',
        );
    }

    return row;
}

export async function subscribeToBackInStock(
    input:
        BackInStockSubscriptionInput,
): Promise<void> {
    const selection =
        resolveCatalogSelection(
            input.productSlug,
            input.variantId,
        );

    const email =
        normalizeEmail(
            input.email,
        );

    const emailHash =
        hashEmail(
            email,
        );

    await withTransaction(
        async (
            client,
        ) => {
            /*
             * Lock the inventory row while eligibility is checked and the
             * subscription is written.
             *
             * Inventory mutations requiring an exclusive row lock cannot
             * change availability between this check and the subscription
             * commit.
             */
            const inventory =
                await lockInventorySelection(
                    client,
                    selection.product.slug,
                    selection.variant
                        ?.id,
                );

            if (
                inventory.sku !==
                selection.sku
            ) {
                throw new BackInStockError(
                    'inventory-error',
                    503,
                    'Stock could not be verified right now. Please try again.',
                );
            }

            const onHand =
                normalizeDatabaseInteger(
                    inventory.on_hand,
                    'on_hand',
                );

            const reserved =
                normalizeDatabaseInteger(
                    inventory.reserved,
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
                throw new BackInStockError(
                    'inventory-error',
                    503,
                    'Stock could not be verified right now. Please try again.',
                );
            }

            const available =
                onHand -
                reserved;

            if (
                available >
                0
            ) {
                throw new BackInStockError(
                    'already-in-stock',
                    409,
                    'This item is currently in stock. Refresh the product page to purchase it.',
                );
            }

            const id =
                randomUUID();

            /*
             * inventory_item_id + email_hash is unique.
             *
             * Repeated requests therefore reactivate/update the same
             * subscription rather than creating duplicates.
             *
             * If a delivery worker already owns a processing claim, that
             * claim is intentionally preserved.
             */
            await client.query(
                `
            INSERT INTO back_in_stock_subscriptions (
                id,
                inventory_item_id,
                product_slug,
                variant_id,
                sku,
                email,
                email_hash,
                status,
                source,
                request_count,
                notification_count,
                first_requested_at,
                last_requested_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                'active',
                $8,
                1,
                0,
                NOW(),
                NOW()
            )
            ON CONFLICT (
                inventory_item_id,
                email_hash
            )
            DO UPDATE
            SET
                product_slug =
                EXCLUDED.product_slug,

                variant_id =
                EXCLUDED.variant_id,

                sku =
                EXCLUDED.sku,

                email =
                EXCLUDED.email,

                source =
                EXCLUDED.source,

                status =
                CASE
                    WHEN back_in_stock_subscriptions.status = 'processing'
                    THEN 'processing'
                    ELSE 'active'
                END,

                request_count =
                back_in_stock_subscriptions.request_count + 1,

                last_requested_at =
                NOW(),

                cancelled_at =
                CASE
                    WHEN back_in_stock_subscriptions.status = 'processing'
                    THEN back_in_stock_subscriptions.cancelled_at
                    ELSE NULL
                END,

                claim_token =
                CASE
                    WHEN back_in_stock_subscriptions.status = 'processing'
                    THEN back_in_stock_subscriptions.claim_token
                    ELSE NULL
                END,

                claim_expires_at =
                CASE
                    WHEN back_in_stock_subscriptions.status = 'processing'
                    THEN back_in_stock_subscriptions.claim_expires_at
                    ELSE NULL
                END,

                last_error =
                CASE
                    WHEN back_in_stock_subscriptions.status = 'processing'
                    THEN back_in_stock_subscriptions.last_error
                    ELSE NULL
                END,

                updated_at =
                NOW()
        `,
                [
                    id,

                    inventory.id,

                    selection.product.slug,

                    selection.variant
                        ?.id ??
                    null,

                    selection.sku,

                    email,

                    emailHash,

                    input.source,
                ],
            );
        },
    );
}