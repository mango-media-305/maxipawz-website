import { mkdir, writeFile } from 'node:fs/promises';

import { loadEnvFile } from 'node:process';

import Stripe from 'stripe';

import { taxConfig } from '../../src/config/tax';

import { products } from '../../src/data/products';

import type { Product, ProductPrice, ProductVariant } from '../../src/types/product';

import type {
  StripeDemoCatalog,
  StripeDemoCatalogProduct,
} from '../../src/types/stripe-demo-catalog';

try {
  loadEnvFile('.env');
} catch {
  // Environment variables may already
  // be supplied by the shell.
}

const GENERATED_TYPESCRIPT_PATH = 'src/data/stripe-demo-catalog.generated.ts';

const GENERATED_JSON_PATH = '.tmp/stripe-demo-catalog.json';

function getStripeSecretKey(): string {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!stripeSecretKey || !stripeSecretKey.startsWith('sk_test_')) {
    throw new Error(
      'STRIPE_SECRET_KEY must contain a Stripe Sandbox secret key beginning with sk_test_.',
    );
  }

  return stripeSecretKey;
}

function normalizeLookupSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

function getProductLookupKey(product: Product, variant?: ProductVariant): string {
  const productSegment = normalizeLookupSegment(product.slug);

  const optionSegment = variant ? normalizeLookupSegment(variant.id) : 'default';

  return `maxipawz_demo_${productSegment}_${optionSegment}`;
}

function getProductImageUrl(product: Product): string | undefined {
  const image = product.images[0];

  if (!image) {
    return undefined;
  }

  const source = typeof image.src === 'string' ? image.src : image.src.src;

  if (!source.startsWith('https://')) {
    return undefined;
  }

  return source;
}

function getStripeProductId(price: Stripe.Price): string {
  return typeof price.product === 'string' ? price.product : price.product.id;
}

function getPriceForOption(product: Product, variant?: ProductVariant): ProductPrice {
  const price = variant?.price ?? product.price;

  if (!price) {
    const optionLabel = variant ? ` option "${variant.label}"` : '';

    throw new Error(`${product.name}${optionLabel} does not have a price.`);
  }

  if (price.currency !== 'USD') {
    throw new Error(`${product.name} must use USD for the U.S.-only storefront.`);
  }

  return price;
}

function getOptionAvailability(product: Product, variant?: ProductVariant): string {
  return variant?.availability ?? product.availability;
}

async function findExistingProduct(
  stripe: Stripe,
  product: Product,
): Promise<Stripe.Product | undefined> {
  for await (const stripeProduct of stripe.products.list({
    limit: 100,
  })) {
    if (
      stripeProduct.metadata.catalog_slug === product.slug &&
      stripeProduct.metadata.storefront === 'maxipawz' &&
      stripeProduct.metadata.demo_only === 'true'
    ) {
      return stripeProduct;
    }
  }

  return undefined;
}

async function getOrCreateProduct(stripe: Stripe, product: Product): Promise<Stripe.Product> {
  const existingProduct = await findExistingProduct(stripe, product);

  const imageUrl = getProductImageUrl(product);

  const metadata = {
    catalog_slug: product.slug,

    catalog_sku: product.sku ?? '',

    catalog_category: product.category,

    availability: product.availability,

    storefront: 'maxipawz',

    demo_only: 'true',

    sales_country: taxConfig.salesCountry,

    tax_code: taxConfig.productTaxCode,
  };

  const productData = {
    active: true,

    name: `[DEMO] ${product.name}`,

    description: `TEST ONLY — ${product.shortDescription}`,

    tax_code: taxConfig.productTaxCode,

    metadata,

    ...(imageUrl
      ? {
          images: [imageUrl],
        }
      : {}),
  };

  if (existingProduct) {
    return stripe.products.update(existingProduct.id, productData);
  }

  return stripe.products.create(productData);
}

async function findExistingPrice(
  stripe: Stripe,
  lookupKey: string,
): Promise<Stripe.Price | undefined> {
  const response = await stripe.prices.list({
    lookup_keys: [lookupKey],

    limit: 100,
  });

  return response.data[0];
}

