export type StripeTaxBehavior =
    | 'exclusive';

export const taxConfig = {
    salesCountry: 'US',

    salesCountryLabel:
        'United States',

    stripeCurrency: 'usd',

    productTaxCode:
        'txcd_99999999',

    productTaxCodeLabel:
        'General - Tangible Goods',

    shippingTaxCode:
        'txcd_92010001',

    shippingTaxCodeLabel:
        'Shipping',

    taxBehavior:
        'exclusive' as StripeTaxBehavior,
} as const;