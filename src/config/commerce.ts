import {
    businessConfig,
} from './business';

import {
    isStoreLive,
} from './storefront';

import {
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

export const checkoutEndpoint =
    '/api/create-embedded-checkout-session';

export const shippingOptionsEndpoint =
    '/api/update-shipping-options';

export const orderStatusEndpoint =
    '/api/get-order-status';

export const stripeWebhookEndpoint =
    '/api/stripe-webhook';

export const stripePublishableKey =
    import.meta.env
        .PUBLIC_STRIPE_PUBLISHABLE_KEY
        ?.trim() ?? '';

export const commerceConfig = {
    checkoutMode,

    sandboxCatalogCheckoutEnabled,

    checkoutEndpoint,

    shippingOptionsEndpoint,

    orderStatusEndpoint,

    stripeWebhookEndpoint,

    stripePublishableKey,

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