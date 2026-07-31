import {
    shippingConfig,
} from '../config/shipping';

import type {
    ShippingThresholdState,
} from '../types/shipping';

function normalizeAmount(
    amount: number,
): number {
    if (
        !Number.isFinite(
            amount,
        )
    ) {
        return 0;
    }

    return Math.max(
        0,
        Math.round(
            amount,
        ),
    );
}

export function getShippingThresholdState(
    merchandiseSubtotalAmount: number,
): ShippingThresholdState {
    const normalizedSubtotal =
        normalizeAmount(
            merchandiseSubtotalAmount,
        );

    const threshold =
        shippingConfig
            .freeShippingThresholdAmount;

    const qualifiesForFreeShipping =
        normalizedSubtotal >=
        threshold;

    const amountUntilFreeShipping =
        Math.max(
            0,
            threshold -
            normalizedSubtotal,
        );

    const progress =
        threshold <= 0
            ? 100
            : Math.min(
                100,
                Math.round(
                    (
                        normalizedSubtotal /
                        threshold
                    ) *
                    100,
                ),
            );

    return {
        merchandiseSubtotalAmount:
            normalizedSubtotal,

        qualifiesForFreeShipping,

        amountUntilFreeShipping,

        progress,
    };
}

export function getFreeShippingProgress(
    merchandiseSubtotalAmount: number,
): number {
    return getShippingThresholdState(
        merchandiseSubtotalAmount,
    ).progress;
}