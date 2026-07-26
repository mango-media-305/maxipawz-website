import type { ImageMetadata } from 'astro';

import collarsAndAccessoriesImage from '../assets/categories/collars-and-accessories.webp';
import comfortAndHomeImage from '../assets/categories/comfort-and-home.webp';
import feedingAndHydrationImage from '../assets/categories/feeding-and-hydration.webp';
import groomingAndCareImage from '../assets/categories/grooming-and-care.webp';
import playAndEnrichmentImage from '../assets/categories/play-and-enrichment.webp';
import walkAndTravelImage from '../assets/categories/walk-and-travel.webp';

export type CategoryBackgroundPosition =
    | 'center'
    | 'top'
    | 'bottom'
    | 'left'
    | 'right';

export type CategoryBackgroundOverlay =
    | 'light'
    | 'medium'
    | 'dark';

export type LifestyleCategoryTone =
    | 'brand'
    | 'accent'
    | 'sand';

export type LifestyleCategoryIcon =
    | 'play'
    | 'travel'
    | 'hydration'
    | 'comfort'
    | 'care'
    | 'accessories';

export interface LifestyleCategory {
    title: string;
    description: string;
    slug: string;
    icon: LifestyleCategoryIcon;
    tone: LifestyleCategoryTone;

    backgroundImage?: ImageMetadata;
    backgroundPosition?: CategoryBackgroundPosition;
    backgroundOverlay?: CategoryBackgroundOverlay;
}

export type ShopPrincipleIcon =
    | 'purpose'
    | 'practical'
    | 'joy';

export interface ShopPrinciple {
    title: string;
    description: string;
    icon: ShopPrincipleIcon;
}

export interface CollectionHighlight {
    title: string;
    description: string;
}

export const lifestyleCategories: LifestyleCategory[] = [
    {
        title: 'Play & Enrichment',

        description:
            'Toys, puzzles, interactive products, and engaging activities that help keep pets active, curious, and entertained.',

        slug: 'play-and-enrichment',
        icon: 'play',
        tone: 'accent',

        backgroundImage: playAndEnrichmentImage,
        backgroundPosition: 'center',
        backgroundOverlay: 'medium',
    },

    {
        title: 'Walk & Travel',

        description:
            'Portable essentials, walking accessories, travel gear, and practical products for comfortable adventures together.',

        slug: 'walk-and-travel',
        icon: 'travel',
        tone: 'brand',

        backgroundImage: walkAndTravelImage,
        backgroundPosition: 'center',
        backgroundOverlay: 'medium',
    },

    {
        title: 'Feeding & Hydration',

        description:
            'Water bottles, bowls, feeding accessories, and helpful products for meals, treats, and hydration at home or away.',

        slug: 'feeding-and-hydration',
        icon: 'hydration',
        tone: 'sand',

        backgroundImage: feedingAndHydrationImage,
        backgroundPosition: 'center',
        backgroundOverlay: 'medium',
    },

    {
        title: 'Comfort & Home',

        description:
            'Cozy, calming, and practical products designed to make resting and everyday life at home more comfortable.',

        slug: 'comfort-and-home',
        icon: 'comfort',
        tone: 'brand',

        backgroundImage: comfortAndHomeImage,
        backgroundPosition: 'center',
        backgroundOverlay: 'medium',
    },

    {
        title: 'Grooming & Care',

        description:
            'Useful care products and grooming essentials that help make regular pet-care routines simpler and more enjoyable.',

        slug: 'grooming-and-care',
        icon: 'care',
        tone: 'accent',

        backgroundImage: groomingAndCareImage,
        backgroundPosition: 'center',
        backgroundOverlay: 'light',
    },

    {
        title: 'Collars & Accessories',

        description:
            'Collars, wearable accessories, identification products, and expressive details for everyday pet style.',

        slug: 'collars-and-accessories',
        icon: 'accessories',
        tone: 'sand',

        backgroundImage: collarsAndAccessoriesImage,
        backgroundPosition: 'right',
        backgroundOverlay: 'medium',
    },
];

export const shopHeroHighlights = [
    'Playful and practical finds',
    'Products for everyday routines',
    'A collection inspired by real pet life',
] as const;

export const shopPrinciples: ShopPrinciple[] = [
    {
        title: 'Chosen with purpose',

        description:
            'We consider how a product supports play, comfort, movement, feeding, care, travel, or another real part of pet life.',

        icon: 'purpose',
    },

    {
        title: 'Useful every day',

        description:
            'Our collection is being shaped around products that can earn a meaningful place in everyday routines.',

        icon: 'practical',
    },

    {
        title: 'Joyful by nature',

        description:
            'MaxiPawz brings warmth, color, personality, and a sense of fun to shopping for the pets we love.',

        icon: 'joy',
    },
];

export const prelaunchCollectionHighlights: CollectionHighlight[] =
    [
        {
            title: 'A varied collection',

            description:
                'MaxiPawz is preparing products for play, walking, travel, feeding, hydration, comfort, grooming, and personal style.',
        },

        {
            title: 'Thoughtful organization',

            description:
                'Products will be organized around the moments and routines pet owners understand instead of one long, confusing catalog.',
        },

        {
            title: 'Helpful product guidance',

            description:
                'Our Pet Guides will support more informed decisions about sizing, purpose, use, comfort, and everyday care.',
        },

        {
            title: 'A friendly shopping experience',

            description:
                'The store is being designed to feel welcoming, useful, colorful, and easy to explore on any device.',
        },
    ];