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
    parseShippingRateAmount,
    shippingConfig,
} from '../../src/config/shipping';

import {
    products,
} from '../../src/data/products';

import type {
    CheckoutErrorCode,
    CheckoutRequestLine,
    CheckoutSessionErrorResponse,
    CheckoutSessionRequest,
    CheckoutSessionSuccessResponse,
} from '../../src/types/checkout';

import type {
    Product,
    ProductPrice,
    ProductVariant,
} from '../../src/types/product';

import type {
    ShippingQuote,
} from '../../src/types/shipping';

import {
    getShippingQuote,
} from '../../src/utils/shipping';

const MAXIMUM_CART_LINES = 50;
const MAXIMUM_QUANTITY = 99;

type StripeShippingOptions =
    NonNullable<
        Stripe.Checkout.SessionCreateParams[
        'shipping_options'
        ]
    >;

interface CheckoutRuntimeConfig {
    stripeSecretKey: string;
    allowDemoProducts: boolean;

    standardShippingRateAmount:
    | number
    | null;
}

interface ValidatedStripeLine {
    price: string;
    quantity: number;
    unitAmount: number;
}

interface ConsolidatedCart {
    lineItems:
    Stripe.Checkout.SessionCreateParams.LineItem[];

    merchandiseSubtotalAmount: number;
}

interface ShippingSelection {
    quote: ShippingQuote;

    options:
    StripeShippingOptions;
}