async function getOrCreatePrice(
  stripe: Stripe,
  stripeProduct: Stripe.Product,
  product: Product,
  variant?: ProductVariant,
): Promise<Stripe.Price> {
  const price = getPriceForOption(product, variant);

  const lookupKey = getProductLookupKey(product, variant);

  const availability = getOptionAvailability(product, variant);

  const shouldBeActive = availability === 'in-stock';

  const label = variant ? `${product.name} — ${variant.label}` : product.name;

  const metadata = {
    catalog_slug: product.slug,

    catalog_sku: variant?.sku ?? product.sku ?? '',

    variant_id: variant?.id ?? '',

    variant_label: variant?.label ?? '',

    availability,

    storefront: 'maxipawz',

    demo_only: 'true',

    sales_country: taxConfig.salesCountry,

    tax_behavior: taxConfig.taxBehavior,
  };

  const existingPrice = await findExistingPrice(stripe, lookupKey);

  const currency = price.currency.toLowerCase();

  const existingMatches = Boolean(
    existingPrice &&
      getStripeProductId(existingPrice) === stripeProduct.id &&
      existingPrice.unit_amount === price.amount &&
      existingPrice.currency === currency &&
      existingPrice.tax_behavior === taxConfig.taxBehavior,
  );

  if (existingPrice && existingMatches) {
    return stripe.prices.update(existingPrice.id, {
      active: shouldBeActive,

      nickname: `[DEMO] ${label}`,

      metadata,
    });
  }

  const newPrice = await stripe.prices.create({
    product: stripeProduct.id,

    currency,

    unit_amount: price.amount,

    tax_behavior: taxConfig.taxBehavior,

    active: shouldBeActive,

    lookup_key: lookupKey,

    transfer_lookup_key: Boolean(existingPrice),

    nickname: `[DEMO] ${label}`,

    metadata,
  });

  if (existingPrice?.active) {
    await stripe.prices.update(existingPrice.id, {
      active: false,
    });
  }

  return newPrice;
}

async function syncCatalogProduct(
  stripe: Stripe,
  product: Product,
): Promise<[string, StripeDemoCatalogProduct]> {
  const stripeProduct = await getOrCreateProduct(stripe, product);

  const reference: StripeDemoCatalogProduct = {
    stripeProductId: stripeProduct.id,

    variantPriceIds: {},
  };

  if (product.variants && product.variants.length > 0) {
    for (const variant of product.variants) {
      const stripePrice = await getOrCreatePrice(stripe, stripeProduct, product, variant);

      reference.variantPriceIds[variant.id] = stripePrice.id;
    }
  } else {
    const stripePrice = await getOrCreatePrice(stripe, stripeProduct, product);

    reference.stripeDefaultPriceId = stripePrice.id;
  }

  return [product.slug, reference];
}

function createGeneratedModule(catalog: StripeDemoCatalog): string {
  return `import type {
  StripeDemoCatalog,
} from '../types/stripe-demo-catalog';

/**
 * AUTO-GENERATED FILE.
 *
 * Generated by:
 *
 * npm run stripe:create-test-catalog
 *
 * Do not edit the Stripe IDs manually.
 */
export const stripeDemoCatalog:
  StripeDemoCatalog = ${JSON.stringify(catalog, null, 2)};
`;
}

async function main(): Promise<void> {
  const stripe = new Stripe(getStripeSecretKey());

  const demoProducts = products.filter((product) => product.isDemo);

  if (demoProducts.length === 0) {
    throw new Error('No demo products were found in src/data/products.ts.');
  }

  console.log(`Synchronizing ${demoProducts.length} demo products with Stripe Sandbox...`);

  console.log(`Product tax code: ${taxConfig.productTaxCode} (${taxConfig.productTaxCodeLabel})`);

  console.log(`Tax behavior: ${taxConfig.taxBehavior}`);

  console.log('');

  const entries: Array<[string, StripeDemoCatalogProduct]> = [];

  for (const product of demoProducts) {
    console.log(`Synchronizing ${product.name}...`);

    entries.push(await syncCatalogProduct(stripe, product));
  }

  const catalog = Object.fromEntries(entries) as StripeDemoCatalog;

  await mkdir('.tmp', {
    recursive: true,
  });

  await writeFile(
    GENERATED_TYPESCRIPT_PATH,

    createGeneratedModule(catalog),

    'utf8',
  );

  await writeFile(
    GENERATED_JSON_PATH,

    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),

        taxConfiguration: {
          salesCountry: taxConfig.salesCountry,

          productTaxCode: taxConfig.productTaxCode,

          shippingTaxCode: taxConfig.shippingTaxCode,

          taxBehavior: taxConfig.taxBehavior,
        },

        products: catalog,
      },
      null,
      2,
    )}\n`,

    'utf8',
  );

  console.log('');

  console.log('Stripe Sandbox synchronization complete.');

  console.log(`Generated ${GENERATED_TYPESCRIPT_PATH}.`);

  console.log(`Generated ${GENERATED_JSON_PATH}.`);

  console.log('');

  entries.forEach(([productSlug, reference]) => {
    console.log(`${productSlug}: ${reference.stripeProductId}`);

    if (reference.stripeDefaultPriceId) {
      console.log(`  default: ${reference.stripeDefaultPriceId}`);
    }

    Object.entries(reference.variantPriceIds).forEach(([variantId, priceId]) => {
      console.log(`  ${variantId}: ${priceId}`);
    });
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);

  process.exitCode = 1;
});
