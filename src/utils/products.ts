import { products } from '../data/products';
import {
    lifestyleCategories,
    type LifestyleCategory,
} from '../data/shop';

import {
    productCategorySlugs,
    type PetType,
    type Product,
    type ProductAvailability,
    type ProductCategorySlug,
    type ProductDimensions,
    type ProductImage,
    type ProductPrice,
} from '../types/product';

const availabilityLabels: Record<
    ProductAvailability,
    string
> = {
    'coming-soon': 'Coming soon',
    'in-stock': 'Available',
    'out-of-stock': 'Out of stock',
    discontinued: 'Discontinued',
};

const petTypeLabels: Record<PetType, string> = {
    dog: 'Dogs',
    cat: 'Cats',
    'small-pet': 'Small pets',
    other: 'Other pets',
};

function sortProducts(
    productList: Product[],
): Product[] {
    return [...productList].sort((first, second) => {
        const featuredDifference =
            Number(Boolean(second.featured)) -
            Number(Boolean(first.featured));

        if (featuredDifference !== 0) {
            return featuredDifference;
        }

        return first.name.localeCompare(second.name);
    });
}

export function isProductCategorySlug(
    value: string | null | undefined,
): value is ProductCategorySlug {
    if (!value) {
        return false;
    }

    return productCategorySlugs.includes(
        value as ProductCategorySlug,
    );
}

const sandboxCatalogEnabled =
    import.meta.env.PUBLIC_SANDBOX_CATALOG_CHECKOUT ===
    'true';

function isProductVisible(
    product: Product,
): boolean {
    return (
        sandboxCatalogEnabled ||
        !product.isDemo
    );
}

export function getAllProducts(): Product[] {
    return sortProducts(
        products.filter(isProductVisible),
    );
}

export function getActiveProducts(): Product[] {
    return sortProducts(
        products.filter(
            (product) =>
                product.status === 'active' &&
                isProductVisible(product),
        ),
    );
}

export function getFeaturedProducts(): Product[] {
    return getActiveProducts().filter(
        (product) => product.featured,
    );
}

export function getProductBySlug(
    slug: string,
): Product | undefined {
    return getActiveProducts().find(
        (product) => product.slug === slug,
    );
}

export function getProductsByCategory(
    category: ProductCategorySlug,
): Product[] {
    return getActiveProducts().filter(
        (product) => product.category === category,
    );
}

export function getCategoryBySlug(
    slug: ProductCategorySlug,
): LifestyleCategory | undefined {
    return lifestyleCategories.find(
        (category) => category.slug === slug,
    );
}

export function getCategoryLabel(
    slug: ProductCategorySlug,
): string {
    return (
        getCategoryBySlug(slug)?.title ??
        slug
            .split('-')
            .map(
                (part) =>
                    part.charAt(0).toUpperCase() +
                    part.slice(1),
            )
            .join(' ')
    );
}

export function getAvailabilityLabel(
    availability: ProductAvailability,
): string {
    return availabilityLabels[availability];
}

export function formatPetType(
    petType: PetType,
): string {
    return petTypeLabels[petType];
}

export function formatProductPrice(
    price: ProductPrice,
): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: price.currency,
    }).format(price.amount / 100);
}

export function formatProductDimensions(
    dimensions?: ProductDimensions,
): string | null {
    if (!dimensions) {
        return null;
    }

    const measurements = [
        dimensions.length,
        dimensions.width,
        dimensions.height,
    ].filter(
        (measurement): measurement is number =>
            typeof measurement === 'number',
    );

    const measurementText =
        measurements.length > 0
            ? `${measurements.join(' × ')} ${dimensions.unit}`
            : '';

    const weightText = dimensions.weight
        ? `${dimensions.weight.value} ${dimensions.weight.unit}`
        : '';

    return (
        [measurementText, weightText]
            .filter(Boolean)
            .join(' · ') || null
    );
}

export function getPrimaryProductImage(
    product: Product,
): ProductImage | undefined {
    return product.images[0];
}

export function isProductPurchasable(
    product: Product,
): boolean {
    if (
        product.status !== 'active' ||
        product.availability !== 'in-stock'
    ) {
        return false;
    }

    const hasDefaultStripePrice = Boolean(
        product.stripeProductId &&
        product.stripeDefaultPriceId,
    );

    const hasVariantStripePrice = Boolean(
        product.stripeProductId &&
        product.variants?.some(
            (variant) =>
                variant.availability !==
                'discontinued' &&
                Boolean(variant.stripePriceId),
        ),
    );

    return (
        hasDefaultStripePrice ||
        hasVariantStripePrice
    );
}