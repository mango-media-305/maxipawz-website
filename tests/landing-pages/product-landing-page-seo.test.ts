import assert from 'node:assert/strict';

import {
    test,
} from 'node:test';

import type {
    Product,
} from '../../src/types/product';

import type {
    ProductLandingPageDefinition,
} from '../../src/types/product-landing-page';

import {
    getProductLandingPageSeoPolicy,
} from '../../src/utils/product-landing-page-seo';

function createProduct(
    overrides:
        Partial<Product> =
        {},
): Product {
    return {
        slug:
            'test-product',

        name:
            'Test Product',

        category:
            'walk-and-travel',

        status:
            'active',

        availability:
            'in-stock',

        shortDescription:
            'Test product.',

        description: [
            'Test product description.',
        ],

        petTypes: [
            'dog',
        ],

        tags: [
            'Test',
        ],

        images: [
            {
                src:
                    'https://example.com/product.webp',

                alt:
                    'Test product',

                width:
                    1200,

                height:
                    1200,
            },
        ],

        price: {
            amount:
                1999,

            currency:
                'USD',
        },

        ...overrides,
    };
}

function createLandingPage(
    options: {
        product?:
        Partial<Product>;

        seoNoIndex?:
        boolean;
    } = {},
):
    ProductLandingPageDefinition & {
        product:
        Product;
    } {
    const product =
        createProduct(
            options.product,
        );

    return {
        slug:
            'test-product-campaign',

        productSlug:
            product.slug,

        status:
            'active',

        chrome:
            'site',

        campaign: {
            id:
                'test-product-campaign',
        },

        hero: {
            style:
                'cinematic',

            imageIndex:
                0,

            headline:
                'Test headline.',

            description:
                'Test description.',

            primaryCtaLabel:
                'View Product',
        },

        purchase: {
            title:
                'Buy the product',

            description:
                'Purchase description.',

            imageIndex:
                0,
        },

        seo: {
            title:
                'Test Product | Featured',

            description:
                'Campaign description.',

            imageIndex:
                0,

            ...(options.seoNoIndex !==
                undefined
                ? {
                    noIndex:
                        options.seoNoIndex,
                }
                : {}),
        },

        product,
    };
}

test(
    'demo landing pages remain noindex and canonicalize to the product page',

    () => {
        const policy =
            getProductLandingPageSeoPolicy(
                createLandingPage(
                    {
                        product: {
                            isDemo:
                                true,
                        },

                        seoNoIndex:
                            false,
                    },
                ),

                true,
            );

        assert.equal(
            policy.noIndex,

            true,
        );

        assert.equal(
            policy.canonicalPath,

            '/shop/test-product',
        );
    },
);

test(
    'prelaunch landing pages remain noindex even for real products',

    () => {
        const policy =
            getProductLandingPageSeoPolicy(
                createLandingPage(
                    {
                        product: {
                            isDemo:
                                false,
                        },

                        seoNoIndex:
                            false,
                    },
                ),

                false,
            );

        assert.equal(
            policy.noIndex,

            true,
        );

        assert.equal(
            policy.canonicalPath,

            '/shop/test-product',
        );
    },
);

test(
    'explicit campaign noindex canonicalizes to the permanent product page',

    () => {
        const policy =
            getProductLandingPageSeoPolicy(
                createLandingPage(
                    {
                        product: {
                            isDemo:
                                false,
                        },

                        seoNoIndex:
                            true,
                    },
                ),

                true,
            );

        assert.equal(
            policy.noIndex,

            true,
        );

        assert.equal(
            policy.canonicalPath,

            '/shop/test-product',
        );
    },
);

test(
    'an intentionally indexable real landing page becomes self-canonical when the store is live',

    () => {
        const policy =
            getProductLandingPageSeoPolicy(
                createLandingPage(
                    {
                        product: {
                            isDemo:
                                false,
                        },

                        seoNoIndex:
                            false,
                    },
                ),

                true,
            );

        assert.equal(
            policy.noIndex,

            false,
        );

        assert.equal(
            policy.canonicalPath,

            '/featured/test-product-campaign',
        );
    },
);

test(
    'landing and product paths are always exposed by the SEO policy',

    () => {
        const policy =
            getProductLandingPageSeoPolicy(
                createLandingPage(),

                true,
            );

        assert.equal(
            policy.landingPath,

            '/featured/test-product-campaign',
        );

        assert.equal(
            policy.productPath,

            '/shop/test-product',
        );
    },
);