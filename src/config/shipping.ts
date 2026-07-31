export const shippingConfig = {
    currency: 'USD',

    stripeCurrency: 'usd',

    allowedCountries: [
        'US',
    ],

    destinationLabel:
        'United States',

    freeDisplayName:
        'Free standard shipping',

    freeShippingThresholdAmount:
        10000,

    maximumCheckoutShippingOptions:
        3,

    policyHref:
        '/shipping-policy',
} as const;