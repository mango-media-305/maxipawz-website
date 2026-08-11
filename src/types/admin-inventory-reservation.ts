import type {
    InventoryReservationStatus,
} from './inventory-reservation';

export interface AdminInventoryReservationItem {
    inventoryItemId: string;

    productSlug: string;

    productName: string;

    variantId?: string;

    variantLabel?: string;

    sku: string;

    quantity: number;
}

export interface AdminInventoryReservation {
    id: string;

    cartReference: string;

    stripeSessionId?: string;

    status:
        InventoryReservationStatus;

    releaseReason?: string;

    expiresAt: string;

    createdAt: string;

    updatedAt: string;

    completedAt?: string;

    releasedAt?: string;

    expiredAt?: string;

    holdsInventory: boolean;

    heldUnits: number;

    expirationPastDue: boolean;

    items:
        AdminInventoryReservationItem[];
}

export interface AdminInventoryReservationSummary {
    total: number;

    active: number;

    paymentPending: number;

    completed: number;

    released: number;

    expired: number;

    heldUnits: number;

    expirationPastDue: number;
}

export interface AdminInventoryReservationsData {
    reservations:
        AdminInventoryReservation[];

    summary:
        AdminInventoryReservationSummary;

    displayLimit: number;

    truncated: boolean;
}

export interface AdminInventoryReservationsSuccessResponse
    extends AdminInventoryReservationsData {
    ok: true;
}

export interface AdminInventoryReservationsErrorResponse {
    ok: false;

    message: string;
}

export type AdminInventoryReservationsResponse =
    | AdminInventoryReservationsSuccessResponse
    | AdminInventoryReservationsErrorResponse;