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