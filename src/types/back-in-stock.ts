export const backInStockSubscriptionStatuses = [
    'active',
    'processing',
    'notified',
    'cancelled',
] as const;

export type BackInStockSubscriptionStatus =
    (typeof backInStockSubscriptionStatuses)[number];

export const backInStockSubscriptionSources = ['product-detail-sold-out'] as const;

export type BackInStockSubscriptionSource =
    (typeof backInStockSubscriptionSources)[number];

export interface BackInStockSubscriptionInput {
    productSlug: string;

    variantId?: string;

    email: string;

    source: BackInStockSubscriptionSource;
}

export interface BackInStockSubscribeRequest {
    productSlug: string;

    variantId?: string;

    email: string;

    botField?: string;
}

export interface BackInStockSubscriptionRecord {
    id: string;

    inventoryItemId: string;

    productSlug: string;

    variantId?: string;

    sku: string;

    email: string;

    emailHash: string;

    status: BackInStockSubscriptionStatus;

    source: BackInStockSubscriptionSource;

    requestCount: number;

    notificationCount: number;

    firstRequestedAt: string;

    lastRequestedAt: string;

    lastAttemptAt?: string;

    lastNotifiedAt?: string;

    cancelledAt?: string;

    claimToken?: string;

    claimExpiresAt?: string;

    lastError?: string;

    createdAt: string;

    updatedAt: string;
}

export type BackInStockErrorCode =
    | 'invalid-request'
    | 'invalid-email'
    | 'product-not-found'
    | 'variant-required'
    | 'variant-not-found'
    | 'not-eligible'
    | 'already-in-stock'
    | 'inventory-error';

export interface BackInStockSubscribeSuccessResponse {
    ok: true;

    accepted: true;

    message: string;
}

export interface BackInStockSubscribeErrorResponse {
    ok: false;

    code: BackInStockErrorCode;

    message: string;
}

export type BackInStockSubscribeResponse =
    | BackInStockSubscribeSuccessResponse
    | BackInStockSubscribeErrorResponse;