import {
    getStore,
} from '@netlify/blobs';

import {
    Resend,
} from 'resend';

import type {
    EmailDeliveryRecord,
} from '../../types/email';

import type {
    OrderRecord,
    OrderReturnRecord,
} from '../../types/order';

import {
    getEmailRuntimeConfig,
} from './config';

import {
    buildCustomerReturnUpdate,
} from './return-template';

import type {
    ReturnEmailStage,
} from './return-template';

export type ReturnEmailResult =
    | 'sent'
    | 'skipped'
    | 'failed';

function getDeliveryStore(
    livemode: boolean,
) {
    return getStore(
        `maxipawz-email-deliveries-${livemode
            ? 'live'
            : 'test'}`,
        {
            consistency:
                'strong',
        },
    );
}

function getDeliveryKey(
    returnId: string,

    stage:
        ReturnEmailStage,
): string {
    return `customer-return-update/${returnId}/${stage}`;
}

export async function sendCustomerReturnUpdateEmail(
    order:
        OrderRecord,

    returnRecord:
        OrderReturnRecord,

    stage:
        ReturnEmailStage,
): Promise<ReturnEmailResult> {
    const config =
        getEmailRuntimeConfig();

    if (
        !config.enabled ||
        order.paymentStatus !==
        'paid'
    ) {
        return 'skipped';
    }

    const recipient =
        !order.livemode
            ? config
                .sandboxRecipientEmail
            : order.customer
                ?.email;

    if (!recipient) {
        console.warn(
            'Return update email skipped because no recipient email is available.',
            {
                sessionId:
                    order.sessionId,

                returnId:
                    returnRecord
                        .returnId,

                stage,
            },
        );

        return 'skipped';
    }

    const store =
        getDeliveryStore(
            order.livemode,
        );

    const key =
        getDeliveryKey(
            returnRecord
                .returnId,
            stage,
        );

    const existing =
        await store.get(
            key,
            {
                type:
                    'json',
            },
        ) as
        | EmailDeliveryRecord
        | null;

    if (
        existing
            ?.status ===
        'sent'
    ) {
        return 'skipped';
    }

    const content =
        buildCustomerReturnUpdate(
            order,
            returnRecord,
            stage,
        );

    const resend =
        new Resend(
            config.apiKey,
        );

    const from =
        `${config.fromName} <${config.fromEmail}>`;

    const now =
        new Date()
            .toISOString();

    const attemptCount =
        (
            existing
                ?.attemptCount ??
            0
        ) +
        1;

    try {
        const result =
            await resend.emails.send(
                {
                    from,

                    to:
                        recipient,

                    ...(config
                        .replyToEmail
                        ? {
                            replyTo:
                                config
                                    .replyToEmail,
                        }
                        : {}),

                    subject:
                        content.subject,

                    html:
                        content.html,

                    text:
                        content.text,

                    tags: [
                        {
                            name:
                                'category',

                            value:
                                'customer-return-update',
                        },

                        {
                            name:
                                'return_stage',

                            value:
                                stage,
                        },

                        {
                            name:
                                'mode',

                            value:
                                order.livemode
                                    ? 'live'
                                    : 'test',
                        },
                    ],
                },
                {
                    idempotencyKey:
                        `customer-return-update/${returnRecord.returnId}/${stage}`,
                },
            );

        if (
            result.error ||
            !result.data?.id
        ) {
            throw new Error(
                result.error
                    ?.message ??
                'Resend did not return an email ID.',
            );
        }

        const record:
            EmailDeliveryRecord = {
            version: 1,

            kind:
                'customer-return-update',

            sessionId:
                order.sessionId,

            recipient,

            status:
                'sent',

            provider:
                'resend',

            providerMessageId:
                result.data.id,

            attemptCount,

            createdAt:
                existing
                    ?.createdAt ??
                now,

            updatedAt:
                now,
        };

        await store.setJSON(
            key,
            record,
        );

        return 'sent';
    } catch (error) {
        const record:
            EmailDeliveryRecord = {
            version: 1,

            kind:
                'customer-return-update',

            sessionId:
                order.sessionId,

            recipient,

            status:
                'failed',

            provider:
                'resend',

            attemptCount,

            lastError:
                error instanceof Error
                    ? error.message.slice(
                        0,
                        500,
                    )
                    : 'Unknown email delivery error.',

            createdAt:
                existing
                    ?.createdAt ??
                now,

            updatedAt:
                now,
        };

        await store.setJSON(
            key,
            record,
        );

        console.error(
            'Return update email failed.',
            error,
        );

        return 'failed';
    }
}