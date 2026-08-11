import {
    getDatabase,
} from '@netlify/database';

import {
    products,
} from '../data/products';

import type {
    AdminInventoryAdjustment,
    AdminInventoryAdjustmentAction,
    AdminInventoryCatalogSelection,
    AdminInventoryErrorCode,
    AdminInventoryListData,
    AdminInventoryMutationData,
    AdminInventoryMutationRequest,
} from '../types/admin-inventory';

import type {
    InventoryItem,
} from '../types/inventory';

import type {
    Product,
    ProductVariant,
} from '../types/product';

import {
    getInventoryItem,
    listInventoryItems,
} from './inventory';

const MAXIMUM_STOCK_QUANTITY =
    1_000_000;

const MAXIMUM_THRESHOLD =
    1_000_000;

const MAXIMUM_REASON_LENGTH =
    500;

const RECENT_ADJUSTMENT_LIMIT =
    75;

type DatabaseClient =
    Awaited<
        ReturnType<
            ReturnType<
                typeof getDatabase
            >['pool']['connect']
        >
    >;

interface CatalogSelection {
    productSlug: string;

    productName: string;

    productStatus:
        Product['status'];

    availability:
        Product['availability'];

    isDemo: boolean;

    trackInventory: boolean;

    variantId?: string;

    variantLabel?: string;

    sku?: string;
}

interface ManageableCatalogSelection
    extends CatalogSelection {
    sku: string;
}

interface LockedInventoryDatabaseRow {
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

    low_stock_threshold:
        | string
        | number;

    reorder_threshold:
        | string
        | number
        | null;

    updated_at:
        | string
        | Date;
}

interface InventoryAdjustmentDatabaseRow {
    id:
        | string
        | number;

    inventory_item_id:
        | string
        | number
        | null;

    product_slug: string;

    variant_id:
        | string
        | null;

    sku: string;

    action:
        AdminInventoryAdjustmentAction;

    quantity_delta:
        | string
        | number
        | null;

    previous_on_hand:
        | string
        | number
        | null;

    next_on_hand:
        | string
        | number
        | null;

    reserved_at_change:
        | string
        | number;

    previous_low_stock_threshold:
        | string
        | number
        | null;

    next_low_stock_threshold:
        | string
        | number
        | null;

    previous_reorder_threshold:
        | string
        | number
        | null;

    next_reorder_threshold:
        | string
        | number
        | null;

    reason: string;

    created_at:
        | string
        | Date;
}

interface InventoryState {
    onHand: number;

    reserved: number;

    lowStockThreshold: number;

    reorderThreshold:
        number |
        null;
}

interface AdjustmentInsert {
    inventoryItemId:
        | string
        | number;

    productSlug: string;

    variantId?:
        string;

    sku: string;

    action:
        AdminInventoryAdjustmentAction;

    quantityDelta:
        number |
        null;

    previousOnHand:
        number |
        null;

    nextOnHand:
        number |
        null;

    reservedAtChange:
        number;

    previousLowStockThreshold:
        number |
        null;

    nextLowStockThreshold:
        number |
        null;

    previousReorderThreshold:
        number |
        null;

    nextReorderThreshold:
        number |
        null;

    reason: string;
}

export class InventoryManagementError
    extends Error {
    readonly status: number;

    readonly code:
        AdminInventoryErrorCode;

    constructor(
        status: number,
        code:
            AdminInventoryErrorCode,
        message: string,
    ) {
        super(
            message,
        );

        this.name =
            'InventoryManagementError';

        this.status =
            status;

        this.code =
            code;
    }
}

function isRecord(
    value: unknown,
): value is Record<
    string,
    unknown
> {
    return (
        typeof value ===
            'object' &&
        value !==
            null &&
        !Array.isArray(
            value,
        )
    );
}

function optionalString(
    value: unknown,
): string | undefined {
    if (
        typeof value !==
        'string'
    ) {
        return undefined;
    }

    const normalized =
        value.trim();

    return normalized ||
        undefined;
}

function requiredString(
    value: unknown,
    message: string,
): string {
    const normalized =
        optionalString(
            value,
        );

    if (!normalized) {
        throw new InventoryManagementError(
            400,
            'invalid-request',
            message,
        );
    }

    return normalized;
}

function parseReason(
    value: unknown,
): string {
    const reason =
        requiredString(
            value,
            'Enter a reason for this inventory change.',
        );

    if (
        reason.length >
        MAXIMUM_REASON_LENGTH
    ) {
        throw new InventoryManagementError(
            400,
            'invalid-request',
            `Inventory reasons cannot exceed ${MAXIMUM_REASON_LENGTH} characters.`,
        );
    }

    return reason;
}

function parseExpectedUpdatedAt(
    value: unknown,
): string {
    const rawValue =
        requiredString(
            value,
            'Refresh inventory before making this change.',
        );

    const timestamp =
        new Date(
            rawValue,
        );

    if (
        Number.isNaN(
            timestamp.getTime(),
        )
    ) {
        throw new InventoryManagementError(
            400,
            'invalid-request',
            'The inventory version timestamp is invalid. Refresh inventory and try again.',
        );
    }

    return timestamp
        .toISOString();
}

