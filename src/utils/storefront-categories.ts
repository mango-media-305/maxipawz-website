import { isStoreLive } from '../config/storefront';
import { getActiveProducts } from './products';

interface CategoryWithSlug {
    slug: string;
}

export function getLifestyleCategoryItems<T extends CategoryWithSlug>(
    categories: readonly T[],
): Array<T & { hasProducts: boolean }> {
    // Demo products can populate categories only in the local sandbox.
    const allowDemoProducts =
        import.meta.env.DEV &&
        import.meta.env.PUBLIC_SANDBOX_CATALOG_CHECKOUT === 'true';

    // Use the full catalog, not the homepage's featured-product preview.
    // Sold-out and coming-soon products still have useful product pages.
    const catalogProducts = getActiveProducts().filter(
        (product) =>
            product.availability !== 'discontinued' &&
            (!product.isDemo || allowDemoProducts),
    );

    const populatedCategorySlugs = new Set<string>(
        catalogProducts.map((product) => product.category),
    );

    return categories
        .map((category) => ({
            ...category,
            hasProducts: populatedCategorySlugs.has(category.slug),
        }))
        .filter((category) => !isStoreLive || category.hasProducts);
}