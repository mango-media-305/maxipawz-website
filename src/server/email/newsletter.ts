import {
    createHash,
} from 'node:crypto';

import {
    getStore,
} from '@netlify/blobs';

import {
    Resend,
} from 'resend';

import type {
    NewsletterLeadInput,
    NewsletterLeadRecord,
    NewsletterMarketingPreferenceMethod,
    NewsletterSource,
    NewsletterSubmissionResult,
} from '../../types/newsletter';

const EMAIL_PATTERN =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAXIMUM_ERROR_MESSAGE_LENGTH =
    500;

/*
 * Increment this whenever the wording presented beside the
 * marketing checkbox materially changes.
 */
const CONSENT_TEXT_VERSION =
    'join-the-pack-email-marketing-v1-2026-08-07';

type NewsletterDataMode =
    | 'test'
    | 'live';

interface NewsletterRuntimeConfig {
    enabled: boolean;

    contactsApiKey: string;

    topicId: string;

    dataMode:
        NewsletterDataMode;
}

interface ResendApiErrorLike {
    name?: unknown;

    message?: unknown;

    statusCode?: unknown;
}

export type NewsletterErrorCode =
    | 'disabled'
    | 'invalid-email'
    | 'invalid-first-name'
    | 'configuration-error'
    | 'provider-error';

export class NewsletterError
    extends Error {
    readonly code:
        NewsletterErrorCode;

    readonly status:
        number;

    constructor(
        code:
            NewsletterErrorCode,

        status: number,

        message: string,
    ) {
        super(
            message,
        );

        this.name =
            'NewsletterError';

        this.code =
            code;

        this.status =
            status;
    }
}

function parseBoolean(
    value:
        string
        | undefined,

    fallback:
        boolean,
): boolean {
    const normalized =
        value
            ?.trim()
            .toLowerCase();

    if (
        normalized ===
        'true'
    ) {
        return true;
    }

    if (
        normalized ===
        'false'
    ) {
        return false;
    }

    return fallback;
}

function getNewsletterDataMode():
    NewsletterDataMode {
    const configured =
        process.env
            .NEWSLETTER_DATA_MODE
            ?.trim()
            .toLowerCase();

    if (
        configured ===
        'test' ||
        configured ===
        'live'
    ) {
        return configured;
    }

    throw new NewsletterError(
        'configuration-error',
        503,
        'NEWSLETTER_DATA_MODE must be explicitly configured as "test" or "live".',
    );
}

function getLeadStore(
    dataMode:
        NewsletterDataMode,
) {
    return getStore(
        `maxipawz-newsletter-leads-${dataMode}`,
        {
            consistency:
                'strong',
        },
    );
}

function hashEmail(
    email: string,
): string {
    return createHash(
        'sha256',
    )
        .update(
            email,
            'utf8',
        )
        .digest(
            'hex',
        );
}

function getLeadKey(
    emailHash: string,
): string {
    return `email/${emailHash}`;
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

    if (
        typeof error ===
        'object' &&
        error !==
        null &&
        'message' in
            error
    ) {
        const message =
            (
                error as {
                    message?: unknown;
                }
            )
                .message;

        if (
            typeof message ===
            'string'
        ) {
            return message.slice(
                0,
                MAXIMUM_ERROR_MESSAGE_LENGTH,
            );
        }
    }

    return 'Unknown newsletter synchronization error.';
}

function isResendNotFoundError(
    error: unknown,
): boolean {
    if (
        typeof error !==
            'object' ||
        error ===
            null
    ) {
        return false;
    }

    const candidate =
        error as
        ResendApiErrorLike;

    return (
        candidate
            .statusCode ===
            404 ||
        candidate
            .name ===
            'not_found'
    );
}

function normalizeEmail(
    value: string,
): string {
    const normalized =
        value
            .trim()
            .toLowerCase();

    if (
        !normalized ||
        normalized.length >
            254 ||
        !EMAIL_PATTERN.test(
            normalized,
        )
    ) {
        throw new NewsletterError(
            'invalid-email',
            400,
            'Please enter a valid email address.',
        );
    }

    return normalized;
}

function normalizeFirstName(
    value:
        string
        | undefined,
): string | undefined {
    if (!value) {
        return undefined;
    }

    const normalized =
        value
            .trim()
            .replace(
                /\s+/g,
                ' ',
            );

    if (!normalized) {
        return undefined;
    }

    if (
        normalized.length >
        80
    ) {
        throw new NewsletterError(
            'invalid-first-name',
            400,
            'The first name is too long.',
        );
    }

    return normalized;
}

