import type Stripe from 'stripe';

import {
    shippingConfig,
} from '../config/shipping';

import type {
    ShippingDestinationZone,
} from '../config/shipping';

import {
    taxConfig,
} from '../config/tax';

import {
    getShippingThresholdState,
} from '../utils/shipping';

type StripeShippingOptions =
    NonNullable<
        Stripe.Checkout.SessionUpdateParams[
        'shipping_options'
        ]
    >;

export interface ShippingEstimate {
    zone:
    ShippingDestinationZone;

    shippingAmount: number;

    freeShippingApplied: boolean;
}

function normalizeState(
    state: string,
): string {
    return state
        .trim()
        .toUpperCase();
}

function getDestinationZone(
    state: string,
): ShippingDestinationZone {
    const normalized =
        normalizeState(
            state,
        );

    if (
        normalized ===
        'AK' ||
        normalized ===
        'ALASKA' ||
        normalized ===
        'HI' ||
        normalized ===
        'HAWAII'
    ) {
        return 'alaska-hawaii';
    }

    return 'contiguous-us';
}

function getPaidShippingAmount(
    weightOz: number,
    zone:
        ShippingDestinationZone,
): number {
    if (
        !Number.isFinite(
            weightOz,
        ) ||
        weightOz <= 0
    ) {
        throw new Error(
            'The order does not contain a valid shipping weight.',
        );
    }

    const tier =
        shippingConfig
            .rateTable
            .find(
                (
                    candidate,
                ) =>
                    weightOz <=
                    candidate
                        .maxWeightOz,
            );

    if (!tier) {
        throw new Error(
            'This order is too heavy for automatic standard-shipping estimation.',
        );
    }

    return zone ===
        'alaska-hawaii'
        ? tier
            .alaskaHawaiiAmount
        : tier
            .contiguousAmount;
}

export function buildStripeShippingOptions(
    destinationState: string,

    merchandiseSubtotalAmount: number,

    shippingWeightOz: number,
): {
    options:
    StripeShippingOptions;

    estimate:
    ShippingEstimate;
} {
    const zone =
        getDestinationZone(
            destinationState,
        );

    const thresholdState =
        getShippingThresholdState(
            merchandiseSubtotalAmount,
        );

    const freeShippingApplied =
        thresholdState
            .qualifiesForFreeShipping;

    const shippingAmount =
        freeShippingApplied
            ? 0
            : getPaidShippingAmount(
                shippingWeightOz,
                zone,
            );

    const displayName =
        freeShippingApplied
            ? shippingConfig
                .freeDisplayName
            : shippingConfig
                .paidDisplayName;

    return {
        estimate: {
            zone,

            shippingAmount,

            freeShippingApplied,
        },

        options: [
            {
                shipping_rate_data: {
                    type:
                        'fixed_amount',

                    fixed_amount: {
                        amount:
                            shippingAmount,

                        currency:
                            taxConfig
                                .stripeCurrency,
                    },

                    display_name:
                        displayName,

                    tax_behavior:
                        taxConfig
                            .taxBehavior,

                    tax_code:
                        taxConfig
                            .shippingTaxCode,

                    metadata: {
                        storefront:
                            'maxipawz',

                        shipping_provider:
                            'maxipawz',

                        shipping_model:
                            'weight-destination-table',

                        shipping_zone:
                            zone,

                        shipping_weight_oz:
                            String(
                                shippingWeightOz,
                            ),

                        shipping_estimate_cents:
                            String(
                                shippingAmount,
                            ),

                        free_shipping_applied:
                            freeShippingApplied
                                ? 'true'
                                : 'false',
                    },
                },
            },
        ],
    };
}