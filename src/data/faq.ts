export type FaqGroupIcon =
    | 'storefront'
    | 'products'
    | 'orders'
    | 'help';

export type FaqGroupTone =
    | 'brand'
    | 'accent'
    | 'sand';

export interface FaqLink {
    label: string;
    href: string;
}

export interface FaqItem {
    question: string;
    answer: string[];
    link?: FaqLink;
}

export interface FaqGroup {
    id: string;
    eyebrow: string;
    title: string;
    description: string;
    icon: FaqGroupIcon;
    tone: FaqGroupTone;
    items: FaqItem[];
}

const prelaunchStorefrontItems: FaqItem[] = [
    {
        question: 'What is Maxi Pawz?',

        answer: [
            'Maxi Pawz is a pet lifestyle store inspired by Maxi, our dog and daily companion. We are creating a welcoming place for playful products, practical essentials, and helpful pet guidance.',

            'The store is being organized around real pet routines such as play, walking, travel, feeding, hydration, comfort, grooming, and everyday care.',
        ],

        link: {
            label: 'Read our story',
            href: '/about',
        },
    },

    {
        question: 'When will the store open?',

        answer: [
            'A public opening date has not been announced yet. We are preparing the collection, product information, shopping experience, and checkout process before opening the store.',

            'Joining the Maxi Pawz pack is the best way to receive future launch updates.',
        ],

        link: {
            label: 'Join the Pack',
            href: '/#join-the-pack',
        },
    },

    {
        question: 'What products will Maxi Pawz offer?',

        answer: [
            'The planned collection includes products for Play & Enrichment, Walk & Travel, Feeding & Hydration, Comfort & Home, Grooming & Care, and Collars & Accessories.',

            'Specific products, prices, availability, and details will be published only after they are ready.',
        ],

        link: {
            label: 'Explore the future collection',
            href: '/shop#shop-categories',
        },
    },

    {
        question: 'Is Maxi Pawz only for dogs?',

        answer: [
            'Maxi Pawz begins with the experience we gained while raising Maxi, so much of our current guidance is dog-focused.',

            'Future product pages will identify the intended animal, size, activity, and use whenever that information applies.',
        ],
    },

    {
        question: 'How can I receive launch updates?',

        answer: [
            'Use the Join the Pack form on the homepage to receive news about the store launch, future products, and new Pet Guides.',

            'You will be able to unsubscribe whenever you no longer wish to receive updates.',
        ],

        link: {
            label: 'Sign up for updates',
            href: '/#join-the-pack',
        },
    },

    {
        question: 'Can I suggest a product or category?',

        answer: [
            'Yes. We welcome thoughtful suggestions about useful products, pet routines, categories, and features.',

            'A suggestion does not guarantee that a product will be added, but it helps us understand what pet owners are looking for.',
        ],

        link: {
            label: 'Send a suggestion',
            href: '/contact#contact-form',
        },
    },
];

const liveStorefrontItems: FaqItem[] = [
    {
        question: 'What is Maxi Pawz?',

        answer: [
            'Maxi Pawz is a pet lifestyle store inspired by Maxi, our dog and daily companion.',

            'We organize products around everyday pet activities, including play, walking, travel, feeding, hydration, comfort, grooming, care, and personal style.',
        ],

        link: {
            label: 'Read our story',
            href: '/about',
        },
    },

    {
        question: 'How is the shop organized?',

        answer: [
            'The shop is divided into six lifestyle categories: Play & Enrichment, Walk & Travel, Feeding & Hydration, Comfort & Home, Grooming & Care, and Collars & Accessories.',

            'This structure makes it easier to begin with the activity or routine you want to support.',
        ],

        link: {
            label: 'Browse the shop',
            href: '/shop',
        },
    },

    {
        question: 'Is Maxi Pawz only for dogs?',

        answer: [
            'Maxi Pawz is inspired by our experience with Maxi, so many products and guides may be dog-focused.',

            'Always review the individual product description, sizing, intended animal, instructions, and warnings before making a purchase.',
        ],
    },

    {
        question: 'Can I suggest a product or category?',

        answer: [
            'Yes. Product suggestions and collection feedback are welcome through our contact form.',

            'Suggestions help us understand the needs and interests of the Maxi Pawz community.',
        ],

        link: {
            label: 'Send a suggestion',
            href: '/contact#contact-form',
        },
    },
];

const productItems: FaqItem[] = [
    {
        question: 'How should I choose a product for my pet?',

        answer: [
            'Begin with your pet’s size, age, activity level, habits, comfort, and the purpose the product should serve.',

            'Consider where the product will be used, how your pet normally interacts with similar items, and whether supervision will be needed.',
        ],

        link: {
            label: 'Read the product-selection guide',
            href: '/pet-guides/choosing-the-right-product',
        },
    },

    {
        question: 'What are Maxi Pawz Pet Guides?',

        answer: [
            'Pet Guides are educational resources that help pet owners think through common product choices and everyday routines.',

            'Topics include play, travel, feeding, hydration, comfort, grooming, care, sizing, and accessories.',
        ],

        link: {
            label: 'Explore Pet Guides',
            href: '/pet-guides',
        },
    },

    {
        question: 'Do the Pet Guides replace veterinary advice?',

        answer: [
            'No. Maxi Pawz Pet Guides provide general educational information only.',

            'They do not replace veterinary diagnosis, treatment, nutritional guidance, behavioral care, emergency services, or individualized professional advice.',
        ],
    },

    {
        question: 'Should I assume a pet toy is indestructible?',

        answer: [
            'No pet toy or accessory should automatically be treated as indestructible.',

            'Inspect products regularly and remove anything that becomes loose, cracked, sharp, exposed, heavily worn, improperly sized, or unsuitable for continued use.',
        ],
    },

    {
        question: 'How often should products be inspected?',

        answer: [
            'Inspection frequency depends on the product and how it is used. Frequently used items and products used during active play may need closer attention.',

            'Check seams, edges, clips, buckles, rings, closures, attachments, filling, and fit whenever they apply.',
        ],
    },

    {
        question: 'Where can I ask a product question?',

        answer: [
            'Use the Maxi Pawz contact form and choose Product question as the topic.',

            'Include the product category, intended use, relevant measurements, feature, or pet routine connected to your question.',
        ],

        link: {
            label: 'Ask a product question',
            href: '/contact#contact-form',
        },
    },
];