function getNewsletterRuntimeConfig():
    NewsletterRuntimeConfig {
    const enabled =
        parseBoolean(
            process.env
                .NEWSLETTER_SIGNUPS_ENABLED,
            false,
        );

    if (!enabled) {
        throw new NewsletterError(
            'disabled',
            503,
            'Newsletter signups are currently unavailable.',
        );
    }

    const contactsApiKey =
        process.env
            .RESEND_CONTACTS_API_KEY
            ?.trim();

    if (
        !contactsApiKey ||
        !contactsApiKey.startsWith(
            're_',
        )
    ) {
        throw new NewsletterError(
            'configuration-error',
            503,
            'RESEND_CONTACTS_API_KEY is missing or invalid.',
        );
    }

    const topicId =
        process.env
            .RESEND_NEWSLETTER_TOPIC_ID
            ?.trim();

    if (
        !topicId ||
        !UUID_PATTERN.test(
            topicId,
        )
    ) {
        throw new NewsletterError(
            'configuration-error',
            503,
            'RESEND_NEWSLETTER_TOPIC_ID is missing or invalid.',
        );
    }

    return {
        enabled,

        contactsApiKey,

        topicId,

        dataMode:
            getNewsletterDataMode(),
    };
}

async function getLead(
    dataMode:
        NewsletterDataMode,

    emailHash: string,
): Promise<NewsletterLeadRecord | null> {
    const store =
        getLeadStore(
            dataMode,
        );

    return await store.get(
        getLeadKey(
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

async function saveLead(
    dataMode:
        NewsletterDataMode,

    record:
        NewsletterLeadRecord,
): Promise<void> {
    const store =
        getLeadStore(
            dataMode,
        );

    await store.setJSON(
        getLeadKey(
            record.emailHash,
        ),
        record,
    );
}

function getPreferenceMethod(
    marketingConsent:
        boolean,
): NewsletterMarketingPreferenceMethod {
    return marketingConsent
        ? 'prechecked-checkbox-submission'
        : 'checkbox-unchecked-submission';
}

async function createResendContact(
    resend:
        Resend,

    config:
        NewsletterRuntimeConfig,

    lead:
        NewsletterLeadRecord,
): Promise<string> {
    const subscription =
        lead.marketingConsent
            ? 'opt_in'
            : 'opt_out';

    const result =
        await resend
            .contacts
            .create({
                email:
                    lead.email,

                ...(lead.firstName
                    ? {
                        firstName:
                            lead.firstName,
                    }
                    : {}),

                unsubscribed:
                    !lead
                        .marketingConsent,

                topics: [
                    {
                        id:
                            config.topicId,

                        subscription,
                    },
                ],
            });

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
            'Resend created the contact but did not return a contact ID.',
        );
    }

    return result
        .data
        .id;
}

async function updateResendContact(
    resend:
        Resend,

    config:
        NewsletterRuntimeConfig,

    lead:
        NewsletterLeadRecord,

    contactId: string,
): Promise<string> {
    const subscription =
        lead.marketingConsent
            ? 'opt_in'
            : 'opt_out';

    const contactResult =
        await resend
            .contacts
            .update({
                id:
                    contactId,

                unsubscribed:
                    !lead
                        .marketingConsent,
            });

    if (
        contactResult.error
    ) {
        throw new Error(
            contactResult
                .error
                .message,
        );
    }

    const topicResult =
        await resend
            .contacts
            .topics
            .update({
                id:
                    contactId,

                topics: [
                    {
                        id:
                            config.topicId,

                        subscription,
                    },
                ],
            });

    if (
        topicResult.error
    ) {
        throw new Error(
            topicResult
                .error
                .message,
        );
    }

    return (
        contactResult
            .data
            ?.id ??
        contactId
    );
}

async function syncLeadToResend(
    config:
        NewsletterRuntimeConfig,

    lead:
        NewsletterLeadRecord,
): Promise<string> {
    const resend =
        new Resend(
            config.contactsApiKey,
        );

    /*
     * Retrieve the Contact first.
     *
     * This avoids treating every create error as if it meant
     * "contact already exists".
     */
    const lookupResult =
        await resend
            .contacts
            .get({
                email:
                    lead.email,
            });

    if (
        lookupResult.error
    ) {
        if (
            isResendNotFoundError(
                lookupResult.error,
            )
        ) {
            return await createResendContact(
                resend,
                config,
                lead,
            );
        }

        throw new Error(
            lookupResult
                .error
                .message,
        );
    }

    if (
        !lookupResult.data?.id
    ) {
        throw new Error(
            'Resend returned a Contact without a contact ID.',
        );
    }

    return await updateResendContact(
        resend,
        config,
        lead,
        lookupResult
            .data
            .id,
    );
}

export function parseNewsletterLeadInput(
    emailValue: string,

    firstNameValue:
        string
        | undefined,

    marketingConsent:
        boolean,

    source:
        NewsletterSource =
        'homepage-join-the-pack',
): NewsletterLeadInput {
    return {
        email:
            normalizeEmail(
                emailValue,
            ),

        firstName:
            normalizeFirstName(
                firstNameValue,
            ),

        marketingConsent,

        source,
    };
}

export async function submitNewsletterLead(
    input:
        NewsletterLeadInput,
): Promise<NewsletterSubmissionResult> {
    const config =
        getNewsletterRuntimeConfig();

    const now =
        new Date()
            .toISOString();

    const emailHash =
        hashEmail(
            input.email,
        );

    const existing =
        await getLead(
            config.dataMode,
            emailHash,
        );

    const firstName =
        input.firstName ??
        existing
            ?.firstName;

    const becameOptedIn =
        input.marketingConsent &&
        existing
            ?.marketingConsent !==
        true;

    const becameOptedOut =
        !input.marketingConsent &&
        existing
            ?.marketingConsent !==
        false;

    const pendingRecord:
        NewsletterLeadRecord = {
        version: 1,

        email:
            input.email,

        emailHash,

        firstName,

        source:
            input.source,

        marketingConsent:
            input.marketingConsent,

        marketingPreferenceMethod:
            getPreferenceMethod(
                input.marketingConsent,
            ),

        consentTextVersion:
            CONSENT_TEXT_VERSION,

        firstSubmittedAt:
            existing
                ?.firstSubmittedAt ??
            now,

        lastSubmittedAt:
            now,

        marketingPreferenceUpdatedAt:
            now,

        lastOptInAt:
            becameOptedIn
                ? now
                : existing
                    ?.lastOptInAt,

        lastOptOutAt:
            becameOptedOut
                ? now
                : existing
                    ?.lastOptOutAt,

        submissionCount:
            (
                existing
                    ?.submissionCount ??
                0
            ) +
            1,

        resendContactId:
            existing
                ?.resendContactId,

        resendTopicId:
            config.topicId,

        resendSyncStatus:
            'pending',

        lastError:
            undefined,

        createdAt:
            existing
                ?.createdAt ??
            now,

        updatedAt:
            now,
    };

    /*
     * Save before talking to Resend.
     *
     * A temporary provider failure therefore cannot erase the lead
     * or the visitor's most recently submitted preference.
     */
    await saveLead(
        config.dataMode,
        pendingRecord,
    );

    try {
        const resendContactId =
            await syncLeadToResend(
                config,
                pendingRecord,
            );

        const syncedAt =
            new Date()
                .toISOString();

        await saveLead(
            config.dataMode,
            {
                ...pendingRecord,

                resendContactId,

                resendSyncStatus:
                    'synced',

                lastError:
                    undefined,

                updatedAt:
                    syncedAt,
            },
        );

        return {
            accepted:
                true,

            marketingConsent:
                input
                    .marketingConsent,

            resendSyncStatus:
                'synced',
        };
    } catch (error) {
        const failedAt =
            new Date()
                .toISOString();

        await saveLead(
            config.dataMode,
            {
                ...pendingRecord,

                resendSyncStatus:
                    'failed',

                lastError:
                    getSafeErrorMessage(
                        error,
                    ),

                updatedAt:
                    failedAt,
            },
        );

        console.error(
            'Newsletter lead was saved, but Resend synchronization failed.',
            {
                emailHash,

                dataMode:
                    config.dataMode,

                marketingConsent:
                    input
                        .marketingConsent,

                error,
            },
        );

        throw new NewsletterError(
            'provider-error',
            503,
            'Your information was saved, but your email preference could not be synchronized. Please try again.',
        );
    }
}