function parseInteger(
    value: unknown,
    fieldName: string,
): number {
    if (
        typeof value !==
            'number' ||
        !Number.isSafeInteger(
            value,
        )
    ) {
        throw new InventoryManagementError(
            400,
            'invalid-request',
            `${fieldName} must be a whole number.`,
        );
    }

    return value;
}

function parseStockQuantity(
    value: unknown,
    fieldName: string,
): number {
    const quantity =
        parseInteger(
            value,
            fieldName,
        );

    if (
        quantity <
            0 ||
        quantity >
            MAXIMUM_STOCK_QUANTITY
    ) {
        throw new InventoryManagementError(
            400,
            'inventory-limit-exceeded',
            `${fieldName} must be between 0 and ${MAXIMUM_STOCK_QUANTITY}.`,
        );
    }

    return quantity;
}

function parseQuantityDelta(
    value: unknown,
): number {
    const quantityDelta =
        parseInteger(
            value,
            'Quantity adjustment',
        );

    if (
        quantityDelta ===
        0
    ) {
        throw new InventoryManagementError(
            400,
            'no-change',
            'The inventory adjustment must change the on-hand quantity.',
        );
    }

    if (
        Math.abs(
            quantityDelta,
        ) >
        MAXIMUM_STOCK_QUANTITY
    ) {
        throw new InventoryManagementError(
            400,
            'inventory-limit-exceeded',
            `The inventory adjustment cannot exceed ${MAXIMUM_STOCK_QUANTITY} units.`,
        );
    }

    return quantityDelta;
}

function parseThreshold(
    value: unknown,
    fieldName: string,
): number {
    const threshold =
        parseInteger(
            value,
            fieldName,
        );

    if (
        threshold <
            0 ||
        threshold >
            MAXIMUM_THRESHOLD
    ) {
        throw new InventoryManagementError(
            400,
            'inventory-limit-exceeded',
            `${fieldName} must be between 0 and ${MAXIMUM_THRESHOLD}.`,
        );
    }

    return threshold;
}

function parseNullableThreshold(
    value: unknown,
): number | null {
    if (
        value ===
        null
    ) {
        return null;
    }

    return parseThreshold(
        value,
        'Reorder threshold',
    );
}

export function parseAdminInventoryMutationRequest(
    value: unknown,
): AdminInventoryMutationRequest {
    if (
        !isRecord(
            value,
        )
    ) {
        throw new InventoryManagementError(
            400,
            'invalid-request',
            'The inventory request is invalid.',
        );
    }

    const action =
        requiredString(
            value.action,
            'Select an inventory action.',
        );

    const productSlug =
        requiredString(
            value.productSlug,
            'A product is required.',
        );

    const variantId =
        optionalString(
            value.variantId,
        );

    const reason =
        parseReason(
            value.reason,
        );

    const selection = {
        productSlug,

        ...(variantId
            ? {
                variantId,
            }
            : {}),

        reason,
    };

    if (
        action ===
        'provision'
    ) {
        const reorderThreshold =
            value.reorderThreshold ===
                undefined
                ? null
                : parseNullableThreshold(
                    value.reorderThreshold,
                );

        return {
            action,

            ...selection,

            onHand:
                parseStockQuantity(
                    value.onHand,
                    'On-hand quantity',
                ),

            lowStockThreshold:
                parseThreshold(
                    value.lowStockThreshold,
                    'Low-stock threshold',
                ),

            reorderThreshold,
        };
    }

    const expectedUpdatedAt =
        parseExpectedUpdatedAt(
            value.expectedUpdatedAt,
        );

    if (
        action ===
        'adjust-on-hand'
    ) {
        return {
            action,

            ...selection,

            expectedUpdatedAt,

            quantityDelta:
                parseQuantityDelta(
                    value.quantityDelta,
                ),
        };
    }

    if (
        action ===
        'set-on-hand'
    ) {
        return {
            action,

            ...selection,

            expectedUpdatedAt,

            onHand:
                parseStockQuantity(
                    value.onHand,
                    'On-hand quantity',
                ),
        };
    }

    if (
        action ===
        'set-thresholds'
    ) {
        if (
            !Object.prototype
                .hasOwnProperty.call(
                    value,
                    'reorderThreshold',
                )
        ) {
            throw new InventoryManagementError(
                400,
                'invalid-request',
                'The reorder threshold must be a whole number or null.',
            );
        }

        return {
            action,

            ...selection,

            expectedUpdatedAt,

            lowStockThreshold:
                parseThreshold(
                    value.lowStockThreshold,
                    'Low-stock threshold',
                ),

            reorderThreshold:
                parseNullableThreshold(
                    value.reorderThreshold,
                ),
        };
    }

    throw new InventoryManagementError(
        400,
        'invalid-request',
        'The requested inventory action is invalid.',
    );
}

