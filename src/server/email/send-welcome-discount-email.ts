import {
    getStore,
} from '@netlify/blobs';

import {
    Resend,
} from 'resend';

import type {
    MarketingEmailDataMode,
    MarketingEmailDeliveryRecord,
} from '../../types/email';

import type {
    NewsletterLeadRecord,
} from '../../types/newsletter';

import {
    getWelcomeDiscountRecord,
    markWelcomeDiscountEmailSent,
    markWelcomeDiscountFailure,
    validateWelcomeDiscountEmailHash,
} from '../discounts/welcome-discount-store';

import {
    getMarketingEmailRuntimeConfig,
} from './marketing';

import {
    buildNewsletterUnsubscribeUrl,
} from './unsubscribe';

import {
    buildWelcomeDiscountEmail,
} from './welcome-discount-template';

const MAXIMUM_ERROR_MESSAGE_LENGTH =
    500;

export type SendWelcomeDiscountEmailResult =
    | {
        outcome: 'sent';

        delivery: MarketingEmailDeliveryRecord;
    }
    | {
        outcome: 'skipped';

        reason: string;
    };

function getNewsletterLeadStore(
    dataMode: MarketingEmailDataMode,
) {
    return getStore(
        `maxipawz-newsletter-leads-${dataMode}`,
        {
            consistency:
                'strong',
        },
    );
}

function getMarketingDeliveryStore(
    dataMode: MarketingEmailDataMode,
) {
    return getStore(
        `maxipawz-marketing-email-deliveries-${dataMode}`,
        {
            consistency:
                'strong',
        },
    );
}

function getNewsletterLeadKey(
    emailHash: string,
): string {
    return `email/${emailHash}`;
}

function getDeliveryKey(
    emailHash: string,
): string {
    return `welcome-discount/${emailHash}`;
}

function getSafeErrorMessage(
    error: unknown,
): string {
    if (
        error instanceof
        Error
    ) {
        return error.message.slice(
            0,
            MAXIMUM_ERROR_MESSAGE_LENGTH,
        );
    }

    return 'Unknown welcome-discount email delivery error.';
}

async function getNewsletterLead(
    emailHash: string,
    dataMode: MarketingEmailDataMode,
): Promise<NewsletterLeadRecord | null> {
    const store =
        getNewsletterLeadStore(
            dataMode,
        );

    return (await store.get(
        getNewsletterLeadKey(
            emailHash,
        ),
        {
            type:
                'json',
        },
    )) as NewsletterLeadRecord | null;
}

async function getDeliveryRecord(
    emailHash: string,
    dataMode: MarketingEmailDataMode,
): Promise<MarketingEmailDeliveryRecord | null> {
    const store =
        getMarketingDeliveryStore(
            dataMode,
        );

    return (await store.get(
        getDeliveryKey(
            emailHash,
        ),
        {
            type:
                'json',
        },
    )) as MarketingEmailDeliveryRecord | null;
}

async function saveDeliveryRecord(
    record:
        MarketingEmailDeliveryRecord,
): Promise<void> {
    const store =
        getMarketingDeliveryStore(
            record.dataMode,
        );

    await store.setJSON(
        getDeliveryKey(
            record.emailHash,
        ),
        record,
    );
}

