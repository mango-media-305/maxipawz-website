import {
  products,
} from '../data/products';

import {
  commerceText,
  getCommerceNumberLocale,
} from '../i18n/commerce';

import type {
  Locale,
} from '../i18n/languages';

import {
  getLocalizedProduct,
} from '../i18n/products';

import type {
  CartLine,
  CartState,
  CartTotals,
  ResolvedCartLine,
} from '../types/cart';

import type {
  Product,
  ProductAvailability,
  ProductImage,
  ProductPrice,
  ProductVariant,
} from '../types/product';

import {
  getCartLineKey,
} from '../stores/cart';

function getProductFromCatalog(
  slug:
    string,

  locale:
    Locale,
): Product | undefined {
  const product =
    products.find(
      (
        catalogProduct,
      ) =>
        catalogProduct.slug ===
        slug,
    );

  return product
    ? getLocalizedProduct(
        product,
        locale,
      )
    : undefined;
}

function getProductVariant(
  product:
    Product,

  variantId?:
    string,
): ProductVariant | undefined {
  if (
    !variantId
  ) {
    return undefined;
  }

  return product.variants?.find(
    (
      variant,
    ) =>
      variant.id ===
      variantId,
  );
}

function getEffectiveAvailability(
  product:
    Product,

  variant?:
    ProductVariant,
): ProductAvailability {
  return (
    variant?.availability ??
    product.availability
  );
}

function getEffectivePrice(
  product:
    Product,

  variant?:
    ProductVariant,
): ProductPrice | undefined {
  return (
    variant?.price ??
    product.price
  );
}

export function resolveCartLine(
  line:
    CartLine,

  locale:
    Locale = 'en',
): ResolvedCartLine {
  const key =
    getCartLineKey(
      line.productSlug,
      line.variantId,
    );

  const product =
    getProductFromCatalog(
      line.productSlug,
      locale,
    );

  if (
    !product
  ) {
    return {
      key,
      line,

      available:
        false,

      lineTotalAmount:
        0,

      compareAtLineTotalAmount:
        0,

      issue:
        commerceText(
          locale,
          'This product is no longer available in the catalog.',
          'Este producto ya no está disponible en el catálogo.',
        ),
    };
  }

  const variant =
    getProductVariant(
      product,
      line.variantId,
    );

  const requiresVariant =
    Boolean(
      product.variants
        ?.length,
    );

  if (
    requiresVariant &&
    !variant
  ) {
    return {
      key,
      line,
      product,

      image:
        product.images[
          0
        ],

      available:
        false,

      lineTotalAmount:
        0,

      compareAtLineTotalAmount:
        0,

      issue:
        commerceText(
          locale,
          'The selected product option is no longer available.',
          'La opción seleccionada de este producto ya no está disponible.',
        ),
    };
  }

  const unitPrice =
    getEffectivePrice(
      product,
      variant,
    );

  const availability =
    getEffectiveAvailability(
      product,
      variant,
    );

  const available =
    product.status ===
      'active' &&
    availability ===
      'in-stock' &&
    Boolean(
      unitPrice,
    );

  const lineTotalAmount =
    unitPrice
      ? unitPrice.amount *
        line.quantity
      : 0;

  const compareAtUnitPrice =
    product.compareAtPrice &&
    unitPrice &&
    product.compareAtPrice
      .amount >
      unitPrice.amount
      ? product.compareAtPrice
      : undefined;

  const compareAtLineTotalAmount =
    compareAtUnitPrice
      ? compareAtUnitPrice
          .amount *
        line.quantity
      : lineTotalAmount;

  let issue:
    string |
    undefined;

  if (
    product.status !==
    'active'
  ) {
    issue =
      commerceText(
        locale,
        'This product is no longer active.',
        'Este producto ya no está activo.',
      );
  } else if (
    availability ===
    'coming-soon'
  ) {
    issue =
      commerceText(
        locale,
        'This product is coming soon.',
        'Este producto estará disponible próximamente.',
      );
  } else if (
    availability ===
    'out-of-stock'
  ) {
    issue =
      commerceText(
        locale,
        'This product is currently out of stock.',
        'Este producto está agotado actualmente.',
      );
  } else if (
    availability ===
    'discontinued'
  ) {
    issue =
      commerceText(
        locale,
        'This product has been discontinued.',
        'Este producto ha sido descontinuado.',
      );
  } else if (
    !unitPrice
  ) {
    issue =
      commerceText(
        locale,
        'Pricing is not currently available.',
        'El precio no está disponible actualmente.',
      );
  }

  return {
    key,
    line,
    product,
    variant,

    image:
      product.images[
        0
      ],

    unitPrice,
    compareAtUnitPrice,

    lineTotalAmount,
    compareAtLineTotalAmount,

    available,
    issue,
  };
}

export function resolveCartLines(
  state:
    CartState,

  locale:
    Locale = 'en',
): ResolvedCartLine[] {
  return state.lines.map(
    (
      line,
    ) =>
      resolveCartLine(
        line,
        locale,
      ),
  );
}

export function getCartTotals(
  lines:
    ResolvedCartLine[],
): CartTotals {
  return lines.reduce<CartTotals>(
    (
      totals,
      line,
    ) => {
      totals.itemCount +=
        line.line
          .quantity;

      if (
        line.available
      ) {
        totals.validItemCount +=
          line.line
            .quantity;

        totals.subtotalAmount +=
          line.lineTotalAmount;

        totals.compareAtSubtotalAmount +=
          line.compareAtLineTotalAmount;
      } else {
        totals.unavailableLineCount +=
          1;
      }

      if (
        line.product
          ?.isDemo
      ) {
        totals.hasDemoItems =
          true;
      }

      totals.savingsAmount =
        Math.max(
          0,

          totals.compareAtSubtotalAmount -
            totals.subtotalAmount,
        );

      return totals;
    },

    {
      itemCount:
        0,

      validItemCount:
        0,

      subtotalAmount:
        0,

      compareAtSubtotalAmount:
        0,

      savingsAmount:
        0,

      unavailableLineCount:
        0,

      hasDemoItems:
        false,
    },
  );
}

export function formatCartAmount(
  amount:
    number,

  currency =
    'USD',

  locale:
    Locale = 'en',
): string {
  return new Intl.NumberFormat(
    getCommerceNumberLocale(
      locale,
    ),

    {
      style:
        'currency',

      currency,
    },
  ).format(
    amount /
      100,
  );
}

export function getProductImageSource(
  image?:
    ProductImage,
): string | undefined {
  if (
    !image
  ) {
    return undefined;
  }

  return typeof image.src ===
    'string'
    ? image.src
    : image.src.src;
}