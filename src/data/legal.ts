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
    effectiveDate:
        businessConfig.policyEffectiveDate,

    lastUpdated:
        businessConfig.policyLastUpdated,

    statusLabel:
        'Prelaunch policy',
} as const;

const commonRelatedLinks: LegalLink[] = [
    {
        label:
            `Contact ${businessConfig.shortName}`,

        href:
            businessConfig.contactHref,

        description:
            'Send a privacy, policy, accessibility, or website question.',
    },

    {
        label:
            'Frequently Asked Questions',

        href:
            '/faq',

        description:
            `Find general information about ${businessConfig.shortName} and the upcoming store.`,
    },

    {
        label:
            'Pet Product Safety',

        href:
            '/product-safety',

        description:
            'Review general guidance for choosing and using pet products.',
    },
];

export const privacyPolicy: LegalDocument = {
    slug:
        'privacy-policy',

    title:
        'Privacy Policy',

    shortTitle:
        'Privacy',

    eyebrow:
        'Your Information',

    description:
        `Learn what information ${businessConfig.shortName} currently collects, why it is used, and the choices available to website visitors.`,

    introduction:
        `This Privacy Policy explains how ${businessDisplayName} handles information submitted through this prelaunch website and information processed while operating, protecting, measuring, and improving the website. It describes the website’s current functionality and will be reviewed again before commercial checkout or additional customer-data features are enabled.`,

    icon:
        'privacy',

    tone:
        'brand',

    ...sharedPolicyDetails,

    sections: [
        {
            id:
                'scope',

            title:
                '1. Scope and current website stage',

            paragraphs: [
                `This policy applies to the ${businessConfig.publicName} website, its launch-list form, contact form, informational pages, Pet Guides, and related website interactions.`,

                'The storefront is currently in prelaunch mode. Commercial checkout is disabled, customer accounts are not offered, and the website does not currently accept real product orders.',

                `The public-facing business name is ${businessConfig.publicName}. This policy does not represent that the business has completed any particular corporate or fictitious-name registration.`,
            ],

            notice:
                'This policy must be reviewed again before commercial checkout or additional customer-data features are enabled.',
        },

        {
            id:
                'information-you-provide',

            title:
                '2. Information you provide',

            paragraphs: [
                'We collect information that you choose to submit through website forms or email.',
            ],

            bullets: [
                'Launch-list information, such as an email address and optional first name.',
                'Contact information, such as your name and email address.',
                'The selected topic and content of a contact-form message.',
                'Product suggestions, website feedback, partnership inquiries, accessibility reports, or other information you voluntarily provide.',
                'Information sent directly to a Maxi Pawz email address.',
                'Order-related information may be collected later after commercial ordering becomes available.',
            ],

            notice:
                'Do not submit passwords, full payment-card numbers, Social Security numbers, medical records, or other highly sensitive information through website forms or ordinary email.',
        },

        {
            id:
                'forms-and-notifications',

            title:
                '3. Website forms and notifications',

            paragraphs: [
                'The contact form and launch-list form are processed through Netlify Forms.',

                'A submission may be stored within Netlify systems and made available to authorized website administrators.',

                `Form-submission notifications may be delivered to ${businessConfig.generalEmail} so the message or signup can be reviewed.`,

                'The launch-list form records interest in future updates. Submitting the form does not create a customer account, complete a purchase, or guarantee that a particular product or promotion will become available.',
            ],
        },

        {
            id:
                'technical-information',

            title:
                '4. Technical and operational information',

            paragraphs: [
                'The website’s hosting, security, delivery, and diagnostic systems may automatically process technical information needed to serve and protect the website.',

                'This may include an Internet Protocol address, browser or device information, request timing, referring pages, page addresses, error information, and similar server or security records.',
            ],
        },

        {
            id:
                'how-information-is-used',

            title:
                '5. How information is used',

            paragraphs: [
                'Information may be used for the purpose described when it is collected and for reasonable activities connected with operating the website.',
            ],

            bullets: [
                'Responding to questions, suggestions, accessibility reports, and support requests.',
                'Maintaining the prelaunch interest list.',
                'Preparing future launch communications.',
                'Reviewing product suggestions and customer interests.',
                'Evaluating website feedback and usability concerns.',
                'Protecting the website against spam, misuse, fraud, or security threats.',
                'Maintaining appropriate business and operational records.',
                'Preparing and improving the future Maxi Pawz shopping experience.',
            ],
        },

        {
            id:
                'service-providers',

            title:
                '6. Service providers and information sharing',

            paragraphs: [
                'We may use service providers to host the website, process forms, send communications, measure website activity, protect the website, and support future ecommerce operations.',

                'These providers may process information only as needed to provide their services, maintain their systems, enforce their terms, protect against misuse, or comply with applicable obligations.',

                'Information may also be disclosed when reasonably necessary to respond to valid legal requests, protect rights or safety, investigate misuse, prevent fraud, or complete a business reorganization or transfer.',
            ],

            notice:
                `${businessConfig.shortName} does not currently sell personal information submitted through its website forms.`,
        },

        {
            id:
                'email-communications',

            title:
                '7. Email communications and launch updates',

            paragraphs: [
                `Visitors who join the ${businessConfig.shortName} launch list may later receive launch information, product news, Pet Guide updates, or occasional store communications.`,

                'A promotional email program will not be treated as ready for launch until the necessary sender identification, mailing-address disclosure, unsubscribe method, and email-service configuration are in place.',

                `Questions about the launch list may be sent to ${businessConfig.generalEmail}.`,
            ],

            notice:
                'Transactional order and shipping messages will be handled separately from promotional email after commercial checkout is launched.',
        },

        {
            id:
                'analytics',

            title:
                '8. Analytics and website-experience measurement',

            paragraphs: [
                'Google Analytics 4 and Microsoft Clarity may be used when analytics are enabled for the production website.',

                'These services may process information such as pages viewed, approximate geographic area, device and browser information, referring sources, clicks, scrolling, interaction patterns, and general website usage information.',

                'These services may use cookies, local storage, identifiers, or similar technologies under their respective policies and configurations.',

                `${businessConfig.shortName} uses website-measurement information to understand performance, improve navigation and content, identify technical or usability problems, and measure successful form-completion events.`,
            ],

            bullets: [
                'Page views and navigation patterns.',
                'General device, browser, and technical information.',
                'Referring websites and marketing sources.',
                'Approximate geographic information.',
                'Clicks, scrolling, and website interaction patterns.',
                'Successful form events without intentionally including the submitted form contents in custom analytics parameters.',
            ],

            notice:
                `${businessConfig.shortName} does not intentionally send names, email addresses, message contents, payment information, or other directly identifying form-field values to analytics services as custom event parameters.`,
        },

        {
            id:
                'future-checkout',

            title:
                '9. Future checkout and payment processing',

            paragraphs: [
                `${businessConfig.shortName} plans to use Stripe for payment processing when the commercial store opens.`,

                'Payment-card information would be submitted through Stripe’s checkout interface and processed under Stripe’s own privacy and security practices.',

                'Before commercial checkout is enabled, this policy will be reviewed to address order information, payment processing, taxes, fraud prevention, fulfillment, shipping, customer service, refunds, and related records.',
            ],
        },

        {
            id:
                'retention-and-security',

            title:
                '10. Retention and security',

            paragraphs: [
                'We seek to retain personal information only for as long as reasonably needed for the purpose for which it was collected, legitimate operational records, security, dispute prevention, or applicable obligations.',

                'Reasonable administrative and technical measures may be used to protect information. No method of electronic transmission or storage can be guaranteed to be completely secure.',
            ],
        },

        {
            id:
                'children',

            title:
                '11. Children’s privacy',

            paragraphs: [
                'The website is intended for adults shopping for or learning about products for pets. It is not intended as a service directed to children under 13.',

                'We do not knowingly request personal information directly from children under 13 through the website forms.',

                `A parent or guardian who believes a child submitted personal information may contact ${businessConfig.privacyEmail} to request review or deletion.`,
            ],
        },

        {
            id:
                'choices-and-requests',

            title:
                '12. Your choices and privacy requests',

            paragraphs: [
                'Depending on applicable law and the circumstances, you may have choices relating to access, correction, deletion, or use of personal information.',

                `Privacy requests may be sent to ${businessConfig.privacyEmail} or submitted through the ${businessConfig.contactLabel}.`,

                'We may need enough information to understand and reasonably verify a request before acting on it.',
            ],
        },

        {
            id:
                'changes-and-contact',

            title:
                '13. Changes and contact information',

            paragraphs: [
                'This Privacy Policy may be updated when website features, service providers, business operations, or applicable requirements change.',

                `Privacy questions and requests should be sent to ${businessConfig.privacyEmail}.`,

                businessConfig.supportResponseTime,
            ],
        },
    ],

    relatedLinks: [
        {
            label:
                'Terms of Use',

            href:
                '/terms',

            description:
                `Review the rules that apply when using the ${businessConfig.shortName} website.`,
        },

        {
            label:
                'Accessibility Statement',

            href:
                '/accessibility',

            description:
                'Learn about our approach to website accessibility.',
        },

        {
            label:
                'Privacy Email',

            href:
                `mailto:${businessConfig.privacyEmail}`,

            description:
                `Send a privacy request to ${businessConfig.privacyEmail}.`,
        },
    ],
};

