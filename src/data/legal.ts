import {
    businessConfig,
    businessDisplayName,
} from '../config/business';

export type LegalDocumentIcon =
    | 'privacy'
    | 'terms'
    | 'shipping'
    | 'returns'
    | 'accessibility';

export type LegalDocumentTone =
    | 'brand'
    | 'accent'
    | 'sand';

export interface LegalLink {
    label: string;
    href: string;
    description: string;
}

export interface LegalSection {
    id: string;
    title: string;
    paragraphs: string[];
    bullets?: string[];
    notice?: string;
}

export interface LegalDocument {
    slug: string;
    title: string;
    shortTitle: string;
    eyebrow: string;
    description: string;
    introduction: string;
    icon: LegalDocumentIcon;
    tone: LegalDocumentTone;
    statusLabel: string;
    effectiveDate: string;
    lastUpdated: string;
    sections: LegalSection[];
    relatedLinks: LegalLink[];
}

const sharedPolicyDetails = {
    effectiveDate: businessConfig.policyEffectiveDate,
    lastUpdated: businessConfig.policyLastUpdated,
    statusLabel: 'Prelaunch policy',
} as const;

const commonRelatedLinks: LegalLink[] = [
    {
        label: 'Contact Maxi Pawz',
        href: businessConfig.contactHref,
        description:
            'Send a privacy, policy, accessibility, or website question.',
    },
    {
        label: 'Frequently Asked Questions',
        href: '/faq',
        description:
            'Find general information about Maxi Pawz and the upcoming store.',
    },
    {
        label: 'Pet Product Safety',
        href: '/product-safety',
        description:
            'Review general guidance for choosing and using pet products.',
    },
];

