import {
    timingSafeEqual,
} from 'node:crypto';

import type {
    Config,
} from '@netlify/functions';

import {
    getMarketingEmailRuntimeConfig,
} from '../../src/server/email/marketing';

import {
    sendWelcomeEmail,
} from '../../src/server/email/send-welcome-email';

import {
    getWelcomeEmailJob,
    markWelcomeEmailJobCompleted,
    markWelcomeEmailJobFailed,
    markWelcomeEmailJobProcessing,
    markWelcomeEmailJobSkipped,
} from '../../src/server/email/welcome-email-jobs';

import type {
    MarketingEmailDataMode,
} from '../../src/types/email';

const EMAIL_HASH_PATTERN =
    /^[0-9a-f]{64}$/;

interface WelcomeEmailJobPayload {
    emailHash: string;

    dataMode:
    MarketingEmailDataMode;
}

function isRecord(
    value: unknown,
): value is Record<
    string,
    unknown
> {
    return (
        typeof value ===
        'object' &&
        value !==
        null &&
        !Array.isArray(
            value,
        )
    );
}

function isWelcomeEmailJobPayload(
    value: unknown,
): value is WelcomeEmailJobPayload {
    if (
        !isRecord(
            value,
        )
    ) {
        return false;
    }

    return (
        typeof value.emailHash ===
        'string' &&
        EMAIL_HASH_PATTERN.test(
            value.emailHash,
        ) &&
        (
            value.dataMode ===
            'test' ||
            value.dataMode ===
            'live'
        )
    );
}

function getInternalFunctionSecret():
    string {
    const secret =
        process.env
            .MAXIPAWZ_INTERNAL_FUNCTION_SECRET
            ?.trim();

    if (
        !secret ||
        secret.length <
        32
    ) {
        throw new Error(
            'MAXIPAWZ_INTERNAL_FUNCTION_SECRET is missing or too short.',
        );
    }

    return secret;
}

function secretsMatch(
    provided:
        string
        | null,

    expected: string,
): boolean {
    if (!provided) {
        return false;
    }

    const providedBuffer =
        Buffer.from(
            provided,
            'utf8',
        );

    const expectedBuffer =
        Buffer.from(
            expected,
            'utf8',
        );

    if (
        providedBuffer.length !==
        expectedBuffer.length
    ) {
        return false;
    }

    return timingSafeEqual(
        providedBuffer,
        expectedBuffer,
    );
}

async function parsePayload(
    request:
        Request,
): Promise<WelcomeEmailJobPayload | null> {
    try {
        const value:
            unknown =
            await request.json();

        return isWelcomeEmailJobPayload(
            value,
        )
            ? {
                emailHash:
                    value
                        .emailHash
                        .toLowerCase(),

                dataMode:
                    value
                        .dataMode,
            }
            : null;
    } catch {
        return null;
    }
}

export default async function handler(
    request:
        Request,
): Promise<void> {
    let expectedSecret:
        string;

    try {
        expectedSecret =
            getInternalFunctionSecret();
    } catch (error) {
        console.error(
            'Welcome-email background function configuration failed.',
            error,
        );

        throw error;
    }

    if (
        !secretsMatch(
            request
                .headers
                .get(
                    'x-maxipawz-internal-secret',
                ),
            expectedSecret,
        )
    ) {
        console.warn(
            'Rejected an unauthorized welcome-email background invocation.',
        );

        return;
    }

    const payload =
        await parsePayload(
            request,
        );

    if (!payload) {
        console.warn(
            'Rejected an invalid welcome-email background payload.',
        );

        return;
    }

    const {
        emailHash,
        dataMode,
    } =
        payload;

    const existingJob =
        await getWelcomeEmailJob(
            emailHash,
            dataMode,
        );

    if (!existingJob) {
        console.warn(
            'Welcome-email background invocation skipped because the job does not exist.',
            {
                emailHash,

                dataMode,
            },
        );

        return;
    }

    if (
        existingJob.status ===
        'completed' ||
        existingJob.status ===
        'skipped'
    ) {
        return;
    }

    await markWelcomeEmailJobProcessing(
        emailHash,
        dataMode,
    );

    try {
        const config =
            getMarketingEmailRuntimeConfig();

        if (
            config.mode !==
            dataMode
        ) {
            throw new Error(
                'The welcome-email job mode does not match the configured marketing environment.',
            );
        }

        /*
         * Marketing email is intentionally allowed to be disabled while
         * this infrastructure is being built.
         *
         * A skipped job may be queued again later after marketing is
         * enabled.
         */
        if (!config.enabled) {
            await markWelcomeEmailJobSkipped(
                emailHash,
                dataMode,
                'Marketing email is currently disabled.',
            );

            return;
        }

        const result =
            await sendWelcomeEmail(
                emailHash,
                dataMode,
            );

        if (
            result.outcome ===
            'skipped'
        ) {
            await markWelcomeEmailJobSkipped(
                emailHash,
                dataMode,
                result.reason,
            );

            return;
        }

        await markWelcomeEmailJobCompleted(
            emailHash,
            dataMode,
        );
    } catch (error) {
        try {
            await markWelcomeEmailJobFailed(
                emailHash,
                dataMode,
                error,
            );
        } catch (recordError) {
            console.error(
                'The welcome-email job failure could not be recorded.',
                recordError,
            );
        }

        console.error(
            'Welcome-email background processing failed.',
            {
                emailHash,

                dataMode,

                error,
            },
        );

        /*
         * Preserve the same retry behavior used by the paid-order
         * background email workflow.
         */
        throw error;
    }
}

export const config:
    Config = {
    background:
        true,

    method:
        'POST',

    path:
        '/api/internal/send-welcome-email',
};