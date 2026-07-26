export type SafetyTone =
    | 'brand'
    | 'accent'
    | 'sand';

export type SafetySectionIcon =
    | 'fit'
    | 'instructions'
    | 'introduction'
    | 'supervision'
    | 'inspection'
    | 'storage';

export type ProductChecklistIcon =
    | 'play'
    | 'walk'
    | 'feeding'
    | 'care';

export interface SafetySection {
    id: string;
    eyebrow: string;
    title: string;
    description: string;
    icon: SafetySectionIcon;
    tone: SafetyTone;
    points: string[];
    note?: string;
}

export interface ProductSafetyChecklist {
    id: string;
    title: string;
    description: string;
    icon: ProductChecklistIcon;
    tone: SafetyTone;
    items: string[];
}

export const productSafetyHeroPoints = [
    'Choose products for the individual pet.',
    'Follow the product’s intended use and instructions.',
    'Inspect products before and after use.',
] as const;

export const beforeUseChecklist = [
    'Confirm that the product still fits correctly.',
    'Look for loose, cracked, sharp, exposed, or damaged parts.',
    'Check clips, seams, rings, closures, and attachments.',
    'Remove packaging, tags, and temporary fasteners.',
    'Decide whether the activity requires direct supervision.',
] as const;

export const productSafetySections: SafetySection[] = [
    {
        id: 'choose-the-right-product',

        eyebrow: 'Step One',

        title: 'Choose for the individual pet.',

        description:
            'A product should match the pet’s current size, age, activity, habits, physical comfort, and normal way of interacting with similar items.',

        icon: 'fit',
        tone: 'brand',

        points: [
            'Use actual measurements when sizing information is available.',
            'Review the intended animal, activity, age, and use.',
            'Consider chewing strength, play style, and activity level.',
            'Avoid items that are inappropriately small or difficult for the pet to use comfortably.',
            'Recheck fit after growth, weight changes, grooming, or changes in coat thickness.',
        ],

        note:
            'Size labels are not universal. Compare measurements with the information provided for the individual product.',
    },

    {
        id: 'follow-the-instructions',

        eyebrow: 'Before Use',

        title: 'Read the instructions and intended use.',

        description:
            'Product descriptions, labels, assembly directions, warnings, and care instructions provide important information about how an item is intended to be used.',

        icon: 'instructions',
        tone: 'accent',

        points: [
            'Use the product only for its stated purpose.',
            'Complete any required assembly before giving the product to a pet.',
            'Confirm that adjustable pieces, closures, and connections are secure.',
            'Keep useful instructions and product information for future reference.',
            'Do not modify a product in a way that could weaken its construction or change its intended use.',
        ],
    },

    {
        id: 'introduce-gradually',

        eyebrow: 'First Experience',

        title: 'Introduce unfamiliar products gradually.',

        description:
            'A new product may feel unfamiliar even when it appears simple to us. A calm introduction provides time to observe the pet’s response.',

        icon: 'introduction',
        tone: 'sand',

        points: [
            'Allow the pet to look at and investigate the product.',
            'Keep the first interaction brief and closely observed.',
            'Avoid forcing immediate interaction with an unfamiliar item.',
            'Pause when the pet shows continuing discomfort, fear, or frustration.',
            'Increase access gradually when the pet is using the product appropriately.',
        ],
    },

    {
        id: 'supervise-use',

        eyebrow: 'During Use',

        title: 'Provide the supervision the product requires.',

        description:
            'The appropriate level of supervision depends on the product, activity, environment, and the way the individual pet interacts with it.',

        icon: 'supervision',
        tone: 'brand',

        points: [
            'Closely observe first-time use.',
            'Supervise toys containing filling, squeakers, ropes, attachments, or detachable pieces.',
            'Store supervised-use products out of reach when the activity ends.',
            'Do not assume that familiar use will always remain unchanged.',
            'Separate pets when competition over a product could create conflict.',
        ],

        note:
            'Some products may be appropriate only while a person is actively participating or watching.',
    },

    {
        id: 'inspect-and-replace',

        eyebrow: 'Ongoing Care',

        title: 'Inspect regularly and replace when needed.',

        description:
            'Wear can change a product over time. Frequent inspection helps identify damage, poor fit, or weakened construction before the next use.',

        icon: 'inspection',
        tone: 'accent',

        points: [
            'Check seams, edges, clips, buckles, rings, handles, and attachments.',
            'Look for cracks, deep punctures, exposed filling, fraying, or missing pieces.',
            'Stop using products with damaged closures or weakened hardware.',
            'Remove items that have become too small, uncomfortable, or unsuitable.',
            'Replace products that can no longer be cleaned, secured, or used as intended.',
        ],

        note:
            'No pet product should automatically be treated as indestructible.',
    },

    {
        id: 'clean-dry-and-store',

        eyebrow: 'After Use',

        title: 'Clean, dry, and store products appropriately.',

        description:
            'Cleaning and storage should reflect the material, product instructions, environment, and the way the item is used.',

        icon: 'storage',
        tone: 'sand',

        points: [
            'Follow the product’s washing and care instructions.',
            'Allow wet products to dry completely before storage.',
            'Wash and dry food bowls and feeding utensils after use.',
            'Wash water bowls regularly and keep drinking products clean.',
            'Keep products, treats, food, packaging, and small loose pieces in secure locations.',
        ],
    },
];

