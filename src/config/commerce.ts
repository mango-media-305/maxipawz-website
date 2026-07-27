import {
    businessConfig,
} from './business';

import {
    isStoreLive,
} from './storefront';

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
} as const;

export const isTestCheckoutEnabled =
    checkoutMode === 'test';