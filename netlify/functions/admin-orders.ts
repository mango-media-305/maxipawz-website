import type {
    Config,
} from '@netlify/functions';

import {
    AdminAuthError,
    assertAdminAuthorized,
} from '../../src/server/admin-auth';

import type {
    AdminOrder,
    AdminOrdersResponse,
} from '../../src/types/admin-order';

import type {
    OrderRecord,
} from '../../src/types/order';

import {
    listOrders,
} from '../../src/utils/orders';

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

        livemode:
            order.livemode,

        paymentIntentId:
            order.paymentIntentId,

        paymentStatus:
            order.paymentStatus,

        orderStatus:
            order.orderStatus,

        fulfillmentStatus:
            order.fulfillmentStatus ??
            'unfulfilled',

        refundStatus:
            order.refundStatus ??
            'none',

        amountRefunded:
            order.amountRefunded ??
            0,

        amountRefundPending:
            order.amountRefundPending ??
            0,

        amountRefundable:
            order.amountRefundable ??
            Math.max(
                0,
                order.amountTotal,
            ),

        refunds:
            order.refunds ??
            [],

        customer:
            order.customer,

        shippingAddress:
            order.shippingAddress,

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
        AdminOrdersResponse,

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
        'GET'
    ) {
        return jsonResponse(
            {
                ok: false,

                message:
                    'This endpoint accepts GET requests only.',
            },
            405,
        );
    }

    try {
        assertAdminAuthorized(
            request,
        );

        const orders =
            await listOrders(
                false,
            );

        return jsonResponse({
            ok: true,

            orders:
                orders.map(
                    toAdminOrder,
                ),
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
            'Admin order listing failed.',
            error,
        );

        return jsonResponse(
            {
                ok: false,

                message:
                    'Orders could not be loaded.',
            },
            500,
        );
    }
}

export const config:
    Config = {
    path:
        '/api/admin/orders',
};