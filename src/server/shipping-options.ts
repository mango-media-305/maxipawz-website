import type Stripe from 'stripe';

import {
    shippingConfig,
} from '../config/shipping';

import {
    taxConfig,
} from '../config/tax';

import type {
    EasyPostRate,
    EasyPostShipment,
} from './easypost';

import {
    getShippingThresholdState,
} from '../utils/shipping';

type StripeShippingOptions =
    NonNullable<
        Stripe.Checkout.SessionUpdateParams[
        'shipping_options'
        ]
    >;

interface NormalizedRate {
    source:
    EasyPostRate;

    amountCents: number;
}

const excludedUspsServices =
    new Set([
        'First',
        'LibraryMail',
        'MediaMail',
    ]);

function normalizeCarrierName(
    carrier: string,
): string {
    if (
        carrier.startsWith(
            'UPS',
        )
    ) {
        return 'UPS';
    }

    if (
        carrier.startsWith(
            'FedEx',
        )
    ) {
        return 'FedEx';
    }

    if (
        carrier ===
        'USPS'
    ) {
        return 'USPS';
    }

    return carrier;
}

function normalizeServiceName(
    service: string,
): string {
    const labels:
        Record<
            string,
            string
        > = {
        GroundAdvantage:
            'Ground Advantage',

        Ground:
            'Ground',

        UPSGroundsaverGreaterThan1lb:
            'Ground Saver',

        FEDEX_GROUND:
            'Ground',

        GROUND_HOME_DELIVERY:
            'Home Delivery',

        SMART_POST:
            'Ground Economy',

        Priority:
            'Priority Mail',

        Express:
            'Priority Mail Express',

        FEDEX_2_DAY:
            '2Day',

        FEDEX_EXPRESS_SAVER:
            'Express Saver',

        '2ndDayAir':
            '2nd Day Air',

        '3DaySelect':
            '3 Day Select',

        NextDayAir:
            'Next Day Air',

        NextDayAirSaver:
            'Next Day Air Saver',
    };

    return (
        labels[
        service
        ] ??
        service
    );
}

function rateToCents(
    value: string,
): number | null {
    const dollars =
        Number(
            value,
        );

    if (
        !Number.isFinite(
            dollars,
        ) ||
        dollars <= 0
    ) {
        return null;
    }

    return Math.round(
        dollars *
        100,
    );
}

function isSupportedCarrier(
    carrier: string,
): boolean {
    return (
        carrier ===
        'USPS' ||
        carrier.startsWith(
            'UPS',
        ) ||
        carrier.startsWith(
            'FedEx',
        )
    );
}

function isAllowedRate(
    rate: EasyPostRate,
): boolean {
    if (
        rate.currency !==
        'USD' ||
        !isSupportedCarrier(
            rate.carrier,
        )
    ) {
        return false;
    }

    if (
        rate.carrier ===
        'USPS' &&
        excludedUspsServices.has(
            rate.service,
        )
    ) {
        return false;
    }

    return (
        rateToCents(
            rate.rate,
        ) !== null
    );
}

function isStandardRate(
    rate: EasyPostRate,
): boolean {
    if (
        rate.carrier ===
        'USPS'
    ) {
        return (
            rate.service ===
            'GroundAdvantage'
        );
    }

    if (
        rate.carrier.startsWith(
            'UPS',
        )
    ) {
        return (
            rate.service ===
            'Ground' ||
            rate.service ===
            'UPSGroundsaverGreaterThan1lb'
        );
    }

    if (
        rate.carrier.startsWith(
            'FedEx',
        )
    ) {
        return (
            rate.service ===
            'FEDEX_GROUND' ||
            rate.service ===
            'GROUND_HOME_DELIVERY' ||
            rate.service ===
            'SMART_POST'
        );
    }

    return false;
}

function normalizeRates(
    rates:
        EasyPostRate[],
): NormalizedRate[] {
    const uniqueRates =
        new Map<
            string,
            NormalizedRate
        >();

    rates
        .filter(
            isAllowedRate,
        )
        .forEach(
            (rate) => {
                const amountCents =
                    rateToCents(
                        rate.rate,
                    );

                if (
                    amountCents ===
                    null
                ) {
                    return;
                }

                const key =
                    `${normalizeCarrierName(
                        rate.carrier,
                    )}:${rate.service}`;

                const existing =
                    uniqueRates.get(
                        key,
                    );

                if (
                    !existing ||
                    amountCents <
                    existing
                        .amountCents
                ) {
                    uniqueRates.set(
                        key,
                        {
                            source:
                                rate,

                            amountCents,
                        },
                    );
                }
            },
        );

    return Array.from(
        uniqueRates.values(),
    ).sort(
        (
            left,
            right,
        ) =>
            left.amountCents -
            right.amountCents,
    );
}

