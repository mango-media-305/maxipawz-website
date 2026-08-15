import {
    productLandingPages,
} from '../data/product-landing-pages';

import {
    products,
} from '../data/products';

import type {
    Product,
} from '../types/product';

import type {
    ProductLandingPageDefinition,
} from '../types/product-landing-page';

import {
    assertValidProductLandingPages,
} from './product-landing-page-validation';

import {
    getProductBySlug,
} from './products';

export interface ResolvedProductLandingPage
    extends ProductLandingPageDefinition {
    product: Product;
}

/**
 * Validate the complete landing-page catalog immediately
 * when this module is loaded.
 *
 * This module is used by the /featured/[slug] static route,
 * so invalid configuration now fails the Astro build instead
 * of silently producing an incomplete campaign page.
 */
assertValidProductLandingPages(
    productLandingPages,

    products,
);

export function getActiveProductLandingPages():
    ResolvedProductLandingPage[] {
    return productLandingPages.flatMap(
        (
            landingPage,
        ) => {
            if (
                landingPage.status !==
                'active'
            ) {
                return [];
            }

            /*
             * Continue using getProductBySlug instead of reading
             * the raw product array here.
             *
             * That preserves the existing demo-catalog visibility
             * rules and prevents hidden demo products from becoming
             * visible just because they have a landing page.
             */
            const product =
                getProductBySlug(
                    landingPage.productSlug,
                );

            if (
                !product
            ) {
                return [];
            }

            return [
                {
                    ...landingPage,

                    product,
                },
            ];
        },
    );
}

export function getProductLandingPageBySlug(
    slug: string,
):
    | ResolvedProductLandingPage
    | undefined {
    return getActiveProductLandingPages().find(
        (
            landingPage,
        ) =>
            landingPage.slug ===
            slug,
    );
}