function getEffectiveAvailability(
    product: Product,
    variant?: ProductVariant,
): Product['availability'] {
    return (
        variant?.availability ??
        product.availability
    );
}

function getTrackInventory(
    product: Product,
    variant?: ProductVariant,
): boolean {
    return (
        variant?.trackInventory ??
        product.trackInventory ??
        false
    );
}

function getCatalogSelections():
    CatalogSelection[] {
    const selections:
        CatalogSelection[] = [];

    products.forEach(
        (product) => {
            if (
                product.variants
                    ?.length
            ) {
                product.variants.forEach(
                    (variant) => {
                        const sku =
                            variant.sku
                                ?.trim();

                        selections.push({
                            productSlug:
                                product.slug,

                            productName:
                                product.name,

                            productStatus:
                                product.status,

                            availability:
                                getEffectiveAvailability(
                                    product,
                                    variant,
                                ),

                            isDemo:
                                Boolean(
                                    product.isDemo,
                                ),

                            trackInventory:
                                getTrackInventory(
                                    product,
                                    variant,
                                ),

                            variantId:
                                variant.id,

                            variantLabel:
                                variant.label,

                            ...(sku
                                ? {
                                    sku,
                                }
                                : {}),
                        });
                    },
                );

                return;
            }

            const sku =
                product.sku
                    ?.trim();

            selections.push({
                productSlug:
                    product.slug,

                productName:
                    product.name,

                productStatus:
                    product.status,

                availability:
                    product.availability,

                isDemo:
                    Boolean(
                        product.isDemo,
                    ),

                trackInventory:
                    getTrackInventory(
                        product,
                    ),

                ...(sku
                    ? {
                        sku,
                    }
                    : {}),
            });
        },
    );

    return selections;
}

function resolveCatalogSelection(
    productSlug: string,
    variantId?: string,
): CatalogSelection {
    const product =
        products.find(
            (
                candidate,
            ) =>
                candidate.slug ===
                productSlug,
        );

    if (!product) {
        throw new InventoryManagementError(
            404,
            'catalog-selection-not-found',
            'The selected product could not be found in the catalog.',
        );
    }

    const hasVariants =
        Boolean(
            product.variants
                ?.length,
        );

    if (
        hasVariants &&
        !variantId
    ) {
        throw new InventoryManagementError(
            400,
            'catalog-selection-not-found',
            `${product.name} requires a variant selection.`,
        );
    }

    if (
        !hasVariants &&
        variantId
    ) {
        throw new InventoryManagementError(
            400,
            'catalog-selection-not-found',
            `${product.name} does not use inventory variants.`,
        );
    }

    if (variantId) {
        const variant =
            product.variants?.find(
                (
                    candidate,
                ) =>
                    candidate.id ===
                    variantId,
            );

        if (!variant) {
            throw new InventoryManagementError(
                404,
                'catalog-selection-not-found',
                `The selected ${product.name} variant could not be found.`,
            );
        }

        const sku =
            variant.sku
                ?.trim();

        return {
            productSlug:
                product.slug,

            productName:
                product.name,

            productStatus:
                product.status,

            availability:
                getEffectiveAvailability(
                    product,
                    variant,
                ),

            isDemo:
                Boolean(
                    product.isDemo,
                ),

            trackInventory:
                getTrackInventory(
                    product,
                    variant,
                ),

            variantId:
                variant.id,

            variantLabel:
                variant.label,

            ...(sku
                ? {
                    sku,
                }
                : {}),
        };
    }

    const sku =
        product.sku
            ?.trim();

    return {
        productSlug:
            product.slug,

        productName:
            product.name,

        productStatus:
            product.status,

        availability:
            product.availability,

        isDemo:
            Boolean(
                product.isDemo,
            ),

        trackInventory:
            getTrackInventory(
                product,
            ),

        ...(sku
            ? {
                sku,
            }
            : {}),
    };
}

function requireManageableSelection(
    productSlug: string,
    variantId?: string,
): ManageableCatalogSelection {
    const selection =
        resolveCatalogSelection(
            productSlug,
            variantId,
        );

    if (!selection.sku) {
        throw new InventoryManagementError(
            409,
            'catalog-sku-missing',
            selection.variantLabel
                ? `${selection.productName} — ${selection.variantLabel} does not have a SKU configured in the catalog.`
                : `${selection.productName} does not have a SKU configured in the catalog.`,
        );
    }

    return {
        ...selection,

        sku:
            selection.sku,
    };
}

function selectionKey(
    productSlug: string,
    variantId?: string,
): string {
    return `${productSlug}\u0000${variantId ?? ''}`;
}

function normalizeDatabaseInteger(
    value:
        | string
        | number,
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
        throw new InventoryManagementError(
            500,
            'inventory-error',
            `Inventory field "${fieldName}" contains an invalid integer.`,
        );
    }

    return normalized;
}