const orderItems: FaqItem[] = [
    {
        question: 'What payment methods are accepted?',

        answer: [
            'The payment methods available for your purchase will be displayed during secure checkout.',

            'Available options may depend on the checkout configuration, device, browser, or customer location.',
        ],
    },

    {
        question: 'How can I track my order?',

        answer: [
            'Review the confirmation and shipping-related messages associated with your purchase.',

            'Tracking information will appear there when it becomes available for the order.',
        ],

        link: {
            label: 'Contact order support',
            href: '/contact#contact-form',
        },
    },

    {
        question: 'How are shipping costs calculated?',

        answer: [
            'Any applicable shipping charge should appear before the purchase is completed.',

            'The amount may depend on the order, destination, and available delivery method. Review the full checkout summary before approving payment.',
        ],
    },

    {
        question: 'How do returns work?',

        answer: [
            'Return eligibility depends on the applicable return terms, product, condition, and circumstances of the request.',

            'Use the contact form and include your order number and a clear description. Do not send an item back until return instructions have been provided.',
        ],

        link: {
            label: 'Start a return request',
            href: '/contact#contact-form',
        },
    },

    {
        question: 'What should I do if an item arrives damaged?',

        answer: [
            'Stop using the product when the damage could make it unsuitable or unsafe.',

            'Keep the product, packaging, and order information while the issue is reviewed. Contact Maxi Pawz with your order number and a description of the damage.',
        ],

        link: {
            label: 'Report an order problem',
            href: '/contact#contact-form',
        },
    },

    {
        question: 'Can I change or cancel an order?',

        answer: [
            'Submit your request as soon as possible and include the order number.',

            'A change or cancellation cannot be guaranteed after processing or fulfillment has begun.',
        ],

        link: {
            label: 'Contact order support',
            href: '/contact#contact-form',
        },
    },
];

const helpItems: FaqItem[] = [
    {
        question: 'How can I contact Maxi Pawz?',

        answer: [
            'Use the contact form and select the topic that most closely matches your message.',

            'Include useful details such as the relevant product category, page, feature, order number, or pet routine.',
        ],

        link: {
            label: 'Open the contact form',
            href: '/contact#contact-form',
        },
    },

    {
        question: 'Can I report a website or accessibility problem?',

        answer: [
            'Yes. Select Website feedback in the contact form and describe the page, feature, device, or accessibility concern involved.',

            'Including the page address and a description of what happened will help us understand the issue.',
        ],

        link: {
            label: 'Send website feedback',
            href: '/contact#contact-form',
        },
    },

    {
        question: 'How can I propose a partnership?',

        answer: [
            'Choose Partnership or collaboration in the contact form and briefly explain the organization, creator, project, audience, or opportunity involved.',

            'Please do not send confidential material through the initial contact form.',
        ],

        link: {
            label: 'Share a partnership idea',
            href: '/contact#contact-form',
        },
    },

    {
        question: 'Can Maxi Pawz help with a pet emergency?',

        answer: [
            'No. The website, contact form, shop, and Pet Guides are not emergency services.',

            'For urgent medical, poisoning, injury, behavioral, or safety concerns, contact an appropriate veterinarian, emergency clinic, poison-control resource, or local emergency provider.',
        ],
    },
];

export function getFaqGroups(
    isStoreLive: boolean,
): FaqGroup[] {
    const groups: FaqGroup[] = [
        {
            id: 'about-maxipawz',

            eyebrow: isStoreLive
                ? 'Store Information'
                : 'Coming Soon',

            title: isStoreLive
                ? 'About Maxi Pawz and the shop'
                : 'About Maxi Pawz and the upcoming store',

            description: isStoreLive
                ? 'Learn about the brand, collection, and shopping experience.'
                : 'Learn what we are building and how to receive launch updates.',

            icon: 'storefront',
            tone: 'brand',

            items: isStoreLive
                ? liveStorefrontItems
                : prelaunchStorefrontItems,
        },

        {
            id: 'products-and-guides',

            eyebrow: 'Helpful Guidance',

            title: 'Products and Pet Guides',

            description:
                'Answers about choosing, using, inspecting, and learning about pet products.',

            icon: 'products',
            tone: 'accent',

            items: productItems,
        },
    ];

    if (isStoreLive) {
        groups.push({
            id: 'orders-and-returns',

            eyebrow: 'Customer Support',

            title: 'Orders, shipping, and returns',

            description:
                'General answers for purchases and order-related support.',

            icon: 'orders',
            tone: 'sand',

            items: orderItems,
        });
    }

    groups.push({
        id: 'contact-and-help',

        eyebrow: 'Get in Touch',

        title: 'Contact and additional help',

        description:
            'Find the right place for questions, feedback, partnerships, and website concerns.',

        icon: 'help',
        tone: 'brand',

        items: helpItems,
    });

    return groups;
}