import {
    isStoreLive,
} from '../config/storefront';

import type {
    Locale,
} from '../i18n/languages';

import {
    getStorefrontCatalogProducts,
} from './storefront-catalog';

interface CategoryWithSlug {
    slug:
    string;
}

export function getLifestyleCategoryItems<
    T extends CategoryWithSlug,
>(
    categories:
        readonly T[],

    locale:
        Locale = 'en',
): Array<
    T & {
        hasProducts:
        boolean;
    }
> {
    const populatedCategorySlugs =
        new Set<string>(
            getStorefrontCatalogProducts(
                locale,
            ).map(
                (
                    product,
                ) =>
                    product.category,
            ),
        );

    return categories
        .map(
            (
                category,
            ) => ({
                ...category,

                hasProducts:
                    populatedCategorySlugs.has(
                        category.slug,
                    ),
            }),
        )
        .filter(
            (
                category,
            ) =>
                !isStoreLive ||
                category.hasProducts,
        );
}