export const privacyPolicy: LegalDocument = {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    shortTitle: 'Privacy',
    eyebrow: 'Your Information',
    description:
        'Learn what information Maxi Pawz currently collects, why it is used, and the choices available to website visitors.',
    introduction:
        `This Privacy Policy explains how ${businessDisplayName} handles information submitted through this prelaunch website and information processed through website analytics and experience-measurement services. It reflects the website’s current forms and functionality and must be reviewed again before ecommerce checkout, advertising tools, or additional customer services are enabled.`,
    icon: 'privacy',
    tone: 'brand',
    ...sharedPolicyDetails,

    sections: [
        {
            id: 'scope',

            title: '1. Scope and current website stage',

            paragraphs: [
                `This policy applies to the ${businessConfig.publicName} website, its launch-list form, contact form, informational pages, Pet Guides, and related website interactions.`,

                'The online store is currently in prelaunch mode. The website does not currently accept purchases, create customer accounts, or collect payment-card information.',
            ],

            notice:
                'This policy must be updated before the storefront begins accepting payments or collecting additional customer information.',
        },

        {
            id: 'information-you-provide',

            title: '2. Information you provide',

            paragraphs: [
                'We collect information that you choose to submit through website forms.',
            ],

            bullets: [
                'Launch-list information, such as an email address and optional first name.',
                'Contact information, such as your name and email address.',
                'The topic and content of a message submitted through the contact form.',
                'Product suggestions, website feedback, partnership inquiries, or other information you voluntarily provide.',
                'An order number may be collected later when order-support functionality becomes available.',
            ],

            notice:
                'Do not submit passwords, full payment-card numbers, Social Security numbers, medical records, or other highly sensitive personal information through website forms.',
        },

        {
            id: 'technical-information',

            title: '3. Technical and operational information',

            paragraphs: [
                'The website’s hosting, security, and delivery infrastructure may automatically process technical information needed to serve and protect the website.',

                'This may include an Internet Protocol address, browser or device information, request timing, referring pages, error information, and similar server or security records.',
            ],
        },

        {
            id: 'how-information-is-used',

            title: '4. How information is used',

            paragraphs: [
                'Information may be used for the purposes described when it is collected and for reasonable activities connected with operating the website.',
            ],

            bullets: [
                'Responding to questions, suggestions, and support requests.',
                'Managing launch-list subscriptions and sending requested Maxi Pawz updates.',
                'Reviewing product suggestions and customer interests.',
                'Evaluating website feedback and accessibility concerns.',
                'Protecting the website against spam, misuse, fraud, or security threats.',
                'Maintaining business records and complying with applicable legal obligations.',
                'Preparing and improving the future Maxi Pawz shopping experience.',
            ],
        },

        {
            id: 'service-providers',

            title: '5. Service providers and information sharing',

            paragraphs: [
                'We may use service providers to host the website, process forms, send communications, protect the website, and support future ecommerce operations.',

                'Website forms are currently processed through Netlify Forms. Submitted form information may be stored within Netlify systems and made available to authorized website administrators.',

                'Information may also be disclosed when reasonably necessary to comply with law, respond to valid legal requests, protect rights or safety, investigate misuse, or complete a business reorganization or transfer.',
            ],

            notice:
                'Maxi Pawz does not currently sell personal information submitted through its website forms.',
        },

        {
            id: 'email-updates',

            title: '6. Email updates and communication choices',

            paragraphs: [
                'Visitors who join the Maxi Pawz launch list may receive launch information, product news, Pet Guide updates, and occasional store communications.',

                'You may unsubscribe using the option included in an email or by contacting Maxi Pawz through the website.',
            ],
        },

        {
            id: 'cookies-and-analytics',

            title:
                '7. Cookies, analytics, and website experience measurement',

            paragraphs: [
                'The website uses Google Analytics 4 to help us understand how visitors discover and use Maxi Pawz. Google Analytics may process information such as pages viewed, approximate geographic area, device and browser information, referring sources, interactions, and general website usage patterns.',

                'The website uses Microsoft Clarity to help us understand how visitors interact with website pages through tools such as session recordings, heatmaps, interaction measurements, and diagnostic information.',

                'These services may use cookies, local storage, identifiers, or similar technologies. Information is processed under the applicable policies and settings of Google and Microsoft.',

                'Maxi Pawz uses this information to understand website performance, improve navigation and content, identify technical or usability problems, and measure actions such as successful launch-list and contact-form submissions.',
            ],

            bullets: [
                'Page views and navigation patterns.',
                'General device, browser, and technical information.',
                'Referring websites and marketing sources.',
                'Approximate geographic information.',
                'Clicks, scrolling, and website interaction patterns.',
                'Successful form-completion events without including the submitted form contents in analytics event parameters.',
            ],

            notice:
                'Do not submit highly sensitive information through website forms. Maxi Pawz does not intentionally send names, email addresses, message contents, payment information, or other directly identifying form-field values to Google Analytics or Microsoft Clarity as custom analytics events.',
        },

        {
            id: 'future-checkout',

            title: '8. Future checkout and payment processing',

            paragraphs: [
                'Maxi Pawz plans to use Stripe-hosted checkout when the store opens. Payment information would then be submitted directly to Stripe and handled under Stripe’s own privacy and security practices.',

                'The Maxi Pawz Privacy Policy will be reviewed and updated before checkout is enabled, including any information collected for orders, taxes, fulfillment, customer service, and fraud prevention.',
            ],
        },

        {
            id: 'retention-and-security',

            title: '9. Retention and security',

            paragraphs: [
                'We seek to retain personal information only for as long as reasonably needed for the purpose for which it was collected, legitimate business records, dispute prevention, security, or applicable legal obligations.',

                'Reasonable administrative and technical measures may be used to protect information. No method of electronic transmission or storage can be guaranteed to be completely secure.',
            ],
        },

        {
            id: 'children',

            title: '10. Children’s privacy',

            paragraphs: [
                'The website is intended for adults and is not directed to children under 13.',

                'We do not knowingly request personal information directly from children under 13. A parent or guardian who believes a child submitted personal information may contact Maxi Pawz to request review or deletion.',
            ],
        },

        {
            id: 'choices-and-rights',

            title: '11. Your choices and privacy requests',

            paragraphs: [
                'Depending on your location and applicable law, you may have rights or choices relating to access, correction, deletion, or use of personal information.',

                `Submit a request through the ${businessConfig.contactLabel}. We may need enough information to understand and reasonably verify the request before acting on it.`,
            ],
        },

        {
            id: 'changes-and-contact',

            title: '12. Changes and contact information',

            paragraphs: [
                'This Privacy Policy may be updated when website features, service providers, business operations, or legal requirements change.',

                `Questions or privacy requests may be submitted through the ${businessConfig.contactLabel}.`,
            ],
        },
    ],

    relatedLinks: [
        {
            label: 'Terms of Use',
            href: '/terms',
            description:
                'Review the rules that apply when using the Maxi Pawz website.',
        },
        {
            label: 'Accessibility Statement',
            href: '/accessibility',
            description:
                'Learn about our approach to website accessibility.',
        },
        ...commonRelatedLinks.slice(0, 1),
    ],
};

