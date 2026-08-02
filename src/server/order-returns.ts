import {
    getStore,
} from '@netlify/blobs';

import {
    randomUUID,
} from 'node:crypto';

import type {
    AdminApproveReturnRequest,
    AdminCloseReturnRequest,
    AdminConfirmRefundSyncedRequest,
    AdminMarkReturnReceivedRequest,
    AdminRejectReturnRequest,
    AdminStartReturnRequest,
} from '../types/admin-order';

import type {
    OrderItem,
    OrderRecord,
    OrderReturnItem,
    OrderReturnRecord,
} from '../types/order';

const MAXIMUM_WRITE_ATTEMPTS =
    5;

const RETURN_WINDOW_DAYS =
    30;

export type ReturnActionInput =
    | AdminStartReturnRequest
    | AdminApproveReturnRequest
    | AdminRejectReturnRequest
    | AdminMarkReturnReceivedRequest
    | AdminConfirmRefundSyncedRequest
    | AdminCloseReturnRequest;

export interface OrderReturnUpdateResult {
    order:
    OrderRecord;

    returnRecord:
    OrderReturnRecord;

    changed: boolean;
}

function getOrderStore(
    livemode: boolean,
) {
    return getStore(
        `maxipawz-orders-${livemode
            ? 'live'
            : 'test'}`,
        {
            consistency:
                'strong',
        },
    );
}

function getOrderKey(
    sessionId: string,
): string {
    return `session/${sessionId}`;
}

function delay(
    milliseconds: number,
): Promise<void> {
    return new Promise(
        (
            resolve,
        ) => {
            setTimeout(
                resolve,
                milliseconds,
            );
        },
    );
}

function getItemKey(
    productSlug: string,
    variantId?: string,
): string {
    return `${productSlug}::${variantId ?? ''}`;
}

function getPurchasedQuantities(
    items:
        OrderItem[],
): Map<
    string,
    number
> {
    const quantities =
        new Map<
            string,
            number
        >();

    for (
        const item of
        items
    ) {
        const key =
            getItemKey(
                item.productSlug,
                item.variantId,
            );

        quantities.set(
            key,
            (
                quantities.get(
                    key,
                ) ??
                0
            ) +
            item.quantity,
        );
    }

    return quantities;
}

function getCatalogItem(
    order:
        OrderRecord,

    productSlug: string,

    variantId?: string,
): OrderItem | undefined {
    return order.items.find(
        (
            item,
        ) =>
            item.productSlug ===
            productSlug &&
            (
                item.variantId ??
                undefined
            ) ===
            (
                variantId ??
                undefined
            ),
    );
}

function buildReturnItems(
    order:
        OrderRecord,

    input:
        AdminStartReturnRequest,
): OrderReturnItem[] {
    if (
        input.items.length ===
        0
    ) {
        throw new Error(
            'Select at least one item for the return.',
        );
    }

    const purchasedQuantities =
        getPurchasedQuantities(
            order.items,
        );

    const selectedQuantities =
        new Map<
            string,
            number
        >();

    const returnItems:
        OrderReturnItem[] = [];

    for (
        const item of
        input.items
    ) {
        if (
            !Number.isInteger(
                item.quantity,
            ) ||
            item.quantity <=
            0
        ) {
            throw new Error(
                'Every returned item must have a valid quantity.',
            );
        }

        const key =
            getItemKey(
                item.productSlug,
                item.variantId,
            );

        const purchasedQuantity =
            purchasedQuantities.get(
                key,
            ) ??
            0;

        const nextSelectedQuantity =
            (
                selectedQuantities.get(
                    key,
                ) ??
                0
            ) +
            item.quantity;

        if (
            purchasedQuantity ===
            0 ||
            nextSelectedQuantity >
            purchasedQuantity
        ) {
            throw new Error(
                'A returned quantity exceeds the quantity purchased.',
            );
        }

        const catalogItem =
            getCatalogItem(
                order,
                item.productSlug,
                item.variantId,
            );

        if (!catalogItem) {
            throw new Error(
                'A selected return item does not exist in the order.',
            );
        }

        selectedQuantities.set(
            key,
            nextSelectedQuantity,
        );

        returnItems.push({
            productSlug:
                catalogItem.productSlug,

            variantId:
                catalogItem.variantId,

            productName:
                catalogItem.productName,

            variantLabel:
                catalogItem.variantLabel,

            quantity:
                item.quantity,
        });
    }

    return returnItems;
}