function normalizeOptionalDatabaseInteger(
    value:
        | string
        | number
        | null,
    fieldName: string,
): number | undefined {
    if (
        value ===
        null
    ) {
        return undefined;
    }

    return normalizeDatabaseInteger(
        value,
        fieldName,
    );
}

function normalizeDatabaseTimestamp(
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
        throw new InventoryManagementError(
            500,
            'inventory-error',
            'Inventory data contains an invalid timestamp.',
        );
    }

    return timestamp
        .toISOString();
}

function mapAdjustment(
    row:
        InventoryAdjustmentDatabaseRow,
): AdminInventoryAdjustment {
    const quantityDelta =
        normalizeOptionalDatabaseInteger(
            row.quantity_delta,
            'quantity_delta',
        );

    const previousOnHand =
        normalizeOptionalDatabaseInteger(
            row.previous_on_hand,
            'previous_on_hand',
        );

    const nextOnHand =
        normalizeOptionalDatabaseInteger(
            row.next_on_hand,
            'next_on_hand',
        );

    const previousLowStockThreshold =
        normalizeOptionalDatabaseInteger(
            row.previous_low_stock_threshold,
            'previous_low_stock_threshold',
        );

    const nextLowStockThreshold =
        normalizeOptionalDatabaseInteger(
            row.next_low_stock_threshold,
            'next_low_stock_threshold',
        );

    const previousReorderThreshold =
        normalizeOptionalDatabaseInteger(
            row.previous_reorder_threshold,
            'previous_reorder_threshold',
        );

    const nextReorderThreshold =
        normalizeOptionalDatabaseInteger(
            row.next_reorder_threshold,
            'next_reorder_threshold',
        );

    return {
        id:
            String(
                row.id,
            ),

        ...(row.inventory_item_id !==
            null
            ? {
                inventoryItemId:
                    String(
                        row.inventory_item_id,
                    ),
            }
            : {}),

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

        action:
            row.action,

        ...(quantityDelta !==
            undefined
            ? {
                quantityDelta,
            }
            : {}),

        ...(previousOnHand !==
            undefined
            ? {
                previousOnHand,
            }
            : {}),

        ...(nextOnHand !==
            undefined
            ? {
                nextOnHand,
            }
            : {}),

        reservedAtChange:
            normalizeDatabaseInteger(
                row.reserved_at_change,
                'reserved_at_change',
            ),

        ...(previousLowStockThreshold !==
            undefined
            ? {
                previousLowStockThreshold,
            }
            : {}),

        ...(nextLowStockThreshold !==
            undefined
            ? {
                nextLowStockThreshold,
            }
            : {}),

        ...(previousReorderThreshold !==
            undefined
            ? {
                previousReorderThreshold,
            }
            : {}),

        ...(nextReorderThreshold !==
            undefined
            ? {
                nextReorderThreshold,
            }
            : {}),

        reason:
            row.reason,

        createdAt:
            normalizeDatabaseTimestamp(
                row.created_at,
            ),
    };
}

function normalizeInventoryState(
    row:
        LockedInventoryDatabaseRow,
): InventoryState {
    return {
        onHand:
            normalizeDatabaseInteger(
                row.on_hand,
                'on_hand',
            ),

        reserved:
            normalizeDatabaseInteger(
                row.reserved,
                'reserved',
            ),

        lowStockThreshold:
            normalizeDatabaseInteger(
                row.low_stock_threshold,
                'low_stock_threshold',
            ),

        reorderThreshold:
            row.reorder_threshold ===
                null
                ? null
                : normalizeDatabaseInteger(
                    row.reorder_threshold,
                    'reorder_threshold',
                ),
    };
}

function variantsMatch(
    first:
        string |
        null,
    second?: string,
): boolean {
    return (
        first ??
        undefined
    ) === second;
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
    } catch (error) {
        await client
            .query(
                'ROLLBACK',
            )
            .catch(
                () => undefined,
            );

        throw error;
    } finally {
        client.release();
    }
}

function getDatabaseErrorCode(
    error: unknown,
): string | undefined {
    if (
        typeof error !==
            'object' ||
        error ===
            null ||
        !(
            'code' in
            error
        )
    ) {
        return undefined;
    }

    const code =
        (
            error as {
                code?: unknown;
            }
        ).code;

    return typeof code ===
        'string'
        ? code
        : undefined;
}

async function lockConfiguredInventory(
    client:
        DatabaseClient,
    selection:
        ManageableCatalogSelection,
): Promise<
    LockedInventoryDatabaseRow
