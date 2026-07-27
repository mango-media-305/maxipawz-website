import {
    businessConfig,
} from './business';

import {
    isStoreLive,
} from './storefront';

import {
    parseShippingRateAmount,
    shippingConfig,
} from './shipping';

import {
    charityConfig,
} from './charity';

export type CheckoutMode =
    | 'disabled'
    | 'test';

const configuredCheckoutMode =
    import.meta.env
        .PUBLIC_CHECKOUT_MODE;

export const checkoutMode:
    CheckoutMode =
    configuredCheckoutMode ===
        'test'
        ? 'test'
        : 'disabled';

export const sandboxCatalogCheckoutEnabled =
    checkoutMode === 'test' &&
    import.meta.env
        .PUBLIC_SANDBOX_CATALOG_CHECKOUT ===
    'true';

export const standardShippingRateAmount =
    parseShippingRateAmount(
        import.meta.env
            .PUBLIC_STANDARD_SHIPPING_RATE_CENTS,
    );

export const checkoutEndpoint =
    '/api/create-checkout-session';

export const orderStatusEndpoint =
    '/api/get-order-status';

export const stripeWebhookEndpoint =
    '/api/stripe-webhook';

export const commerceConfig = {
    checkoutMode,

    sandboxCatalogCheckoutEnabled,

    checkoutEndpoint,
    orderStatusEndpoint,
    stripeWebhookEndpoint,

    storefrontLive:
        isStoreLive,

    policiesFinalized:
        businessConfig
            .commercePoliciesFinalized,

    publicSiteUrl:
        import.meta.env
            .PUBLIC_SITE_URL
            ?.trim() ?? '',

    shipping: {
        ...shippingConfig,

        standardShippingRateAmount,
    },

    charity: {
        planned:
            charityConfig.planned,

        enabled:
            charityConfig.enabled,

        countsTowardFreeShipping:
            charityConfig
                .countsTowardFreeShipping,
    },
} as const;

export const isTestCheckoutEnabled =
    checkoutMode === 'test';