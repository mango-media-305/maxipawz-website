import {
    createHash,
    createHmac,
    timingSafeEqual,
} from 'node:crypto';

import {
    getStore,
} from '@netlify/blobs';

import {
    Resend,
} from 'resend';

import type {
    NewsletterLeadRecord,
    NewsletterResendSyncStatus,
} from '../../types/newsletter';

import {
    buildEmailSiteUrl,
} from './branding';

const EMAIL_PATTERN =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMAIL_HASH_PATTERN =
    /^[0-9a-f]{64}$/;

const TOKEN_SIGNATURE_PATTERN =
    /^[A-Za-z0-9_-]{43}$/;

const TOKEN_VERSION =
    'v1';

const MAXIMUM_ERROR_MESSAGE_LENGTH =
    500;

type NewsletterDataMode =
    | 'test'
    | 'live';

interface NewsletterUnsubscribeRuntimeConfig {
    dataMode:
        NewsletterDataMode;

    contactsApiKey: string;

    topicId: string;

    unsubscribeSecret: string;
}

interface ParsedNewsletterUnsubscribeToken {
    emailHash: string;

    dataMode:
        NewsletterDataMode;
}

interface ResendApiErrorLike {
    name?: unknown;

    statusCode?: unknown;
}

export interface NewsletterUnsubscribePreview {
    emailHash: string;

    alreadyUnsubscribed: boolean;
}

export interface NewsletterUnsubscribeResult {
    unsubscribed: true;

    alreadyUnsubscribed: boolean;

    resendSyncStatus:
        NewsletterResendSyncStatus;
}

export type NewsletterUnsubscribeErrorCode =
    | 'invalid-token'
    | 'lead-not-found'
    | 'configuration-error';

export class NewsletterUnsubscribeError
    extends Error {
    readonly code:
        NewsletterUnsubscribeErrorCode;

    readonly status:
        number;

    constructor(
        code:
            NewsletterUnsubscribeErrorCode,

        status: number,

        message: string,
    ) {
        super(
            message,
        );

        this.name =
            'NewsletterUnsubscribeError';

        this.code =
            code;

        this.status =
            status;
    }
}

function getRequiredEnvironmentVariable(
    name: string,
): string {
    const value =
        process.env[
            name
        ]?.trim();

    if (!value) {
        throw new NewsletterUnsubscribeError(
            'configuration-error',
            503,
            `${name} is missing.`,
        );
    }

    return value;
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

    throw new NewsletterUnsubscribeError(
        'configuration-error',
        503,
        'NEWSLETTER_DATA_MODE must be explicitly configured as "test" or "live".',
    );
}

