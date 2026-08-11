import type { ImageMetadata } from 'astro';

export const productCategorySlugs = [
  'play-and-enrichment',
  'walk-and-travel',
  'feeding-and-hydration',
  'comfort-and-home',
  'grooming-and-care',
  'collars-and-accessories',
] as const;

export type ProductCategorySlug = (typeof productCategorySlugs)[number];

export const productStatuses = ['draft', 'active', 'archived'] as const;

export type ProductStatus = (typeof productStatuses)[number];

export const productAvailabilityValues = [
  'coming-soon',
  'in-stock',
  'out-of-stock',
  'discontinued',
] as const;

export type ProductAvailability = (typeof productAvailabilityValues)[number];

export const petTypeValues = ['dog', 'cat', 'small-pet', 'other'] as const;

export type PetType = (typeof petTypeValues)[number];

export type ProductCurrency = 'USD';

export type ProductImagePosition = 'center' | 'top' | 'bottom' | 'left' | 'right';

export interface ProductImageCredit {
  name: string;
  href: string;
  source: 'Unsplash';
}

interface ProductImageBase {
  alt: string;
  position?: ProductImagePosition;
  credit?: ProductImageCredit;
}

/**
 * Production product imagery should be imported from src/assets so Astro can
 * generate responsive, optimized derivatives during the build.
 */
export interface LocalProductImage extends ProductImageBase {
  src: ImageMetadata;
  width?: never;
  height?: never;
}

/**
 * Remote product imagery is intended for temporary or demo catalog content.
 * Intrinsic dimensions are required to reserve layout space and avoid CLS.
 */
export interface RemoteProductImage extends ProductImageBase {
  src: string;
  width: number;
  height: number;
}

export type ProductImage = LocalProductImage | RemoteProductImage;

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

  /**
   * Enables runtime inventory tracking for this option.
   *
   * When omitted, the variant inherits the parent product's
   * trackInventory value.
   *
   * Inventory-tracked variants must have their own SKU.
   */
  trackInventory?: boolean;

  stripePriceId?: string;
}

export interface Product {
  slug: string;
  name: string;
  sku?: string;

  category: ProductCategorySlug;
  status: ProductStatus;
  availability: ProductAvailability;

  /**
   * Enables runtime inventory tracking.
   *
   * Static availability continues to control merchandising states such as
   * coming-soon and discontinued. Runtime inventory is consulted only when
   * the effective catalog availability is in-stock.
   *
   * Products with variants may use this value as the default for all
   * variants. Individual variants can override it.
   */
  trackInventory?: boolean;

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