export const termsPolicy: LegalDocument = {
    slug:
        'terms',

    title:
        'Website Terms of Use',

    shortTitle:
        'Terms',

    eyebrow:
        'Website Use',

    description:
        `Review the terms that apply when accessing and using the ${businessConfig.shortName} prelaunch website.`,

    introduction:
        `These Website Terms of Use govern access to the ${businessConfig.publicName} website. The current website is informational and prelaunch. Commercial terms will be added or updated before products are offered for purchase.`,

    icon:
        'terms',

    tone:
        'accent',

    ...sharedPolicyDetails,

    sections: [
        {
            id:
                'acceptance',

            title:
                '1. Acceptance of these terms',

            paragraphs: [
                'By accessing or using this website, you agree to these Website Terms of Use and the Privacy Policy.',

                'Do not use the website if you do not agree with these terms.',
            ],
        },

        {
            id:
                'prelaunch-status',

            title:
                '2. Prelaunch website status',

            paragraphs: [
                `${businessConfig.shortName} is currently preparing its product collection and ecommerce experience.`,

                'The website does not currently accept commercial product orders.',

                'Product categories, planned services, launch information, illustrations, concepts, demo products, Sandbox prices, and previews do not represent a current offer to sell a product or guarantee that a specific product will become available.',
            ],

            notice:
                'No purchase agreement is created through the current prelaunch website.',
        },

        {
            id:
                'business-identity',

            title:
                '3. Business identity',

            paragraphs: [
                `The website currently operates publicly under the name ${businessConfig.publicName}.`,

                'The use of that public-facing name on this prelaunch website does not state or guarantee that any particular corporation, limited-liability company, fictitious name, trademark, or other registration has been completed.',

                'Business-identity information may be updated after the applicable registrations and launch preparations are complete.',
            ],
        },

        {
            id:
                'eligibility',

            title:
                '4. Eligibility and authority',

            paragraphs: [
                'The website is intended for people who can legally agree to these terms.',

                'When using the website on behalf of a business or organization, you represent that you have authority to act for that organization.',
            ],
        },

        {
            id:
                'acceptable-use',

            title:
                '5. Acceptable use',

            paragraphs: [
                'You may use the website only for lawful purposes and in a way that does not interfere with its operation or the rights of others.',
            ],

            bullets: [
                'Do not attempt to gain unauthorized access to the website, hosting systems, forms, administrative tools, or connected services.',
                'Do not introduce malicious code, automated attacks, excessive traffic, or other harmful technology.',
                'Do not use website forms for harassment, fraud, unlawful solicitation, impersonation, or spam.',
                'Do not attempt to interfere with security, analytics, checkout testing, or form processing.',
                'Do not scrape, copy, or republish substantial website content in a way that violates applicable rights.',
                `Do not misrepresent an affiliation with ${businessConfig.shortName}.`,
            ],
        },

        {
            id:
                'intellectual-property',

            title:
                '6. Website and brand content',

            paragraphs: [
                `The website design, ${businessConfig.shortName} branding, mascot, logos, original text, graphics, guides, photographs, page layouts, and other original materials may be protected by applicable intellectual-property laws.`,

                'Limited personal viewing of public website content does not transfer ownership or grant permission to reproduce, distribute, sell, modify, or create derivative commercial works.',
            ],
        },

        {
            id:
                'submissions',

            title:
                '7. Messages, suggestions, and submissions',

            paragraphs: [
                'You remain responsible for information you submit through the website or by email.',

                `By submitting feedback, suggestions, or ideas, you allow ${businessConfig.shortName} to review and use the submission for evaluating or improving the website, brand, products, or services without creating an obligation to adopt or compensate for the idea.`,
            ],

            notice:
                'Do not submit confidential business information, proprietary product designs, or content you do not have permission to share.',
        },

        {
            id:
                'pet-information',

            title:
                '8. Pet information and educational content',

            paragraphs: [
                'Pet Guides, product-safety information, frequently asked questions, and similar content are provided for general educational purposes.',

                'They do not replace veterinary diagnosis, treatment, emergency services, nutritional advice, professional training, or individualized behavioral or medical guidance.',

                'Pet owners remain responsible for selecting products appropriate for their animal and for supervising product use as appropriate.',
            ],
        },

        {
            id:
                'third-party-services',

            title:
                '9. Third-party services and links',

            paragraphs: [
                'The website may rely on or link to third-party services. Those services operate under their own terms, policies, availability, and security practices.',

                'A link or technical integration does not necessarily represent an endorsement of every statement, product, or practice of the third party.',
            ],
        },

        {
            id:
                'availability',

            title:
                '10. Website availability and changes',

            paragraphs: [
                'The website may be changed, suspended, restricted, or discontinued at any time.',

                'We do not guarantee that every page, feature, form, link, demo, or piece of information will remain continuously available or error-free.',
            ],
        },

        {
            id:
                'disclaimers',

            title:
                '11. Disclaimers',

            paragraphs: [
                'The prelaunch website and its content are provided on an “as available” basis to the extent permitted by applicable law.',

                `${businessConfig.shortName} does not promise that the website will satisfy every particular purpose, remain uninterrupted, or be free from all errors or security risks.`,
            ],
        },

        {
            id:
                'limitation',

            title:
                '12. Limitation of responsibility',

            paragraphs: [
                `To the fullest extent permitted by applicable law, ${businessConfig.shortName} is not responsible for indirect, incidental, special, consequential, or similar losses arising solely from use of or inability to use the informational prelaunch website.`,

                'Nothing in these terms excludes responsibility that cannot legally be excluded or limited.',
            ],
        },

        {
            id:
                'commercial-terms',

            title:
                '13. Future commercial terms',

            paragraphs: [
                'Commercial terms relating to products, prices, checkout, payment, taxes, shipping, returns, cancellations, refunds, promotions, and order support are not active through this prelaunch website.',

                'The applicable policies will be reviewed and published before real purchases are enabled.',
            ],
        },

        {
            id:
                'changes',

            title:
                '14. Changes to these terms',

            paragraphs: [
                'These terms may be revised as the website, store, policies, and services develop.',

                'The updated date displayed on this page identifies the most recent published version.',
            ],
        },

        {
            id:
                'contact',

            title:
                '15. Contact',

            paragraphs: [
                `Questions about these terms may be sent to ${businessConfig.generalEmail} or submitted through the ${businessConfig.contactLabel}.`,

                businessConfig.supportResponseTime,
            ],
        },
    ],

    relatedLinks: [
        {
            label:
                'Privacy Policy',

            href:
                '/privacy-policy',

            description:
                'Learn how information submitted through the website is handled.',
        },

        {
            label:
                'Accessibility Statement',

            href:
                '/accessibility',

            description:
                'Review our approach to accessible website use.',
        },

        ...commonRelatedLinks.slice(
            0,
            1,
        ),
    ],
};