export const termsPolicy: LegalDocument = {
    slug: 'terms',
    title: 'Website Terms of Use',
    shortTitle: 'Terms',
    eyebrow: 'Website Use',
    description:
        'Review the terms that apply when accessing and using the Maxi Pawz prelaunch website.',
    introduction:
        `These Website Terms of Use govern access to the ${businessConfig.publicName} website. The current website is informational and prelaunch. Separate commercial terms will be added or updated before products are offered for purchase.`,
    icon: 'terms',
    tone: 'accent',
    ...sharedPolicyDetails,

    sections: [
        {
            id: 'acceptance',

            title: '1. Acceptance of these terms',

            paragraphs: [
                'By accessing or using this website, you agree to these Website Terms of Use and the Privacy Policy.',

                'Do not use the website if you do not agree with these terms.',
            ],
        },

        {
            id: 'prelaunch-status',

            title: '2. Prelaunch website status',

            paragraphs: [
                'Maxi Pawz is currently preparing its product collection and ecommerce experience.',

                'Product categories, descriptions of planned services, launch information, illustrations, concepts, and previews do not represent a current offer to sell a product or a guarantee that a specific product will become available.',
            ],

            notice:
                'No purchase agreement is created through the current prelaunch website.',
        },

        {
            id: 'eligibility',

            title: '3. Eligibility and authority',

            paragraphs: [
                'The website is intended for people who can legally agree to these terms.',

                'When using the website on behalf of a business or organization, you represent that you have authority to act for that organization.',
            ],
        },

        {
            id: 'acceptable-use',

            title: '4. Acceptable use',

            paragraphs: [
                'You may use the website only for lawful purposes and in a way that does not interfere with its operation or the rights of others.',
            ],

            bullets: [
                'Do not attempt to gain unauthorized access to the website, hosting systems, forms, or administrative tools.',
                'Do not introduce malicious code, automated attacks, excessive traffic, or other harmful technology.',
                'Do not use website forms for harassment, fraud, unlawful solicitation, impersonation, or spam.',
                'Do not scrape, copy, or republish substantial website content in a way that violates applicable rights.',
                'Do not misrepresent an affiliation with Maxi Pawz.',
            ],
        },

        {
            id: 'intellectual-property',

            title: '5. Website and brand content',

            paragraphs: [
                'The website design, Maxi Pawz branding, mascot, logos, original text, graphics, guides, page layouts, and other original materials are protected by applicable intellectual-property laws.',

                'Limited personal viewing of public website content does not transfer ownership or grant permission to reproduce, distribute, sell, modify, or create derivative commercial works.',
            ],
        },

        {
            id: 'user-submissions',

            title: '6. Messages, suggestions, and submissions',

            paragraphs: [
                'You remain responsible for information you submit through the website.',

                'By submitting feedback, suggestions, or ideas, you give Maxi Pawz permission to review and use the submission for evaluating or improving the website, brand, products, or services without creating an obligation to adopt or compensate for the idea.',
            ],

            notice:
                'Do not submit confidential business information, proprietary product designs, or content you do not have permission to share.',
        },

        {
            id: 'pet-information',

            title: '7. Pet information and educational content',

            paragraphs: [
                'Pet Guides, product-safety information, frequently asked questions, and similar content are provided for general educational purposes.',

                'They do not replace veterinary diagnosis, treatment, emergency services, nutritional advice, professional training, or individualized behavioral or medical guidance.',
            ],
        },

        {
            id: 'third-party-services',

            title: '8. Third-party services and links',

            paragraphs: [
                'The website may rely on or link to third-party services. Those services operate under their own terms, policies, availability, and security practices.',

                'A link or technical integration does not necessarily represent an endorsement of every statement, product, or practice of the third party.',
            ],
        },

        {
            id: 'availability',

            title: '9. Website availability and changes',

            paragraphs: [
                'The website may be changed, suspended, restricted, or discontinued at any time.',

                'We do not guarantee that every page, feature, form, link, or piece of information will remain continuously available or error-free.',
            ],
        },

        {
            id: 'disclaimers',

            title: '10. Disclaimers',

            paragraphs: [
                'The prelaunch website and its content are provided on an “as available” basis to the extent permitted by law.',

                'Maxi Pawz does not promise that the website will satisfy every particular purpose, remain uninterrupted, or be free from all errors or security risks.',
            ],
        },

        {
            id: 'limitation',

            title: '11. Limitation of responsibility',

            paragraphs: [
                'To the fullest extent permitted by applicable law, Maxi Pawz is not responsible for indirect, incidental, special, consequential, or similar losses arising solely from use of or inability to use the informational prelaunch website.',

                'Nothing in these terms excludes responsibility that cannot legally be excluded or limited.',
            ],
        },

        {
            id: 'changes',

            title: '12. Changes to these terms',

            paragraphs: [
                'These terms may be revised as the website, store, policies, and services develop.',

                'The updated date displayed on this page identifies the most recent published version.',
            ],
        },

        {
            id: 'contact',

            title: '13. Contact',

            paragraphs: [
                `Questions about these terms may be submitted through the ${businessConfig.contactLabel}.`,
            ],
        },
    ],

    relatedLinks: [
        {
            label: 'Privacy Policy',
            href: '/privacy-policy',
            description:
                'Learn how information submitted through the website is handled.',
        },
        {
            label: 'Accessibility Statement',
            href: '/accessibility',
            description:
                'Review our approach to accessible website use.',
        },
        ...commonRelatedLinks.slice(0, 1),
    ],
};