function getReturnWindowEndsAt(
    deliveredAt:
        string,
): string {
    const deliveredDate =
        new Date(
            deliveredAt,
        );

    if (
        Number.isNaN(
            deliveredDate.getTime(),
        )
    ) {
        throw new Error(
            'The order delivery date is invalid.',
        );
    }

    deliveredDate.setUTCDate(
        deliveredDate.getUTCDate() +
        RETURN_WINDOW_DAYS,
    );

    return deliveredDate
        .toISOString();
}

function getActiveReturn(
    order:
        OrderRecord,
): OrderReturnRecord | undefined {
    if (
        !order.activeReturnId
    ) {
        return undefined;
    }

    return (
        order.returns ??
        []
    ).find(
        (
            returnRecord,
        ) =>
            returnRecord.returnId ===
            order.activeReturnId,
    );
}

function replaceReturnRecord(
    returns:
        OrderReturnRecord[],

    nextReturn:
        OrderReturnRecord,
): OrderReturnRecord[] {
    const exists =
        returns.some(
            (
                returnRecord,
            ) =>
                returnRecord.returnId ===
                nextReturn.returnId,
        );

    if (!exists) {
        return [
            ...returns,
            nextReturn,
        ];
    }

    return returns.map(
        (
            returnRecord,
        ) =>
            returnRecord.returnId ===
                nextReturn.returnId
                ? nextReturn
                : returnRecord,
    );
}

function getAvailableRefundAmount(
    order:
        OrderRecord,
): number {
    return Math.max(
        0,
        order.amountRefundable ??
        (
            order.amountTotal -
            (
                order.amountRefunded ??
                0
            ) -
            (
                order.amountRefundPending ??
                0
            )
        ),
    );
}

function startReturn(
    order:
        OrderRecord,

    input:
        AdminStartReturnRequest,

    now:
        string,
): OrderReturnRecord {
    if (
        order.paymentStatus !==
        'paid'
    ) {
        throw new Error(
            'Only paid orders can have a return.',
        );
    }

    if (
        order.fulfillmentStatus !==
        'delivered' ||
        !order.fulfillment
            ?.deliveredAt
    ) {
        throw new Error(
            'A return can be started only after the order is marked delivered.',
        );
    }

    if (
        getActiveReturn(
            order,
        )
    ) {
        throw new Error(
            'This order already has an active return.',
        );
    }

    if (
        order.refundStatus ===
        'refunded'
    ) {
        throw new Error(
            'A fully refunded order cannot start another return.',
        );
    }

    if (
        !Number.isInteger(
            input.expectedRefundAmount,
        ) ||
        input.expectedRefundAmount <=
        0
    ) {
        throw new Error(
            'Enter a valid expected refund amount.',
        );
    }

    const availableRefundAmount =
        getAvailableRefundAmount(
            order,
        );

    if (
        input.expectedRefundAmount >
        availableRefundAmount
    ) {
        throw new Error(
            'The expected refund exceeds the amount still refundable in Stripe.',
        );
    }

    const returnWindowEndsAt =
        getReturnWindowEndsAt(
            order.fulfillment
                .deliveredAt,
        );

    const outsidePolicyWindow =
        new Date(
            now,
        ).getTime() >
        new Date(
            returnWindowEndsAt,
        ).getTime();

    if (
        outsidePolicyWindow &&
        !input.policyException
    ) {
        throw new Error(
            'The standard 30-day return window has expired. Record a policy exception to continue.',
        );
    }

    return {
        returnId:
            `ret_${randomUUID().replaceAll(
                '-',
                '',
            )}`,

        status:
            'under-review',

        reason:
            input.reason,

        items:
            buildReturnItems(
                order,
                input,
            ),

        expectedRefundAmount:
            input.expectedRefundAmount,

        refundBaselineAmount:
            order.amountRefunded ??
            0,

        returnWindowEndsAt,

        policyException:
            input.policyException,

        customerMessage:
            input.customerMessage,

        internalNotes:
            input.internalNotes,

        requestedAt:
            now,

        updatedAt:
            now,
    };
}