function getRuntimeConfig():
    NewsletterUnsubscribeRuntimeConfig {
    const contactsApiKey =
        getRequiredEnvironmentVariable(
            'RESEND_CONTACTS_API_KEY',
        );

    if (
        !contactsApiKey.startsWith(
            're_',
        )
    ) {
        throw new NewsletterUnsubscribeError(
            'configuration-error',
            503,
            'RESEND_CONTACTS_API_KEY is invalid.',
        );
    }

    const topicId =
        getRequiredEnvironmentVariable(
            'RESEND_NEWSLETTER_TOPIC_ID',
        );

    const unsubscribeSecret =
        getRequiredEnvironmentVariable(
            'NEWSLETTER_UNSUBSCRIBE_SECRET',
        );

    if (
        unsubscribeSecret.length <
        32
    ) {
        throw new NewsletterUnsubscribeError(
            'configuration-error',
            503,
            'NEWSLETTER_UNSUBSCRIBE_SECRET must contain at least 32 characters.',
        );
    }

    return {
        dataMode:
            getNewsletterDataMode(),

        contactsApiKey,

        topicId,

        unsubscribeSecret,
    };
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

function getLeadKey(
    emailHash: string,
): string {
    return `email/${emailHash}`;
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
        throw new NewsletterUnsubscribeError(
            'invalid-token',
            400,
            'The unsubscribe email address is invalid.',
        );
    }

    return normalized;
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

    return 'Unknown unsubscribe synchronization error.';
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

function buildTokenPayload(
    dataMode:
        NewsletterDataMode,

    emailHash: string,
): string {
    return [
        TOKEN_VERSION,
        dataMode,
        emailHash,
    ].join(
        '.',
    );
}

function signTokenPayload(
    payload: string,

    secret: string,
): string {
    return createHmac(
        'sha256',
        secret,
    )
        .update(
            payload,
            'utf8',
        )
        .digest(
            'base64url',
        );
}

function signaturesMatch(
    expected: string,

    received: string,
): boolean {
    if (
        expected.length !==
        received.length
    ) {
        return false;
    }

    const expectedBuffer =
        Buffer.from(
            expected,
            'utf8',
        );

    const receivedBuffer =
        Buffer.from(
            received,
            'utf8',
        );

    if (
        expectedBuffer.length !==
        receivedBuffer.length
    ) {
        return false;
    }

    return timingSafeEqual(
        expectedBuffer,
        receivedBuffer,
    );
}

function parseToken(
    token: string,

    config:
        NewsletterUnsubscribeRuntimeConfig,
): ParsedNewsletterUnsubscribeToken {
    const parts =
        token
            .trim()
            .split(
                '.',
            );

    if (
        parts.length !==
        4
    ) {
        throw new NewsletterUnsubscribeError(
            'invalid-token',
            400,
            'The unsubscribe link is invalid.',
        );
    }

    const [
        version,
        mode,
        emailHash,
        signature,
    ] =
        parts;

    if (
        version !==
        TOKEN_VERSION ||
        (
            mode !==
            'test' &&
            mode !==
            'live'
        ) ||
        !emailHash ||
        !EMAIL_HASH_PATTERN.test(
            emailHash,
        ) ||
        !signature ||
        !TOKEN_SIGNATURE_PATTERN.test(
            signature,
        )
    ) {
        throw new NewsletterUnsubscribeError(
            'invalid-token',
            400,
            'The unsubscribe link is invalid.',
        );
    }

    if (
        mode !==
        config.dataMode
    ) {
        throw new NewsletterUnsubscribeError(
            'invalid-token',
            400,
            'The unsubscribe link does not belong to this environment.',
        );
    }

    const payload =
        buildTokenPayload(
            mode,
            emailHash,
        );

    const expectedSignature =
        signTokenPayload(
            payload,
            config.unsubscribeSecret,
        );

    if (
        !signaturesMatch(
            expectedSignature,
            signature,
        )
    ) {
        throw new NewsletterUnsubscribeError(
            'invalid-token',
            400,
            'The unsubscribe link signature is invalid.',
        );
    }

    return {
        emailHash,

        dataMode:
            mode,
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

async function createResendOptOutContact(
    resend:
        Resend,

    config:
        NewsletterUnsubscribeRuntimeConfig,

    lead:
        NewsletterLeadRecord,
): Promise<string> {
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
                    true,

                topics: [
                    {
                        id:
                            config.topicId,

                        subscription:
                            'opt_out',
                    },
                ],
            });

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
        !result.data?.id
    ) {
        throw new Error(
            'Resend created the opt-out Contact but did not return a Contact ID.',
        );
    }

    return result
        .data
        .id;
}