export const shippingPolicy: LegalDocument = {
    slug: 'shipping-policy',
    title: 'Shipping Policy',
    shortTitle: 'Shipping',
    eyebrow: 'Prelaunch Fulfillment',
    description:
        'Review the current prelaunch status of Maxi Pawz shipping and fulfillment.',
    introduction:
        'The Maxi Pawz online store is not yet accepting orders. Shipping destinations, methods, rates, processing times, and fulfillment procedures have not been finalized and are not currently being offered as commercial promises.',
    icon: 'shipping',
    tone: 'brand',
    ...sharedPolicyDetails,

    sections: [
        {
            id: 'current-status',

            title: '1. Current shipping status',

            paragraphs: [
                'Maxi Pawz is currently in prelaunch mode and does not accept website orders.',

                'Because no purchases are currently processed, there are no active shipping methods, delivery estimates, shipping charges, free-shipping thresholds, or supported delivery destinations.',
            ],

            notice:
                'A complete shipping policy will be published and reviewed before checkout is enabled.',
        },

        {
            id: 'future-policy',

            title: '2. Information the final policy will include',

            paragraphs: [
                'Before commercial launch, this page will be updated with clear fulfillment information.',
            ],

            bullets: [
                'Countries, states, territories, or regions eligible for delivery.',
                'Order-processing and handling timeframes.',
                'Available carriers and delivery methods.',
                'Estimated delivery ranges.',
                'Shipping rates and any free-shipping conditions.',
                'Tracking availability.',
                'Address-change procedures.',
                'Approach to delays, lost packages, and damaged shipments.',
                'Any product or destination restrictions.',
            ],
        },

        {
            id: 'estimated-dates',

            title: '3. Processing and delivery estimates',

            paragraphs: [
                'No processing or delivery timeframe is currently promised.',

                'When the store opens, processing time and carrier transit time will be described separately because they represent different stages of fulfillment.',
            ],
        },

        {
            id: 'shipping-addresses',

            title: '4. Shipping addresses',

            paragraphs: [
                'Future customers will be responsible for reviewing shipping information before completing checkout.',

                'The final policy will explain whether and when an address can be corrected after an order is submitted.',
            ],
        },

        {
            id: 'tracking-and-delays',

            title: '5. Tracking and carrier delays',

            paragraphs: [
                'Tracking availability and procedures will be described after fulfillment providers and delivery methods are finalized.',

                'The final policy will distinguish between Maxi Pawz processing activity and delays occurring after a shipment is transferred to a carrier.',
            ],
        },

        {
            id: 'problems',

            title: '6. Lost, damaged, or misdirected shipments',

            paragraphs: [
                'The future policy will explain how customers should report a shipment that appears lost, damaged, incomplete, or delivered to an incorrect destination.',

                'Customers should not discard products, packaging, shipping labels, or order records while a reported problem is being reviewed.',
            ],
        },

        {
            id: 'updates',

            title: '7. Policy updates',

            paragraphs: [
                'This prelaunch Shipping Policy will be replaced or expanded before the store begins accepting orders.',

                `Questions about the planned store may be submitted through the ${businessConfig.contactLabel}.`,
            ],
        },
    ],

    relatedLinks: [
        {
            label: 'Return Policy',
            href: '/return-policy',
            description:
                'Review the current status of returns, exchanges, and refunds.',
        },
        {
            label: 'Frequently Asked Questions',
            href: '/faq',
            description:
                'Find answers about the upcoming Maxi Pawz store.',
        },
        {
            label: 'Contact Maxi Pawz',
            href: '/contact',
            description:
                'Send a question about the future shopping experience.',
        },
    ],
};