function updateActiveReturn(
    order:
        OrderRecord,

    input:
        Exclude<
            ReturnActionInput,
            AdminStartReturnRequest
        >,

    now:
        string,
): OrderReturnRecord {
    const activeReturn =
        getActiveReturn(
            order,
        );

    if (!activeReturn) {
        throw new Error(
            'This order does not have an active return.',
        );
    }

    if (
        input.action ===
        'approve-return'
    ) {
        if (
            activeReturn.status !==
            'under-review'
        ) {
            throw new Error(
                'Only a return under review can be approved.',
            );
        }

        return {
            ...activeReturn,

            status:
                'awaiting-return',

            returnDeadline:
                input.returnDeadline,

            decisionMessage:
                input.decisionMessage,

            approvedAt:
                now,

            updatedAt:
                now,
        };
    }

    if (
        input.action ===
        'reject-return'
    ) {
        if (
            activeReturn.status !==
            'under-review'
        ) {
            throw new Error(
                'Only a return under review can be rejected.',
            );
        }

        return {
            ...activeReturn,

            status:
                'rejected',

            decisionMessage:
                input.decisionMessage,

            rejectedAt:
                now,

            updatedAt:
                now,
        };
    }

    if (
        input.action ===
        'mark-return-received'
    ) {
        if (
            activeReturn.status !==
            'awaiting-return'
        ) {
            throw new Error(
                'Only an approved return awaiting shipment can be marked received.',
            );
        }

        return {
            ...activeReturn,

            status:
                'refund-pending',

            conditionNotes:
                input.conditionNotes,

            receivedAt:
                now,

            updatedAt:
                now,
        };
    }

    if (
        input.action ===
        'confirm-refund-synced'
    ) {
        if (
            activeReturn.status !==
            'refund-pending'
        ) {
            throw new Error(
                'The return must be received before its refund can be confirmed.',
            );
        }

        const refundApplied =
            Math.max(
                0,
                (
                    order.amountRefunded ??
                    0
                ) -
                activeReturn
                    .refundBaselineAmount,
            );

        if (
            refundApplied <
            activeReturn
                .expectedRefundAmount
        ) {
            throw new Error(
                'Stripe has not synchronized the full expected refund for this return yet.',
            );
        }

        return {
            ...activeReturn,

            status:
                'refunded',

            refundedAt:
                now,

            updatedAt:
                now,
        };
    }

    if (
        activeReturn.status !==
        'rejected' &&
        activeReturn.status !==
        'refunded'
    ) {
        throw new Error(
            'Only a rejected or refunded return can be closed.',
        );
    }

    return {
        ...activeReturn,

        status:
            'closed',

        closedAt:
            now,

        updatedAt:
            now,
    };
}

export async function applyReturnAction(
    input:
        ReturnActionInput,

    livemode:
        boolean,
): Promise<OrderReturnUpdateResult> {
    const store =
        getOrderStore(
            livemode,
        );

    const key =
        getOrderKey(
            input.sessionId,
        );

    const now =
        new Date()
            .toISOString();

    for (
        let attempt = 0;
        attempt <
        MAXIMUM_WRITE_ATTEMPTS;
        attempt += 1
    ) {
        const existing =
            await store.get(
                key,
                {
                    type:
                        'json',
                },
            ) as
            | OrderRecord
            | null;

        if (!existing) {
            throw new Error(
                'The order record does not exist.',
            );
        }

        if (
            existing.livemode !==
            livemode
        ) {
            throw new Error(
                'The order environment does not match the requested operation.',
            );
        }

        const nextReturn =
            input.action ===
                'start-return'
                ? startReturn(
                    existing,
                    input,
                    now,
                )
                : updateActiveReturn(
                    existing,
                    input,
                    now,
                );

        const returns =
            replaceReturnRecord(
                existing.returns ??
                [],
                nextReturn,
            );

        const isClosing =
            input.action ===
            'close-return';

        const nextOrder:
            OrderRecord = {
            ...existing,

            returnStatus:
                nextReturn.status,

            activeReturnId:
                isClosing
                    ? undefined
                    : nextReturn.returnId,

            returns,

            updatedAt:
                now,
        };

        await store.setJSON(
            key,
            nextOrder,
        );

        const confirmed =
            await store.get(
                key,
                {
                    type:
                        'json',
                },
            ) as
            | OrderRecord
            | null;

        const confirmedReturn =
            (
                confirmed?.returns ??
                []
            ).find(
                (
                    returnRecord,
                ) =>
                    returnRecord.returnId ===
                    nextReturn.returnId,
            );

        if (
            confirmed &&
            confirmedReturn
                ?.updatedAt ===
            now &&
            confirmedReturn.status ===
            nextReturn.status
        ) {
            return {
                order:
                    confirmed,

                returnRecord:
                    confirmedReturn,

                changed:
                    true,
            };
        }

        await delay(
            25 *
            (
                attempt +
                1
            ),
        );
    }

    throw new Error(
        'The return update could not be saved after multiple attempts.',
    );
}