import {
  products,
} from '../data/products';

import {
  getLocalizedAvailabilityLabel,
  getLocalizedCategoryLabel,
  getLocalizedPetTypeLabel,
} from '../i18n/commerce';

import type {
  Locale,
} from '../i18n/languages';

import {
  getLocalizedProduct,
} from '../i18n/products';

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

function sortProducts(
  productList:
    Product[],
): Product[] {
  return [
    ...productList,
  ].sort(
    (
      first,
      second,
    ) => {
      const featuredDifference =
        Number(
          Boolean(
            second.featured,
          ),
        ) -
        Number(
          Boolean(
            first.featured,
          ),
        );

      if (
        featuredDifference !==
        0
      ) {
        return featuredDifference;
      }

      return first.name.localeCompare(
        second.name,
      );
    },
  );
}

export function isProductCategorySlug(
  value:
    string |
    null |
    undefined,
): value is ProductCategorySlug {
  if (
    !value
  ) {
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
  product:
    Product,
): boolean {
  return (
    sandboxCatalogEnabled ||
    !product.isDemo
  );
}

function localizeProducts(
  productList:
    Product[],

  locale:
    Locale,
): Product[] {
  return productList.map(
    (
      product,
    ) =>
      getLocalizedProduct(
        product,
        locale,
      ),
  );
}

export function getAllProducts(
  locale:
    Locale = 'en',
): Product[] {
  return sortProducts(
    localizeProducts(
      products.filter(
        isProductVisible,
      ),
      locale,
    ),
  );
}

export function getActiveProducts(
  locale:
    Locale = 'en',
): Product[] {
  return sortProducts(
    localizeProducts(
      products.filter(
        (
          product,
        ) =>
          product.status ===
            'active' &&
          isProductVisible(
            product,
          ),
      ),
      locale,
    ),
  );
}

export function getFeaturedProducts(
  locale:
    Locale = 'en',
): Product[] {
  return getActiveProducts(
    locale,
  ).filter(
    (
      product,
    ) =>
      product.featured,
  );
}

export function getProductBySlug(
  slug:
    string,

  locale:
    Locale = 'en',
): Product | undefined {
  return getActiveProducts(
    locale,
  ).find(
    (
      product,
    ) =>
      product.slug ===
      slug,
  );
}

export function getProductsByCategory(
  category:
    ProductCategorySlug,

  locale:
    Locale = 'en',
): Product[] {
  return getActiveProducts(
    locale,
  ).filter(
    (
      product,
    ) =>
      product.category ===
      category,
  );
}

export function getCategoryLabel(
  slug:
    ProductCategorySlug,

  locale:
    Locale = 'en',
): string {
  return getLocalizedCategoryLabel(
    slug,
    locale,
  );
}

export function getAvailabilityLabel(
  availability:
    ProductAvailability,

  locale:
    Locale = 'en',
): string {
  return getLocalizedAvailabilityLabel(
    availability,
    locale,
  );
}

export function formatPetType(
  petType:
    PetType,

  locale:
    Locale = 'en',
): string {
  return getLocalizedPetTypeLabel(
    petType,
    locale,
  );
}

export function formatProductPrice(
  price:
    ProductPrice,

  locale:
    Locale = 'en',
): string {
  return new Intl.NumberFormat(
    locale ===
      'es'
      ? 'es-US'
      : 'en-US',

    {
      style:
        'currency',

      currency:
        price.currency,
    },
  ).format(
    price.amount /
      100,
  );
}

export function formatProductDimensions(
  dimensions?:
    ProductDimensions,

  locale:
    Locale = 'en',
): string | null {
  if (
    !dimensions
  ) {
    return null;
  }

  const measurements = [
    dimensions.length,
    dimensions.width,
    dimensions.height,
  ].filter(
    (
      measurement,
    ): measurement is number =>
      typeof measurement ===
      'number',
  );

  const dimensionUnit =
    locale ===
      'es' &&
    dimensions.unit ===
      'in'
      ? 'pulg'
      : dimensions.unit;

  const measurementText =
    measurements.length >
    0
      ? `${measurements.join(
          ' × ',
        )} ${dimensionUnit}`
      : '';

  const weightText =
    dimensions.weight
      ? `${dimensions.weight.value} ${dimensions.weight.unit}`
      : '';

  return (
    [
      measurementText,
      weightText,
    ]
      .filter(
        Boolean,
      )
      .join(
        ' · ',
      ) ||
    null
  );
}

export function getPrimaryProductImage(
  product:
    Product,
): ProductImage | undefined {
  return product.images[
    0
  ];
}

export function isProductPurchasable(
  product:
    Product,
): boolean {
  if (
    product.status !==
      'active' ||
    product.availability !==
      'in-stock'
  ) {
    return false;
  }

  const hasDefaultStripePrice =
    Boolean(
      product.stripeProductId &&
      product.stripeDefaultPriceId,
    );

  const hasVariantStripePrice =
    Boolean(
      product.stripeProductId &&
      product.variants?.some(
        (
          variant,
        ) =>
          variant.availability !==
            'discontinued' &&
          Boolean(
            variant.stripePriceId,
          ),
      ),
    );

  return (
    hasDefaultStripePrice ||
    hasVariantStripePrice
  );
}