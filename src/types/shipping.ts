export type ShippingTier =
    | 'standard'
    | 'free-standard';

export interface ShippingQuote {
    tier: ShippingTier;

    merchandiseSubtotalAmount: number;

    shippingAmount: number | null;

    estimatedTotalBeforeTaxAmount:
    | number
    | null;

    qualifiesForFreeShipping: boolean;

    amountUntilFreeShipping: number;

    configured: boolean;
}