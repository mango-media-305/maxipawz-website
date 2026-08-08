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
    getMarketingEmailRuntimeConfig,
} from './marketing';

import {
    buildNewsletterUnsubscribeUrl,
} from './unsubscribe';

import {
    buildWelcomeToPackEmail,
} from './welcome-email-template';

const EMAIL_HASH_PATTERN =
    /^[0-9a-f]{64}$/;

const MAXIMUM_ERROR_MESSAGE_LENGTH =
    500;

export type SendWelcomeEmailResult =
    | {
        outcome:
            'sent';

        delivery:
            MarketingEmailDeliveryRecord;
    }
    | {
        outcome:
            'skipped';

        reason:
            string;
    };

function validateEmailHash(
    emailHash: string,
): string {
    const normalized =
        emailHash
            .trim()
            .toLowerCase();

    if (
        !EMAIL_HASH_PATTERN.test(
            normalized,
        )
    ) {
        throw new Error(
            'The welcome email contains an invalid email hash.',
        );
    }

    return normalized;
}

function getNewsletterLeadStore(
    dataMode:
        MarketingEmailDataMode,
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
    dataMode:
        MarketingEmailDataMode,
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
    return `welcome-to-the-pack/${emailHash}`;
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

    return 'Unknown welcome-email delivery error.';
}

async function getNewsletterLead(
    emailHash: string,

    dataMode:
        MarketingEmailDataMode,
): Promise<NewsletterLeadRecord | null> {
    const store =
        getNewsletterLeadStore(
            dataMode,
        );

    return await store.get(
        getNewsletterLeadKey(
            emailHash,
        ),
        {
            type:
                'json',
        },
    ) as
        | NewsletterLeadRecord
        | null;
}

async function getDeliveryRecord(
    emailHash: string,

    dataMode:
        MarketingEmailDataMode,
): Promise<MarketingEmailDeliveryRecord | null> {
    const store =
        getMarketingDeliveryStore(
            dataMode,
        );

    return await store.get(
        getDeliveryKey(
            emailHash,
        ),
        {
            type:
                'json',
        },
    ) as
        | MarketingEmailDeliveryRecord
        | null;
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

export async function sendWelcomeEmail(
    emailHash: string,

    dataMode:
        MarketingEmailDataMode,
): Promise<SendWelcomeEmailResult> {
    const normalizedEmailHash =
        validateEmailHash(
            emailHash,
        );

    const config =
        getMarketingEmailRuntimeConfig();

    if (
        config.mode !==
        dataMode
    ) {
        throw new Error(
            'The welcome-email data mode does not match the configured marketing environment.',
        );
    }

    if (!config.enabled) {
        return {
            outcome:
                'skipped',

            reason:
                'Marketing email is currently disabled.',
        };
    }

    /*
     * The permanent delivery record is our long-term idempotency layer.
     */
    const existingDelivery =
        await getDeliveryRecord(
            normalizedEmailHash,
            dataMode,
        );

    if (
        existingDelivery
            ?.status ===
        'sent'
    ) {
        return {
            outcome:
                'sent',

            delivery:
                existingDelivery,
        };
    }

    /*
     * Read the most recent lead immediately before the send.
     *
     * The original signup state stored in the job is never trusted for
     * marketing permission because the visitor may have unsubscribed
     * while the background job was waiting.
     */
    const lead =
        await getNewsletterLead(
            normalizedEmailHash,
            dataMode,
        );

    if (!lead) {
        throw new Error(
            'The newsletter lead for the welcome email could not be found.',
        );
    }

    if (
        lead.emailHash !==
        normalizedEmailHash
    ) {
        throw new Error(
            'The newsletter lead does not match the welcome-email hash.',
        );
    }

    if (
        !lead.marketingConsent
    ) {
        return {
            outcome:
                'skipped',

            reason:
                'The newsletter lead no longer has active marketing consent.',
        };
    }

    if (
        lead.resendSyncStatus !==
        'synced'
    ) {
        throw new Error(
            'The newsletter lead must be synchronized with Resend before a welcome email can be sent.',
        );
    }

    const unsubscribeUrl =
        buildNewsletterUnsubscribeUrl(
            lead.email,
        );

    const content =
        buildWelcomeToPackEmail({
            firstName:
                lead.firstName,

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

    const intendedRecipient =
        lead.email;

    const recipient =
        intendedRecipient;

    const now =
        new Date()
            .toISOString();

    const attemptCount =
        (
            existingDelivery
                ?.attemptCount ??
            0
        ) +
        1;

    try {
        const result =
            await resend
                .emails
                .send(
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

                        /*
                         * RFC 8058-style one-click unsubscribe support.
                         *
                         * A normal browser GET still shows our confirmation
                         * page. Email providers may POST directly to the same
                         * signed URL for their native unsubscribe control.
                         */
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
                                    'welcome-to-the-pack',
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
                            `welcome-to-the-pack/${dataMode}/${normalizedEmailHash}`,
                    },
                );

        if (
            result.error
        ) {
            throw new Error(
                result
                    .error
                    .message,
            );
        }

        if (
            !result
                .data
                ?.id
        ) {
            throw new Error(
                'Resend did not return an email ID for the welcome email.',
            );
        }

        const record:
            MarketingEmailDeliveryRecord = {
            version: 1,

            kind:
                'welcome-to-the-pack',

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
                result
                    .data
                    .id,

            attemptCount,

            createdAt:
                existingDelivery
                    ?.createdAt ??
                now,

            updatedAt:
                now,
        };

        await saveDeliveryRecord(
            record,
        );

        return {
            outcome:
                'sent',

            delivery:
                record,
        };
    } catch (error) {
        const record:
            MarketingEmailDeliveryRecord = {
            version: 1,

            kind:
                'welcome-to-the-pack',

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
                existingDelivery
                    ?.createdAt ??
                now,

            updatedAt:
                now,
        };

        await saveDeliveryRecord(
            record,
        );

        throw error;
    }
}