> {
    const result =
        await client.query(
            `
                SELECT
                    id,
                    product_slug,
                    variant_id,
                    sku,
                    on_hand,
                    reserved,
                    low_stock_threshold,
                    reorder_threshold,
                    updated_at
                FROM inventory_items
                WHERE
                    product_slug = $1
                    AND variant_id
                        IS NOT DISTINCT FROM $2
                FOR UPDATE
            `,
            [
                selection.productSlug,

                selection.variantId ??
                null,
            ],
        );

    const inventory =
        result.rows[0] as
        | LockedInventoryDatabaseRow
        | undefined;

    if (!inventory) {
        throw new InventoryManagementError(
            404,
            'inventory-not-configured',
            'Inventory has not been provisioned for this catalog selection.',
        );
    }

    if (
        inventory.sku !==
        selection.sku
    ) {
        throw new InventoryManagementError(
            409,
            'inventory-conflict',
            `The database SKU "${inventory.sku}" does not match catalog SKU "${selection.sku}".`,
        );
    }

    return inventory;
}

function assertExpectedInventoryVersion(
    row:
        LockedInventoryDatabaseRow,
    expectedUpdatedAt: string,
): void {
    const expected =
        parseExpectedUpdatedAt(
            expectedUpdatedAt,
        );

    const current =
        normalizeDatabaseTimestamp(
            row.updated_at,
        );

    if (
        current !==
        expected
    ) {
        throw new InventoryManagementError(
            409,
            'inventory-stale',
            'Inventory changed since this dashboard view was loaded. The latest inventory has been refreshed; review it and try again.',
        );
    }
}

async function insertAdjustment(
    client:
        DatabaseClient,
    adjustment:
        AdjustmentInsert,
): Promise<
    AdminInventoryAdjustment
> {
    const result =
        await client.query(
            `
                INSERT INTO inventory_adjustments (
                    inventory_item_id,
                    product_slug,
                    variant_id,
                    sku,
                    action,
                    quantity_delta,
                    previous_on_hand,
                    next_on_hand,
                    reserved_at_change,
                    previous_low_stock_threshold,
                    next_low_stock_threshold,
                    previous_reorder_threshold,
                    next_reorder_threshold,
                    reason
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    $9,
                    $10,
                    $11,
                    $12,
                    $13,
                    $14
                )
                RETURNING
                    id,
                    inventory_item_id,
                    product_slug,
                    variant_id,
                    sku,
                    action,
                    quantity_delta,
                    previous_on_hand,
                    next_on_hand,
                    reserved_at_change,
                    previous_low_stock_threshold,
                    next_low_stock_threshold,
                    previous_reorder_threshold,
                    next_reorder_threshold,
                    reason,
                    created_at
            `,
            [
                adjustment
                    .inventoryItemId,

                adjustment
                    .productSlug,

                adjustment
                    .variantId ??
                null,

                adjustment.sku,

                adjustment.action,

                adjustment
                    .quantityDelta,

                adjustment
                    .previousOnHand,

                adjustment
                    .nextOnHand,

                adjustment
                    .reservedAtChange,

                adjustment
                    .previousLowStockThreshold,

                adjustment
                    .nextLowStockThreshold,

                adjustment
                    .previousReorderThreshold,

                adjustment
                    .nextReorderThreshold,

                adjustment.reason,
            ],
        );

    const row =
        result.rows[0] as
        | InventoryAdjustmentDatabaseRow
        | undefined;

    if (!row) {
        throw new InventoryManagementError(
            500,
            'inventory-error',
            'The inventory audit record could not be created.',
        );
    }

    return mapAdjustment(
        row,
    );
}

async function getInventoryAfterMutation(
    selection:
        ManageableCatalogSelection,
): Promise<InventoryItem> {
    const inventory =
        await getInventoryItem(
            selection.productSlug,
            selection.variantId,
        );

    if (!inventory) {
        throw new InventoryManagementError(
            500,
            'inventory-error',
            'The updated inventory item could not be reloaded.',
        );
    }

    if (
        inventory.sku !==
        selection.sku
    ) {
        throw new InventoryManagementError(
            500,
            'inventory-error',
            'The updated inventory item no longer matches the catalog SKU.',
        );
    }

    return inventory;
}

async function provisionInventory(
    request:
        Extract<
            AdminInventoryMutationRequest,
            {
                action:
                    'provision';
            }
        >,
    selection:
        ManageableCatalogSelection,
): Promise<
    AdminInventoryMutationData
