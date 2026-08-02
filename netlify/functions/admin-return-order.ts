import type {
    Config,
} from '@netlify/functions';

import {
    AdminAuthError,
    assertAdminAuthorized,
} from '../../src/server/admin-auth';

import {
    sendCustomerReturnUpdateEmail,
} from '../../src/server/email/send-return-email';

import type {
    ReturnEmailStage,
} from '../../src/server/email/return-template';

import {
    applyReturnAction,
} from '../../src/server/order-returns';

import type {
    AdminOrder,
    AdminReturnAction,
    AdminReturnItemInput,
    AdminReturnOrderRequest,
    AdminReturnOrderResponse,
} from '../../src/types/admin-order';

import type {
    OrderRecord,
    OrderReturnReason,
} from '../../src/types/order';

const returnReasons =
    new Set<
        OrderReturnReason
    >([
        'changed-mind',
        'damaged',
        'defective',
        'wrong-item',
        'missing-item',
        'not-as-described',
        'other',
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

function requiredString(
    value: unknown,

    message: string,
): string {
    const normalized =
        optionalString(
            value,
        );

    if (!normalized) {
        throw new Error(
            message,
        );
    }

    return normalized;
}

function parseSessionId(
    value: unknown,
): string {
    const sessionId =
        requiredString(
            value,
            'A Stripe Sandbox Checkout Session is required.',
        );

    if (
        !sessionId.startsWith(
            'cs_test_',
        )
    ) {
        throw new Error(
            'A valid Stripe Sandbox Checkout Session is required.',
        );
    }

    return sessionId;
}

function parseDateOnly(
    value: unknown,
): string {
    const date =
        requiredString(
            value,
            'Select a return mailing deadline.',
        );

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
            date,
        )
    ) {
        throw new Error(
            'The return deadline must use YYYY-MM-DD.',
        );
    }

    const parsed =
        new Date(
            `${date}T12:00:00Z`,
        );

    if (
        Number.isNaN(
            parsed.getTime(),
        )
    ) {
        throw new Error(
            'The return deadline is invalid.',
        );
    }

    return date;
}

function parseReturnItems(
    value: unknown,
): AdminReturnItemInput[] {
    if (
        !Array.isArray(
            value,
        )
    ) {
        throw new Error(
            'Select at least one item for the return.',
        );
    }

    return value.map(
        (
            item,
        ) => {
            if (
                !isRecord(
                    item,
                )
            ) {
                throw new Error(
                    'A selected return item is invalid.',
                );
            }

            const productSlug =
                requiredString(
                    item.productSlug,
                    'A selected return item is missing its product identifier.',
                );

            const quantity =
                item.quantity;

            if (
                typeof quantity !==
                'number' ||
                !Number.isInteger(
                    quantity,
                ) ||
                quantity <=
                0
            ) {
                throw new Error(
                    'Every return item must have a valid quantity.',
                );
            }

            return {
                productSlug,

                variantId:
                    optionalString(
                        item.variantId,
                    ),

                quantity,
            };
        },
    );
}

