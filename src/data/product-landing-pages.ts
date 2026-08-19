import type {
    ProductLandingPageDefinition,
} from '../types/product-landing-page';

export const productLandingPages:
    ProductLandingPageDefinition[] =
    [
        {
            slug:
                'adventure-fit-harness-outdoor-ready',

            productSlug:
                'adventure-fit-harness',

            status:
                'active',

            chrome:
                'site',

            campaign: {
                id:
                    'adventure-fit-harness-outdoor-ready',

                channel:
                    'meta',

                audience:
                    'dog-owners-outdoor-lifestyle',
            },

            hero: {
                style:
                    'cinematic',

                imageIndex:
                    0,

                eyebrow:
                    'Demo featured product',

                headline:
                    'Made for the walks that turn into adventures.',

                description:
                    'An immersive product-first landing page designed around photography, benefits, and a focused path to purchase.',

                primaryCtaLabel:
                    'Explore the Harness',

                secondaryCtaLabel:
                    'Discover the Details',
            },

            highlights: [
                {
                    eyebrow:
                        '01',

                    title:
                        'Adjustable fit',

                    description:
                        'A clear, benefit-led product highlight that is easy to scan.',
                },

                {
                    eyebrow:
                        '02',

                    title:
                        'Everyday comfort',

                    description:
                        'Use this area for the strongest reasons someone should care.',
                },

                {
                    eyebrow:
                        '03',

                    title:
                        'Ready for the outdoors',

                    description:
                        'Keep campaign messaging short, visual, and product focused.',
                },
            ],

            story: [
                {
                    imageIndex:
                        1,

                    imageFit:
                        'cover',

                    imageSide:
                        'left',

                    eyebrow:
                        'Designed around the experience',

                    title:
                        'Show the product in the life your customer wants.',

                    body: [
                        'Rather than placing every piece of information inside a card, this layout uses large photography and editorial spacing to tell the product story.',

                        'When real product photography becomes available, each section can use a different lifestyle shot, close-up, packaging image, or product angle.',
                    ],

                    bullets: [
                        'Lifestyle photography',

                        'Close-up product details',

                        'Real-world use cases',
                    ],
                },

                {
                    imageIndex:
                        2,

                    imageFit:
                        'cover',

                    imageSide:
                        'right',

                    eyebrow:
                        'Product details',

                    title:
                        'Then move from emotion into practical details.',

                    body: [
                        'The second story block can transition from the lifestyle promise into product construction, materials, fit, dimensions, or another major selling point.',
                    ],

                    bullets: [
                        'Materials',

                        'Fit and sizing',

                        'Construction details',
                    ],
                },
            ],

            gallery: {
                eyebrow:
                    'See every angle',

                title:
                    'Let the product photography do more of the selling.',

                description:
                    'Explore the Adventure Fit Harness through lifestyle, detail, fit, and alternate-angle photography.',

                imageIndexes: [
                    0,
                    1,
                    2,
                    3,
                    4,
                ],

                imageFit:
                    'cover',
            },

            purchase: {
                eyebrow:
                    'Ready when they are',

                title:
                    'Choose your fit and make it yours.',

                description:
                    'The final conversion section connects directly to the same product, variant, inventory, cart, and Back-in-Stock logic as the normal store.',

                imageIndex:
                    4,

                note:
                    'This demo campaign remains part of the sandbox catalog only.',
            },

            faq: [
                {
                    question:
                        'Can each landing page use different product photos?',

                    answer:
                        'Yes. Hero, story, gallery, and purchase sections can each reference different images from the same product record.',
                },

                {
                    question:
                        'What happens when a variant sells out?',

                    answer:
                        'The purchase section will use the same live inventory and Back-in-Stock experience as the normal product page.',
                },

                {
                    question:
                        'Can the same product have several landing pages?',

                    answer:
                        'Yes. Different campaigns can use different headlines, imagery, story sections, and positioning while referencing the same underlying product.',
                },
            ],

            seo: {
                title:
                    'Adventure Fit Harness | Featured',

                description:
                    'Demo campaign landing page for the Adventure Fit Harness.',

                imageIndex:
                    0,

                noIndex:
                    true,
            },
        },

        {
            slug:
                'cloud-nest-pet-bed-home-comfort',

            productSlug:
                'cloud-nest-pet-bed',

            status:
                'active',

            chrome:
                'site',

            campaign: {
                id:
                    'cloud-nest-pet-bed-home-comfort',

                channel:
                    'email',

                audience:
                    'home-and-comfort',
            },

            hero: {
                style:
                    'studio',

                imageIndex:
                    0,

                eyebrow:
                    'Demo featured product',

                headline:
                    'Comfort deserves center stage.',

                description:
                    'The studio hero is a second visual option for products that benefit from a clean, spacious presentation rather than a photographic background.',

                primaryCtaLabel:
                    'Explore the Bed',

                secondaryCtaLabel:
                    'See the Story',
            },

            highlights: [
                {
                    eyebrow:
                        '01',

                    title:
                        'Soft visual direction',
                },

                {
                    eyebrow:
                        '02',

                    title:
                        'Product-first composition',
                },

                {
                    eyebrow:
                        '03',

                    title:
                        'Minimal distractions',
                },
            ],

            story: [
                {
                    imageIndex:
                        0,

                    imageFit:
                        'cover',

                    imageSide:
                        'right',

                    eyebrow:
                        'Made for slow moments',

                    title:
                        'Give every campaign its own visual rhythm.',

                    body: [
                        'Not every product needs the same hero treatment. The landing-page configuration can select the studio presentation while continuing to reuse all of the same underlying components.',
                    ],

                    bullets: [
                        'Large product imagery',

                        'Editorial copy',

                        'Campaign-specific messaging',
                    ],
                },
            ],

            gallery: {
                eyebrow:
                    'Product gallery',

                title:
                    'Details worth looking closer at.',

                description:
                    'The demo bed currently has one catalog image. Additional real product photography can be added later without changing the landing-page architecture.',

                imageIndexes: [
                    0,
                ],

                imageFit:
                    'cover',
            },

            purchase: {
                eyebrow:
                    'Bring it home',

                title:
                    'Explore the product and available options.',

                description:
                    'The campaign ends with the real product controls rather than sending the shopper through another unnecessary page.',

                imageIndex:
                    0,
            },

            faq: [
                {
                    question:
                        'Can this hero be used instead of the cinematic version?',

                    answer:
                        'Yes. Hero style is selected independently for every landing page.',
                },

                {
                    question:
                        'Do real products need several images?',

                    answer:
                        'They do not technically require them, but the landing-page system is specifically designed to make strong use of multiple images when they are available.',
                },
            ],

            seo: {
                title:
                    'Cloud Nest Pet Bed | Featured',

                description:
                    'Demo featured-product landing page using the studio visual treatment.',

                imageIndex:
                    0,

                noIndex:
                    true,
            },
        },
    ];