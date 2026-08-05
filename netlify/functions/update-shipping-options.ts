import type {
    Config,
} from '@netlify/functions';

import Stripe from 'stripe';

import {
    buildStripeShippingOptions,
} from '../../src/server/shipping-options';

import type {
    CheckoutShippingDetails,
    ShippingOptionsUpdateRequest,
    ShippingOptionsUpdateResponse,
} from '../../src/types/shipping';

function jsonResponse(
    body:
        ShippingOptionsUpdateResponse,

    status = 200,
): Response {
    return Response.json(
        body,
        {
            status,

            headers: {
                'Cache-Control':
                    'no-store, max-age=0',
            },
        },
    );
}

function isRecord(
    value: unknown,
): value is Record<
    string,
    unknown
> {
    return (
        typeof value ===
        'object' &&
        value !== null &&
        !Array.isArray(
            value,
        )
    );
}

function parseShippingDetails(
    value: unknown,
): CheckoutShippingDetails {
    if (
        !isRecord(
            value,
        ) ||
        typeof value.name !==
        'string' ||
        !value.name.trim() ||
        !isRecord(
            value.address,
        )
    ) {
        throw new Error(
            'Enter a complete U.S. shipping address.',
        );
    }

    const address =
        value.address;

    const requiredFields = [
        'line1',
        'city',
        'state',
        'postal_code',
        'country',
    ] as const;

    requiredFields.forEach(
        (field) => {
            if (
                typeof address[
                field
                ] !==
                'string' ||
                !address[
                    field
                ].trim()
            ) {
                throw new Error(
                    'Enter a complete U.S. shipping address.',
                );
            }
        },
    );

    if (
        address.country !==
        'US'
    ) {
        throw new Error(
            'Maxi Pawz currently ships only within the United States.',
        );
    }

    return {
        name:
            value.name.trim(),

        address: {
            line1:
                String(
                    address.line1,
                ).trim(),

            ...(typeof address.line2 ===
                'string' &&
                address.line2.trim()
                ? {
                    line2:
                        address.line2.trim(),
                }
                : {}),

            city:
                String(
                    address.city,
                ).trim(),

            state:
                String(
                    address.state,
                )
                    .trim()
                    .toUpperCase(),

            postal_code:
                String(
                    address.postal_code,
                ).trim(),

            country:
                'US',
        },
    };
}

function parseRequest(
    value: unknown,
): ShippingOptionsUpdateRequest {
    if (
        !isRecord(
            value,
        ) ||
        typeof value.checkout_session_id !==
        'string' ||
        !value.checkout_session_id.startsWith(
            'cs_test_',
        )
    ) {
        throw new Error(
            'The Checkout Session is invalid.',
        );
    }

    return {
        checkout_session_id:
            value.checkout_session_id,

        shipping_details:
            parseShippingDetails(
                value.shipping_details,
            ),
    };
}

function parseTrustedAmount(
    value:
        | string
        | undefined,

    label: string,
): number {
    const amount =
        Number(
            value,
        );

    if (
        !Number.isInteger(
            amount,
        ) ||
        amount < 0
    ) {
        throw new Error(
            `The Checkout Session does not contain a valid ${label}.`,
        );
    }

    return amount;
}

export default async function handler(
    request: Request,
): Promise<Response> {
    if (
        request.method !==
        'POST'
    ) {
        return jsonResponse(
            {
                ok: false,

                message:
                    'This endpoint accepts POST requests only.',
            },
            405,
        );
    }

    try {
        const stripeSecretKey =
            process.env
                .STRIPE_SECRET_KEY
                ?.trim();

        if (
            !stripeSecretKey ||
            !stripeSecretKey.startsWith(
                'sk_test_',
            )
        ) {
            throw new Error(
                'Stripe Sandbox is not configured.',
            );
        }

        const rawRequest =
            await request
                .json()
                .catch(
                    () => null,
                );

        const payload =
            parseRequest(
                rawRequest,
            );

        const stripe =
            new Stripe(
                stripeSecretKey,
            );

        const session =
            await stripe
                .checkout
                .sessions
                .retrieve(
                    payload
                        .checkout_session_id,
                );

        if (
            session.metadata
                ?.storefront !==
            'maxipawz' ||
            session.metadata
                ?.checkout_mode !==
            'test'
        ) {
            throw new Error(
                'The Checkout Session does not belong to the Maxi Pawz Sandbox integration.',
            );
        }

        if (
            session.status !==
            'open'
        ) {
            throw new Error(
                'This Checkout Session can no longer be updated.',
            );
        }

        const merchandiseSubtotalAmount =
            parseTrustedAmount(
                session.metadata
                    ?.merchandise_subtotal_cents,

                'merchandise subtotal',
            );

        const shippingWeightOz =
            parseTrustedAmount(
                session.metadata
                    ?.shipping_weight_oz,

                'shipping weight',
            );

        if (
            shippingWeightOz <= 0
        ) {
            throw new Error(
                'The Checkout Session shipping weight is invalid.',
            );
        }

        const shippingDetails =
            payload
                .shipping_details;

        const {
            options,
            estimate,
        } =
            buildStripeShippingOptions(
                shippingDetails
                    .address
                    .state,

                merchandiseSubtotalAmount,

                shippingWeightOz,
            );

        await stripe
            .checkout
            .sessions
            .update(
                session.id,
                {
                    collected_information: {
                        shipping_details: {
                            name:
                                shippingDetails
                                    .name,

                            address: {
                                line1:
                                    shippingDetails
                                        .address
                                        .line1,

                                line2:
                                    shippingDetails
                                        .address
                                        .line2,

                                city:
                                    shippingDetails
                                        .address
                                        .city,

                                state:
                                    shippingDetails
                                        .address
                                        .state,

                                postal_code:
                                    shippingDetails
                                        .address
                                        .postal_code,

                                country:
                                    'US',
                            },
                        },
                    },

                    shipping_options:
                        options,

                    metadata: {
                        shipping_provider:
                            'maxipawz',

                        shipping_model:
                            'weight-destination-table',

                        shipping_zone:
                            estimate.zone,

                        shipping_estimate_cents:
                            String(
                                estimate
                                    .shippingAmount,
                            ),

                        free_shipping_applied:
                            estimate
                                .freeShippingApplied
                                ? 'true'
                                : 'false',
                    },
                },
            );

        return jsonResponse({
            ok: true,

            zone:
                estimate.zone,

            shippingAmount:
                estimate
                    .shippingAmount,

            optionCount:
                options.length,

            freeShippingApplied:
                estimate
                    .freeShippingApplied,
        });
    } catch (error) {
        console.error(
            'Shipping estimate calculation failed.',
            error,
        );

        return jsonResponse(
            {
                ok: false,

                message:
                    error instanceof Error
                        ? error.message
                        : 'Shipping could not be calculated.',
            },
            400,
        );
    }
}

export const config:
    Config = {
    path:
        '/api/update-shipping-options',
};