> {
    let adjustment:
        AdminInventoryAdjustment;

    try {
        adjustment =
            await withTransaction(
                async (
                    client,
                ) => {
                    const conflicts =
                        await client.query(
                            `
                                SELECT
                                    id,
                                    product_slug,
                                    variant_id,
                                    sku,
                                    on_hand,
                                    reserved,
                                    low_stock_threshold,
                                    reorder_threshold,
                                    updated_at
                                FROM inventory_items
                                WHERE
                                    sku = $1
                                    OR (
                                        product_slug = $2
                                        AND variant_id
                                            IS NOT DISTINCT FROM $3
                                    )
                                ORDER BY id ASC
                                FOR UPDATE
                            `,
                            [
                                selection.sku,

                                selection
                                    .productSlug,

                                selection
                                    .variantId ??
                                null,
                            ],
                        );

                    if (
                        conflicts.rows
                            .length >
                        0
                    ) {
                        const exactMatch =
                            conflicts.rows.some(
                                (
                                    rawRow,
                                ) => {
                                    const row =
                                        rawRow as
                                        LockedInventoryDatabaseRow;

                                    return (
                                        row.sku ===
                                            selection.sku &&
                                        row.product_slug ===
                                            selection.productSlug &&
                                        variantsMatch(
                                            row.variant_id,
                                            selection.variantId,
                                        )
                                    );
                                },
                            );

                        throw new InventoryManagementError(
                            409,
                            exactMatch
                                ? 'inventory-already-configured'
                                : 'inventory-conflict',
                            exactMatch
                                ? 'Inventory is already provisioned for this catalog selection.'
                                : 'The catalog SKU or product selection conflicts with an existing inventory record.',
                        );
                    }

                    const insertResult =
                        await client.query(
                            `
                                INSERT INTO inventory_items (
                                    product_slug,
                                    variant_id,
                                    sku,
                                    on_hand,
                                    reserved,
                                    low_stock_threshold,
                                    reorder_threshold
                                )
                                VALUES (
                                    $1,
                                    $2,
                                    $3,
                                    $4,
                                    0,
                                    $5,
                                    $6
                                )
                                RETURNING id
                            `,
                            [
                                selection
                                    .productSlug,

                                selection
                                    .variantId ??
                                null,

                                selection.sku,

                                request.onHand,

                                request
                                    .lowStockThreshold,

                                request
                                    .reorderThreshold ??
                                null,
                            ],
                        );

                    const inserted =
                        insertResult
                            .rows[0] as
                        | {
                            id:
                                | string
                                | number;
                        }
                        | undefined;

                    if (!inserted) {
                        throw new InventoryManagementError(
                            500,
                            'inventory-error',
                            'The inventory item could not be provisioned.',
                        );
                    }

                    return await insertAdjustment(
                        client,
                        {
                            inventoryItemId:
                                inserted.id,

                            productSlug:
                                selection
                                    .productSlug,

                            variantId:
                                selection
                                    .variantId,

                            sku:
                                selection.sku,

                            action:
                                'provision',

                            quantityDelta:
                                request.onHand,

                            previousOnHand:
                                null,

                            nextOnHand:
                                request.onHand,

                            reservedAtChange:
                                0,

                            previousLowStockThreshold:
                                null,

                            nextLowStockThreshold:
                                request
                                    .lowStockThreshold,

                            previousReorderThreshold:
                                null,

                            nextReorderThreshold:
                                request
                                    .reorderThreshold ??
                                null,

                            reason:
                                request.reason,
                        },
                    );
                },
            );
    } catch (error) {
        if (
            getDatabaseErrorCode(
                error,
            ) ===
            '23505'
        ) {
            throw new InventoryManagementError(
                409,
                'inventory-conflict',
                'Inventory was provisioned concurrently or conflicts with an existing SKU.',
            );
        }

        throw error;
    }

    return {
        action:
            request.action,

        inventory:
            await getInventoryAfterMutation(
                selection,
            ),

        adjustment,
    };
}

async function adjustInventoryOnHand(
    request:
        Extract<
            AdminInventoryMutationRequest,
            {
                action:
                    'adjust-on-hand';
            }
        >,
    selection:
        ManageableCatalogSelection,
): Promise<
    AdminInventoryMutationData
> {
    const adjustment =
        await withTransaction(
            async (
                client,
            ) => {
                const row =
                    await lockConfiguredInventory(
                        client,
                        selection,
                    );

                assertExpectedInventoryVersion(
                    row,
                    request.expectedUpdatedAt,
                );

                const state =
                    normalizeInventoryState(
                        row,
                    );

                const nextOnHand =
                    state.onHand +
                    request.quantityDelta;

                if (
                    nextOnHand <
                    state.reserved
                ) {
                    throw new InventoryManagementError(
                        409,
                        'inventory-below-reserved',
                        `On-hand inventory cannot be reduced below ${state.reserved} currently reserved unit${state.reserved === 1 ? '' : 's'}.`,
                    );
                }

                if (
                    nextOnHand <
                        0 ||
                    nextOnHand >
                        MAXIMUM_STOCK_QUANTITY
                ) {
                    throw new InventoryManagementError(
                        400,
                        'inventory-limit-exceeded',
                        `The resulting on-hand quantity must be between 0 and ${MAXIMUM_STOCK_QUANTITY}.`,
                    );
                }

                await client.query(
                    `
                        UPDATE inventory_items
                        SET on_hand = $1
                        WHERE id = $2
                    `,
                    [
                        nextOnHand,
                        row.id,
                    ],
                );

                return await insertAdjustment(
                    client,
                    {
                        inventoryItemId:
                            row.id,

                        productSlug:
                            selection
                                .productSlug,

                        variantId:
                            selection
                                .variantId,

                        sku:
                            selection.sku,

                        action:
                            'adjust-on-hand',

                        quantityDelta:
                            request
                                .quantityDelta,

                        previousOnHand:
                            state.onHand,

                        nextOnHand,

                        reservedAtChange:
                            state.reserved,

                        previousLowStockThreshold:
                            state
                                .lowStockThreshold,

                        nextLowStockThreshold:
                            state
                                .lowStockThreshold,

                        previousReorderThreshold:
                            state
                                .reorderThreshold,

                        nextReorderThreshold:
                            state
                                .reorderThreshold,

                        reason:
                            request.reason,
                    },
                );
            },
        );

    return {
        action:
            request.action,

        inventory:
            await getInventoryAfterMutation(
                selection,
            ),

        adjustment,
    };
}

