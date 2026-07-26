export type MaxiLessonIcon =
    | 'play'
    | 'practical'
    | 'personal'
    | 'community';

export interface MaxiLesson {
    title: string;
    description: string;
    icon: MaxiLessonIcon;
}

export interface StoryMilestone {
    number: string;
    title: string;
    description: string;
}

export const aboutHero = {
    eyebrow: 'Meet Maxi',

    title: 'The dog behind MaxiPawz.',

    description:
        'Maxi is our dog, the inspiration for our mascot, and the reason this store exists. Our experience choosing pet products began at home, caring for Maxi from puppyhood and learning what truly makes a difference in a dog’s everyday life.',

    highlights: [
        'Inspired by our own dog',
        'Built from firsthand experience',
        'Grown with the support of friends',
    ],
} as const;

export const maxiStory = {
    eyebrow: 'Where the Story Began',

    title:
        'Before there was a store, there was Maxi.',

    paragraphs: [
        'Maxi has been part of our lives since puppyhood. From the beginning, we wanted to find toys that could keep Maxi interested, accessories that felt comfortable, and useful products that made walking, traveling, feeding, hydration, and daily care easier.',

        'Living with Maxi taught us that not every pet product delivers the same experience. Some toys become instant favorites. Some accessories look good but are not practical. Some everyday products quietly become things you never want to be without.',

        'Those experiences gave us the idea for MaxiPawz: a store shaped by real life with a real dog. We wanted to bring together playful products, practical accessories, travel and hydration essentials, comfort items, and everyday supplies under one friendly brand.',

        'We did not build the idea alone. Our friends believed in MaxiPawz, encouraged us, shared ideas, and helped us move forward when the business was still starting from zero. Their support helped turn a personal idea inspired by Maxi into a growing vision.',
    ],

    milestones: [
        {
            number: '01',

            title: 'Life with Maxi',

            description:
                'Caring for Maxi from puppyhood gave us firsthand experience with toys, accessories, routines, and everyday pet needs.',
        },

        {
            number: '02',

            title: 'Learning what works',

            description:
                'Over time, we learned to recognize the difference between products that only look appealing and products that are genuinely useful.',
        },

        {
            number: '03',

            title: 'From zero to hero—together',

            description:
                'Our friends supported the idea with encouragement, feedback, creativity, and the belief that MaxiPawz could become something special.',
        },

        {
            number: '04',

            title: 'A growing vision',

            description:
                'The idea inspired by Maxi has grown into a brand that continues to evolve with the support of our community.',
        }
    ] satisfies StoryMilestone[],
} as const;

export const maxiLessons: MaxiLesson[] = [
    {
        title: 'Play should have purpose',

        description:
            'A good toy should create interest, activity, curiosity, interaction, or simply a happy moment.',

        icon: 'play',
    },

    {
        title: 'Practical details matter',

        description:
            'Comfort, durability, portability, sizing, and ease of use can make an everyday product much more valuable.',

        icon: 'practical',
    },

    {
        title: 'Every dog is different',

        description:
            'Dogs have their own preferences, personalities, routines, and ways of playing, just like the people who love them.',

        icon: 'personal',
    },

    {
        title: 'Good ideas grow together',

        description:
            'Maxi inspired the store, but the encouragement and support of our friends helped the vision become real.',

        icon: 'community',
    },
];

export const customerPromises = [
    'Products considered for real everyday use',
    'Clear information about purpose, sizing, and care',
    'Options for play, walking, travel, hydration, comfort, and daily routines',
    'Honest guidance rather than exaggerated promises',
    'A friendly shopping experience inspired by genuine pet ownership',
] as const;