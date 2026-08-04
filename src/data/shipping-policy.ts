import {
    businessConfig,
    businessDisplayName,
} from '../config/business';

import type {
    LegalDocument,
} from './legal';

export const shippingPolicyDocument:
    LegalDocument = {
    slug:
        'shipping-policy',

    title:
        'Shipping Policy',

    shortTitle:
        'Shipping',

    eyebrow:
        'Prelaunch Fulfillment',

    description:
        `Review the current prelaunch status of ${businessConfig.shortName} shipping, fulfillment, tracking, and delivery procedures.`,

    introduction:
        `${businessDisplayName} is not yet accepting commercial website orders. The shipping configuration currently used for development and Stripe Sandbox testing does not create a public shipping offer, rate promise, delivery commitment, or commercial fulfillment agreement.`,

    icon:
        'shipping',

    tone:
        'brand',

    statusLabel:
        'Prelaunch policy',

    effectiveDate:
        businessConfig.policyEffectiveDate,

    lastUpdated:
        businessConfig.policyLastUpdated,

    sections: [
        {
            id:
                'current-status',

            title:
                '1. Current shipping status',

            paragraphs: [
                'Commercial checkout is disabled and no real website order can currently be submitted.',

                'Demo products, test prices, shipping tables, package weights, Stripe Sandbox sessions, and internal fulfillment tools are used only for development and testing.',

                'Those test configurations do not create a promise that a particular destination, shipping price, free-shipping threshold, processing time, carrier, service, or delivery range will be available at commercial launch.',
            ],

            notice:
                'A complete commercial Shipping Policy will be reviewed before real checkout is enabled.',
        },

        {
            id:
                'planned-destinations',

            title:
                '2. Planned shipping destinations',

            paragraphs: [
                'The current technical checkout configuration is designed around United States shipping addresses.',

                'The exact commercial destination list, including any treatment of Alaska, Hawaii, United States territories, military addresses, post-office boxes, or other special destinations, remains subject to final operational approval.',

                'International shipping is not currently planned for the initial launch.',
            ],
        },

        {
            id:
                'rates-and-free-shipping',

            title:
                '3. Shipping charges and free-shipping conditions',

            paragraphs: [
                'The development environment currently contains provisional shipping calculations for testing checkout behavior.',

                'Those calculations are not live carrier quotes and are not approved commercial rates.',

                'The final policy will state the approved shipping charges, any merchandise threshold for free standard shipping, the destinations eligible for that offer, and how discounts, taxes, or other charges affect eligibility.',
            ],
        },

        {
            id:
                'processing',

            title:
                '4. Order processing',

            paragraphs: [
                'Orders will require processing and packaging before being transferred to a shipping carrier.',

                'No commercial processing-time commitment is currently promised.',

                'The final policy will describe processing time separately from carrier transit time.',
            ],

            notice:
                'Creating a shipping label does not by itself mean that a carrier has received a package.',
        },

        {
            id:
                'carriers',

            title:
                '5. Carrier and service selection',

            paragraphs: [
                `${businessConfig.shortName} may select an appropriate available carrier and service when fulfilling a future standard-shipping order.`,

                'Carrier selection may depend on package size, package weight, destination, service availability, delivery expectations, and cost.',

                'The initial fulfillment process may include manually purchasing labels and entering tracking information.',
            ],
        },

        {
            id:
                'addresses',

            title:
                '6. Shipping addresses and corrections',

            paragraphs: [
                'Future customers will be responsible for reviewing the recipient name, street address, apartment or unit information, city, state, and postal code before completing checkout.',

                `After launch, address or order questions should be sent promptly to ${businessConfig.ordersEmail}.`,

                'An address correction will not be guaranteed after an order has entered processing, fulfillment, or carrier possession.',
            ],
        },

        {
            id:
                'tracking',

            title:
                '7. Tracking',

            paragraphs: [
                'Tracking information will be provided when it is available for the service used to fulfill an order.',

                'Tracking information may require time to update after a label is created.',

                'Carrier scans, estimated delivery dates, delivery notices, routes, and final delivery events are controlled by the carrier.',
            ],
        },

        {
            id:
                'shipping-problems',

            title:
                '8. Delayed, damaged, incomplete, or missing shipments',

            paragraphs: [
                `Future order-status questions should be sent to ${businessConfig.ordersEmail}.`,

                `Reports involving a damaged, defective, incorrect, incomplete, missing, or otherwise problematic shipment should be sent to ${businessConfig.supportEmail}.`,

                'Customers may be asked to preserve the product, accessories, packaging, shipping container, shipping label, photographs, tracking information, and order records while the issue is reviewed.',

                `${businessConfig.shortName} may need to review carrier information, delivery records, photographs, inventory records, and other relevant documentation before determining an appropriate response.`,
            ],
        },

        {
            id:
                'final-policy',

            title:
                '9. Information the final policy will include',

            paragraphs: [
                'Before commercial launch, this page will be updated with approved shipping and fulfillment rules.',
            ],

            bullets: [
                'Eligible states, regions, and address types.',
                'Order-processing and handling expectations.',
                'Available delivery methods or carrier-selection practices.',
                'Estimated carrier transit ranges.',
                'Shipping charges and free-shipping conditions.',
                'Maximum supported package or order weight.',
                'Tracking availability.',
                'Address-correction and cancellation procedures.',
                'Approach to delays, lost packages, delivery exceptions, and damaged shipments.',
                'Any product or destination restrictions.',
            ],
        },

        {
            id:
                'updates',

            title:
                '10. Policy updates and contact',

            paragraphs: [
                'This Shipping Policy may be updated when destinations, rates, processing expectations, carriers, fulfillment procedures, or applicable requirements change.',

                `General questions may be submitted through the ${businessConfig.contactLabel} or sent to ${businessConfig.generalEmail}.`,

                businessConfig.supportResponseTime,
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
                'Review the current status of returns, refunds, and cancellations.',
        },

        {
            label:
                'Order Support Email',

            href:
                `mailto:${businessConfig.ordersEmail}`,

            description:
                `Send a future order or shipping question to ${businessConfig.ordersEmail}.`,
        },

        {
            label:
                'Product-Issue Support',

            href:
                `mailto:${businessConfig.supportEmail}`,

            description:
                `Report a future damaged, incorrect, incomplete, or missing product to ${businessConfig.supportEmail}.`,
        },
    ],
};