function parseRequest(
    value: unknown,
): AdminReturnOrderRequest {
    if (
        !isRecord(
            value,
        )
    ) {
        throw new Error(
            'The return request is invalid.',
        );
    }

    const action =
        requiredString(
            value.action,
            'A return action is required.',
        ) as
        AdminReturnAction;

    const sessionId =
        parseSessionId(
            value.sessionId,
        );

    if (
        action ===
        'start-return'
    ) {
        const reason =
            requiredString(
                value.reason,
                'Select a return reason.',
            ) as
            OrderReturnReason;

        if (
            !returnReasons.has(
                reason,
            )
        ) {
            throw new Error(
                'Select a valid return reason.',
            );
        }

        const expectedRefundAmount =
            value.expectedRefundAmount;

        if (
            typeof expectedRefundAmount !==
            'number' ||
            !Number.isInteger(
                expectedRefundAmount,
            ) ||
            expectedRefundAmount <=
            0
        ) {
            throw new Error(
                'Enter the expected refund amount in cents.',
            );
        }

        return {
            action,

            sessionId,

            reason,

            items:
                parseReturnItems(
                    value.items,
                ),

            expectedRefundAmount,

            customerMessage:
                optionalString(
                    value.customerMessage,
                ),

            internalNotes:
                optionalString(
                    value.internalNotes,
                ),

            policyException:
                value.policyException ===
                true,
        };
    }

    if (
        action ===
        'approve-return'
    ) {
        return {
            action,

            sessionId,

            returnDeadline:
                parseDateOnly(
                    value.returnDeadline,
                ),

            decisionMessage:
                requiredString(
                    value.decisionMessage,
                    'Enter the customer-facing return instructions.',
                ),
        };
    }

    if (
        action ===
        'reject-return'
    ) {
        return {
            action,

            sessionId,

            decisionMessage:
                requiredString(
                    value.decisionMessage,
                    'Explain why the return request was not approved.',
                ),
        };
    }

    if (
        action ===
        'mark-return-received'
    ) {
        return {
            action,

            sessionId,

            conditionNotes:
                optionalString(
                    value.conditionNotes,
                ),
        };
    }

    if (
        action ===
        'confirm-refund-synced'
    ) {
        return {
            action,

            sessionId,
        };
    }

    if (
        action ===
        'close-return'
    ) {
        return {
            action,

            sessionId,
        };
    }

    throw new Error(
        'The requested return action is invalid.',
    );
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

        livemode:
            order.livemode,

        paymentIntentId:
            order.paymentIntentId,

        paymentStatus:
            order.paymentStatus,

        orderStatus:
            order.orderStatus,

        fulfillmentStatus:
            order.fulfillmentStatus,

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

        returnStatus:
            order.returnStatus ??
            'none',

        activeReturnId:
            order.activeReturnId,

        returns:
            order.returns ??
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

function getEmailStage(
    action:
        AdminReturnAction,
): ReturnEmailStage | undefined {
    if (
        action ===
        'start-return'
    ) {
        return 'request-received';
    }

    if (
        action ===
        'approve-return'
    ) {
        return 'approved';
    }

    if (
        action ===
        'reject-return'
    ) {
        return 'rejected';
    }

    if (
        action ===
        'mark-return-received'
    ) {
        return 'return-received';
    }

    return undefined;
}

function getSuccessMessage(
    action:
        AdminReturnAction,

    emailStatus:
        'sent'
        | 'skipped'
        | 'failed',
): string {
    const baseMessage =
        action ===
            'start-return'
            ? 'Return request created.'
            : action ===
                'approve-return'
                ? 'Return request approved.'
                : action ===
                    'reject-return'
                    ? 'Return request rejected.'
                    : action ===
                        'mark-return-received'
                        ? 'Return marked received and awaiting its Stripe refund.'
                        : action ===
                            'confirm-refund-synced'
                            ? 'The synchronized Stripe refund was confirmed for this return.'
                            : 'Return closed.';

    if (
        action ===
        'confirm-refund-synced' ||
        action ===
        'close-return'
    ) {
        return baseMessage;
    }

    if (
        emailStatus ===
        'sent'
    ) {
        return `${baseMessage} Customer email sent.`;
    }

    if (
        emailStatus ===
        'failed'
    ) {
        return `${baseMessage} The customer email failed; check Resend.`;
    }

    return `${baseMessage} Customer email skipped by the current email configuration.`;
}

function jsonResponse(
    body:
        AdminReturnOrderResponse,

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

        const result =
            await applyReturnAction(
                payload,
                false,
            );

        const emailStage =
            getEmailStage(
                payload.action,
            );

        const emailStatus =
            emailStage
                ? await sendCustomerReturnUpdateEmail(
                    result.order,
                    result.returnRecord,
                    emailStage,
                )
                : 'skipped';

        return jsonResponse({
            ok: true,

            action:
                payload.action,

            order:
                toAdminOrder(
                    result.order,
                ),

            returnRecord:
                result.returnRecord,

            emailStatus,

            message:
                getSuccessMessage(
                    payload.action,
                    emailStatus,
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
            'Admin return action failed.',
            error,
        );

        return jsonResponse(
            {
                ok: false,

                message:
                    error instanceof Error
                        ? error.message
                        : 'The return action could not be completed.',
            },
            400,
        );
    }
}

export const config:
    Config = {
    path:
        '/api/admin/return-order',
};