export const shippingPolicy: LegalDocument = {
    slug:
        'shipping-policy',

    title:
        'Shipping Policy',

    shortTitle:
        'Shipping',

    eyebrow:
        'Prelaunch Fulfillment',

    description:
        `Review the current prelaunch status of ${businessConfig.shortName} shipping and fulfillment.`,

    introduction:
        `The ${businessConfig.publicName} online store is not yet accepting commercial orders. Shipping destinations, rates, processing commitments, delivery estimates, carrier procedures, and fulfillment rules remain under review.`,

    icon:
        'shipping',

    tone:
        'brand',

    ...sharedPolicyDetails,

    sections: [
        {
            id:
                'current-status',

            title:
                '1. Current shipping status',

            paragraphs: [
                'Commercial checkout is disabled and no real website order can currently be submitted.',

                'Any shipping configuration used in Stripe Sandbox, demo products, test orders, or internal development does not create a public shipping offer or delivery promise.',
            ],

            notice:
                'A complete commercial Shipping Policy will be reviewed before real checkout is enabled.',
        },

        {
            id:
                'future-policy',

            title:
                '2. Information the final policy will include',

            paragraphs: [
                'Before commercial launch, the Shipping Policy will be updated with approved fulfillment information.',
            ],

            bullets: [
                'Eligible shipping destinations.',
                'Order-processing and handling expectations.',
                'Available delivery methods or carrier-selection practices.',
                'Estimated carrier transit ranges.',
                'Shipping charges and any free-shipping conditions.',
                'Tracking availability.',
                'Address-correction procedures.',
                'Approach to carrier delays and delivery exceptions.',
                'Process for damaged, incomplete, missing, or misdirected shipments.',
                'Any product, package-weight, or destination restrictions.',
            ],
        },

        {
            id:
                'addresses',

            title:
                '3. Future shipping addresses',

            paragraphs: [
                'Future customers will be responsible for reviewing recipient and shipping-address information before completing checkout.',

                'The final policy will explain whether and when an address may be corrected after an order is submitted.',
            ],
        },

        {
            id:
                'tracking-and-delivery',

            title:
                '4. Tracking and delivery information',

            paragraphs: [
                'Tracking and delivery procedures will be published after fulfillment methods are finalized.',

                'The final policy will distinguish store processing from carrier transit and carrier-controlled tracking events.',
            ],
        },

        {
            id:
                'shipping-problems',

            title:
                '5. Future shipping problems',

            paragraphs: [
                `After commercial launch, order questions should be sent to ${businessConfig.ordersEmail}.`,

                `Reports involving damaged, incomplete, incorrect, missing, or otherwise problematic deliveries should be sent to ${businessConfig.supportEmail}.`,

                'Customers may be asked to preserve the product, packaging, shipping label, photographs, tracking information, and order records while a reported problem is reviewed.',
            ],
        },

        {
            id:
                'updates',

            title:
                '6. Policy updates and contact',

            paragraphs: [
                'This prelaunch policy will be replaced or expanded before real purchases are enabled.',

                `General questions may be sent to ${businessConfig.generalEmail}.`,
            ],
        },
    ],

    relatedLinks: [
        {
            label:
                'Return Policy',

            href:
                '/return-policy',

            description:
                'Review the current status of returns, cancellations, and refunds.',
        },

        {
            label:
                'Order Support Email',

            href:
                `mailto:${businessConfig.ordersEmail}`,

            description:
                `Send a future order question to ${businessConfig.ordersEmail}.`,
        },

        {
            label:
                `Contact ${businessConfig.shortName}`,

            href:
                businessConfig.contactHref,

            description:
                'Send a question about the future shopping experience.',
        },
    ],
};

