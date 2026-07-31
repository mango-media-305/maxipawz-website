import {
    randomUUID,
} from 'node:crypto';

import type {
    Config,
} from '@netlify/functions';

import Stripe from 'stripe';

import {
    businessConfig,
} from '../../src/config/business';

import {
    shippingConfig,
} from '../../src/config/shipping';

import {
    taxConfig,
} from '../../src/config/tax';

import {
    CheckoutValidationError,
    parseCheckoutRequest,
    validateCheckoutCart,
} from '../../src/server/checkout-cart';

import type {
    CheckoutSessionErrorResponse,
    CheckoutSessionSuccessResponse,
} from '../../src/types/checkout';

class CheckoutConfigurationError
    extends Error {
    readonly status: number;

    constructor(
        status: number,
        message: string,
    ) {
        super(
            message,
        );

        this.name =
            'CheckoutConfigurationError';

        this.status =
            status;
    }
}

function jsonResponse(
    body:
        | CheckoutSessionSuccessResponse
        | CheckoutSessionErrorResponse,

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

function getStripeSecretKey():
    string {
    if (
        process.env
            .PUBLIC_CHECKOUT_MODE !==
        'test'
    ) {
        throw new CheckoutConfigurationError(
            503,
            'Stripe test checkout is currently disabled.',
        );
    }

    if (
        process.env
            .PUBLIC_STOREFRONT_MODE !==
        'live'
    ) {
        throw new CheckoutConfigurationError(
            503,
            'The storefront must be in live mode before checkout can begin.',
        );
    }

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
        throw new CheckoutConfigurationError(
            503,
            'A Stripe Sandbox secret key has not been configured.',
        );
    }

    return stripeSecretKey;
}

function getSiteOrigin():
    string {
    const configuredSiteUrl =
        process.env
            .PUBLIC_SITE_URL
            ?.trim() ||
        process.env.URL
            ?.trim();

    if (
        !configuredSiteUrl
    ) {
        throw new CheckoutConfigurationError(
            503,
            'The website URL is not configured for checkout.',
        );
    }

    const url =
        new URL(
            configuredSiteUrl,
        );

    if (
        url.protocol !==
        'https:' &&
        url.protocol !==
        'http:'
    ) {
        throw new CheckoutConfigurationError(
            503,
            'The configured website URL is invalid.',
        );
    }

    return url.origin;
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

                code:
                    'invalid-method',

                message:
                    'This endpoint accepts POST requests only.',
            },
            405,
        );
    }

    try {
        const stripeSecretKey =
            getStripeSecretKey();

        const allowDemoProducts =
            process.env
                .PUBLIC_SANDBOX_CATALOG_CHECKOUT ===
            'true';

        if (
            !businessConfig
                .commercePoliciesFinalized &&
            !allowDemoProducts
        ) {
            return jsonResponse(
                {
                    ok: false,

                    code:
                        'policies-incomplete',

                    message:
                        'Commerce policies must be finalized before checkout can begin.',
                },
                503,
            );
        }

        const rawRequest =
            await request
                .json()
                .catch(
                    () => null,
                );

        const checkoutRequest =
            parseCheckoutRequest(
                rawRequest,
            );

        const cart =
            validateCheckoutCart(
                checkoutRequest,

                allowDemoProducts,
            );

        const siteOrigin =
            getSiteOrigin();

        const cartReference =
            randomUUID();

        const stripe =
            new Stripe(
                stripeSecretKey,
            );

        const session =
            await stripe
                .checkout
                .sessions
                .create({
                    mode:
                        'payment',

                    ui_mode:
                        'embedded_page',

                    permissions: {
                        update_shipping_details:
                            'server_only',
                    },

                    line_items:
                        cart.lineItems,

                    automatic_tax: {
                        enabled:
                            true,
                    },

                    shipping_address_collection: {
                        allowed_countries: [
                            taxConfig
                                .salesCountry,
                        ],
                    },

                    shipping_options: [
                        {
                            shipping_rate_data: {
                                type:
                                    'fixed_amount',

                                fixed_amount: {
                                    amount:
                                        0,

                                    currency:
                                        taxConfig
                                            .stripeCurrency,
                                },

                                display_name:
                                    'Shipping calculated after address',

                                tax_behavior:
                                    taxConfig
                                        .taxBehavior,

                                tax_code:
                                    taxConfig
                                        .shippingTaxCode,

                                metadata: {
                                    storefront:
                                        'maxipawz',

                                    shipping_placeholder:
                                        'true',
                                },
                            },
                        },
                    ],

                    customer_creation:
                        'always',

                    billing_address_collection:
                        'auto',

                    phone_number_collection: {
                        enabled:
                            true,
                    },

                    allow_promotion_codes:
                        false,

                    client_reference_id:
                        cartReference,

                    metadata: {
                        cart_reference:
                            cartReference,

                        cart_source:
                            'storefront-cart',

                        storefront:
                            'maxipawz',

                        checkout_mode:
                            'test',

                        sandbox_catalog_checkout:
                            allowDemoProducts
                                ? 'true'
                                : 'false',

                        sales_country:
                            taxConfig
                                .salesCountry,

                        automatic_tax_enabled:
                            'true',

                        shipping_provider:
                            'maxipawz',

                        shipping_model:
                            'weight-destination-table',

                        shipping_weight_oz:
                            String(
                                cart
                                    .shippingWeightOz,
                            ),

                        free_shipping_threshold_cents:
                            String(
                                shippingConfig
                                    .freeShippingThresholdAmount,
                            ),

                        merchandise_subtotal_cents:
                            String(
                                cart
                                    .merchandiseSubtotalAmount,
                            ),
                    },

                    return_url:
                        `${siteOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
                });

        if (
            !session.client_secret
        ) {
            throw new Error(
                'Stripe did not return an Embedded Checkout client secret.',
            );
        }

        return jsonResponse({
            ok: true,

            sessionId:
                session.id,

            clientSecret:
                session.client_secret,
        });
    } catch (error) {
        if (
            error instanceof
            CheckoutValidationError
        ) {
            return jsonResponse(
                {
                    ok: false,

                    code:
                        error.code,

                    message:
                        error.message,
                },
                error.status,
            );
        }

        if (
            error instanceof
            CheckoutConfigurationError
        ) {
            return jsonResponse(
                {
                    ok: false,

                    code:
                        'stripe-not-configured',

                    message:
                        error.message,
                },
                error.status,
            );
        }

        const errorReference =
            randomUUID();

        console.error(
            'Embedded Stripe Checkout Session creation failed.',
            {
                errorReference,

                error,
            },
        );

        return jsonResponse(
            {
                ok: false,

                code:
                    'session-creation-failed',

                message:
                    `Checkout could not be started. Reference: ${errorReference}`,
            },
            500,
        );
    }
}

export const config:
    Config = {
    path:
        '/api/create-embedded-checkout-session',
};