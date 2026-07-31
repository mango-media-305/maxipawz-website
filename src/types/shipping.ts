export interface ShippingThresholdState {
    merchandiseSubtotalAmount: number;

    qualifiesForFreeShipping: boolean;

    amountUntilFreeShipping: number;

    progress: number;
}

export interface CheckoutShippingAddress {
    line1: string;

    line2?: string;

    city: string;

    state: string;

    postal_code: string;

    country: string;
}

export interface CheckoutShippingDetails {
    name: string;

    address:
    CheckoutShippingAddress;
}

export interface ShippingOptionsUpdateRequest {
    checkout_session_id: string;

    shipping_details:
    CheckoutShippingDetails;
}

export interface ShippingOptionsUpdateSuccessResponse {
    ok: true;

    shipmentId: string;

    optionCount: number;

    freeShippingApplied: boolean;
}

export interface ShippingOptionsUpdateErrorResponse {
    ok: false;

    message: string;
}

export type ShippingOptionsUpdateResponse =
    | ShippingOptionsUpdateSuccessResponse
    | ShippingOptionsUpdateErrorResponse;