export const returnPolicy: LegalDocument = {
    slug:
        'return-policy',

    title:
        'Return and Refund Policy',

    shortTitle:
        'Returns',

    eyebrow:
        'Prelaunch Returns',

    description:
        `Review the current prelaunch status of ${businessConfig.shortName} returns, cancellations, exchanges, and refunds.`,

    introduction:
        `The ${businessConfig.publicName} online store is not yet accepting commercial purchases. No active return window, exchange program, refund timeline, cancellation guarantee, or return-shipping procedure currently applies to website purchases.`,

    icon:
        'returns',

    tone:
        'accent',

    ...sharedPolicyDetails,

    sections: [
        {
            id:
                'current-status',

            title:
                '1. Current return status',

            paragraphs: [
                'Because commercial checkout is disabled, there are no real website purchases currently eligible for return, cancellation, exchange, or refund.',

                'Content on this page does not create a return or refund right for a purchase made through another seller or business.',
            ],

            notice:
                'Final return and refund terms must be reviewed before commercial checkout is enabled.',
        },

        {
            id:
                'manual-process',

            title:
                '2. Planned manual request process',

            paragraphs: [
                `After launch, return requests and reports involving damaged, defective, incorrect, missing, or incomplete products will be handled manually through ${businessConfig.supportEmail}.`,

                'The initial store will not provide an automatic self-service return portal.',

                'A customer should not mail or deliver a product unless return instructions have been provided for that specific request.',
            ],
        },

        {
            id:
                'future-policy',

            title:
                '3. Information the final policy will include',

            paragraphs: [
                'The completed policy will clearly explain the conditions and process for requesting a return, cancellation, or refund.',
            ],

            bullets: [
                'The number of days available to request a return.',
                'The condition in which an item must be returned.',
                'Whether original packaging, tags, accessories, or components are required.',
                'Products that are final sale or otherwise excluded.',
                'Rules for opened, used, consumable, personalized, or hygiene-sensitive products.',
                'Procedures for damaged, defective, incorrect, missing, or incomplete items.',
                'Who is responsible for return-shipping costs.',
                'Whether direct exchanges are offered.',
                'How approved refunds are initiated.',
                'Expected internal refund-processing time.',
                'When an order can no longer be changed or cancelled.',
            ],
        },

        {
            id:
                'request-information',

            title:
                '4. Information a future request may require',

            paragraphs: [
                'A return or product-issue request may require the order reference, purchaser email address, item name, reason for the request, and supporting photographs when relevant.',

                'Customers may be asked to preserve the product, accessories, packaging, shipping container, shipping label, and order documentation while the request is reviewed.',
            ],
        },

        {
            id:
                'refund-method',

            title:
                '5. Future refunds',

            paragraphs: [
                'No refund-processing timeframe is currently promised.',

                'The final policy will explain when an approved refund is initiated, how it is returned to the original payment method, and why the customer’s financial institution may require additional time to post the credit.',

                'Stripe will handle payment and refund receipts when commercial checkout is launched.',
            ],
        },

        {
            id:
                'changes-and-cancellations',

            title:
                '6. Future order changes and cancellations',

            paragraphs: [
                `After launch, customers should contact ${businessConfig.ordersEmail} promptly when requesting an order correction or cancellation.`,

                'A cancellation, shipping-address change, or order change will not be guaranteed after an order has entered processing or fulfillment.',
            ],
        },

        {
            id:
                'updates',

            title:
                '7. Policy updates and contact',

            paragraphs: [
                'This prelaunch policy will be replaced or expanded before the store begins accepting commercial purchases.',

                `Questions about the planned return process may be sent to ${businessConfig.supportEmail}.`,

                businessConfig.supportResponseTime,
            ],
        },
    ],

    relatedLinks: [
        {
            label:
                'Shipping Policy',

            href:
                '/shipping-policy',

            description:
                'Review the current shipping and fulfillment status.',
        },

        {
            label:
                'Pet Product Safety',

            href:
                '/product-safety',

            description:
                'Review guidance for inspecting and using pet products.',
        },

        {
            label:
                'Returns and Product Issues',

            href:
                `mailto:${businessConfig.supportEmail}`,

            description:
                `Send a future return or product-issue request to ${businessConfig.supportEmail}.`,
        },
    ],
};

