import {
    shippingConfig,
} from '../config/shipping';

import type {
    ShippingQuote,
} from '../types/shipping';

function normalizeAmount(
    amount: number,
): number {
    if (
        !Number.isFinite(amount)
    ) {
        return 0;
    }

    return Math.max(
        0,
        Math.round(amount),
    );
}

export function getShippingQuote(
    merchandiseSubtotalAmount: number,
    standardShippingRateAmount:
        | number
        | null,
): ShippingQuote {
    const normalizedSubtotal =
        normalizeAmount(
            merchandiseSubtotalAmount,
        );

    const qualifiesForFreeShipping =
        normalizedSubtotal >=
        shippingConfig
            .freeShippingThresholdAmount;

    const amountUntilFreeShipping =
        Math.max(
            0,

            shippingConfig
                .freeShippingThresholdAmount -
            normalizedSubtotal,
        );

    const shippingAmount =
        qualifiesForFreeShipping
            ? 0
            : standardShippingRateAmount;

    return {
        tier:
            qualifiesForFreeShipping
                ? 'free-standard'
                : 'standard',

        merchandiseSubtotalAmount:
            normalizedSubtotal,

        shippingAmount,

        estimatedTotalBeforeTaxAmount:
            shippingAmount === null
                ? null
                : normalizedSubtotal +
                shippingAmount,

        qualifiesForFreeShipping,

        amountUntilFreeShipping,

        configured:
            shippingAmount !== null,
    };
}

export function getFreeShippingProgress(
    merchandiseSubtotalAmount: number,
): number {
    const normalizedSubtotal =
        normalizeAmount(
            merchandiseSubtotalAmount,
        );

    if (
        shippingConfig
            .freeShippingThresholdAmount <= 0
    ) {
        return 100;
    }

    return Math.min(
        100,

        Math.round(
            (
                normalizedSubtotal /
                shippingConfig
                    .freeShippingThresholdAmount
            ) * 100,
        ),
    );
}