import type {
    BackInStockSubscriptionSource,
    BackInStockSubscriptionStatus,
} from './back-in-stock';

export interface AdminBackInStockSubscription {
    id: string;

    productSlug: string;

    productName: string;

    variantId?: string;

    variantLabel?: string;

    sku: string;

    maskedEmail: string;

    emailHashSuffix: string;

    status: BackInStockSubscriptionStatus;

    source: BackInStockSubscriptionSource;

    requestCount: number;

    notificationCount: number;

    currentAvailable: number;

    manualReview: boolean;

    firstRequestedAt: string;

    lastRequestedAt: string;

    lastAttemptAt?: string;

    lastNotifiedAt?: string;

    cancelledAt?: string;

    claimExpiresAt?: string;

    lastError?: string;

    createdAt: string;

    updatedAt: string;
}

export interface AdminBackInStockSummary {
    total: number;

    active: number;

    processing: number;

    notified: number;

    cancelled: number;

    manualReview: number;
}

export interface AdminBackInStockData {
    subscriptions: AdminBackInStockSubscription[];

    summary: AdminBackInStockSummary;

    displayLimit: number;

    truncated: boolean;
}

export interface AdminBackInStockSuccessResponse
    extends AdminBackInStockData {
    ok: true;
}

export interface AdminBackInStockErrorResponse {
    ok: false;

    message: string;
}

export type AdminBackInStockResponse =
    | AdminBackInStockSuccessResponse
    | AdminBackInStockErrorResponse;