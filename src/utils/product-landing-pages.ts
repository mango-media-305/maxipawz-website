import {
    productLandingPages,
} from '../data/product-landing-pages';

import type {
    Product,
} from '../types/product';

import type {
    ProductLandingPageDefinition,
} from '../types/product-landing-page';

import {
    getProductBySlug,
} from './products';

export interface ResolvedProductLandingPage
    extends ProductLandingPageDefinition {
    product: Product;
}

export function getActiveProductLandingPages():
    ResolvedProductLandingPage[] {
    return productLandingPages.flatMap(
        (landingPage) => {
            if (
                landingPage.status !==
                'active'
            ) {
                return [];
            }

            const product =
                getProductBySlug(
                    landingPage.productSlug,
                );

            if (!product) {
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
        (landingPage) =>
            landingPage.slug === slug,
    );
}