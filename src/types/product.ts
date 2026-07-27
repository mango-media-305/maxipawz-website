import type { ImageMetadata } from 'astro';

export const productCategorySlugs = [
    'play-and-enrichment',
    'walk-and-travel',
    'feeding-and-hydration',
    'comfort-and-home',
    'grooming-and-care',
    'collars-and-accessories',
] as const;

export type ProductCategorySlug =
    (typeof productCategorySlugs)[number];

export const productStatuses = [
    'draft',
    'active',
    'archived',
] as const;

export type ProductStatus =
    (typeof productStatuses)[number];

export const productAvailabilityValues = [
    'coming-soon',
    'in-stock',
    'out-of-stock',
    'discontinued',
] as const;

export type ProductAvailability =
    (typeof productAvailabilityValues)[number];

export const petTypeValues = [
    'dog',
    'cat',
    'small-pet',
    'other',
] as const;

export type PetType =
    (typeof petTypeValues)[number];

export type ProductCurrency = 'USD';

export type ProductImagePosition =
    | 'center'
    | 'top'
    | 'bottom'
    | 'left'
    | 'right';

export interface ProductImageCredit {
    name: string;
    href: string;
    source: 'Unsplash';
}

export interface ProductImage {
    src: ImageMetadata | string;
    alt: string;
    position?: ProductImagePosition;

    width?: number;
    height?: number;

    credit?: ProductImageCredit;
}

export interface ProductPrice {
    /**
     * Store prices in cents.
     *
     * Example:
     * $19.99 is represented as 1999.
     */
    amount: number;
    currency: ProductCurrency;
}

export interface ProductWeight {
    value: number;
    unit: 'oz' | 'lb' | 'g' | 'kg';
}

export interface ProductDimensions {
    length?: number;
    width?: number;
    height?: number;
    unit: 'in' | 'cm';
    weight?: ProductWeight;
}

export interface ProductVariant {
    id: string;
    label: string;
    sku?: string;

    price?: ProductPrice;
    availability?: ProductAvailability;

    stripePriceId?: string;
}

export interface Product {
    slug: string;
    name: string;
    sku?: string;

    category: ProductCategorySlug;
    status: ProductStatus;
    availability: ProductAvailability;

    shortDescription: string;
    description: string[];

    petTypes: PetType[];
    tags: string[];
    searchKeywords?: string[];

    images: ProductImage[];

    featured?: boolean;
    isDemo?: boolean;

    price?: ProductPrice;
    compareAtPrice?: ProductPrice;

    materials?: string[];
    dimensions?: ProductDimensions;

    variants?: ProductVariant[];

    careInstructions?: string[];
    safetyNotes?: string[];

    stripeProductId?: string;
    stripeDefaultPriceId?: string;

    seoTitle?: string;
    seoDescription?: string;
}