export const returnPolicy: LegalDocument = {
    slug: 'return-policy',
    title: 'Return and Refund Policy',
    shortTitle: 'Returns',
    eyebrow: 'Prelaunch Returns',
    description:
        'Review the current prelaunch status of Maxi Pawz returns, exchanges, cancellations, and refunds.',
    introduction:
        'The Maxi Pawz online store is not yet accepting purchases. No return window, exchange program, refund timeline, cancellation guarantee, or return-shipping procedure is currently active.',
    icon: 'returns',
    tone: 'accent',
    ...sharedPolicyDetails,

    sections: [
        {
            id: 'current-status',

            title: '1. Current return status',

            paragraphs: [
                'Because the website is in prelaunch mode and does not currently process orders, there are no website purchases eligible for return, exchange, cancellation, or refund.',

                'Content on this page does not create a return right or refund promise for a purchase made through another business or seller.',
            ],

            notice:
                'The final return and refund terms must be published before Maxi Pawz checkout is enabled.',
        },

        {
            id: 'future-policy',

            title: '2. Information the final policy will include',

            paragraphs: [
                'The completed policy will clearly explain the conditions and process for requesting a return or refund.',
            ],

            bullets: [
                'The number of days available to request a return.',
                'The condition in which an item must be returned.',
                'Whether original packaging, tags, or accessories are required.',
                'Products that are final sale or otherwise excluded.',
                'Procedures for damaged, defective, incorrect, or incomplete items.',
                'Who is responsible for return-shipping costs.',
                'Whether exchanges are available.',
                'How approved refunds are issued.',
                'Expected refund-processing time.',
                'When an order can no longer be changed or cancelled.',
            ],
        },

        {
            id: 'request-process',

            title: '3. Future return-request process',

            paragraphs: [
                'When returns become available, customers will be instructed to contact Maxi Pawz before sending an item back.',

                'A request may require the order number, purchaser email address, item name, reason for the request, and supporting photographs when relevant.',
            ],

            notice:
                'Do not mail or deliver a product to an address unless Maxi Pawz has provided return instructions for that specific request.',
        },

        {
            id: 'product-condition',

            title: '4. Product condition and pet-use considerations',

            paragraphs: [
                'The final policy will address product condition, signs of use, hygiene considerations, missing components, damage, and packaging requirements.',

                'Some products may have different eligibility rules because they are wearable, consumable, personalized, hygienic, or intended for direct pet use.',
            ],
        },

        {
            id: 'damaged-or-incorrect',

            title: '5. Damaged, defective, or incorrect items',

            paragraphs: [
                'The completed policy will provide a separate process for reporting products that arrive damaged, defective, incomplete, or different from the item ordered.',

                'Customers may be asked to preserve the product, packaging, shipping label, and order documentation while the issue is reviewed.',
            ],
        },

        {
            id: 'refunds',

            title: '6. Refund timing and payment method',

            paragraphs: [
                'No refund-processing timeframe is currently promised.',

                'Before launch, the policy will explain when an approved refund is initiated, the original payment method used, and why a financial institution may require additional time to post the credit.',
            ],
        },

        {
            id: 'changes-and-cancellations',

            title: '7. Order changes and cancellations',

            paragraphs: [
                'The future cancellation policy will explain how quickly a customer should contact Maxi Pawz and when an order may be too far into processing or fulfillment to change.',

                'A cancellation or address change will not be described as guaranteed after an order has entered processing.',
            ],
        },

        {
            id: 'updates',

            title: '8. Policy updates',

            paragraphs: [
                'This prelaunch policy will be replaced or expanded before the store begins accepting purchases.',

                `Questions about the planned return process may be submitted through the ${businessConfig.contactLabel}.`,
            ],
        },
    ],

    relatedLinks: [
        {
            label: 'Shipping Policy',
            href: '/shipping-policy',
            description:
                'Review the current shipping and fulfillment status.',
        },
        {
            label: 'Pet Product Safety',
            href: '/product-safety',
            description:
                'Review guidance for inspecting and using pet products.',
        },
        {
            label: 'Contact Maxi Pawz',
            href: '/contact',
            description:
                'Send a question about the future store.',
        },
    ],
};