class CheckoutRequestError
    extends Error {
    readonly status: number;

    readonly code:
        CheckoutErrorCode;

    constructor(
        status: number,
        code: CheckoutErrorCode,
        message: string,
    ) {
        super(message);

        this.name =
            'CheckoutRequestError';

        this.status =
            status;

        this.code =
            code;
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

function parseCheckoutLine(
    value: unknown,
): CheckoutRequestLine {
    if (!isRecord(value)) {
        throw new CheckoutRequestError(
            400,
            'invalid-cart',
            'A cart item has an invalid format.',
        );
    }

    if (
        typeof value.productSlug !==
        'string' ||
        !value.productSlug.trim()
    ) {
        throw new CheckoutRequestError(
            400,
            'invalid-cart',
            'A cart item is missing its product identifier.',
        );
    }

    const quantity =
        typeof value.quantity ===
            'number'
            ? value.quantity
            : Number.NaN;

    if (
        !Number.isInteger(
            quantity,
        ) ||
        quantity < 1 ||
        quantity >
        MAXIMUM_QUANTITY
    ) {
        throw new CheckoutRequestError(
            400,
            'invalid-cart',
            `Cart quantities must be whole numbers between 1 and ${MAXIMUM_QUANTITY}.`,
        );
    }

    const variantId =
        typeof value.variantId ===
            'string' &&
            value.variantId.trim()
            ? value.variantId.trim()
            : undefined;

    return {
        productSlug:
            value.productSlug.trim(),

        variantId,
        quantity,
    };
}

async function parseRequest(
    request: Request,
): Promise<CheckoutSessionRequest> {
    let value: unknown;

    try {
        value =
            await request.json();
    } catch {
        throw new CheckoutRequestError(
            400,
            'invalid-request',
            'The checkout request could not be read.',
        );
    }

    if (
        !isRecord(value) ||
        !Array.isArray(
            value.lines,
        )
    ) {
        throw new CheckoutRequestError(
            400,
            'invalid-request',
            'The checkout request is missing its cart lines.',
        );
    }

    if (
        value.lines.length === 0 ||
        value.lines.length >
        MAXIMUM_CART_LINES
    ) {
        throw new CheckoutRequestError(
            400,
            'invalid-cart',
            `The cart must contain between 1 and ${MAXIMUM_CART_LINES} lines.`,
        );
    }

    return {
        lines:
            value.lines.map(
                parseCheckoutLine,
            ),
    };
}

function assertCheckoutConfiguration():
    CheckoutRuntimeConfig {
    if (
        process.env
            .PUBLIC_CHECKOUT_MODE !==
        'test'
    ) {
        throw new CheckoutRequestError(
            503,
            'checkout-disabled',
            'Stripe test checkout is currently disabled.',
        );
    }

    if (
        process.env
            .PUBLIC_STOREFRONT_MODE !==
        'live'
    ) {
        throw new CheckoutRequestError(
            503,
            'storefront-not-live',
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
        throw new CheckoutRequestError(
            503,
            'stripe-not-configured',
            'A Stripe Sandbox secret key has not been configured.',
        );
    }

    const allowDemoProducts =
        process.env
            .PUBLIC_SANDBOX_CATALOG_CHECKOUT ===
        'true';

    if (
        !businessConfig
            .commercePoliciesFinalized &&
        !allowDemoProducts
    ) {
        throw new CheckoutRequestError(
            503,
            'policies-incomplete',
            'Commerce policies must be finalized before checkout can begin.',
        );
    }

    return {
        stripeSecretKey,

        allowDemoProducts,

        standardShippingRateAmount:
            parseShippingRateAmount(
                process.env
                    .PUBLIC_STANDARD_SHIPPING_RATE_CENTS,
            ),
    };
}

function getProduct(
    slug: string,
    allowDemoProducts: boolean,
): Product {
    const product =
        products.find(
            (
                catalogProduct,
            ) =>
                catalogProduct.slug ===
                slug,
        );

    if (
        !product ||
        product.status !==
        'active'
    ) {
        throw new CheckoutRequestError(
            400,
            'product-not-found',
            'One of the selected products is no longer available.',
        );
    }

    if (
        product.isDemo &&
        !allowDemoProducts
    ) {
        throw new CheckoutRequestError(
            400,
            'demo-product',
            'Demo products are disabled for Stripe Checkout.',
        );
    }

    return product;
}

function getVariant(
    product: Product,
    variantId?: string,
): ProductVariant | undefined {
    const hasVariants =
        Boolean(
            product.variants
                ?.length,
        );

    if (
        hasVariants &&
        !variantId
    ) {
        throw new CheckoutRequestError(
            400,
            'variant-required',
            `Select an option for ${product.name}.`,
        );
    }

    if (
        !hasVariants &&
        variantId
    ) {
        throw new CheckoutRequestError(
            400,
            'variant-not-found',
            `The selected option for ${product.name} is invalid.`,
        );
    }

    if (!variantId) {
        return undefined;
    }

    const variant =
        product.variants?.find(
            (
                productVariant,
            ) =>
                productVariant.id ===
                variantId,
        );

    if (!variant) {
        throw new CheckoutRequestError(
            400,
            'variant-not-found',
            `The selected option for ${product.name} is no longer available.`,
        );
    }

    return variant;
}

function getCatalogPrice(
    product: Product,
    variant?: ProductVariant,
): ProductPrice {
    const price =
        variant?.price ??
        product.price;

    if (
        !price ||
        price.amount < 0
    ) {
        throw new CheckoutRequestError(
            400,
            'price-not-configured',
            `${product.name} does not have a valid catalog price.`,
        );
    }

    if (
        price.currency !==
        shippingConfig.currency
    ) {
        throw new CheckoutRequestError(
            400,
            'invalid-cart',
            `${product.name} uses an unsupported currency.`,
        );
    }

    return price;
}

function getStripeLineItem(
    line: CheckoutRequestLine,
    allowDemoProducts: boolean,
): ValidatedStripeLine {
    const product =
        getProduct(
            line.productSlug,
            allowDemoProducts,
        );

    const variant =
        getVariant(
            product,
            line.variantId,
        );

    const availability =
        variant?.availability ??
        product.availability;

    if (
        availability !==
        'in-stock'
    ) {
        throw new CheckoutRequestError(
            400,
            'product-unavailable',
            `${product.name} is not currently available for checkout.`,
        );
    }

    const catalogPrice =
        getCatalogPrice(
            product,
            variant,
        );

    const stripePriceId =
        variant?.stripePriceId ??
        product
            .stripeDefaultPriceId;

    if (
        !stripePriceId ||
        !stripePriceId.startsWith(
            'price_',
        )
    ) {
        throw new CheckoutRequestError(
            400,
            'price-not-configured',
            `${product.name} does not have a valid Stripe Sandbox Price ID.`,
        );
    }

    return {
        price:
            stripePriceId,

        quantity:
            line.quantity,

        unitAmount:
            catalogPrice.amount,
    };
}

function consolidateLineItems(
    lines: CheckoutRequestLine[],
    allowDemoProducts: boolean,
): ConsolidatedCart {
    const groupedLines =
        new Map<
            string,
            {
                quantity: number;
                unitAmount: number;
            }
        >();

    let merchandiseSubtotalAmount =
        0;

    lines.forEach((line) => {
        const stripeLine =
            getStripeLineItem(
                line,
                allowDemoProducts,
            );

        merchandiseSubtotalAmount +=
            stripeLine.unitAmount *
            stripeLine.quantity;

        const existingLine =
            groupedLines.get(
                stripeLine.price,
            );

        const nextQuantity =
            (
                existingLine
                    ?.quantity ?? 0
            ) +
            stripeLine.quantity;

        if (
            nextQuantity >
            MAXIMUM_QUANTITY
        ) {
            throw new CheckoutRequestError(
                400,
                'invalid-cart',
                `A product quantity cannot exceed ${MAXIMUM_QUANTITY}.`,
            );
        }

        groupedLines.set(
            stripeLine.price,
            {
                quantity:
                    nextQuantity,

                unitAmount:
                    stripeLine
                        .unitAmount,
            },
        );
    });

    return {
        merchandiseSubtotalAmount,

        lineItems:
            Array.from(
                groupedLines
                    .entries(),
            ).map(
                ([
                    price,
                    value,
                ]) => ({
                    price,

                    quantity:
                        value.quantity,
                }),
            ),
    };
}

function getShippingSelection(
    merchandiseSubtotalAmount: number,
    standardShippingRateAmount:
        | number
        | null,
): ShippingSelection {
    const quote =
        getShippingQuote(
            merchandiseSubtotalAmount,
            standardShippingRateAmount,
        );

    if (
        quote.shippingAmount ===
        null
    ) {
        throw new CheckoutRequestError(
            503,
            'shipping-not-configured',
            'The standard shipping rate is not configured.',
        );
    }

    const displayName =
        quote
            .qualifiesForFreeShipping
            ? shippingConfig
                .freeDisplayName
            : shippingConfig
                .standardDisplayName;

    return {
        quote,

        options: [
            {
                shipping_rate_data: {
                    type:
                        'fixed_amount',

                    fixed_amount: {
                        amount:
                            quote
                                .shippingAmount,

                        currency:
                            'usd',
                    },

                    display_name:
                        displayName,

                    delivery_estimate: {
                        minimum: {
                            unit:
                                'business_day',

                            value:
                                shippingConfig
                                    .transitEstimate
                                    .minimumBusinessDays,
                        },

                        maximum: {
                            unit:
                                'business_day',

                            value:
                                shippingConfig
                                    .transitEstimate
                                    .maximumBusinessDays,
                        },
                    },

                    metadata: {
                        storefront:
                            'maxipawz',

                        shipping_tier:
                            quote.tier,

                        free_shipping_threshold_cents:
                            String(
                                shippingConfig
                                    .freeShippingThresholdAmount,
                            ),
                    },
                },
            },
        ],
    };
}

function getSiteOrigin(): string {
    const configuredSiteUrl =
        process.env
            .PUBLIC_SITE_URL
            ?.trim() ||
        process.env.URL?.trim();

    if (!configuredSiteUrl) {
        throw new CheckoutRequestError(
            503,
            'stripe-not-configured',
            'The website URL is not configured for checkout.',
        );
    }

    let parsedUrl: URL;

    try {
        parsedUrl =
            new URL(
                configuredSiteUrl,
            );
    } catch {
        throw new CheckoutRequestError(
            503,
            'stripe-not-configured',
            'The configured website URL is invalid.',
        );
    }

    if (
        parsedUrl.protocol !==
        'http:' &&
        parsedUrl.protocol !==
        'https:'
    ) {
        throw new CheckoutRequestError(
            503,
            'stripe-not-configured',
            'The configured website URL must use HTTP or HTTPS.',
        );
    }

    return parsedUrl.origin;
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
        const runtimeConfig =
            assertCheckoutConfiguration();

        const checkoutRequest =
            await parseRequest(
                request,
            );

        const consolidatedCart =
            consolidateLineItems(
                checkoutRequest.lines,

                runtimeConfig
                    .allowDemoProducts,
            );

        const shippingSelection =
            getShippingSelection(
                consolidatedCart
                    .merchandiseSubtotalAmount,

                runtimeConfig
                    .standardShippingRateAmount,
            );

        const siteOrigin =
            getSiteOrigin();

        const cartReference =
            randomUUID();

        const stripe =
            new Stripe(
                runtimeConfig
                    .stripeSecretKey,
            );

        const session =
            await stripe
                .checkout
                .sessions
                .create({
                    mode:
                        'payment',

                    line_items:
                        consolidatedCart
                            .lineItems,

                    shipping_address_collection: {
                        allowed_countries: [
                            'US',
                        ],
                    },

                    shipping_options:
                        shippingSelection
                            .options,

                    customer_creation:
                        'always',

                    billing_address_collection:
                        'auto',

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
                            runtimeConfig
                                .allowDemoProducts
                                ? 'true'
                                : 'false',

                        merchandise_subtotal_cents:
                            String(
                                consolidatedCart
                                    .merchandiseSubtotalAmount,
                            ),

                        shipping_tier:
                            shippingSelection
                                .quote
                                .tier,

                        shipping_amount_cents:
                            String(
                                shippingSelection
                                    .quote
                                    .shippingAmount,
                            ),

                        free_shipping_threshold_cents:
                            String(
                                shippingConfig
                                    .freeShippingThresholdAmount,
                            ),
                    },

                    success_url:
                        `${siteOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,

                    cancel_url:
                        `${siteOrigin}/checkout/cancel`,
                });

        if (!session.url) {
            throw new CheckoutRequestError(
                502,
                'session-creation-failed',
                'Stripe did not return a checkout URL.',
            );
        }

        return jsonResponse({
            ok: true,

            sessionId:
                session.id,

            url:
                session.url,
        });
    } catch (error) {
        if (
            error instanceof
            CheckoutRequestError
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

        const errorReference =
            randomUUID();

        console.error(
            'Stripe Checkout Session creation failed.',
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

export const config: Config = {
    path:
        '/api/create-checkout-session',
};