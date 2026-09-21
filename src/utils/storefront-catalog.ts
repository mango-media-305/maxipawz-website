import type {
  Locale,
} from '../i18n/languages';

import type {
  Product,
} from '../types/product';

import {
  getActiveProducts,
} from './products';

export function getStorefrontCatalogProducts(
  locale:
    Locale = 'en',
): Product[] {
  const allowDemoProducts =
    import.meta.env.DEV &&
    import.meta.env.PUBLIC_SANDBOX_CATALOG_CHECKOUT ===
      'true';

  /*
   * Keep sold-out and coming-soon products available to explore.
   * Demo products are included only in the local sandbox.
   */
  return getActiveProducts(
    locale,
  ).filter(
    (
      product,
    ) =>
      product.availability !==
        'discontinued' &&
      (
        !product.isDemo ||
        allowDemoProducts
      ),
  );
}