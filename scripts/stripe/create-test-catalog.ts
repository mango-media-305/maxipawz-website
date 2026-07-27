import { randomUUID } from 'node:crypto';

import { mkdir, writeFile } from 'node:fs/promises';

import { loadEnvFile } from 'node:process';

import Stripe from 'stripe';

try {
  loadEnvFile('.env');
} catch {
  // Environment variables may already be supplied by the shell.
}

interface FixturePrice {
  fixturePriceId: string;
  label: string;

  unitAmount: number;
  lookupKey: string;

  variantId?: string;
}

interface FixtureProduct {
  fixtureProductId: string;

  name: string;
  description: string;
  catalogSlug: string;

  prices: FixturePrice[];
}

interface CreatedFixturePrice {
  fixturePriceId: string;
  label: string;

  stripePriceId: string;
  lookupKey: string;

  unitAmount: number;
  currency: string;

  variantId?: string;
}

interface CreatedFixtureProduct {
  fixtureProductId: string;

  catalogSlug: string;
  name: string;

  stripeProductId: string;

  prices: CreatedFixturePrice[];
}

const fixtures: FixtureProduct[] = [
  {
    fixtureProductId: 'simple-rope-toy',

    name: 'MaxiPawz Stripe Test — Rope Toy',

    description: 'Stripe sandbox fixture used only for checkout and webhook testing.',

    catalogSlug: 'stripe-test-rope-toy',

    prices: [
      {
        fixturePriceId: 'simple-rope-toy-default',

        label: 'Default',

        unitAmount: 1999,

        lookupKey: 'maxipawz_test_rope_toy_default',
      },
    ],
  },

  {
    fixtureProductId: 'sized-harness',

    name: 'MaxiPawz Stripe Test — Sized Harness',

    description: 'Stripe sandbox fixture with multiple prices for variant testing.',

    catalogSlug: 'stripe-test-sized-harness',

    prices: [
      {
        fixturePriceId: 'sized-harness-small',

        label: 'Small',

        variantId: 'small',

        unitAmount: 2499,

        lookupKey: 'maxipawz_test_harness_small',
      },

      {
        fixturePriceId: 'sized-harness-medium',

        label: 'Medium',

        variantId: 'medium',

        unitAmount: 2999,

        lookupKey: 'maxipawz_test_harness_medium',
      },

      {
        fixturePriceId: 'sized-harness-large',

        label: 'Large',

        variantId: 'large',

        unitAmount: 3499,

        lookupKey: 'maxipawz_test_harness_large',
      },
    ],
  },
];

function getStripeSecretKey(): string {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!stripeSecretKey || !stripeSecretKey.startsWith('sk_test_')) {
    throw new Error('STRIPE_SECRET_KEY must contain a Stripe test secret key.');
  }

  return stripeSecretKey;
}

async function findExistingProduct(
  stripe: Stripe,
  fixture: FixtureProduct,
): Promise<Stripe.Product | undefined> {
  for await (const product of stripe.products.list({
    active: true,
    limit: 100,
  })) {
    if (product.metadata.maxipawz_fixture_id === fixture.fixtureProductId) {
      return product;
    }
  }

  return undefined;
}

async function getOrCreateProduct(
  stripe: Stripe,
  fixture: FixtureProduct,
): Promise<Stripe.Product> {
  const existingProduct = await findExistingProduct(stripe, fixture);

  const metadata = {
    maxipawz_fixture_id: fixture.fixtureProductId,

    catalog_slug: fixture.catalogSlug,

    storefront: 'maxipawz',

    test_only: 'true',
  };

  if (existingProduct) {
    return stripe.products.update(existingProduct.id, {
      name: fixture.name,

      description: fixture.description,

      metadata,
    });
  }

  return stripe.products.create({
    name: fixture.name,

    description: fixture.description,

    metadata,
  });
}

