import type {
    InventoryItem,
} from './inventory';

import type {
    ProductAvailability,
    ProductStatus,
} from './product';

export const adminInventoryAdjustmentActions = [
    'provision',
    'adjust-on-hand',
    'set-on-hand',
    'set-thresholds',
] as const;

export type AdminInventoryAdjustmentAction =
    (typeof adminInventoryAdjustmentActions)[number];

export type AdminInventoryConfigurationState =
    | 'not-configured'
    | 'configured'
    | 'sku-mismatch'
    | 'catalog-sku-missing';

export interface AdminInventoryCatalogSelection {
    productSlug: string;

    productName: string;

    productStatus:
        ProductStatus;

    availability:
        ProductAvailability;

    isDemo: boolean;

    trackInventory: boolean;

    variantId?: string;

    variantLabel?: string;

    sku?: string;

    configurationState:
        AdminInventoryConfigurationState;

    canManage: boolean;

    inventory?:
        InventoryItem;
}

export interface AdminInventoryAdjustment {
    id: string;

    inventoryItemId?: string;

    productSlug: string;

    variantId?: string;

    sku: string;

    action:
        AdminInventoryAdjustmentAction;

    quantityDelta?: number;

    previousOnHand?: number;

    nextOnHand?: number;

    reservedAtChange: number;

    previousLowStockThreshold?: number;

    nextLowStockThreshold?: number;

    previousReorderThreshold?: number;

    nextReorderThreshold?: number;

    reason: string;

    createdAt: string;
}

interface AdminInventoryMutationBase {
    productSlug: string;

    variantId?: string;

    reason: string;
}

export interface AdminInventoryProvisionRequest
    extends AdminInventoryMutationBase {
    action:
        'provision';

    onHand: number;

    lowStockThreshold: number;

    reorderThreshold?:
        number |
        null;
}

export interface AdminInventoryAdjustOnHandRequest
    extends AdminInventoryMutationBase {
    action:
        'adjust-on-hand';

    quantityDelta: number;
}

export interface AdminInventorySetOnHandRequest
    extends AdminInventoryMutationBase {
    action:
        'set-on-hand';

    onHand: number;
}

export interface AdminInventorySetThresholdsRequest
    extends AdminInventoryMutationBase {
    action:
        'set-thresholds';

    lowStockThreshold: number;

    reorderThreshold:
        number |
        null;
}

export type AdminInventoryMutationRequest =
    | AdminInventoryProvisionRequest
    | AdminInventoryAdjustOnHandRequest
    | AdminInventorySetOnHandRequest
    | AdminInventorySetThresholdsRequest;

export interface AdminInventoryListData {
    selections:
        AdminInventoryCatalogSelection[];

    unmappedInventory:
        InventoryItem[];

    recentAdjustments:
        AdminInventoryAdjustment[];
}

export interface AdminInventoryMutationData {
    action:
        AdminInventoryAdjustmentAction;

    inventory:
        InventoryItem;

    adjustment:
        AdminInventoryAdjustment;
}

export interface AdminInventoryListResponse
    extends AdminInventoryListData {
    ok: true;
}

export interface AdminInventoryMutationResponse
    extends AdminInventoryMutationData {
    ok: true;

    message: string;
}

export type AdminInventoryErrorCode =
    | 'admin-auth'
    | 'invalid-request'
    | 'catalog-selection-not-found'
    | 'catalog-sku-missing'
    | 'inventory-not-configured'
    | 'inventory-already-configured'
    | 'inventory-conflict'
    | 'inventory-below-reserved'
    | 'inventory-limit-exceeded'
    | 'no-change'
    | 'inventory-error';

export interface AdminInventoryErrorResponse {
    ok: false;

    code:
        AdminInventoryErrorCode;

    message: string;
}

export type AdminInventoryResponse =
    | AdminInventoryListResponse
    | AdminInventoryMutationResponse
    | AdminInventoryErrorResponse;