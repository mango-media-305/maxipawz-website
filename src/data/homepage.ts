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
}

export type BrandStoryPrincipleIcon =
    | 'joy'
    | 'usefulness'
    | 'care';

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
    },

    {
        title: 'Walk & Travel',

        description:
            'Portable essentials, walking accessories, travel gear, and practical products for comfortable adventures together.',

        slug: 'walk-and-travel',
        icon: 'travel',
        tone: 'brand',
    },

    {
        title: 'Feeding & Hydration',

        description:
            'Water bottles, bowls, feeding accessories, and helpful products for meals, treats, and hydration at home or away.',

        slug: 'feeding-and-hydration',
        icon: 'hydration',
        tone: 'sand',
    },

    {
        title: 'Comfort & Home',

        description:
            'Cozy, calming, and practical products designed to make resting and everyday life at home more comfortable.',

        slug: 'comfort-and-home',
        icon: 'comfort',
        tone: 'brand',
    },

    {
        title: 'Grooming & Care',

        description:
            'Useful care products and grooming essentials that help make regular pet-care routines simpler and more enjoyable.',

        slug: 'grooming-and-care',
        icon: 'care',
        tone: 'accent',
    },

    {
        title: 'Collars & Accessories',

        description:
            'Collars, necklaces, wearable accessories, identification products, and expressive details for everyday pet style.',

        slug: 'collars-and-accessories',
        icon: 'accessories',
        tone: 'sand',
    },
];

export const brandStory = {
    eyebrow: 'Our Story',

    title:
        'Made for pets. Built by two friends who love them.',

    introduction:
        'The MaxiPawz vision started with two friends and pet lovers who joined their efforts around one shared idea: shopping for pets should feel as joyful, practical, and personal as life with the animals we love.',

    description:
        'Together, they set out to create a welcoming destination where playful toys, useful accessories, travel and hydration essentials, comfort items, and everyday supplies can live under one warm and trusted brand.',

    closing:
        'MaxiPawz is their way of helping pet owners discover thoughtful products that bring more ease, personality, connection, and happiness to the moments they share with their pets.',
} as const;

export const brandStoryPrinciples: BrandStoryPrinciple[] = [
    {
        title: 'Joyful by nature',

        description:
            'Every part of MaxiPawz is designed to make shopping for pets feel warm, friendly, colorful, and full of personality.',

        icon: 'joy',
    },

    {
        title: 'Useful every day',

        description:
            'We look for products that have a meaningful place in playtime, travel, feeding, care, comfort, and daily routines.',

        icon: 'usefulness',
    },

    {
        title: 'Selected with care',

        description:
            'Our goal is to offer thoughtful choices supported by clear information, honest guidance, and genuine care for pets.',

        icon: 'care',
    },
];