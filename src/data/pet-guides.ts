export type PetGuideTone = 'brand' | 'accent' | 'sand';

export type PetGuideIcon =
    | 'choosing'
    | 'play'
    | 'travel'
    | 'hydration'
    | 'comfort'
    | 'care'
    | 'accessories';

export interface PetGuideTip {
    title: string;
    description: string;
}

export interface PetGuideSection {
    id: string;
    title: string;
    paragraphs: string[];
    points?: string[];
    tip?: PetGuideTip;
}

export interface PetGuide {
    slug: string;
    href: string;

    title: string;
    cardTitle: string;
    description: string;
    introduction: string;

    eyebrow: string;
    icon: PetGuideIcon;
    tone: PetGuideTone;

    readingTime: string;
    updatedAt: string;

    featured?: boolean;
    showOnHomepage?: boolean;

    learningPoints: string[];
    sections: PetGuideSection[];

    closingTitle: string;
    closingDescription: string;
}

export const petGuides: PetGuide[] = [
    {
        slug: 'choosing-the-right-product',
        href: '/pet-guides/choosing-the-right-product',

        title: 'How to Choose the Right Product for Your Dog',
        cardTitle: 'Choosing the Right Product',

        description:
            'Evaluate toys, accessories, travel products, comfort items, and everyday dog essentials with your dog’s real needs in mind.',

        introduction:
            'A thoughtful product choice starts with your dog—not simply with the product that looks the most exciting.',

        eyebrow: 'Start Here',
        icon: 'choosing',
        tone: 'brand',

        readingTime: '8 min read',
        updatedAt: 'July 2026',

        featured: true,

        learningPoints: [
            'Match products to your dog’s size, age, habits, and activity level.',
            'Consider how and where the product will be used.',
            'Look beyond appearance and think about everyday practicality.',
            'Inspect toys and accessories regularly for wear or damage.',
        ],

        sections: [
            {
                id: 'start-with-your-dog',

                title: 'Start with your dog—not the product.',

                paragraphs: [
                    'Before comparing features, colors, or prices, create a quick profile of your dog. The same product can be enjoyable and appropriate for one dog while being uncomfortable, uninteresting, or impractical for another.',

                    'Consider your dog’s size, age, activity level, habits, play style, daily routine, and response to unfamiliar materials or experiences.',
                ],

                points: [
                    'Use your dog’s actual measurements instead of relying only on breed labels.',
                    'Consider whether your dog plays gently or interacts with toys intensely.',
                    'Think about where and how frequently the product will be used.',
                    'Account for your dog’s current age and life stage.',
                    'Pay attention to comfort, mobility, and sensitivities.',
                ],

                tip: {
                    title: 'A lesson from Maxi',

                    description:
                        'The products Maxi enjoys most are not always the newest or most elaborate. They are often the ones that match his personality and fit naturally into his routine.',
                },
            },

            {
                id: 'define-the-purpose',

                title: 'Define what the product should accomplish.',

                paragraphs: [
                    'A product is easier to evaluate when its purpose is clear. Ask what need it should meet, what activity it should support, or what part of your daily routine it should improve.',

                    'A toy may support movement, interaction, chewing, retrieval, or mental stimulation. A travel product may help with hydration, organization, comfort, or identification.',
                ],

                points: [
                    'Identify the activity or routine the product should support.',
                    'Avoid purchasing an item only because it looks appealing.',
                    'Consider how frequently the product will be used.',
                    'Think about storage, cleaning, maintenance, and portability.',
                ],
            },

            {
                id: 'choose-the-right-size',

                title: 'Choose the correct size and fit.',

                paragraphs: [
                    'Product labels such as small, medium, and large are not universal. Measure your dog and compare those measurements with the specific product’s sizing information whenever possible.',

                    'Wearable products should allow comfortable movement and normal breathing. Toys should be appropriately sized for the way your dog handles, carries, or chews them.',
                ],

                points: [
                    'Measure the neck, chest, body, or paw when required.',
                    'Do not select a size using breed name alone.',
                    'Recheck fit as puppies grow.',
                    'Check sizing again after meaningful weight or coat changes.',
                    'Avoid toys that are inappropriately small for your dog.',
                ],
            },

            {
                id: 'inspect-materials',

                title: 'Inspect materials and construction.',

                paragraphs: [
                    'Durability claims are not a substitute for inspection. Examine a product before its first use and continue checking it throughout its useful life.',

                    'Look at seams, edges, closures, attachments, clips, rings, handles, and other areas that may loosen or wear over time.',
                ],

                points: [
                    'Look for loose parts or attachments.',
                    'Check for rough, cracked, sharp, or unfinished edges.',
                    'Inspect fabric for weak seams or exposed filling.',
                    'Test clips, buckles, rings, and closures.',
                    'Consider whether the product can be cleaned and dried properly.',
                ],
            },

            {
                id: 'introduce-the-product',

                title: 'Introduce unfamiliar products gradually.',

                paragraphs: [
                    'A new product may look ordinary to us while feeling unfamiliar to a dog. Allow your dog to investigate at a comfortable pace instead of forcing immediate interaction.',

                    'Keep the first experience brief and calm. Observe your dog’s response and reinforce comfortable, appropriate interaction.',
                ],

                points: [
                    'Allow your dog to look at and smell the product.',
                    'Keep the first interaction short.',
                    'Use praise or another appropriate positive experience.',
                    'Pause when your dog shows sustained discomfort.',
                    'Provide supervision whenever the product requires it.',
                ],
            },

            {
                id: 'monitor-and-replace',

                title: 'Monitor, maintain, and replace the product.',

                paragraphs: [
                    'Product selection does not end after the purchase. Continue observing how your dog uses the item, clean it according to its instructions, and inspect it regularly.',

                    'Stop using an item when damage, poor fit, worn materials, or changes in your dog’s behavior make continued use inappropriate.',
                ],

                points: [
                    'Replace items with loose, cracked, sharp, or exposed pieces.',
                    'Stop using damaged closures or hardware.',
                    'Recheck the fit of wearable products.',
                    'Clean products according to their care instructions.',
                    'Remove products that are no longer appropriate for your dog.',
                ],
            },

            {
                id: 'final-checklist',

                title: 'Use a final decision checklist.',

                paragraphs: [
                    'Before deciding, step back and evaluate the product as part of your dog’s real routine rather than as an isolated purchase.',
                ],

                points: [
                    'Does this product meet a real need?',
                    'Is it appropriate for my dog’s current size and life stage?',
                    'Does it match the way my dog normally plays or behaves?',
                    'Can it be used comfortably in the intended environment?',
                    'Can I clean, inspect, and maintain it properly?',
                    'Will it require supervision?',
                    'Do I know when it should be replaced?',
                ],
            },
        ],

        closingTitle:
            'A better choice begins with understanding your dog.',

        closingDescription:
            'The right product is one that supports your dog’s comfort, personality, habits, and everyday life.',
    },

    {
        slug: 'play-and-enrichment',
        href: '/pet-guides/play-and-enrichment',

        title: 'A Practical Guide to Play and Enrichment',
        cardTitle: 'Play & Enrichment',

        description:
            'Understand play styles and choose toys that support movement, curiosity, interaction, and mental stimulation.',

        introduction:
            'Dogs play in different ways. Learning how your dog prefers to engage can help you choose more appropriate and enjoyable toys.',

        eyebrow: 'Play & Enrichment',
        icon: 'play',
        tone: 'accent',

        readingTime: '7 min read',
        updatedAt: 'July 2026',

        showOnHomepage: true,

        learningPoints: [
            'Recognize different dog play styles.',
            'Choose appropriately sized toys.',
            'Use toy rotation to maintain interest.',
            'Know when a damaged toy should be removed.',
        ],

        sections: [
            {
                id: 'understand-play-style',

                title: 'Understand your dog’s play style.',

                paragraphs: [
                    'Some dogs enjoy chasing and retrieving, while others prefer tugging, carrying, chewing, searching, or solving simple puzzles.',

                    'Observe which activities naturally hold your dog’s attention before selecting a toy.',
                ],

                points: [
                    'Chasing and retrieving',
                    'Tugging and interactive play',
                    'Carrying and comfort play',
                    'Chewing',
                    'Searching and puzzle solving',
                ],
            },

            {
                id: 'choose-appropriate-toys',

                title: 'Choose toys that match the dog and activity.',

                paragraphs: [
                    'Consider size, shape, construction, movement, texture, and the amount of supervision the toy requires.',

                    'No toy should be treated as indestructible. Regular observation and inspection remain important.',
                ],

                points: [
                    'Choose an appropriate size.',
                    'Match construction to normal play behavior.',
                    'Avoid loose or easily detached pieces.',
                    'Supervise unfamiliar toy use.',
                ],
            },

            {
                id: 'rotate-toys',

                title: 'Use rotation to keep play interesting.',

                paragraphs: [
                    'Keeping every toy available at all times can make familiar items feel less interesting. A simple rotation can renew attention without constantly buying new products.',
                ],

                points: [
                    'Keep a small selection available.',
                    'Rotate some toys every few days.',
                    'Retain favorite comfort items when appropriate.',
                    'Clean toys before returning them to the rotation.',
                ],

                tip: {
                    title: 'Maxi’s play routine',

                    description:
                        'Maxi often becomes interested in a familiar toy again after it has been stored for a few days and then reintroduced.',
                },
            },

            {
                id: 'inspect-play-products',

                title: 'Inspect toys before and after play.',

                paragraphs: [
                    'Look for torn fabric, exposed filling, damaged edges, cracks, loosened attachments, or changes in shape that could make continued use inappropriate.',
                ],

                points: [
                    'Remove heavily damaged toys.',
                    'Check seams and attachments.',
                    'Clean according to the product instructions.',
                    'Replace toys that can no longer be used appropriately.',
                ],
            },
        ],

        closingTitle:
            'Good play begins with observation.',

        closingDescription:
            'The goal is not simply to provide more toys, but to provide activities that suit the way your dog enjoys playing.',
    },

    {
        slug: 'walk-and-travel',
        href: '/pet-guides/walk-and-travel',

        title: 'Walk and Travel Essentials for Dogs',
        cardTitle: 'Walk & Travel',

        description:
            'Prepare for walks, car rides, day trips, and longer adventures with practical and comfortable essentials.',

        introduction:
            'Good walking and travel products should support comfort, organization, hydration, identification, and safer everyday movement.',

        eyebrow: 'Walk & Travel',
        icon: 'travel',
        tone: 'brand',

        readingTime: '7 min read',
        updatedAt: 'July 2026',

        showOnHomepage: true,

        learningPoints: [
            'Prepare a practical outing checklist.',
            'Choose comfortable walking equipment.',
            'Plan for hydration and identification.',
            'Introduce unfamiliar travel products gradually.',
        ],

        sections: [
            {
                id: 'walking-equipment',

                title: 'Choose comfortable walking equipment.',

                paragraphs: [
                    'Collars, harnesses, and leashes should fit correctly and support the kind of walking you plan to do.',

                    'Inspect connection points and closures before leaving home.',
                ],

                points: [
                    'Measure before selecting a size.',
                    'Check buckles, clips, rings, and stitching.',
                    'Confirm that movement is not restricted.',
                    'Recheck fit regularly.',
                ],
            },

            {
                id: 'pack-the-essentials',

                title: 'Pack the essentials for the outing.',

                paragraphs: [
                    'The length, location, temperature, and purpose of the outing should determine what you bring.',
                ],

                points: [
                    'Water and a portable drinking container',
                    'Identification information',
                    'Waste bags',
                    'Any necessary food or treats',
                    'A towel or cleanup item',
                    'A familiar comfort item for longer trips',
                ],
            },

            {
                id: 'car-and-travel-comfort',

                title: 'Plan for comfort during transportation.',

                paragraphs: [
                    'Introduce carriers, travel beds, seat protection, and other unfamiliar products before the day of a major trip.',

                    'Short practice experiences can help you observe whether adjustments are needed.',
                ],

                points: [
                    'Introduce travel equipment at home.',
                    'Begin with shorter practice trips.',
                    'Maintain ventilation and temperature comfort.',
                    'Never leave a dog unattended in unsafe conditions.',
                ],
            },

            {
                id: 'after-the-outing',

                title: 'Inspect and clean equipment after the outing.',

                paragraphs: [
                    'Walking and travel products may collect dirt, moisture, sand, or debris. Cleaning and inspection help keep them ready for the next adventure.',
                ],

                points: [
                    'Allow wet products to dry fully.',
                    'Check hardware and closures.',
                    'Refill supplies after returning home.',
                    'Store travel essentials together.',
                ],
            },
        ],

        closingTitle:
            'A little preparation makes adventures easier.',

        closingDescription:
            'The best travel setup is practical, comfortable, and appropriate for the specific outing you are planning.',
    },

    {
        slug: 'feeding-and-hydration',
        href: '/pet-guides/feeding-and-hydration',

        title: 'Feeding and Hydration Essentials',
        cardTitle: 'Feeding & Hydration',

        description:
            'Choose bowls, portable water products, and feeding accessories that support practical daily routines.',

        introduction:
            'Feeding and hydration products should be appropriately sized, stable, easy to use, and easy to maintain.',

        eyebrow: 'Feeding & Hydration',
        icon: 'hydration',
        tone: 'sand',

        readingTime: '6 min read',
        updatedAt: 'July 2026',

        showOnHomepage: true,

        learningPoints: [
            'Consider bowl size, shape, and stability.',
            'Prepare portable hydration for outings.',
            'Clean food and water products regularly.',
            'Observe changes in normal eating or drinking habits.',
        ],

        sections: [
            {
                id: 'choose-bowls',

                title: 'Choose appropriate bowls and feeding products.',

                paragraphs: [
                    'Consider the product’s size, shape, depth, stability, material, and intended location.',

                    'The product should suit the way your dog normally approaches food and water.',
                ],

                points: [
                    'Choose an appropriate capacity.',
                    'Look for stable construction.',
                    'Consider ease of cleaning.',
                    'Place bowls in a practical location.',
                ],
            },

            {
                id: 'portable-hydration',

                title: 'Prepare portable hydration for outings.',

                paragraphs: [
                    'Portable bottles and bowls can make it easier to offer water during walks, travel, and outdoor activities.',

                    'Test unfamiliar hydration products at home before depending on them away from home.',
                ],

                points: [
                    'Fill the product before leaving.',
                    'Confirm that it does not leak.',
                    'Clean it after each outing.',
                    'Bring enough water for the planned activity.',
                ],
            },

            {
                id: 'cleaning-routine',

                title: 'Maintain a consistent cleaning routine.',

                paragraphs: [
                    'Food and water products should be cleaned regularly according to their material and care instructions.',
                ],

                points: [
                    'Remove leftover food.',
                    'Wash bowls and accessories regularly.',
                    'Allow cleaned items to dry properly.',
                    'Replace damaged or difficult-to-clean products.',
                ],
            },

            {
                id: 'observe-normal-habits',

                title: 'Know your dog’s normal habits.',

                paragraphs: [
                    'Familiarity with your dog’s usual eating and drinking patterns makes it easier to notice meaningful changes.',

                    'Concerns about appetite, hydration, or health should be discussed with a qualified veterinarian.',
                ],
            },
        ],

        closingTitle:
            'Simple products can support important daily routines.',

        closingDescription:
            'Choose feeding and hydration products that are practical for both your dog and the way your household operates.',
    },

    {
        slug: 'comfort-at-home',
        href: '/pet-guides/comfort-at-home',

        title: 'Creating Comfortable Spaces at Home',
        cardTitle: 'Comfort at Home',

        description:
            'Create practical spaces for rest, calm time, familiar routines, and comfortable everyday living.',

        introduction:
            'A comfortable space should feel safe, appropriately sized, easy to maintain, and suitable for your dog’s resting habits.',

        eyebrow: 'Comfort at Home',
        icon: 'comfort',
        tone: 'brand',

        readingTime: '6 min read',
        updatedAt: 'July 2026',

        learningPoints: [
            'Observe how and where your dog rests.',
            'Choose washable and practical materials.',
            'Place comfort items in calm locations.',
            'Maintain familiar resting routines.',
        ],

        sections: [
            {
                id: 'observe-resting-style',

                title: 'Observe how your dog prefers to rest.',

                paragraphs: [
                    'Some dogs curl into a compact position, while others stretch out fully or prefer leaning against a raised edge.',

                    'Your dog’s normal sleeping posture can help guide decisions about shape and available space.',
                ],

                points: [
                    'Observe normal sleeping positions.',
                    'Measure the space your dog uses while resting.',
                    'Consider age and mobility.',
                    'Account for preferred room temperature.',
                ],
            },

            {
                id: 'choose-the-location',

                title: 'Choose a calm and practical location.',

                paragraphs: [
                    'A resting area should be accessible without being placed directly in the busiest or most disruptive part of the home.',

                    'Many dogs benefit from having a familiar place where they can rest without unnecessary interruption.',
                ],
            },

            {
                id: 'materials-and-cleaning',

                title: 'Consider materials and cleaning.',

                paragraphs: [
                    'Comfort products should suit the home environment and be maintainable over time.',
                ],

                points: [
                    'Check washing and care instructions.',
                    'Consider removable or washable covers.',
                    'Allow damp products to dry completely.',
                    'Inspect seams, filling, and closures.',
                ],
            },

            {
                id: 'maintain-familiarity',

                title: 'Maintain familiar comfort routines.',

                paragraphs: [
                    'Familiar scents, locations, and resting products can become part of a dog’s normal daily routine.',

                    'When replacing a comfort product, a gradual transition may help some dogs adjust.',
                ],

                tip: {
                    title: 'Maxi’s familiar place',

                    description:
                        'Maxi often returns to the same resting locations because they are familiar, calm, and connected to his normal routine.',
                },
            },
        ],

        closingTitle:
            'Comfort is personal.',

        closingDescription:
            'The most useful resting space is one that reflects how your dog actually relaxes at home.',
    },

    {
        slug: 'grooming-and-care',
        href: '/pet-guides/grooming-and-care',

        title: 'Grooming and Everyday Care Routines',
        cardTitle: 'Grooming & Everyday Care',

        description:
            'Introduce grooming tools and everyday care products through patient, predictable, and comfortable routines.',

        introduction:
            'Simple care routines can become easier when products are introduced gradually and used with respect for your dog’s comfort.',

        eyebrow: 'Grooming & Care',
        icon: 'care',
        tone: 'accent',

        readingTime: '7 min read',
        updatedAt: 'July 2026',

        learningPoints: [
            'Introduce grooming products gradually.',
            'Keep early sessions brief.',
            'Choose tools for the intended task.',
            'Recognize when professional care is appropriate.',
        ],

        sections: [
            {
                id: 'introduce-tools',

                title: 'Introduce tools before using them.',

                paragraphs: [
                    'Allow your dog to see and investigate an unfamiliar brush, towel, cleaning product, or other care item before beginning the full routine.',

                    'A calm introduction can reduce uncertainty and give you an opportunity to observe your dog’s response.',
                ],
            },

            {
                id: 'keep-sessions-short',

                title: 'Keep early sessions short and positive.',

                paragraphs: [
                    'It is often better to complete a small amount comfortably than to continue until the dog becomes overwhelmed.',

                    'Increase the duration gradually as your dog becomes more familiar with the process.',
                ],

                points: [
                    'Begin with a brief interaction.',
                    'Pause when discomfort increases.',
                    'Reinforce calm cooperation.',
                    'Build duration gradually.',
                ],
            },

            {
                id: 'choose-the-right-tool',

                title: 'Choose tools for the intended task.',

                paragraphs: [
                    'Different coats, body areas, and care routines may require different products. Read instructions and select tools appropriate for their intended purpose.',
                ],

                points: [
                    'Follow product directions.',
                    'Check edges and working surfaces before use.',
                    'Clean tools after the routine.',
                    'Store products securely.',
                ],
            },

            {
                id: 'professional-support',

                title: 'Know when to seek professional support.',

                paragraphs: [
                    'Grooming products and general guides do not replace veterinary care or professional grooming expertise.',

                    'Pain, skin concerns, injuries, significant coat problems, or strong behavioral responses should be discussed with an appropriate professional.',
                ],
            },
        ],

        closingTitle:
            'Patience can make care routines easier.',

        closingDescription:
            'Introduce products gradually, observe your dog closely, and prioritize comfort throughout the process.',
    },

    {
        slug: 'collars-and-accessories',
        href: '/pet-guides/collars-and-accessories',

        title: 'Collars, Sizing, and Everyday Accessories',
        cardTitle: 'Collars & Accessories',

        description:
            'Choose wearable products with attention to sizing, comfort, identification, construction, and everyday use.',

        introduction:
            'A collar or wearable accessory should fit securely without restricting normal movement or causing unnecessary pressure.',

        eyebrow: 'Collars & Accessories',
        icon: 'accessories',
        tone: 'sand',

        readingTime: '7 min read',
        updatedAt: 'July 2026',

        learningPoints: [
            'Measure before selecting a size.',
            'Check fit regularly.',
            'Keep identification information current.',
            'Inspect hardware and stitching for wear.',
        ],

        sections: [
            {
                id: 'measure-first',

                title: 'Measure before selecting a size.',

                paragraphs: [
                    'Do not rely only on terms such as small, medium, or large. Compare your dog’s actual measurements with the product’s specific sizing information.',
                ],

                points: [
                    'Use a flexible measuring tape.',
                    'Measure where the product will sit.',
                    'Follow the manufacturer’s measurement instructions.',
                    'Recheck the measurement before ordering.',
                ],
            },

            {
                id: 'check-the-fit',

                title: 'Check comfort and fit.',

                paragraphs: [
                    'The collar or accessory should remain secure while allowing normal movement and breathing.',

                    'Check the fit again after growth, weight change, grooming, or changes in coat thickness.',
                ],
            },

            {
                id: 'identification',

                title: 'Keep identification information current.',

                paragraphs: [
                    'Identification accessories are useful only when the information remains readable and up to date.',

                    'Check tags, rings, engraving, and attachment points regularly.',
                ],

                points: [
                    'Confirm contact information.',
                    'Check that text remains readable.',
                    'Inspect rings and attachment points.',
                    'Replace damaged identification products.',
                ],
            },

            {
                id: 'inspect-accessories',

                title: 'Inspect hardware, stitching, and decorative details.',

                paragraphs: [
                    'Wearable accessories may include buckles, clips, rings, stitching, decorations, or other parts that can loosen with use.',
                ],

                points: [
                    'Test closures before use.',
                    'Check for frayed or weakened stitching.',
                    'Look for loose decorations.',
                    'Remove accessories that cause irritation.',
                ],
            },
        ],

        closingTitle:
            'Style should never come before comfort.',

        closingDescription:
            'Choose accessories that fit correctly, remain secure, and work comfortably within your dog’s daily routine.',
    },
];

export const featuredGuide = petGuides.find(
    (guide) => guide.featured,
) as PetGuide;

export const petGuideTopics = petGuides.filter(
    (guide) => !guide.featured,
);

export const homepagePetGuides = petGuides.filter(
    (guide) => guide.showOnHomepage,
);

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
            'Replace items that become damaged, loose, sharp, heavily worn, or no longer appropriate for continued use.',
    },
] as const;

export function getPetGuideBySlug(
    slug: string,
): PetGuide | undefined {
    return petGuides.find(
        (guide) => guide.slug === slug,
    );
}