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
        'Review Maxi Pawz shipping destinations, shipping estimates, free-shipping eligibility, tracking, and delivery information.',

    introduction:
        `${businessDisplayName} currently uses this policy as a draft while the storefront and Stripe Sandbox checkout are being prepared for commercial launch.`,

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
                `Maxi Pawz is configured to accept shipping addresses within the ${shippingConfig.destinationLabel}.`,

                'International shipping and delivery to separately coded United States territories are not included in the current checkout configuration.',
            ],
        },

        {
            id:
                'rates',

            title:
                '2. Standard shipping charges',

            paragraphs: [
                `For eligible orders below ${formatAmount(
                    shippingConfig
                        .freeShippingThresholdAmount,
                )}, Maxi Pawz calculates a standard-shipping estimate based on the order's shipping weight and destination category.`,

                'The shipping charge for the order is displayed during checkout before payment is completed.',
            ],

            bullets: [
                'Maxi Pawz does not currently use a single fixed standard-shipping charge.',

                'The checkout shipping charge is an estimate and is not represented as a live USPS, UPS, FedEx, or other carrier quote.',

                'The actual postage Maxi Pawz later pays to fulfill an order may be higher or lower than the checkout shipping charge.',

                'Customers are not charged an additional amount solely because actual postage later differs from the shipping charge accepted during checkout.',

                'Shipping charges may be subject to applicable sales-tax rules based on the destination.',
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

                'When an eligible order receives free standard shipping, Maxi Pawz absorbs the applicable fulfillment shipping expense.',
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
                'Orders require processing and packaging before they are transferred to a shipping carrier.',

                'A final commercial processing-time commitment has not yet been published. The live policy will be updated before commercial launch.',
            ],

            notice:
                'Processing time and carrier transit time are separate. Creating a shipping label does not by itself mean that a carrier has received the package.',
        },

        {
            id:
                'fulfillment',

            title:
                '5. Shipping carrier and fulfillment',

            paragraphs: [
                'Maxi Pawz may select an appropriate available carrier and service when fulfilling a standard-shipping order.',

                'Carrier selection may depend on package size, package weight, destination, service availability, delivery expectations, and shipping cost.',

                'During the initial launch stage, shipping labels and carrier services may be purchased manually as part of the fulfillment process.',
            ],
        },

        {
            id:
                'addresses',

            title:
                '6. Shipping addresses and changes',

            paragraphs: [
                'Customers are responsible for reviewing the recipient name, street address, apartment or unit information, city, state, and postal code before completing checkout.',

                `Contact Maxi Pawz through the ${businessConfig.contactLabel} promptly if an address correction is needed.`,

                'An address change cannot be guaranteed after an order has entered fulfillment or has been transferred to a carrier.',
            ],
        },

        {
            id:
                'tracking',

            title:
                '7. Tracking',

            paragraphs: [
                'Tracking information will be provided when tracking is available for the shipping service used to fulfill the order.',

                'Tracking information can require time to update after a label is created.',

                'Carrier scans, estimated delivery dates, delivery notices, and route information are controlled by the carrier.',
            ],
        },

        {
            id:
                'shipping-problems',

            title:
                '8. Delayed, damaged, incomplete, or missing shipments',

            paragraphs: [
                `Contact Maxi Pawz through the ${businessConfig.contactLabel} promptly when a shipment appears delayed, damaged, incomplete, misdirected, or marked delivered but cannot be located.`,

                'Keep the product, packaging, shipping container, shipping label, photographs, tracking information, and order records while the issue is reviewed.',

                'Maxi Pawz may need to review carrier information, delivery records, photographs, inventory records, or other relevant documentation before determining the appropriate response.',
            ],
        },

        {
            id:
                'charity',

            title:
                '9. Future animal-shelter contribution program',

            paragraphs: [
                charityConfig.planned
                    ? 'Maxi Pawz is considering a future option that would allow customers to add a separate voluntary contribution benefiting a local animal shelter.'
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
                'This Shipping Policy may be updated when shipping rates, destinations, fulfillment procedures, delivery expectations, or legal requirements change.',

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
                'Find general information about Maxi Pawz orders and products.',
        },

        {
            label:
                'Contact Maxi Pawz',

            href:
                businessConfig
                    .contactHref,

            description:
                'Send a shipping or order question.',
        },
    ],
};