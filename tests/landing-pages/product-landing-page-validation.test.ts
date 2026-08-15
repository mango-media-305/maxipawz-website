import assert from 'node:assert/strict';

import {
    test,
} from 'node:test';

import {
    productLandingPages,
} from '../../src/data/product-landing-pages';

import {
    products,
} from '../../src/data/products';

import type {
    Product,
} from '../../src/types/product';

import type {
    ProductLandingPageDefinition,
} from '../../src/types/product-landing-page';

import {
    validateProductLandingPages,
} from '../../src/utils/product-landing-page-validation';

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
            'Test product description.',

        description: [
            'Test product long description.',
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
                    'https://example.com/test-product.webp',

                alt:
                    'Test product',

                width:
                    1200,

                height:
                    1200,

                position:
                    'center',
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
    overrides:
        Partial<ProductLandingPageDefinition> =
        {},
): ProductLandingPageDefinition {
    return {
        slug:
            'test-product-campaign',

        productSlug:
            'test-product',

        status:
            'active',

        chrome:
            'site',

        campaign: {
            id:
                'test-product-campaign',

            channel:
                'test',

            audience:
                'test-audience',
        },

        hero: {
            style:
                'cinematic',

            imageIndex:
                0,

            eyebrow:
                'Featured product',

            headline:
                'Test campaign headline.',

            description:
                'Test campaign description.',

            primaryCtaLabel:
                'View Product',

            secondaryCtaLabel:
                'See Details',
        },

        highlights: [
            {
                title:
                    'Test highlight',
            },
        ],

        story: [
            {
                imageIndex:
                    0,

                imageFit:
                    'cover',

                imageSide:
                    'left',

                title:
                    'Test story',

                body: [
                    'Test story paragraph.',
                ],

                bullets: [
                    'Test bullet',
                ],
            },
        ],

        gallery: {
            title:
                'Test gallery',

            imageIndexes: [
                0,
            ],

            imageFit:
                'cover',
        },

        purchase: {
            title:
                'Test purchase section',

            description:
                'Test purchase description.',

            imageIndex:
                0,
        },

        faq: [
            {
                question:
                    'Test question?',

                answer:
                    'Test answer.',
            },
        ],

        seo: {
            title:
                'Test Product | Featured',

            description:
                'Test SEO description.',

            imageIndex:
                0,

            noIndex:
                true,
        },

        ...overrides,
    };
}

test(
    'the current Maxi Pawz landing-page catalog passes validation',

    () => {
        const result =
            validateProductLandingPages(
                productLandingPages,

                products,
            );

        assert.equal(
            result.valid,

            true,
        );

        assert.deepEqual(
            result.errors,

            [],
        );
    },
);

test(
    'landing-page validation rejects references to products that do not exist',

    () => {
        const landingPage =
            createLandingPage(
                {
                    productSlug:
                        'missing-product',
                },
            );

        const result =
            validateProductLandingPages(
                [
                    landingPage,
                ],

                [
                    createProduct(),
                ],
            );

        assert.equal(
            result.valid,

            false,
        );

        assert.equal(
            result.errors.some(
                (
                    issue,
                ) =>
                    issue.code ===
                    'product-not-found',
            ),

            true,
        );
    },
);

test(
    'landing-page validation rejects product image indexes that do not exist',

    () => {
        const landingPage =
            createLandingPage(
                {
                    gallery: {
                        title:
                            'Broken gallery',

                        imageIndexes: [
                            0,
                            1,
                            4,
                        ],

                        imageFit:
                            'cover',
                    },
                },
            );

        const result =
            validateProductLandingPages(
                [
                    landingPage,
                ],

                [
                    createProduct(),
                ],
            );

        const imageErrors =
            result.errors.filter(
                (
                    issue,
                ) =>
                    issue.code ===
                    'missing-product-image',
            );

        assert.equal(
            result.valid,

            false,
        );

        assert.equal(
            imageErrors.length,

            2,
        );

        assert.equal(
            imageErrors.some(
                (
                    issue,
                ) =>
                    issue.path ===
                    'gallery.imageIndexes[1]',
            ),

            true,
        );

        assert.equal(
            imageErrors.some(
                (
                    issue,
                ) =>
                    issue.path ===
                    'gallery.imageIndexes[2]',
            ),

            true,
        );
    },
);

test(
    'landing-page validation rejects duplicate landing slugs and campaign IDs',

    () => {
        const first =
            createLandingPage();

        const second =
            createLandingPage(
                {
                    productSlug:
                        'second-product',
                },
            );

        const result =
            validateProductLandingPages(
                [
                    first,
                    second,
                ],

                [
                    createProduct(),

                    createProduct(
                        {
                            slug:
                                'second-product',

                            name:
                                'Second Product',
                        },
                    ),
                ],
            );

        assert.equal(
            result.valid,

            false,
        );

        assert.equal(
            result.errors.some(
                (
                    issue,
                ) =>
                    issue.code ===
                    'duplicate-landing-slug',
            ),

            true,
        );

        assert.equal(
            result.errors.some(
                (
                    issue,
                ) =>
                    issue.code ===
                    'duplicate-campaign-id',
            ),

            true,
        );
    },
);

test(
    'active demo landing pages must explicitly remain noindex',

    () => {
        const landingPage =
            createLandingPage(
                {
                    seo: {
                        title:
                            'Demo Product | Featured',

                        description:
                            'Demo campaign.',

                        imageIndex:
                            0,

                        noIndex:
                            false,
                    },
                },
            );

        const result =
            validateProductLandingPages(
                [
                    landingPage,
                ],

                [
                    createProduct(
                        {
                            isDemo:
                                true,
                        },
                    ),
                ],
            );

        assert.equal(
            result.valid,

            false,
        );

        assert.equal(
            result.errors.some(
                (
                    issue,
                ) =>
                    issue.code ===
                    'demo-landing-page-must-noindex',
            ),

            true,
        );
    },
);

test(
    'active landing pages cannot reference inactive products',

    () => {
        const result =
            validateProductLandingPages(
                [
                    createLandingPage(),
                ],

                [
                    createProduct(
                        {
                            status:
                                'draft',
                        },
                    ),
                ],
            );

        assert.equal(
            result.valid,

            false,
        );

        assert.equal(
            result.errors.some(
                (
                    issue,
                ) =>
                    issue.code ===
                    'inactive-product',
            ),

            true,
        );
    },
);