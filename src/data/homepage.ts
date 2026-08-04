import type { ImageMetadata } from 'astro';

import playAndEnrichmentImage from '../assets/categories/play-and-enrichment.webp';
import walkAndTravelImage from '../assets/categories/walk-and-travel.webp';
import feedingAndHydrationImage from '../assets/categories/feeding-and-hydration.webp';
import comfortAndHomeImage from '../assets/categories/comfort-and-home.webp';
import groomingAndCareImage from '../assets/categories/grooming-and-care.webp';
import collarsAndAccessoriesImage from '../assets/categories/collars-and-accessories.webp';

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

export type BrandStoryPrincipleIcon =
    | 'experience'
    | 'purpose'
    | 'community';

export interface BrandStoryPrinciple {
    title: string;
    description: string;
    icon: BrandStoryPrincipleIcon;
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

export const brandStory = {
    eyebrow: 'Inspired by Maxi',

    title:
        'The dog behind the name—and the heart behind our store.',

    introduction:
        'Maxi is our dog, our daily companion, and the inspiration behind the Maxi Pawz mascot and everything this store represents.',

    experience:
        'Raising Maxi from puppyhood gave us firsthand experience choosing toys, collars, walking accessories, portable water bottles, comfort products, and everyday essentials. Over time, we learned which products create excitement, which ones make daily routines easier, and which ones truly earn a place in a dog owner’s home.',

    community:
        'Maxi inspired the beginning, and our friends helped the idea grow. Their encouragement, feedback, creativity, and belief in the vision helped us take Maxi Pawz from zero to hero.',
} as const;

export const brandStoryPrinciples: BrandStoryPrinciple[] = [
    {
        title: 'Real-life experience',

        description:
            'Our perspective comes from caring for Maxi from puppyhood and learning what dogs actually enjoy and use.',

        icon: 'experience',
    },

    {
        title: 'Chosen with purpose',

        description:
            'We look beyond appearance and consider play value, usefulness, comfort, portability, and everyday practicality.',

        icon: 'purpose',
    },

    {
        title: 'Grown together',

        description:
            'Maxi inspired the store, while the support and ideas of our friends helped transform the vision into a growing brand.',

        icon: 'community',
    },
];

