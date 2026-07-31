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
} from '../../types/order';

import {
    getEmailRuntimeConfig,
} from './config';

import {
    buildCustomerShippingConfirmation,
} from './shipping-template';

export type ShippingEmailResult =
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
    sessionId: string,
): string {
    return `customer-shipping-confirmation/${sessionId}`;
}

export async function sendShippingConfirmationEmail(
    order:
        OrderRecord,
): Promise<ShippingEmailResult> {
    const config =
        getEmailRuntimeConfig();

    if (
        !config.enabled ||
        order.paymentStatus !==
        'paid' ||
        order.fulfillmentStatus !==
        'shipped' ||
        !order.fulfillment
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
            'Shipping confirmation email skipped because no recipient email is available.',
            {
                sessionId:
                    order.sessionId,
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
            order.sessionId,
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
        return 'sent';
    }

    const content =
        buildCustomerShippingConfirmation(
            order,
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
                                'customer-shipping-confirmation',
                        },

                        {
                            name:
                                'storefront',

                            value:
                                'maxipawz',
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
                        `customer-shipping-confirmation/${order.sessionId}`,
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
                'customer-shipping-confirmation',

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
                'customer-shipping-confirmation',

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
            'Shipping confirmation email failed.',
            error,
        );

        return 'failed';
    }
}