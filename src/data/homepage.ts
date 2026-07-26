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
    eyebrow: 'Inspired by Maxi',

    title:
        'The dog behind the name—and the heart behind our store.',

    introduction:
        'Maxi is our dog, our daily companion, and the inspiration behind the MaxiPawz mascot and everything this store represents.',

    experience:
        'Raising Maxi from puppyhood gave us firsthand experience choosing toys, collars, walking accessories, portable water bottles, comfort products, and everyday essentials. Over time, we learned which products create excitement, which ones make daily routines easier, and which ones truly earn a place in a dog owner’s home.',

    community:
        'Maxi inspired the beginning, and our friends helped the idea grow. Their encouragement, feedback, creativity, and belief in the vision helped us take MaxiPawz from zero to hero.',
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