export const accessibilityStatement: LegalDocument = {
    slug:
        'accessibility',

    title:
        'Accessibility Statement',

    shortTitle:
        'Accessibility',

    eyebrow:
        'Inclusive Website Use',

    description:
        `Learn about the ${businessConfig.shortName} commitment to creating a website that is welcoming and usable for more people.`,

    introduction:
        `${businessConfig.publicName} is committed to improving the accessibility and usability of its website. Accessibility is treated as an ongoing design, development, testing, and content responsibility rather than a claim of complete or permanent conformity.`,

    icon:
        'accessibility',

    tone:
        'sand',

    ...sharedPolicyDetails,

    sections: [
        {
            id:
                'commitment',

            title:
                '1. Our accessibility commitment',

            paragraphs: [
                'We want visitors to be able to understand the content, navigate the website, use forms, and access important store information across a range of devices and assistive technologies.',

                'The website will continue to be reviewed and improved as new pages, products, checkout tools, and customer-service features are introduced.',
            ],
        },

        {
            id:
                'current-practices',

            title:
                '2. Current design and development practices',

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
            id:
                'ongoing-work',

            title:
                '3. Ongoing work',

            paragraphs: [
                'Accessibility work may include automated checks, keyboard testing, screen-reader review, contrast evaluation, content review, and correction of issues found after deployment.',

                'Third-party ecommerce, payment, analytics, form, or embedded tools will be evaluated as they are introduced.',
            ],
        },

        {
            id:
                'limitations',

            title:
                '4. Known limitations and third-party content',

            paragraphs: [
                'Despite ongoing efforts, some content or functionality may not work perfectly for every user, device, browser, or assistive technology.',

                'Some third-party services, embedded tools, payment interfaces, or linked websites are controlled by their respective providers and may have separate accessibility features and limitations.',
            ],
        },

        {
            id:
                'feedback',

            title:
                '5. Accessibility feedback',

            paragraphs: [
                'We welcome reports about barriers, difficult interactions, unclear content, missing labels, keyboard problems, contrast concerns, or other accessibility issues.',

                `Use the ${businessConfig.contactLabel}, select “Website feedback,” or email ${businessConfig.generalEmail}.`,

                'Include the page address, the problem encountered, the device or assistive technology involved when relevant, and the format or assistance that would be useful.',
            ],
        },

        {
            id:
                'response',

            title:
                '6. Our approach to reported issues',

            paragraphs: [
                'Accessibility feedback will be reviewed so the problem can be understood and considered for correction.',

                `When a reasonable alternative way to access information is available, ${businessConfig.shortName} may provide that alternative while a website issue is being investigated.`,

                businessConfig.supportResponseTime,
            ],
        },

        {
            id:
                'changes',

            title:
                '7. Statement updates',

            paragraphs: [
                'This statement may be updated as accessibility work, website functionality, and third-party services change.',

                'The date displayed on this page identifies the latest published version.',
            ],
        },
    ],

    relatedLinks: [
        {
            label:
                `Contact ${businessConfig.shortName}`,

            href:
                '/contact#contact-form',

            description:
                'Report a website or accessibility concern.',
        },

        {
            label:
                'Accessibility Email',

            href:
                `mailto:${businessConfig.generalEmail}`,

            description:
                `Send an accessibility concern to ${businessConfig.generalEmail}.`,
        },

        {
            label:
                'Privacy Policy',

            href:
                '/privacy-policy',

            description:
                'Learn how contact-form information is handled.',
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