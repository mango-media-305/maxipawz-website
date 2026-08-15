import type {
    Product,
} from '../types/product';

import type {
    ProductLandingPageDefinition,
} from '../types/product-landing-page';

export interface ProductLandingPageSeoInput
    extends ProductLandingPageDefinition {
    product: Product;
}

export interface ProductLandingPageSeoPolicy {
    noIndex: boolean;

    canonicalPath: string;

    landingPath: string;

    productPath: string;
}

/**
 * SEO policy for featured-product landing pages.
 *
 * Campaign pages default to noindex and canonicalize to
 * the permanent product URL.
 *
 * If we intentionally create an indexable evergreen
 * landing page later, it becomes self-canonical.
 */
export function getProductLandingPageSeoPolicy(
    landingPage:
        ProductLandingPageSeoInput,

    storeLive: boolean,
): ProductLandingPageSeoPolicy {
    const landingPath =
        `/featured/${landingPage.slug}`;

    const productPath =
        `/shop/${landingPage.product.slug}`;

    const noIndex =
        !storeLive ||
        Boolean(
            landingPage.product
                .isDemo,
        ) ||
        landingPage.seo
            .noIndex !==
        false;

    return {
        noIndex,

        canonicalPath:
            noIndex
                ? productPath
                : landingPath,

        landingPath,

        productPath,
    };
}