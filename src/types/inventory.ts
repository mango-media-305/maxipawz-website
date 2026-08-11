export const inventoryStockStatuses = [
    'in-stock',
    'low-stock',
    'sold-out',
] as const;

export type InventoryStockStatus =
    (typeof inventoryStockStatuses)[number];

export interface InventoryItem {
    id: string;

    productSlug: string;

    variantId?: string;

    sku: string;

    onHand: number;

    reserved: number;

    available: number;

    lowStockThreshold: number;

    reorderThreshold?: number;

    reorderRecommended: boolean;

    status: InventoryStockStatus;

    createdAt: string;

    updatedAt: string;
}

export interface PublicInventorySnapshot {
    tracked: boolean;

    productSlug: string;

    variantId?: string;

    sku?: string;

    status:
        | InventoryStockStatus
        | 'not-tracked';

    available: number | null;

    canPurchase: boolean;
}

export interface ProductInventoryResponse {
    ok: true;

    inventory:
        PublicInventorySnapshot;
}

export interface ProductInventoryErrorResponse {
    ok: false;

    code:
        | 'invalid-request'
        | 'product-not-found'
        | 'variant-not-found'
        | 'inventory-error';

    message: string;
}