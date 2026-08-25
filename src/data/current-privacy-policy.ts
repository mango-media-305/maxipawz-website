import { businessConfig, businessDisplayName } from '../config/business';

import {
    privacyPolicy as basePrivacyPolicy,
    type LegalDocument,
    type LegalSection,
} from './legal';

const CURRENT_PRIVACY_POLICY_UPDATED_DATE = 'August 24, 2026';

function updateSection(section: LegalSection): LegalSection {
    switch (section.id) {
        case 'scope':
            return {
                ...section,

                paragraphs: [
                    `This policy applies to the ${businessConfig.publicName} website, its Founding Pack and launch-list experience, optional pet-profile feature, contact form, informational pages, Pet Guides, and related website interactions.`,

                    'The storefront is currently in prelaunch mode. Commercial checkout is disabled, customer accounts are not offered, and the website does not currently accept real product orders.',
                ],

                notice:
                    'This policy will be reviewed again before commercial checkout or materially different customer-data features are enabled.',
            };

        case 'information-you-provide':
            return {
                ...section,

                paragraphs: [
                    'We collect information that you choose to submit through website forms, optional profile features, or email.',
                ],

                bullets: [
                    'Founding Pack signup information, such as an email address, optional first name, and your selected email-marketing preference.',

                    'Optional Founding Pack pet-profile information, including a pet name, pet type, play-personality selection, and the product category you would most like Maxi Pawz to launch first.',

                    'Contact information, such as your name and email address.',

                    'The selected topic and content of a contact-form message.',

                    'Product suggestions, website feedback, partnership inquiries, accessibility reports, or other information you voluntarily provide.',

                    'Information sent directly to a Maxi Pawz email address.',

                    'Order-related information may be collected later after commercial ordering becomes available.',
                ],

                notice:
                    'Do not submit passwords, full payment-card numbers, Social Security numbers, medical records, or other highly sensitive information through website forms, pet-profile fields, or ordinary email.',
            };

        case 'forms-and-notifications':
            return {
                ...section,

                paragraphs: [
                    'The contact form may be processed through Netlify Forms and related Netlify infrastructure.',

                    'The Founding Pack signup is processed through a Maxi Pawz serverless function. Signup records are stored using Netlify Blobs, and email preferences may be synchronized with Resend when email marketing is selected.',

                    'The optional Founding Pack pet profile is stored separately using Netlify Blobs. The pet-profile record is associated with the existing signup through a one-way hash derived from the normalized email address rather than storing another plaintext copy of the email inside the pet-profile record.',

                    'A Founding Pack signup may be completed without creating a pet profile. The pet-profile step is optional and can be skipped without cancelling the signup.',

                    `Contact-form notifications may be delivered to ${businessConfig.generalEmail} so submitted messages can be reviewed.`,

                    'Joining the Founding Pack does not create a customer account, complete a purchase, or guarantee that a particular product, category, promotion, or service will become available.',
                ],
            };

        case 'how-information-is-used':
            return {
                ...section,

                paragraphs: [
                    'Information may be used for the purpose described when it is collected and for reasonable activities connected with operating and preparing the website and future store.',
                ],

                bullets: [
                    'Responding to questions, suggestions, accessibility reports, and support requests.',

                    'Maintaining the Founding Pack and prelaunch interest list.',

                    'Preparing launch communications for visitors who selected email marketing.',

                    'Understanding broad community interest in pet types, play preferences, and potential product categories when visitors voluntarily complete the pet profile.',

                    'Reviewing product suggestions and customer interests.',

                    'Evaluating website feedback and usability concerns.',

                    'Protecting the website against spam, misuse, fraud, or security threats.',

                    'Maintaining appropriate business and operational records.',

                    'Preparing and improving the future Maxi Pawz shopping experience.',
                ],
            };

        case 'service-providers':
            return {
                ...section,

                paragraphs: [
                    'We may use service providers to host the website, store website submissions, send communications, measure website activity, protect the website, and support future ecommerce operations.',

                    'Current website infrastructure may include Netlify for hosting, serverless functions, form processing, and data storage; Resend for email-contact and communication services; Google Analytics 4 for website analytics; and Microsoft Clarity for website-experience measurement when those analytics services are enabled.',

                    'These providers may process information only as needed to provide their services, maintain their systems, enforce their terms, protect against misuse, or comply with applicable obligations.',

                    'Information may also be disclosed when reasonably necessary to respond to valid legal requests, protect rights or safety, investigate misuse, prevent fraud, or complete a business reorganization or transfer.',
                ],

                notice: `${businessConfig.shortName} does not currently sell personal information submitted through its website forms or optional pet-profile feature.`,
            };

        case 'email-communications':
            return {
                ...section,

                paragraphs: [
                    `Visitors who join the ${businessConfig.shortName} Founding Pack and select email marketing may receive launch information, product news, Pet Guide updates, or occasional store communications.`,

                    'Joining the Founding Pack and creating an optional pet profile are separate from the email-marketing preference. A visitor may submit a signup while declining promotional email.',

                    'Marketing preferences and unsubscribe requests are maintained separately from the optional pet-profile information.',

                    `Questions about the Founding Pack or email preferences may be sent to ${businessConfig.generalEmail}.`,
                ],

                notice:
                    'Transactional order and shipping messages will be handled separately from promotional email after commercial checkout is launched.',
            };

        case 'analytics':
            return {
                ...section,

                paragraphs: [
                    'Google Analytics 4 and Microsoft Clarity may be used when analytics are enabled for the production website.',

                    'These services may process information such as pages viewed, approximate geographic area, device and browser information, referring sources, clicks, scrolling, interaction patterns, and general website usage information.',

                    'These services may use cookies, local storage, identifiers, or similar technologies under their respective policies and configurations.',

                    `${businessConfig.shortName} may record general Founding Pack funnel events such as starting the signup, successfully completing the signup, viewing the optional pet-profile step, completing that optional step, or skipping it.`,

                    'The Founding Pack analytics events are designed to measure completion and drop-off without intentionally sending the submitted email address, first name, pet name, pet type, pet personality, launch-interest answer, or other form-field values as custom analytics parameters.',
                ],

                bullets: [
                    'Page views and navigation patterns.',

                    'General device, browser, and technical information.',

                    'Referring websites and marketing sources.',

                    'Approximate geographic information.',

                    'Clicks, scrolling, and website interaction patterns.',

                    'General form and funnel completion events without intentionally including submitted form-field values in custom analytics parameters.',
                ],

                notice: `${businessConfig.shortName} does not intentionally send names, email addresses, pet-profile answers, message contents, payment information, or other directly identifying form-field values to analytics services as custom event parameters.`,
            };

        case 'retention-and-security':
            return {
                ...section,

                paragraphs: [
                    'We seek to retain personal information and optional pet-profile records only for as long as reasonably needed for the purpose for which they were collected, legitimate operational records, security, dispute prevention, or applicable obligations.',

                    'Reasonable administrative and technical measures may be used to protect information. No method of electronic transmission or storage can be guaranteed to be completely secure.',
                ],
            };

        case 'choices-and-requests':
            return {
                ...section,

                paragraphs: [
                    'Depending on applicable law and the circumstances, you may have choices relating to access, correction, deletion, or use of personal information.',

                    'A privacy request may also include information associated with an optional Founding Pack pet profile.',

                    `Privacy requests may be sent to ${businessConfig.privacyEmail} or submitted through the ${businessConfig.contactLabel}.`,

                    'We may need enough information to understand and reasonably verify a request before acting on it.',
                ],
            };

        default:
            return section;
    }
}

export const currentPrivacyPolicy = {
    ...basePrivacyPolicy,

    description: `Learn what information ${businessConfig.shortName} currently collects through the prelaunch website, Founding Pack, optional pet profiles, communications, and website measurement.`,

    introduction: `This Privacy Policy explains how ${businessDisplayName} handles information submitted through this prelaunch website, including the Founding Pack signup and optional pet-profile experience, as well as information processed while operating, protecting, measuring, and improving the website.`,

    lastUpdated: CURRENT_PRIVACY_POLICY_UPDATED_DATE,

    sections: basePrivacyPolicy.sections.map(updateSection),
} satisfies LegalDocument;