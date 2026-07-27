import {
    businessConfig,
    businessDisplayName,
} from '../config/business';

import {
    charityConfig,
} from '../config/charity';

import {
    commerceConfig,
} from '../config/commerce';

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
                shippingConfig.currency,
        },
    ).format(
        amount / 100,
    );
}

const standardShippingRateAmount =
    commerceConfig
        .shipping
        .standardShippingRateAmount;

const standardShippingStatement =
    standardShippingRateAmount ===
        null
        ? 'The flat standard-shipping amount is not yet configured. It must be configured and displayed before a commercial order below the free-shipping threshold can be accepted.'
        : `Orders with an eligible merchandise subtotal below ${formatAmount(
            shippingConfig
                .freeShippingThresholdAmount,
        )} are charged ${formatAmount(
            standardShippingRateAmount,
        )} for standard shipping.`;

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
        'Review MaxiPawz shipping destinations, rates, free-shipping eligibility, processing times, and delivery information.',

    introduction:
        `${businessDisplayName} currently uses this policy as a draft for storefront and Stripe Sandbox testing. Shipping rates and threshold calculations are implemented, but the complete commerce policy package must still be approved before live payments are enabled.`,

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
                `MaxiPawz is currently configured to collect and accept shipping addresses within the ${shippingConfig.destinationLabel}.`,

                'A valid and complete shipping address must be entered during Stripe Checkout. International shipping and delivery to separately coded United States territories are not included in the current checkout configuration.',
            ],

            notice:
                'Shipping availability may change when carriers, fulfillment providers, product restrictions, or destination requirements are finalized.',
        },

        {
            id:
                'rates',

            title:
                '2. Standard and free shipping',

            paragraphs: [
                standardShippingStatement,

                `Eligible orders receive free standard shipping when the merchandise subtotal is ${formatAmount(
                    shippingConfig
                        .freeShippingThresholdAmount,
                )} or more.`,
            ],

            bullets: [
                'The threshold is based on the validated merchandise subtotal before shipping and tax.',

                'Item-level sale prices are reflected in the merchandise subtotal.',

                'Shipping fees, taxes, gift cards, and other non-merchandise charges do not count toward the free-shipping threshold.',

                charityConfig
                    .countsTowardFreeShipping
                    ? 'A future shelter contribution may count toward the free-shipping threshold only when that program is formally enabled.'
                    : 'A future optional animal-shelter contribution will not count toward the free-shipping threshold.',

                'The applicable shipping amount is displayed in the cart estimate and again in Stripe Checkout before payment.',
            ],
        },

        {
            id:
                'processing',

            title:
                '3. Order processing',

            paragraphs: [
                `The current draft processing estimate is ${shippingConfig.processingEstimate.minimumBusinessDays}–${shippingConfig.processingEstimate.maximumBusinessDays} business days before an order is transferred to a carrier.`,

                'Business days generally exclude weekends and federal holidays. High-volume periods, inventory review, address questions, payment review, severe weather, or operational interruptions may extend processing time.',
            ],

            notice:
                'Processing time and carrier transit time are separate. An order is not considered shipped until it has been transferred to the carrier.',
        },

        {
            id:
                'delivery',

            title:
                '4. Estimated carrier transit',

            paragraphs: [
                `The current standard-shipping transit estimate is ${shippingConfig.transitEstimate.minimumBusinessDays}–${shippingConfig.transitEstimate.maximumBusinessDays} business days after carrier acceptance.`,

                'Delivery estimates are not guarantees. Carrier capacity, weather, service interruptions, destination conditions, and events outside MaxiPawz control may affect actual delivery.',
            ],
        },

        {
            id:
                'addresses',

            title:
                '5. Shipping addresses and changes',

            paragraphs: [
                'Customers are responsible for reviewing the recipient name, street address, unit or apartment information, city, state, and postal code before completing checkout.',

                `Contact MaxiPawz through the ${businessConfig.contactLabel} promptly if an address correction is needed.`,

                'An address change cannot be guaranteed after an order has entered processing, has been packed, or has been transferred to a carrier.',
            ],
        },

        {
            id:
                'tracking',

            title:
                '6. Tracking and carrier activity',

            paragraphs: [
                'Tracking information will be provided when supported by the selected carrier and fulfillment process.',

                'A tracking status may require time to update after a label is created. Carrier scans, estimated dates, delivery notices, and route information are controlled by the carrier.',
            ],
        },

        {
            id:
                'shipping-problems',

            title:
                '7. Delayed, damaged, incomplete, or missing shipments',

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
                '8. Future animal-shelter contribution program',

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
                '9. Policy updates and contact',

            paragraphs: [
                'This Shipping Policy may be updated when shipping rates, carriers, destinations, fulfillment procedures, delivery estimates, or legal requirements change.',

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