function getDeliveryDays(
    rate: EasyPostRate,
): number | null {
    const days =
        rate.delivery_days ??
        rate.est_delivery_days ??
        null;

    if (
        days === null ||
        !Number.isInteger(
            days,
        ) ||
        days < 1 ||
        days > 30
    ) {
        return null;
    }

    return days;
}

function buildShippingOption(
    normalized:
        NormalizedRate,

    amountChargedCents: number,

    freeShippingApplied: boolean,
): StripeShippingOptions[number] {
    const rate =
        normalized.source;

    const carrier =
        normalizeCarrierName(
            rate.carrier,
        );

    const service =
        normalizeServiceName(
            rate.service,
        );

    const deliveryDays =
        getDeliveryDays(
            rate,
        );

    const displayName =
        freeShippingApplied
            ? `Free standard — ${carrier} ${service}`
            : `${carrier} ${service}`;

    return {
        shipping_rate_data: {
            type:
                'fixed_amount',

            fixed_amount: {
                amount:
                    amountChargedCents,

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

            ...(deliveryDays
                ? {
                    delivery_estimate: {
                        minimum: {
                            unit:
                                'business_day',

                            value:
                                deliveryDays,
                        },

                        maximum: {
                            unit:
                                'business_day',

                            value:
                                deliveryDays,
                        },
                    },
                }
                : {}),

            metadata: {
                storefront:
                    'maxipawz',

                shipping_provider:
                    'easypost',

                easypost_shipment_id:
                    rate.shipment_id,

                easypost_rate_id:
                    rate.id,

                easypost_carrier:
                    rate.carrier,

                easypost_service:
                    rate.service,

                easypost_postage_cents:
                    String(
                        normalized
                            .amountCents,
                    ),

                free_shipping_applied:
                    freeShippingApplied
                        ? 'true'
                        : 'false',
            },
        },
    };
}

export function buildStripeShippingOptions(
    shipment:
        EasyPostShipment,

    merchandiseSubtotalAmount: number,
): {
    options:
    StripeShippingOptions;

    freeShippingApplied:
    boolean;
} {
    const rates =
        normalizeRates(
            shipment.rates,
        );

    if (
        rates.length === 0
    ) {
        throw new Error(
            'No supported USPS, UPS, or FedEx rates are available for this address.',
        );
    }

    const thresholdState =
        getShippingThresholdState(
            merchandiseSubtotalAmount,
        );

    if (
        !thresholdState
            .qualifiesForFreeShipping
    ) {
        const selectedRates =
            rates.slice(
                0,
                shippingConfig
                    .maximumCheckoutShippingOptions,
            );

        return {
            freeShippingApplied:
                false,

            options:
                selectedRates.map(
                    (rate) =>
                        buildShippingOption(
                            rate,
                            rate.amountCents,
                            false,
                        ),
                ),
        };
    }

    const standardRate =
        rates.find(
            (rate) =>
                isStandardRate(
                    rate.source,
                ),
        );

    if (
        !standardRate
    ) {
        throw new Error(
            'Free standard shipping is available for this order, but no eligible standard carrier service was returned for the address.',
        );
    }

    const fasterRates =
        rates
            .filter(
                (rate) =>
                    rate.source.id !==
                    standardRate
                        .source.id &&
                    !isStandardRate(
                        rate.source,
                    ),
            )
            .slice(
                0,
                Math.max(
                    0,
                    shippingConfig
                        .maximumCheckoutShippingOptions -
                    1,
                ),
            );

    return {
        freeShippingApplied:
            true,

        options: [
            buildShippingOption(
                standardRate,
                0,
                true,
            ),

            ...fasterRates.map(
                (rate) =>
                    buildShippingOption(
                        rate,
                        rate.amountCents,
                        false,
                    ),
            ),
        ],
    };
}