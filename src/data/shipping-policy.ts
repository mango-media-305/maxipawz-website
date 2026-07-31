import {
    businessConfig,
    businessDisplayName,
} from '../config/business';

import {
    charityConfig,
} from '../config/charity';

import {
    shippingConfig,
} from '../config/shipping';

import type {
    LegalDocument,
} from './legal';

function formatAmount(
    amount: number,
): string {
    return new Intl.NumberFormat(
        'en-US',
        {
            style:
                'currency',

            currency:
                shippingConfig
                    .currency,
        },
    ).format(
        amount /
        100,
    );
}

const policyStatusLabel =
    businessConfig
        .commercePoliciesFinalized
        ? 'Active policy'
        : 'Draft shipping policy';

export const shippingPolicyDocument:
    LegalDocument = {
    slug:
        'shipping-policy',

    title:
        'Shipping Policy',

    shortTitle:
        'Shipping',

    eyebrow:
        'Orders and Delivery',

    description:
        'Review MaxiPawz shipping destinations, carrier-calculated rates, free-shipping eligibility, tracking, and delivery information.',

    introduction:
        `${businessDisplayName} currently uses this policy as a draft for storefront, Stripe Sandbox, and carrier-integration testing. Carrier-calculated shipping is being implemented before live commercial payments are enabled.`,

    icon:
        'shipping',

    tone:
        'brand',

    statusLabel:
        policyStatusLabel,

    effectiveDate:
        businessConfig
            .policyEffectiveDate,

    lastUpdated:
        businessConfig
            .policyLastUpdated,

    sections: [
        {
            id:
                'destinations',

            title:
                '1. Shipping destinations',

            paragraphs: [
                `MaxiPawz is configured to accept shipping addresses within the ${shippingConfig.destinationLabel}.`,

                'International shipping and delivery to separately coded United States territories are not included in the current checkout configuration.',
            ],
        },

        {
            id:
                'rates',

            title:
                '2. Carrier-calculated shipping',

            paragraphs: [
                `For eligible orders below ${formatAmount(
                    shippingConfig
                        .freeShippingThresholdAmount,
                )}, shipping charges are calculated using available carrier rates based on the delivery address and shipment information.`,

                'The shipping options and amounts available for an order are displayed during checkout before payment is completed.',
            ],

            bullets: [
                'MaxiPawz does not use a fixed standard-shipping charge in the current shipping model.',

                'Carrier availability, service levels, transit estimates, and rates may vary by destination and shipment characteristics.',

                'Shipping charges may be subject to applicable tax rules when required by the destination jurisdiction.',

                'The shipping amount paid by the customer is shown separately from the merchandise subtotal and sales tax.',
            ],
        },

        {
            id:
                'free-shipping',

            title:
                '3. Free standard shipping',

            paragraphs: [
                `Eligible orders receive free standard shipping when the merchandise subtotal is ${formatAmount(
                    shippingConfig
                        .freeShippingThresholdAmount,
                )} or more.`,

                'When an order qualifies, MaxiPawz covers the eligible standard carrier service offered for that shipment. Faster or upgraded services may remain available for an additional charge.',
            ],

            bullets: [
                'The threshold is based on the validated merchandise subtotal before shipping and tax.',

                'Item-level sale prices are reflected in the merchandise subtotal.',

                'Shipping fees, taxes, gift cards, and other non-merchandise charges do not count toward the free-shipping threshold.',

                charityConfig
                    .countsTowardFreeShipping
                    ? 'A future shelter contribution may count toward the free-shipping threshold only when that program is formally enabled.'
                    : 'A future optional animal-shelter contribution will not count toward the free-shipping threshold.',
            ],
        },

        {
            id:
                'processing',

            title:
                '4. Order processing',

            paragraphs: [
                'Orders require processing before they are transferred to a carrier.',

                'A final commercial processing-time commitment has not yet been published. The live policy will be updated before commercial launch with the applicable order-processing expectations.',
            ],

            notice:
                'Processing time and carrier transit time are separate. Creating a shipping label does not by itself mean that the carrier has received the package.',
        },

        {
            id:
                'delivery',

            title:
                '5. Carrier transit estimates',

            paragraphs: [
                'When available, carrier transit estimates may be displayed alongside shipping services during checkout.',

                'Carrier delivery estimates are not guarantees. Weather, carrier capacity, service interruptions, destination conditions, and other events outside MaxiPawz control may affect delivery.',
            ],
        },

        {
            id:
                'addresses',

            title:
                '6. Shipping addresses and changes',

            paragraphs: [
                'Customers are responsible for reviewing the recipient name, street address, unit or apartment information, city, state, and postal code before completing checkout.',

                `Contact MaxiPawz through the ${businessConfig.contactLabel} promptly if an address correction is needed.`,

                'An address change cannot be guaranteed after an order has entered fulfillment or has been transferred to a carrier.',
            ],
        },

        {
            id:
                'tracking',

            title:
                '7. Tracking and carrier activity',

            paragraphs: [
                'Tracking information will be provided when a supported shipping label is created for the order.',

                'Tracking information may require time to update after label creation. A shipment should not be considered accepted by the carrier until carrier tracking activity reflects possession or acceptance.',

                'Carrier scans, estimated delivery dates, delivery notices, and route information are controlled by the carrier.',
            ],
        },

        {
            id:
                'shipping-problems',

            title:
                '8. Delayed, damaged, incomplete, or missing shipments',

            paragraphs: [
                `Contact MaxiPawz through the ${businessConfig.contactLabel} promptly when a shipment appears delayed, damaged, incomplete, misdirected, or marked delivered but cannot be located.`,

                'Keep the product, packaging, shipping container, shipping label, photographs, tracking information, and order records while the issue is reviewed.',

                'MaxiPawz may need to review carrier information, delivery records, photographs, inventory records, or other relevant documentation before determining the appropriate response.',
            ],
        },

        {
            id:
                'charity',

            title:
                '9. Future animal-shelter contribution program',

            paragraphs: [
                charityConfig.planned
                    ? 'MaxiPawz is considering a future option that would allow customers to add a separate voluntary contribution benefiting a local animal shelter.'
                    : 'No animal-shelter contribution program is currently planned.',

                charityConfig.disclosure,

                'The contribution feature will remain disabled until a partner is selected and written terms, payment handling, remittance, refunds, disclosures, receipts, accounting, and tax treatment are confirmed.',
            ],

            notice:
                'No portion of a current merchandise payment is represented as a charitable contribution.',
        },

        {
            id:
                'updates',

            title:
                '10. Policy updates and contact',

            paragraphs: [
                'This Shipping Policy may be updated when shipping carriers, rates, destinations, fulfillment procedures, delivery expectations, or legal requirements change.',

                `Questions may be submitted through the ${businessConfig.contactLabel}.`,
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
                'Review return, refund, exchange, and cancellation information.',
        },

        {
            label:
                'Frequently Asked Questions',

            href:
                '/faq',

            description:
                'Find general information about MaxiPawz orders and products.',
        },

        {
            label:
                'Contact MaxiPawz',

            href:
                businessConfig
                    .contactHref,

            description:
                'Send a shipping or order question.',
        },
    ],
};