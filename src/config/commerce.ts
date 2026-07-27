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
    import.meta.env.PUBLIC_CHECKOUT_MODE;

export const checkoutMode: CheckoutMode =
    configuredCheckoutMode === 'test'
        ? 'test'
        : 'disabled';

export const checkoutEndpoint =
    '/api/create-checkout-session';

export const commerceConfig = {
    checkoutMode,
    checkoutEndpoint,

    storefrontLive: isStoreLive,

    policiesFinalized:
        businessConfig.commercePoliciesFinalized,

    publicSiteUrl:
        import.meta.env.PUBLIC_SITE_URL?.trim() ??
        '',
} as const;

export const isTestCheckoutEnabled =
    checkoutMode === 'test';