async function setInventoryOnHand(
    request:
        Extract<
            AdminInventoryMutationRequest,
            {
                action:
                    'set-on-hand';
            }
        >,
    selection:
        ManageableCatalogSelection,
): Promise<
    AdminInventoryMutationData
> {
    const adjustment =
        await withTransaction(
            async (
                client,
            ) => {
                const row =
                    await lockConfiguredInventory(
                        client,
                        selection,
                    );

                assertExpectedInventoryVersion(
                    row,
                    request.expectedUpdatedAt,
                );

                const state =
                    normalizeInventoryState(
                        row,
                    );

                if (
                    request.onHand ===
                    state.onHand
                ) {
                    throw new InventoryManagementError(
                        400,
                        'no-change',
                        'The requested on-hand quantity is already current.',
                    );
                }

                if (
                    request.onHand <
                    state.reserved
                ) {
                    throw new InventoryManagementError(
                        409,
                        'inventory-below-reserved',
                        `On-hand inventory cannot be reduced below ${state.reserved} currently reserved unit${state.reserved === 1 ? '' : 's'}.`,
                    );
                }

                await client.query(
                    `
                        UPDATE inventory_items
                        SET on_hand = $1
                        WHERE id = $2
                    `,
                    [
                        request.onHand,
                        row.id,
                    ],
                );

                return await insertAdjustment(
                    client,
                    {
                        inventoryItemId:
                            row.id,

                        productSlug:
                            selection
                                .productSlug,

                        variantId:
                            selection
                                .variantId,

                        sku:
                            selection.sku,

                        action:
                            'set-on-hand',

                        quantityDelta:
                            request.onHand -
                            state.onHand,

                        previousOnHand:
                            state.onHand,

                        nextOnHand:
                            request.onHand,

                        reservedAtChange:
                            state.reserved,

                        previousLowStockThreshold:
                            state
                                .lowStockThreshold,

                        nextLowStockThreshold:
                            state
                                .lowStockThreshold,

                        previousReorderThreshold:
                            state
                                .reorderThreshold,

                        nextReorderThreshold:
                            state
                                .reorderThreshold,

                        reason:
                            request.reason,
                    },
                );
            },
        );

    return {
        action:
            request.action,

        inventory:
            await getInventoryAfterMutation(
                selection,
            ),

        adjustment,
    };
}

async function setInventoryThresholds(
    request:
        Extract<
            AdminInventoryMutationRequest,
            {
                action:
                    'set-thresholds';
            }
        >,
    selection:
        ManageableCatalogSelection,
): Promise<
    AdminInventoryMutationData
> {
    const adjustment =
        await withTransaction(
            async (
                client,
            ) => {
                const row =
                    await lockConfiguredInventory(
                        client,
                        selection,
                    );

                assertExpectedInventoryVersion(
                    row,
                    request.expectedUpdatedAt,
                );

                const state =
                    normalizeInventoryState(
                        row,
                    );

                if (
                    request.lowStockThreshold ===
                        state.lowStockThreshold &&
                    request.reorderThreshold ===
                        state.reorderThreshold
                ) {
                    throw new InventoryManagementError(
                        400,
                        'no-change',
                        'The requested inventory thresholds are already current.',
                    );
                }

                await client.query(
                    `
                        UPDATE inventory_items
                        SET
                            low_stock_threshold = $1,
                            reorder_threshold = $2
                        WHERE id = $3
                    `,
                    [
                        request
                            .lowStockThreshold,

                        request
                            .reorderThreshold,

                        row.id,
                    ],
                );

                return await insertAdjustment(
                    client,
                    {
                        inventoryItemId:
                            row.id,

                        productSlug:
                            selection
                                .productSlug,

                        variantId:
                            selection
                                .variantId,

                        sku:
                            selection.sku,

                        action:
                            'set-thresholds',

                        quantityDelta:
                            null,

                        previousOnHand:
                            state.onHand,

                        nextOnHand:
                            state.onHand,

                        reservedAtChange:
                            state.reserved,

                        previousLowStockThreshold:
                            state
                                .lowStockThreshold,

                        nextLowStockThreshold:
                            request
                                .lowStockThreshold,

                        previousReorderThreshold:
                            state
                                .reorderThreshold,

                        nextReorderThreshold:
                            request
                                .reorderThreshold,

                        reason:
                            request.reason,
                    },
                );
            },
        );

    return {
        action:
            request.action,

        inventory:
            await getInventoryAfterMutation(
                selection,
            ),

        adjustment,
    };
}