async function updateResendOptOutContact(
    resend:
        Resend,

    config:
        NewsletterUnsubscribeRuntimeConfig,

    contactId: string,
): Promise<string> {
    const contactResult =
        await resend
            .contacts
            .update({
                id:
                    contactId,

                unsubscribed:
                    true,
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

                        subscription:
                            'opt_out',
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

async function syncOptOutToResend(
    config:
        NewsletterUnsubscribeRuntimeConfig,

    lead:
        NewsletterLeadRecord,
): Promise<string> {
    const resend =
        new Resend(
            config.contactsApiKey,
        );

    /*
     * Look the Contact up by email instead of trusting an older stored
     * provider ID. This keeps the unsubscribe operation resilient if
     * the Resend Contact was recreated outside Maxi Pawz.
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
            return await createResendOptOutContact(
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
            'Resend returned an opt-out Contact without a Contact ID.',
        );
    }

    return await updateResendOptOutContact(
        resend,
        config,
        lookupResult
            .data
            .id,
    );
}

async function getLeadFromToken(
    token: string,
): Promise<{
    config:
        NewsletterUnsubscribeRuntimeConfig;

    lead:
        NewsletterLeadRecord;

    parsed:
        ParsedNewsletterUnsubscribeToken;
}> {
    const config =
        getRuntimeConfig();

    const parsed =
        parseToken(
            token,
            config,
        );

    const lead =
        await getLead(
            parsed.dataMode,
            parsed.emailHash,
        );

    if (!lead) {
        throw new NewsletterUnsubscribeError(
            'lead-not-found',
            404,
            'The unsubscribe subscription record could not be found.',
        );
    }

    if (
        lead.emailHash !==
        parsed.emailHash
    ) {
        throw new NewsletterUnsubscribeError(
            'invalid-token',
            400,
            'The unsubscribe subscription record does not match the link.',
        );
    }

    return {
        config,

        lead,

        parsed,
    };
}

/*
 * Builds the unsubscribe URL used by marketing email.
 *
 * The token deliberately contains no plain-text email address.
 *
 * Tokens do not expire automatically. An unsubscribe mechanism should
 * remain usable long after an individual message was delivered, and the
 * action granted by this token can only reduce marketing permission.
 */
export function buildNewsletterUnsubscribeUrl(
    emailValue: string,
): string {
    const config =
        getRuntimeConfig();

    const email =
        normalizeEmail(
            emailValue,
        );

    const emailHash =
        hashEmail(
            email,
        );

    const payload =
        buildTokenPayload(
            config.dataMode,
            emailHash,
        );

    const signature =
        signTokenPayload(
            payload,
            config.unsubscribeSecret,
        );

    const token =
        `${payload}.${signature}`;

    const url =
        buildEmailSiteUrl(
            '/api/newsletter/unsubscribe',
        );

    const parsedUrl =
        new URL(
            url,
        );

    parsedUrl.searchParams.set(
        'token',
        token,
    );

    return parsedUrl.toString();
}

/*
 * Used by the initial GET request from an email.
 *
 * This verifies the signature and confirms that the matching Maxi Pawz
 * lead exists, but it intentionally does not change the subscription.
 * Email-security scanners often follow GET links automatically.
 */
export async function inspectNewsletterUnsubscribeToken(
    token: string,
): Promise<NewsletterUnsubscribePreview> {
    const {
        lead,
        parsed,
    } =
        await getLeadFromToken(
            token,
        );

    return {
        emailHash:
            parsed.emailHash,

        alreadyUnsubscribed:
            !lead
                .marketingConsent,
    };
}

/*
 * Executes the actual unsubscribe action.
 *
 * The internal Maxi Pawz preference is written first. Therefore a
 * temporary Resend outage can never cause Maxi Pawz to forget that the
 * customer opted out.
 */
export async function unsubscribeNewsletterLeadByToken(
    token: string,
): Promise<NewsletterUnsubscribeResult> {
    const {
        config,
        lead,
        parsed,
    } =
        await getLeadFromToken(
            token,
        );

    const alreadyUnsubscribed =
        !lead
            .marketingConsent;

    const now =
        new Date()
            .toISOString();

    const pendingRecord:
        NewsletterLeadRecord = {
        ...lead,

        marketingConsent:
            false,

        marketingPreferenceMethod:
            'unsubscribe-link',

        marketingPreferenceUpdatedAt:
            now,

        lastOptOutAt:
            now,

        resendSyncStatus:
            'pending',

        lastError:
            undefined,

        updatedAt:
            now,
    };

    /*
     * This is the authoritative Maxi Pawz opt-out write.
     *
     * submissionCount and lastSubmittedAt intentionally remain unchanged
     * because clicking an unsubscribe link is not a Join the Pack form
     * submission.
     */
    await saveLead(
        parsed.dataMode,
        pendingRecord,
    );

    try {
        const resendContactId =
            await syncOptOutToResend(
                config,
                pendingRecord,
            );

        const syncedAt =
            new Date()
                .toISOString();

        await saveLead(
            parsed.dataMode,
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
            unsubscribed:
                true,

            alreadyUnsubscribed,

            resendSyncStatus:
                'synced',
        };
    } catch (error) {
        const failedAt =
            new Date()
                .toISOString();

        await saveLead(
            parsed.dataMode,
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
            'Newsletter unsubscribe was recorded locally, but Resend synchronization failed.',
            {
                emailHash:
                    parsed.emailHash,

                dataMode:
                    parsed.dataMode,

                error,
            },
        );

        /*
         * The user remains unsubscribed in Maxi Pawz even if the provider
         * synchronization is temporarily unavailable.
         *
         * Future Maxi Pawz marketing sends must always honor the internal
         * marketingConsent flag before sending.
         */
        return {
            unsubscribed:
                true,

            alreadyUnsubscribed,

            resendSyncStatus:
                'failed',
        };
    }
}