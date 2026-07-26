export type PetGuideTone =
    | 'brand'
    | 'accent'
    | 'sand';

export type PetGuideIcon =
    | 'play'
    | 'travel'
    | 'hydration'
    | 'comfort'
    | 'care'
    | 'accessories';

export interface PetGuideTopic {
    title: string;
    description: string;
    introduction: string;
    slug: string;
    icon: PetGuideIcon;
    tone: PetGuideTone;
    learningPoints: string[];
}

export const featuredGuide = {
    eyebrow: 'Start Here',

    title: 'How to choose the right product for your dog',

    description:
        'A thoughtful choice starts with your dog—not simply with the product that looks the most exciting.',

    introduction:
        'Consider your dog’s size, age, personality, play style, daily routine, and comfort before deciding which toy or accessory belongs in your home.',

    slug: 'choosing-the-right-product',

    learningPoints: [
        'Match products to your dog’s size and activity level.',
        'Consider how and where the product will be used.',
        'Look beyond appearance and think about everyday practicality.',
        'Inspect toys and accessories regularly for wear or damage.',
    ],
} as const;

export const petGuideTopics: PetGuideTopic[] = [
    {
        title: 'Play & Enrichment',

        description:
            'Understand play styles and choose toys that support activity, curiosity, interaction, and mental stimulation.',

        introduction:
            'Dogs play in different ways. Some enjoy chasing, some prefer tugging, and others are happiest solving a puzzle or carrying a favorite toy around the house.',

        slug: 'play-and-enrichment',
        icon: 'play',
        tone: 'accent',

        learningPoints: [
            'Recognize different play styles.',
            'Choose age- and size-appropriate toys.',
            'Use rotation to keep familiar toys interesting.',
            'Know when a damaged toy should be replaced.',
        ],
    },

    {
        title: 'Walk & Travel',

        description:
            'Prepare for walks, car rides, day trips, and longer adventures with useful and comfortable essentials.',

        introduction:
            'Good travel products should help make movement, organization, hydration, and comfort easier without adding unnecessary complexity.',

        slug: 'walk-and-travel',
        icon: 'travel',
        tone: 'brand',

        learningPoints: [
            'Choose walking accessories for comfort and control.',
            'Prepare a practical travel checklist.',
            'Carry water, identification, and cleanup supplies.',
            'Introduce unfamiliar travel products gradually.',
        ],
    },

    {
        title: 'Feeding & Hydration',

        description:
            'Explore bowls, portable water products, feeding accessories, and practical ways to support daily routines.',

        introduction:
            'Feeding and hydration products should be easy to use, easy to clean, and appropriate for the way your dog eats, drinks, and travels.',

        slug: 'feeding-and-hydration',
        icon: 'hydration',
        tone: 'sand',

        learningPoints: [
            'Consider bowl size, shape, and stability.',
            'Keep portable hydration products ready for outings.',
            'Clean food and water products regularly.',
            'Watch for changes in normal eating or drinking habits.',
        ],
    },

    {
        title: 'Comfort at Home',

        description:
            'Create comfortable spaces for rest, calm time, familiar routines, and everyday life together.',

        introduction:
            'A comfortable pet space does not need to be complicated. It should feel safe, appropriately sized, easy to maintain, and suitable for your dog’s resting habits.',

        slug: 'comfort-at-home',
        icon: 'comfort',
        tone: 'brand',

        learningPoints: [
            'Choose resting products based on size and sleep style.',
            'Place comfort items in calm and practical locations.',
            'Consider washable and easy-care materials.',
            'Give your dog access to a familiar resting area.',
        ],
    },

    {
        title: 'Grooming & Everyday Care',

        description:
            'Make regular grooming and care routines more comfortable, organized, and predictable.',

        introduction:
            'Simple care routines can become easier when products are introduced gradually and used with patience, positive reinforcement, and respect for your dog’s comfort.',

        slug: 'grooming-and-care',
        icon: 'care',
        tone: 'accent',

        learningPoints: [
            'Introduce grooming tools slowly.',
            'Keep sessions short and positive.',
            'Choose tools appropriate for coat and care needs.',
            'Consult a professional when a concern requires expert care.',
        ],
    },

    {
        title: 'Collars & Accessories',

        description:
            'Choose wearable products with attention to sizing, comfort, identification, and practical everyday use.',

        introduction:
            'A collar or wearable accessory should fit securely without restricting normal movement or causing unnecessary pressure or irritation.',

        slug: 'collars-and-accessories',
        icon: 'accessories',
        tone: 'sand',

        learningPoints: [
            'Measure before selecting a size.',
            'Check fit regularly as your dog grows or changes.',
            'Keep identification information current.',
            'Inspect buckles, clips, rings, and stitching for wear.',
        ],
    },
];

export const homepagePetGuides =
    petGuideTopics.slice(0, 3);

export const maxiGuideTips = [
    {
        title: 'Start with your dog',

        description:
            'Personality, size, age, habits, and routines matter more than choosing a product only because it looks appealing.',
    },

    {
        title: 'Introduce products gradually',

        description:
            'Give your dog time to investigate unfamiliar toys, accessories, bowls, carriers, or grooming tools.',
    },

    {
        title: 'Observe real use',

        description:
            'Watch how your dog interacts with a product and adjust when it creates frustration, discomfort, or unsafe behavior.',
    },

    {
        title: 'Inspect products regularly',

        description:
            'Replace items that become damaged, loose, sharp, heavily worn, or no longer appropriate for safe use.',
    },
] as const;