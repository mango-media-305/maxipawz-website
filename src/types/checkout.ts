export interface CheckoutRequestLine {
  productSlug: string;

  variantId?: string;

  quantity: number;
}

/**
 * Campaign attribution that is allowed to cross the
 * browser/server checkout boundary.
 *
 * This data is informational only.
 *
 * It must never participate in:
 * - cart identity
 * - pricing
 * - inventory validation
 * - reservations
 * - shipping
 * - tax
 * - payment authorization
 */
export interface CheckoutCampaignAttribution {
  landingPageSlug: string;

  campaignId: string;

  productSlug: string;

  channel?: string;

  audience?: string;

  utmSource?: string;

  utmMedium?: string;

  utmCampaign?: string;

  utmContent?: string;

  utmTerm?: string;

  referrerHost?: string;

  capturedAt?: number;
}

export interface CheckoutSessionRequest {
  lines: CheckoutRequestLine[];

  attribution?: CheckoutCampaignAttribution;
}

export interface CheckoutSessionSuccessResponse {
  ok: true;

  sessionId: string;

  clientSecret: string;
}

export type CheckoutErrorCode =
  | 'invalid-method'
  | 'invalid-request'
  | 'invalid-cart'
  | 'checkout-disabled'
  | 'storefront-not-live'
  | 'policies-incomplete'
  | 'stripe-not-configured'
  | 'product-not-found'
  | 'product-unavailable'
  | 'inventory-not-configured'
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