async function getOrCreatePrice(
  stripe: Stripe,
  product: Stripe.Product,
  fixture: FixtureProduct,
  priceFixture: FixturePrice,
): Promise<Stripe.Price> {
  const prices = await stripe.prices.list({
    product: product.id,

    active: true,
    limit: 100,
  });

  const existingPrice = prices.data.find((price) => price.lookup_key === priceFixture.lookupKey);

  if (existingPrice) {
    if (existingPrice.unit_amount !== priceFixture.unitAmount) {
      throw new Error(
        `The existing Stripe Price ${existingPrice.id} uses a different amount for ${priceFixture.lookupKey}.`,
      );
    }

    return existingPrice;
  }

  return stripe.prices.create({
    product: product.id,

    currency: 'usd',

    unit_amount: priceFixture.unitAmount,

    lookup_key: priceFixture.lookupKey,

    metadata: {
      maxipawz_fixture_price_id: priceFixture.fixturePriceId,

      catalog_slug: fixture.catalogSlug,

      variant_id: priceFixture.variantId ?? '',

      variant_label: priceFixture.label,

      storefront: 'maxipawz',

      test_only: 'true',
    },
  });
}

async function createFixtureCatalog(stripe: Stripe): Promise<CreatedFixtureProduct[]> {
  const createdProducts: CreatedFixtureProduct[] = [];

  for (const fixture of fixtures) {
    const product = await getOrCreateProduct(stripe, fixture);

    const createdPrices: CreatedFixturePrice[] = [];

    for (const priceFixture of fixture.prices) {
      const price = await getOrCreatePrice(stripe, product, fixture, priceFixture);

      createdPrices.push({
        fixturePriceId: priceFixture.fixturePriceId,

        label: priceFixture.label,

        stripePriceId: price.id,

        lookupKey: priceFixture.lookupKey,

        unitAmount: price.unit_amount ?? 0,

        currency: price.currency,

        variantId: priceFixture.variantId,
      });
    }

    createdProducts.push({
      fixtureProductId: fixture.fixtureProductId,

      catalogSlug: fixture.catalogSlug,

      name: fixture.name,

      stripeProductId: product.id,

      prices: createdPrices,
    });
  }

  return createdProducts;
}

function getSiteOrigin(): string {
  const configuredUrl = process.env.PUBLIC_SITE_URL?.trim() || 'http://localhost:8888';

  return new URL(configuredUrl).origin;
}

async function createFixtureCheckout(
  stripe: Stripe,
  fixtureCatalog: CreatedFixtureProduct[],
): Promise<void> {
  const firstFixture = fixtureCatalog[0];

  const firstPrice = firstFixture?.prices[0];

  if (!firstFixture || !firstPrice) {
    throw new Error('No Stripe fixture price was created.');
  }

  const siteOrigin = getSiteOrigin();

  const cartReference = randomUUID();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',

    line_items: [
      {
        price: firstPrice.stripePriceId,

        quantity: 1,
      },
    ],

    customer_creation: 'always',

    billing_address_collection: 'auto',

    client_reference_id: cartReference,

    metadata: {
      cart_reference: cartReference,

      cart_source: 'stripe-fixture-script',

      storefront: 'maxipawz',

      checkout_mode: 'test',

      fixture: 'true',
    },

    success_url: `${siteOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,

    cancel_url: `${siteOrigin}/checkout/cancel`,
  });

  if (!session.url) {
    throw new Error('Stripe did not return a Checkout URL.');
  }

  console.log('');
  console.log('Stripe test Checkout Session:');

  console.log(session.url);

  console.log('');
}

async function main(): Promise<void> {
  const stripe = new Stripe(getStripeSecretKey());

  const fixtureCatalog = await createFixtureCatalog(stripe);

  await mkdir('.tmp', {
    recursive: true,
  });

  const outputPath = '.tmp/stripe-test-catalog.json';

  await writeFile(
    outputPath,

    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),

        products: fixtureCatalog,
      },
      null,
      2,
    )}\n`,

    'utf8',
  );

  console.log(`Stripe fixture catalog saved to ${outputPath}.`);

  fixtureCatalog.forEach((product) => {
    console.log('');

    console.log(`${product.name}: ${product.stripeProductId}`);

    product.prices.forEach((price) => {
      console.log(`  ${price.label}: ${price.stripePriceId}`);
    });
  });

  if (process.argv.includes('--checkout')) {
    await createFixtureCheckout(stripe, fixtureCatalog);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);

  process.exitCode = 1;
});