export const productSpecificChecklists: ProductSafetyChecklist[] =
    [
        {
            id: 'toys-and-enrichment',

            title: 'Toys & Enrichment',

            description:
                'Consider size, construction, play style, and the way the pet normally carries, chews, pulls, or solves an activity.',

            icon: 'play',
            tone: 'accent',

            items: [
                'Choose a size that is appropriate for the pet’s mouth and body.',
                'Supervise toys with filling, squeakers, ropes, or detachable parts.',
                'Remove toys with tears, punctures, loose pieces, or exposed material.',
                'Store interactive products when the supervised activity is complete.',
            ],
        },

        {
            id: 'walking-products',

            title: 'Collars, Harnesses & Leashes',

            description:
                'Wearable and walking products should fit securely while allowing comfortable movement and normal breathing.',

            icon: 'walk',
            tone: 'brand',

            items: [
                'Measure the pet and follow the product-specific size guide.',
                'Check buckles, clips, rings, stitching, and adjustment points.',
                'Recheck fit after growth, grooming, or weight changes.',
                'Replace equipment with weakened straps, hardware, or closures.',
            ],
        },

        {
            id: 'feeding-products',

            title: 'Feeding & Hydration',

            description:
                'Food and water products should be appropriately sized, stable, cleanable, and maintained according to their materials.',

            icon: 'feeding',
            tone: 'sand',

            items: [
                'Wash and dry food bowls and feeding utensils after use.',
                'Wash water bowls regularly and refresh drinking water.',
                'Discard cracked, chipped, heavily scratched, or difficult-to-clean items.',
                'Test portable bottles and containers for leaks before travel.',
            ],
        },

        {
            id: 'travel-comfort-and-care',

            title: 'Travel, Comfort & Care',

            description:
                'Introduce carriers, beds, travel products, grooming tools, and care items before depending on them during a longer activity.',

            icon: 'care',
            tone: 'brand',

            items: [
                'Confirm that travel and comfort products provide appropriate space and ventilation.',
                'Check zippers, straps, handles, closures, seams, and attachment points.',
                'Keep grooming sessions brief while introducing unfamiliar tools.',
                'Stop when an item causes pain, injury, continuing distress, or restricted movement.',
            ],
        },
    ];

export const professionalGuidancePoints = [
    'Stop using a product when it causes pain, injury, continuing distress, or restricted movement.',
    'Contact a veterinarian when a pet may have swallowed part of a product.',
    'Seek appropriate emergency help for choking, breathing difficulty, poisoning, or serious injury.',
    'Ask a qualified professional about health, mobility, dietary, or behavioral needs specific to the individual pet.',
] as const;