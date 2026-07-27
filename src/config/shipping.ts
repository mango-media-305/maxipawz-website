export const shippingConfig = {
    currency: 'USD',

    allowedCountries: ['US'],

    destinationLabel:
        'United States',

    standardDisplayName:
        'Standard shipping',

    freeDisplayName:
        'Free standard shipping',

    freeShippingThresholdAmount:
        10000,

    processingEstimate: {
        minimumBusinessDays: 1,
        maximumBusinessDays: 3,
    },

    transitEstimate: {
        minimumBusinessDays: 3,
        maximumBusinessDays: 7,
    },

    policyHref:
        '/shipping-policy',
} as const;

export function parseShippingRateAmount(
    value: string | undefined,
): number | null {
    const normalizedValue =
        value?.trim();

    if (!normalizedValue) {
        return null;
    }

    const amount =
        Number(normalizedValue);

    if (
        !Number.isInteger(amount) ||
        amount <= 0 ||
        amount > 100000
    ) {
        return null;
    }

    return amount;
}