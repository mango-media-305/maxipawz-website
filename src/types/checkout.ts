export interface CheckoutRequestLine {
    productSlug: string;
    variantId?: string;
    quantity: number;
}

export interface CheckoutSessionRequest {
    lines: CheckoutRequestLine[];
}

export interface CheckoutSessionSuccessResponse {
    ok: true;
    sessionId: string;
    url: string;
}

export type CheckoutErrorCode =
    | 'invalid-method'
    | 'invalid-request'
    | 'invalid-cart'
    | 'checkout-disabled'
    | 'storefront-not-live'
    | 'policies-incomplete'
    | 'stripe-not-configured'
    | 'shipping-not-configured'
    | 'product-not-found'
    | 'product-unavailable'
    | 'demo-product'
    | 'variant-required'
    | 'variant-not-found'
    | 'price-not-configured'
    | 'session-creation-failed';

export interface CheckoutSessionErrorResponse {
    ok: false;
    code: CheckoutErrorCode;
    message: string;
}

export type CheckoutSessionResponse =
    | CheckoutSessionSuccessResponse
    | CheckoutSessionErrorResponse;

export interface CheckoutReadiness {
    ready: boolean;
    reasons: string[];
}