export const inventoryReservationStatuses = [
    'active',
    'payment-pending',
    'completed',
    'released',
    'expired',
] as const;

export type InventoryReservationStatus =
    (typeof inventoryReservationStatuses)[number];

export const inventoryReservationReleaseReasons = [
    'checkout-session-creation-failed',
    'checkout-session-expired',
    'stale-reservation-timeout',
    'async-payment-failed',
    'manual',
] as const;

export type InventoryReservationReleaseReason =
    (typeof inventoryReservationReleaseReasons)[number];

export interface InventoryReservationRequestLine {
    productSlug: string;

    variantId?: string;

    sku: string;

    quantity: number;
}

export interface InventoryReservationItem {
    inventoryItemId: string;

    productSlug: string;

    variantId?: string;

    sku: string;

    quantity: number;
}

export interface InventoryReservation {
    id: string;

    cartReference: string;

    stripeSessionId?: string;

    status:
        InventoryReservationStatus;

    expiresAt: string;

    releaseReason?:
        InventoryReservationReleaseReason;

    items:
        InventoryReservationItem[];

    createdAt: string;

    updatedAt: string;

    completedAt?: string;

    releasedAt?: string;

    expiredAt?: string;
}

export interface CreateInventoryReservationInput {
    cartReference: string;

    expiresAt:
        string |
        Date;

    lines:
        InventoryReservationRequestLine[];
}

export type InventoryReservationErrorCode =
    | 'invalid-reservation'
    | 'inventory-not-configured'
    | 'insufficient-stock'
    | 'reservation-not-found'
    | 'reservation-conflict'
    | 'inventory-state-invalid';

export interface InventoryReservationReleaseResult {
    reservationId: string;

    status:
        InventoryReservationStatus;

    changed: boolean;
}