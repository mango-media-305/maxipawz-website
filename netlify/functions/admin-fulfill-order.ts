import type {
    Config,
} from '@netlify/functions';

import {
    AdminAuthError,
    assertAdminAuthorized,
} from '../../src/server/admin-auth';

import {
    sendShippingConfirmationEmail,
} from '../../src/server/email/send-shipping-email';

import type {
    AdminFulfillOrderRequest,
    AdminFulfillOrderResponse,
    AdminOrder,
} from '../../src/types/admin-order';

import type {
    OrderCarrier,
    OrderRecord,
} from '../../src/types/order';

import {
    saveManualFulfillment,
} from '../../src/utils/orders';

const carriers =
    new Set<
        OrderCarrier
    >([
        'USPS',
        'UPS',
        'FedEx',
        'Other',
    ]);

function isRecord(
    value: unknown,
): value is Record<
    string,
    unknown
> {
    return (
        typeof value ===
        'object' &&
        value !== null &&
        !Array.isArray(
            value,
        )
    );
}

function optionalString(
    value: unknown,
): string | undefined {
    if (
        typeof value !==
        'string'
    ) {
        return undefined;
    }

    const normalized =
        value.trim();

    return normalized ||
        undefined;
}

function parseRequest(
    value: unknown,
): AdminFulfillOrderRequest {
    if (
        !isRecord(
            value,
        )
    ) {
        throw new Error(
            'The fulfillment request is invalid.',
        );
    }

    const sessionId =
        optionalString(
            value.sessionId,
        );

    if (
        !sessionId ||
        !sessionId.startsWith(
            'cs_test_',
        )
    ) {
        throw new Error(
            'A valid Stripe Sandbox Checkout Session is required.',
        );
    }

    const carrier =
        optionalString(
            value.carrier,
        ) as
        | OrderCarrier
        | undefined;

    if (
        !carrier ||
        !carriers.has(
            carrier,
        )
    ) {
        throw new Error(
            'Select a valid shipping carrier.',
        );
    }

    const trackingNumber =
        optionalString(
            value.trackingNumber,
        );

    if (
        !trackingNumber
    ) {
        throw new Error(
            'Enter the carrier tracking number.',
        );
    }

    const service =
        optionalString(
            value.service,
        );

    const trackingUrl =
        optionalString(
            value.trackingUrl,
        );

    if (trackingUrl) {
        let url: URL;

        try {
            url =
                new URL(
                    trackingUrl,
                );
        } catch {
            throw new Error(
                'The tracking URL is invalid.',
            );
        }

        if (
            url.protocol !==
            'https:'
        ) {
            throw new Error(
                'The tracking URL must use HTTPS.',
            );
        }
    }

    const postageAmount =
        value.postageAmount;

    if (
        typeof postageAmount !==
        'number' ||
        !Number.isInteger(
            postageAmount,
        ) ||
        postageAmount < 0
    ) {
        throw new Error(
            'Enter the actual postage amount in cents.',
        );
    }

    return {
        sessionId,

        carrier,

        service,

        trackingNumber,

        trackingUrl,

        postageAmount,
    };
}

function getOrderReference(
    sessionId: string,
): string {
    const suffix =
        sessionId
            .replace(
                /^cs_(?:test|live)_/,
                '',
            )
            .slice(
                -10,
            )
            .toUpperCase();

    return `MPZ-${suffix}`;
}

function toAdminOrder(
    order:
        OrderRecord,
): AdminOrder {
    return {
        sessionId:
            order.sessionId,

        reference:
            getOrderReference(
                order.sessionId,
            ),

        paymentStatus:
            order.paymentStatus,

        orderStatus:
            order.orderStatus,

        fulfillmentStatus:
            order
                .fulfillmentStatus,

        customer:
            order.customer,

        shippingAddress:
            order
                .shippingAddress,

        fulfillment:
            order.fulfillment,

        currency:
            order.currency,

        amountSubtotal:
            order.amountSubtotal,

        amountShipping:
            order.amountShipping,

        amountTax:
            order.amountTax,

        amountDiscount:
            order.amountDiscount,

        amountTotal:
            order.amountTotal,

        items:
            order.items,

        createdAt:
            order.createdAt,

        updatedAt:
            order.updatedAt,
    };
}

function jsonResponse(
    body:
        AdminFulfillOrderResponse,

    status = 200,
): Response {
    return Response.json(
        body,
        {
            status,

            headers: {
                'Cache-Control':
                    'no-store, max-age=0',
            },
        },
    );
}

export default async function handler(
    request: Request,
): Promise<Response> {
    if (
        request.method !==
        'POST'
    ) {
        return jsonResponse(
            {
                ok: false,

                message:
                    'This endpoint accepts POST requests only.',
            },
            405,
        );
    }

    try {
        assertAdminAuthorized(
            request,
        );

        const rawRequest =
            await request
                .json()
                .catch(
                    () => null,
                );

        const payload =
            parseRequest(
                rawRequest,
            );

        const order =
            await saveManualFulfillment({
                ...payload,

                livemode:
                    false,
            });

        const emailStatus =
            await sendShippingConfirmationEmail(
                order,
            );

        return jsonResponse({
            ok: true,

            order:
                toAdminOrder(
                    order,
                ),

            emailStatus,
        });
    } catch (error) {
        if (
            error instanceof
            AdminAuthError
        ) {
            return jsonResponse(
                {
                    ok: false,

                    message:
                        error.message,
                },
                error.status,
            );
        }

        console.error(
            'Admin fulfillment update failed.',
            error,
        );

        return jsonResponse(
            {
                ok: false,

                message:
                    error instanceof Error
                        ? error.message
                        : 'The order could not be marked as shipped.',
            },
            400,
        );
    }
}

export const config:
    Config = {
    path:
        '/api/admin/fulfill-order',
};