export const accessibilityStatement: LegalDocument = {
    slug: 'accessibility',
    title: 'Accessibility Statement',
    shortTitle: 'Accessibility',
    eyebrow: 'Inclusive Website Use',
    description:
        'Learn about the Maxi Pawz commitment to creating a website that is welcoming and usable for more people.',
    introduction:
        `${businessConfig.publicName} is committed to improving the accessibility and usability of its website. Accessibility is treated as an ongoing design, development, testing, and content responsibility rather than a one-time claim of complete conformity.`,
    icon: 'accessibility',
    tone: 'sand',
    ...sharedPolicyDetails,

    sections: [
        {
            id: 'commitment',

            title: '1. Our accessibility commitment',

            paragraphs: [
                'We want visitors to be able to understand the content, navigate the website, use forms, and access important store information across a range of devices and assistive technologies.',

                'The website will continue to be reviewed and improved as new pages, products, checkout tools, and customer-service features are introduced.',
            ],
        },

        {
            id: 'current-practices',

            title: '2. Current design and development practices',

            paragraphs: [
                'The website is being developed with recognized accessibility practices in mind.',
            ],

            bullets: [
                'Semantic headings and page landmarks.',
                'Keyboard-accessible links, buttons, forms, and disclosure elements.',
                'Visible keyboard focus indicators.',
                'Form labels and instructions.',
                'Alternative text or decorative-image handling.',
                'Responsive layouts for different screen sizes.',
                'Readable color contrast and scalable text.',
                'Reduced dependence on color alone to communicate meaning.',
                'Clear navigation and descriptive link labels.',
            ],
        },

        {
            id: 'ongoing-work',

            title: '3. Ongoing work',

            paragraphs: [
                'Accessibility work may include automated checks, keyboard testing, screen-reader review, contrast evaluation, content review, and correction of issues found after deployment.',

                'New third-party ecommerce or payment tools will be evaluated as they are introduced.',
            ],
        },

        {
            id: 'limitations',

            title: '4. Known limitations and third-party content',

            paragraphs: [
                'Despite ongoing efforts, some content or functionality may not yet work perfectly for every user, device, browser, or assistive technology.',

                'Some third-party services, embedded tools, payment interfaces, or linked websites are controlled by their respective providers and may have separate accessibility features and limitations.',
            ],
        },

        {
            id: 'feedback',

            title: '5. Accessibility feedback',

            paragraphs: [
                'We welcome reports about barriers, difficult interactions, unclear content, missing labels, keyboard problems, contrast concerns, or other accessibility issues.',

                `Use the ${businessConfig.contactLabel} and select “Website feedback.” Include the page address, the problem encountered, the device or assistive technology involved when relevant, and the format or assistance that would be useful.`,
            ],
        },

        {
            id: 'response',

            title: '6. Our approach to reported issues',

            paragraphs: [
                'Accessibility feedback will be reviewed so that the problem can be understood and considered for correction.',

                'When a reasonable alternative way to access information is available, Maxi Pawz may provide that alternative while a website issue is being investigated.',
            ],
        },

        {
            id: 'changes',

            title: '7. Statement updates',

            paragraphs: [
                'This statement may be updated as accessibility work, website functionality, and third-party services change.',

                'The date displayed on this page identifies the latest published version.',
            ],
        },
    ],

    relatedLinks: [
        {
            label: 'Contact Maxi Pawz',
            href: '/contact#contact-form',
            description:
                'Report a website or accessibility concern.',
        },
        {
            label: 'Privacy Policy',
            href: '/privacy-policy',
            description:
                'Learn how contact-form information is handled.',
        },
        {
            label: 'Frequently Asked Questions',
            href: '/faq',
            description:
                'Find general website and store information.',
        },
    ],
};

export const legalDocuments = [
    privacyPolicy,
    termsPolicy,
    shippingPolicy,
    returnPolicy,
    accessibilityStatement,
] as const;