export async function sendWelcomeDiscountEmail(
    emailHash: string,
    dataMode: MarketingEmailDataMode,
): Promise<SendWelcomeDiscountEmailResult> {
    const normalizedEmailHash =
        validateWelcomeDiscountEmailHash(
            emailHash,
        );

    const config =
        getMarketingEmailRuntimeConfig();

    if (
        config.mode !==
        dataMode
    ) {
        throw new Error(
            'The welcome-discount email data mode does not match the configured marketing environment.',
        );
    }

    if (
        !config.enabled
    ) {
        return {
            outcome:
                'skipped',

            reason:
                'Marketing email is currently disabled.',
        };
    }

    const existingDelivery =
        await getDeliveryRecord(
            normalizedEmailHash,
            dataMode,
        );

    if (
        existingDelivery?.status ===
        'sent'
    ) {
        return {
            outcome:
                'sent',

            delivery:
                existingDelivery,
        };
    }

    const lead =
        await getNewsletterLead(
            normalizedEmailHash,
            dataMode,
        );

    if (
        !lead
    ) {
        throw new Error(
            'The newsletter lead for the welcome discount could not be found.',
        );
    }

    if (
        lead.emailHash !==
        normalizedEmailHash
    ) {
        throw new Error(
            'The newsletter lead does not match the welcome-discount hash.',
        );
    }

    /*
     * The discount email is part of the Maxi Pawz marketing
     * subscription flow.
     *
     * Always re-read the current consent immediately before
     * sending. A previously created Stripe promotion never grants
     * permission to send marketing email by itself.
     */
    if (
        !lead.marketingConsent
    ) {
        return {
            outcome:
                'skipped',

            reason:
                'The newsletter lead does not have active marketing consent.',
        };
    }

    if (
        lead.resendSyncStatus !==
        'synced'
    ) {
        throw new Error(
            'The newsletter lead must be synchronized with Resend before the welcome-discount email can be sent.',
        );
    }

    const discount =
        await getWelcomeDiscountRecord(
            normalizedEmailHash,
            dataMode,
        );

    if (
        !discount
    ) {
        throw new Error(
            'The welcome-discount record could not be found.',
        );
    }

    if (
        !discount.promotionCode ||
        !discount.stripeCouponId ||
        !discount.stripePromotionCodeId
    ) {
        throw new Error(
            'The welcome discount must have a Stripe promotion before its email can be sent.',
        );
    }

    const unsubscribeUrl =
        buildNewsletterUnsubscribeUrl(
            lead.email,
        );

    const content =
        buildWelcomeDiscountEmail({
            promotionCode:
                discount.promotionCode,

            discountPercent:
                discount.discountPercent,

            testMode:
                dataMode ===
                'test',

            mailingAddress:
                config.mailingAddress,

            unsubscribeUrl,
        });

    const resend =
        new Resend(
            config.apiKey,
        );

    const from =
        `${config.fromName} <${config.fromEmail}>`;

    /*
     * Test mode always routes the actual message to the controlled
     * marketing sandbox inbox.
     *
     * intendedRecipient remains the real submitted lead so the
     * delivery audit clearly records both values.
     */
    const intendedRecipient =
        lead.email;

    const recipient =
        dataMode ===
            'test'
            ? config.sandboxRecipientEmail
            : intendedRecipient;

    if (
        !recipient
    ) {
        throw new Error(
            'A controlled marketing sandbox recipient is required in test mode.',
        );
    }

    const now =
        new Date().toISOString();

    const attemptCount =
        (existingDelivery?.attemptCount ??
            0) +
        1;

    try {
        const result =
            await resend.emails.send(
                {
                    from,

                    to:
                        recipient,

                    replyTo:
                        config.replyToEmail,

                    subject:
                        content.subject,

                    html:
                        content.html,

                    text:
                        content.text,

                    headers: {
                        'List-Unsubscribe':
                            `<${unsubscribeUrl}>`,

                        'List-Unsubscribe-Post':
                            'List-Unsubscribe=One-Click',
                    },

                    tags: [
                        {
                            name:
                                'category',

                            value:
                                'welcome-discount',
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
                                dataMode,
                        },

                        {
                            name:
                                'lead_hash',

                            value:
                                normalizedEmailHash,
                        },
                    ],
                },

                {
                    idempotencyKey:
                        `welcome-discount/${dataMode}/${normalizedEmailHash}`,
                },
            );

        if (
            result.error
        ) {
            throw new Error(
                result.error.message,
            );
        }

        if (
            !result.data?.id
        ) {
            throw new Error(
                'Resend did not return an email ID for the welcome-discount email.',
            );
        }

        const record:
            MarketingEmailDeliveryRecord = {
            version:
                1,

            kind:
                'welcome-discount',

            emailHash:
                normalizedEmailHash,

            dataMode,

            intendedRecipient,

            recipient,

            status:
                'sent',

            provider:
                'resend',

            providerMessageId:
                result.data.id,

            attemptCount,

            createdAt:
                existingDelivery?.createdAt ??
                now,

            updatedAt:
                now,
        };

        /*
         * Persist the generic marketing-email audit first.
         *
         * The discount record is then updated with the same Resend ID.
         * Resend's idempotency key makes a later retry safe if either
         * storage write fails after the provider accepted the message.
         */
        await saveDeliveryRecord(
            record,
        );

        await markWelcomeDiscountEmailSent(
            normalizedEmailHash,
            dataMode,
            result.data.id,
        );

        return {
            outcome:
                'sent',

            delivery:
                record,
        };
    } catch (
    error
    ) {
        const record:
            MarketingEmailDeliveryRecord = {
            version:
                1,

            kind:
                'welcome-discount',

            emailHash:
                normalizedEmailHash,

            dataMode,

            intendedRecipient,

            recipient,

            status:
                'failed',

            provider:
                'resend',

            attemptCount,

            lastError:
                getSafeErrorMessage(
                    error,
                ),

            createdAt:
                existingDelivery?.createdAt ??
                now,

            updatedAt:
                now,
        };

        try {
            await saveDeliveryRecord(
                record,
            );
        } catch (
        persistenceError
        ) {
            console.error(
                'The welcome-discount email failure audit could not be persisted.',
                {
                    emailHash:
                        normalizedEmailHash,

                    dataMode,

                    persistenceError,
                },
            );
        }

        try {
            await markWelcomeDiscountFailure(
                normalizedEmailHash,
                dataMode,
                'email-delivery',
                error,
            );
        } catch (
        persistenceError
        ) {
            console.error(
                'The welcome-discount email failure could not be persisted on the incentive record.',
                {
                    emailHash:
                        normalizedEmailHash,

                    dataMode,

                    persistenceError,
                },
            );
        }

        throw error;
    }
}