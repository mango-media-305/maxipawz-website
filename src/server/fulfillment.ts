import type Stripe from 'stripe';

import {
    buyTestShipmentRate,
} from './easypost';

import type {
    EasyPostRate,
} from './easypost';

import type {
    OrderRecord,
    OrderShippingDetails,
} from '../types/order';

import {
    saveOrderFulfillment,
} from '../utils/orders';

interface FulfillPaidSandboxOrderOptions {
    session:
    Stripe.Checkout.Session;

    order:
    OrderRecord;
}

function parsePositiveCents(
    value:
        | string
        | undefined,
): number | null {
    if (!value) {
        return null;
    }

    const amount =
        Number(
            value,
        );

    if (
        !Number.isInteger(
            amount,
        ) ||
        amount < 0
    ) {
        return null;
    }

    return amount;
}

function rateAmountToCents(
    rate:
        EasyPostRate,
): number {
    const dollars =
        Number(
            rate.rate,
        );

    if (
        !Number.isFinite(
            dollars,
        ) ||
        dollars < 0
    ) {
        throw new Error(
            'EasyPost returned an invalid postage amount.',
        );
    }

    return Math.round(
        dollars *
        100,
    );
}

function getSelectedShippingRate(
    session:
        Stripe.Checkout.Session,
): Stripe.ShippingRate {
    const shippingRate =
        session
            .shipping_cost
            ?.shipping_rate;

    if (!shippingRate) {
        throw new Error(
            'The completed Stripe Checkout Session does not contain a selected shipping rate.',
        );
    }

    if (
        typeof shippingRate ===
        'string'
    ) {
        throw new Error(
            'The Stripe Shipping Rate must be expanded before fulfillment.',
        );
    }

    return shippingRate;
}

export async function fulfillPaidSandboxOrder(
    options:
        FulfillPaidSandboxOrderOptions,
): Promise<OrderRecord> {
    const {
        session,
        order,
    } = options;

    if (
        order.paymentStatus !==
        'paid'
    ) {
        return order;
    }

    if (
        process.env
            .EASYPOST_AUTO_PURCHASE_TEST_LABELS !==
        'true'
    ) {
        return order;
    }

    /**
     * This integration deliberately refuses to purchase
     * production labels.
     *
     * Production fulfillment will use a manual/admin
     * approval step after the package is verified.
     */
    if (
        order.livemode ||
        order.checkoutMode !==
        'test' ||
        process.env
            .EASYPOST_MODE !==
        'test'
    ) {
        throw new Error(
            'Automatic EasyPost label purchase is allowed only for Sandbox orders.',
        );
    }

    if (
        order.shipping
            ?.trackingCode
    ) {
        return order;
    }

    const stripeShippingRate =
        getSelectedShippingRate(
            session,
        );

    const metadata =
        stripeShippingRate
            .metadata;

    if (
        metadata
            .shipping_provider !==
        'easypost'
    ) {
        throw new Error(
            'The selected Stripe Shipping Rate is not backed by EasyPost.',
        );
    }

    const shipmentId =
        metadata
            .easypost_shipment_id;

    const rateId =
        metadata
            .easypost_rate_id;

    if (
        !shipmentId
            ?.startsWith(
                'shp_',
            )
    ) {
        throw new Error(
            'The selected shipping option does not contain a valid EasyPost Shipment ID.',
        );
    }

    if (
        !rateId
            ?.startsWith(
                'rate_',
            )
    ) {
        throw new Error(
            'The selected shipping option does not contain a valid EasyPost Rate ID.',
        );
    }

    const sessionShipmentId =
        session.metadata
            ?.easypost_shipment_id;

    if (
        sessionShipmentId &&
        sessionShipmentId !==
        shipmentId
    ) {
        throw new Error(
            'The selected EasyPost Shipment does not match the Checkout Session shipping quote.',
        );
    }

    const purchasedShipment =
        await buyTestShipmentRate(
            shipmentId,
            rateId,
        );

    const selectedRate =
        purchasedShipment
            .selected_rate ??
        purchasedShipment
            .rates
            .find(
                (
                    rate,
                ) =>
                    rate.id ===
                    rateId,
            );

    if (!selectedRate) {
        throw new Error(
            'EasyPost did not return the purchased Rate.',
        );
    }

    const trackingCode =
        purchasedShipment
            .tracking_code;

    const labelUrl =
        purchasedShipment
            .postage_label
            ?.label_url;

    if (
        !trackingCode ||
        !labelUrl
    ) {
        throw new Error(
            'EasyPost did not return the test tracking code and shipping label.',
        );
    }

    const metadataPostageAmount =
        parsePositiveCents(
            metadata
                .easypost_postage_cents,
        );

    const actualPostageAmount =
        rateAmountToCents(
            selectedRate,
        );

    if (
        metadataPostageAmount !==
        null &&
        metadataPostageAmount !==
        actualPostageAmount
    ) {
        throw new Error(
            'The EasyPost postage amount changed between rate selection and label purchase.',
        );
    }

    const freeShippingApplied =
        metadata
            .free_shipping_applied ===
        'true';

    const shipping:
        OrderShippingDetails = {
        provider:
            'easypost',

        easypostShipmentId:
            shipmentId,

        easypostRateId:
            rateId,

        carrier:
            selectedRate
                .carrier,

        service:
            selectedRate
                .service,

        postageAmount:
            actualPostageAmount,

        customerShippingAmount:
            session
                .total_details
                ?.amount_shipping ??
            order
                .amountShipping,

        freeShippingApplied,

        trackingCode,

        trackerId:
            purchasedShipment
                .tracker
                ?.id,

        trackingUrl:
            purchasedShipment
                .tracker
                ?.public_url ??
            undefined,

        labelUrl,

        labelPdfUrl:
            purchasedShipment
                .postage_label
                ?.label_pdf_url ??
            undefined,

        labelZplUrl:
            purchasedShipment
                .postage_label
                ?.label_zpl_url ??
            undefined,

        trackerStatus:
            purchasedShipment
                .tracker
                ?.status,

        labelCreatedAt:
            new Date()
                .toISOString(),
    };

    return await saveOrderFulfillment(
        order.sessionId,
        order.livemode,
        shipping,
    );
}