export async function listInventoryAdjustments(
    limit =
        RECENT_ADJUSTMENT_LIMIT,
): Promise<
    AdminInventoryAdjustment[]
> {
    const normalizedLimit =
        Math.min(
            Math.max(
                Math.trunc(
                    limit,
                ),
                1,
            ),
            250,
        );

    const db =
        getDatabase();

    const rows =
        await db.sql`
            SELECT
                id,
                inventory_item_id,
                product_slug,
                variant_id,
                sku,
                action,
                quantity_delta,
                previous_on_hand,
                next_on_hand,
                reserved_at_change,
                previous_low_stock_threshold,
                next_low_stock_threshold,
                previous_reorder_threshold,
                next_reorder_threshold,
                reason,
                created_at
            FROM inventory_adjustments
            ORDER BY
                created_at DESC,
                id DESC
            LIMIT ${normalizedLimit}
        `;

    return rows.map(
        (
            row,
        ) =>
            mapAdjustment(
                row as
                InventoryAdjustmentDatabaseRow,
            ),
    );
}

export async function listAdminInventoryState():
    Promise<AdminInventoryListData> {
    const [
        inventoryItems,
        recentAdjustments,
    ] =
        await Promise.all([
            listInventoryItems(),

            listInventoryAdjustments(),
        ]);

    const catalogSelections =
        getCatalogSelections();

    const catalogKeys =
        new Set(
            catalogSelections.map(
                (
                    selection,
                ) =>
                    selectionKey(
                        selection.productSlug,
                        selection.variantId,
                    ),
            ),
        );

    const inventoryBySelection =
        new Map<
            string,
            InventoryItem
        >();

    inventoryItems.forEach(
        (
            inventory,
        ) => {
            inventoryBySelection.set(
                selectionKey(
                    inventory.productSlug,
                    inventory.variantId,
                ),
                inventory,
            );
        },
    );

    const selections:
        AdminInventoryCatalogSelection[] =
        catalogSelections.map(
            (
                selection,
            ) => {
                const inventory =
                    inventoryBySelection.get(
                        selectionKey(
                            selection.productSlug,
                            selection.variantId,
                        ),
                    );

                let configurationState:
                    AdminInventoryCatalogSelection[
                        'configurationState'
                    ];

                if (!selection.sku) {
                    configurationState =
                        'catalog-sku-missing';
                } else if (!inventory) {
                    configurationState =
                        'not-configured';
                } else if (
                    inventory.sku !==
                    selection.sku
                ) {
                    configurationState =
                        'sku-mismatch';
                } else {
                    configurationState =
                        'configured';
                }

                return {
                    productSlug:
                        selection
                            .productSlug,

                    productName:
                        selection
                            .productName,

                    productStatus:
                        selection
                            .productStatus,

                    availability:
                        selection
                            .availability,

                    isDemo:
                        selection.isDemo,

                    trackInventory:
                        selection
                            .trackInventory,

                    ...(selection
                        .variantId
                        ? {
                            variantId:
                                selection
                                    .variantId,
                        }
                        : {}),

                    ...(selection
                        .variantLabel
                        ? {
                            variantLabel:
                                selection
                                    .variantLabel,
                        }
                        : {}),

                    ...(selection.sku
                        ? {
                            sku:
                                selection.sku,
                        }
                        : {}),

                    configurationState,

                    canManage:
                        Boolean(
                            selection.sku,
                        ) &&
                        configurationState !==
                            'sku-mismatch',

                    ...(inventory
                        ? {
                            inventory,
                        }
                        : {}),
                };
            },
        );

    const unmappedInventory =
        inventoryItems.filter(
            (
                inventory,
            ) =>
                !catalogKeys.has(
                    selectionKey(
                        inventory.productSlug,
                        inventory.variantId,
                    ),
                ),
        );

    return {
        selections,

        unmappedInventory,

        recentAdjustments,
    };
}

export async function executeAdminInventoryMutation(
    request:
        AdminInventoryMutationRequest,
): Promise<
    AdminInventoryMutationData
> {
    const selection =
        requireManageableSelection(
            request.productSlug,
            request.variantId,
        );

    switch (
    request.action
    ) {
        case 'provision':
            return await provisionInventory(
                request,
                selection,
            );

        case 'adjust-on-hand':
            return await adjustInventoryOnHand(
                request,
                selection,
            );

        case 'set-on-hand':
            return await setInventoryOnHand(
                request,
                selection,
            );

        case 'set-thresholds':
            return await setInventoryThresholds(
                request,
                selection,
            );
    }
}