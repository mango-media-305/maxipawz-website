import {
    getDatabase,
} from '@netlify/database';

import type {
    InventoryItem,
    InventoryStockStatus,
    PublicInventorySnapshot,
} from '../types/inventory';

interface InventoryDatabaseRow {
    id:
        | string
        | number;

    product_slug: string;

    variant_id:
        | string
        | null;

    sku: string;

    on_hand:
        | number
        | string;

    reserved:
        | number
        | string;

    low_stock_threshold:
        | number
        | string;

    reorder_threshold:
        | number
        | string
        | null;

    created_at:
        | string
        | Date;

    updated_at:
        | string
        | Date;
}

function normalizeInteger(
    value:
        | number
        | string,
    fieldName: string,
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
            `Inventory field "${fieldName}" contains an invalid integer.`,
        );
    }

    return normalized;
}

function normalizeOptionalInteger(
    value:
        | number
        | string
        | null,
    fieldName: string,
): number | undefined {
    if (
        value ===
        null
    ) {
        return undefined;
    }

    return normalizeInteger(
        value,
        fieldName,
    );
}

function normalizeTimestamp(
    value:
        | string
        | Date,
): string {
    if (
        value instanceof
        Date
    ) {
        return value.toISOString();
    }

    const date =
        new Date(
            value,
        );

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        throw new Error(
            'Inventory contains an invalid timestamp.',
        );
    }

    return date.toISOString();
}

function getInventoryStatus(
    available: number,
    lowStockThreshold: number,
): InventoryStockStatus {
    if (
        available <=
        0
    ) {
        return 'sold-out';
    }

    if (
        available <=
        lowStockThreshold
    ) {
        return 'low-stock';
    }

    return 'in-stock';
}

function mapInventoryRow(
    row:
        InventoryDatabaseRow,
): InventoryItem {
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

    const lowStockThreshold =
        normalizeInteger(
            row.low_stock_threshold,
            'low_stock_threshold',
        );

    const reorderThreshold =
        normalizeOptionalInteger(
            row.reorder_threshold,
            'reorder_threshold',
        );

    const available =
        Math.max(
            0,
            onHand -
                reserved,
        );

    const reorderRecommended =
        reorderThreshold !==
            undefined &&
        available <=
            reorderThreshold;

    return {
        id:
            String(
                row.id,
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

        onHand,

        reserved,

        available,

        lowStockThreshold,

        ...(reorderThreshold !==
            undefined
            ? {
                reorderThreshold,
            }
            : {}),

        reorderRecommended,

        status:
            getInventoryStatus(
                available,
                lowStockThreshold,
            ),

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

export async function getInventoryItem(
    productSlug: string,
    variantId?: string,
): Promise<
    InventoryItem |
    undefined
> {
    const db =
        getDatabase();

    const rows =
        await db.sql`
            SELECT
                id,
                product_slug,
                variant_id,
                sku,
                on_hand,
                reserved,
                low_stock_threshold,
                reorder_threshold,
                created_at,
                updated_at
            FROM inventory_items
            WHERE
                product_slug = ${productSlug}
                AND variant_id IS NOT DISTINCT FROM ${variantId ?? null}
            LIMIT 1
        `;

    const row =
        rows[0] as
            | InventoryDatabaseRow
            | undefined;

    if (!row) {
        return undefined;
    }

    return mapInventoryRow(
        row,
    );
}

export async function getInventoryItemBySku(
    sku: string,
): Promise<
    InventoryItem |
    undefined
> {
    const db =
        getDatabase();

    const rows =
        await db.sql`
            SELECT
                id,
                product_slug,
                variant_id,
                sku,
                on_hand,
                reserved,
                low_stock_threshold,
                reorder_threshold,
                created_at,
                updated_at
            FROM inventory_items
            WHERE sku = ${sku}
            LIMIT 1
        `;

    const row =
        rows[0] as
            | InventoryDatabaseRow
            | undefined;

    if (!row) {
        return undefined;
    }

    return mapInventoryRow(
        row,
    );
}

export async function getInventoryItemsForProduct(
    productSlug: string,
): Promise<
    InventoryItem[]
> {
    const db =
        getDatabase();

    const rows =
        await db.sql`
            SELECT
                id,
                product_slug,
                variant_id,
                sku,
                on_hand,
                reserved,
                low_stock_threshold,
                reorder_threshold,
                created_at,
                updated_at
            FROM inventory_items
            WHERE product_slug = ${productSlug}
            ORDER BY
                variant_id NULLS FIRST,
                sku ASC
        `;

    return rows.map(
        (row) =>
            mapInventoryRow(
                row as
                    InventoryDatabaseRow,
            ),
    );
}

export async function getPublicInventorySnapshot(
    productSlug: string,
    variantId?: string,
): Promise<
    PublicInventorySnapshot
> {
    const inventory =
        await getInventoryItem(
            productSlug,
            variantId,
        );

    if (!inventory) {
        return {
            tracked:
                false,

            productSlug,

            ...(variantId
                ? {
                    variantId,
                }
                : {}),

            status:
                'not-tracked',

            available:
                null,

            canPurchase:
                false,
        };
    }

    return {
        tracked:
            true,

        productSlug:
            inventory
                .productSlug,

        ...(inventory.variantId
            ? {
                variantId:
                    inventory
                        .variantId,
            }
            : {}),

        sku:
            inventory.sku,

        status:
            inventory.status,

        available:
            inventory.available,

        canPurchase:
            inventory.available >
            0,
    };
}