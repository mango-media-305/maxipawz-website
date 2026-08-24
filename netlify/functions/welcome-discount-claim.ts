import type {
    Config,
} from '@netlify/functions';

import {
    ensureWelcomeDiscountPromotion,
} from '../../src/server/discounts/welcome-discount-stripe';

import {
    hashWelcomeDiscountEmail,
    registerWelcomeDiscountRequest,
} from '../../src/server/discounts/welcome-discount-store';

import {
    sendWelcomeDiscountEmail,
} from '../../src/server/email/send-welcome-discount-email';

import {
    NewsletterError,
    parseNewsletterLeadInput,
    submitNewsletterLead,
} from '../../src/server/email/newsletter';

import type {
    WelcomeDiscountClaimErrorCode,
    WelcomeDiscountClaimResponse,
    WelcomeDiscountDataMode,
} from '../../src/types/welcome-discount';

interface WelcomeDiscountClaimRequest {
    email: string;

    marketingConsent: boolean;

    botField?: string;
}

class WelcomeDiscountClaimError extends Error {
    readonly code:
        WelcomeDiscountClaimErrorCode;

    readonly status:
        number;

    constructor(
        code:
            WelcomeDiscountClaimErrorCode,

        status:
            number,

        message:
            string,
    ) {
        super(
            message,
        );

        this.name =
            'WelcomeDiscountClaimError';

        this.code =
            code;

        this.status =
            status;
    }
}

const SUCCESS_MESSAGE =
    'Check your inbox. If this email is eligible for the Maxi Pawz welcome offer, your code is on its way.';

function jsonResponse(
    body:
        WelcomeDiscountClaimResponse,

    status:
        number,
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

function isRecord(
    value:
        unknown,
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

function optionalString(
    value:
        unknown,
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
    value:
        unknown,

    message:
        string,
): string {
    const normalized =
        optionalString(
            value,
        );

    if (
        !normalized
    ) {
        throw new WelcomeDiscountClaimError(
            'invalid-request',
            400,
            message,
        );
    }

    return normalized;
}

function parseBoolean(
    value:
        unknown,
): boolean {
    return value ===
        true;
}

function parseRequest(
    value:
        unknown,
): WelcomeDiscountClaimRequest {
    if (
        !isRecord(
            value,
        )
    ) {
        throw new WelcomeDiscountClaimError(
            'invalid-request',
            400,
            'The welcome offer request is invalid.',
        );
    }

    const email =
        requiredString(
            value.email,
            'Please enter your email address.',
        );

    const marketingConsent =
        parseBoolean(
            value.marketingConsent,
        );

    const botField =
        optionalString(
            value.botField,
        );

    return {
        email,

        marketingConsent,

        ...(botField
            ? {
                botField,
            }
            : {}),
    };
}

function getWelcomeDiscountDataMode():
    WelcomeDiscountDataMode {
    const configured =
        process.env
            .WELCOME_DISCOUNT_DATA_MODE
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

    throw new WelcomeDiscountClaimError(
        'temporarily-unavailable',
        503,
        'The Maxi Pawz welcome offer is temporarily unavailable.',
    );
}

function getNewsletterErrorResponse(
    error:
        NewsletterError,
): WelcomeDiscountClaimError {
    switch (
    error.code
    ) {
        case 'invalid-email':
            return new WelcomeDiscountClaimError(
                'invalid-email',
                400,
                'Please enter a valid email address.',
            );

        case 'invalid-first-name':
            /*
             * The popup does not collect first name, so this should never
             * normally occur. Keep the public response generic if the
             * newsletter validation contract changes later.
             */
            return new WelcomeDiscountClaimError(
                'invalid-request',
                400,
                'The welcome offer request is invalid.',
            );

        case 'disabled':

        case 'configuration-error':

        case 'provider-error':
            return new WelcomeDiscountClaimError(
                'temporarily-unavailable',
                503,
                'The Maxi Pawz welcome offer is temporarily unavailable. Please try again later.',
            );
    }
}

function successResponse(
    status = 201,
): Response {
    return jsonResponse(
        {
            ok:
                true,

            accepted:
                true,

            message:
                SUCCESS_MESSAGE,
        },
        status,
    );
}

export default async function handler(
    request:
        Request,
): Promise<Response> {
    if (
        request.method !==
        'POST'
    ) {
        return jsonResponse(
            {
                ok:
                    false,

                accepted:
                    false,

                code:
                    'invalid-request',

                message:
                    'This endpoint accepts POST requests only.',
            },
            405,
        );
    }

    try {
        const rawRequest =
            await request
                .json()
                .catch(
                    () =>
                        null,
                );

        const payload =
            parseRequest(
                rawRequest,
            );

        /*
         * Honeypot.
         *
         * Automated submissions receive an apparent successful response
         * but never create a lead, Stripe promotion, Blob record, or email.
         */
        if (
            payload.botField
        ) {
            return successResponse(
                202,
            );
        }

        /*
         * The discount email is intentionally part of the Maxi Pawz
         * marketing subscription flow.
         *
         * Because the incentive can only be delivered through email,
         * active email consent is required before the claim can proceed.
         */
        if (
            !payload.marketingConsent
        ) {
            throw new WelcomeDiscountClaimError(
                'consent-required',
                400,
                'Please agree to receive Maxi Pawz emails so we can send your welcome offer.',
            );
        }

        let newsletterInput;

        try {
            newsletterInput =
                parseNewsletterLeadInput(
                    payload.email,
                    undefined,
                    true,
                    'homepage-welcome-discount-popup',
                );
        } catch (
        error
        ) {
            if (
                error instanceof
                NewsletterError
            ) {
                throw getNewsletterErrorResponse(
                    error,
                );
            }

            throw error;
        }

        const dataMode =
            getWelcomeDiscountDataMode();

        /*
         * The newsletter synchronization is deliberately performed before
         * creating the Stripe promotion.
         *
         * A customer should not receive a durable discount allocation if
         * the email preference could not first be stored and synchronized.
         */
        try {
            await submitNewsletterLead(
                newsletterInput,
            );
        } catch (
        error
        ) {
            if (
                error instanceof
                NewsletterError
            ) {
                throw getNewsletterErrorResponse(
                    error,
                );
            }

            throw error;
        }

        const emailHash =
            hashWelcomeDiscountEmail(
                newsletterInput.email,
            );

        /*
         * Register every legitimate claim attempt.
         *
         * Existing records are reused and only requestCount /
         * lastRequestedAt advance.
         */
        await registerWelcomeDiscountRequest(
            emailHash,
            dataMode,
        );

        /*
         * ensureWelcomeDiscountPromotion() is idempotent.
         *
         * If this email already has a promotion, the existing Stripe
         * identifiers are returned without creating another code.
         */
        await ensureWelcomeDiscountPromotion(
            emailHash,
            dataMode,
        );

        /*
         * The email sender is also idempotent.
         *
         * A previously completed delivery is returned rather than sending
         * another welcome-discount message.
         */
        const emailResult =
            await sendWelcomeDiscountEmail(
                emailHash,
                dataMode,
            );

        /*
         * Marketing being disabled is a server configuration condition,
         * not a successful customer claim.
         *
         * Returning 503 allows the browser to keep the popup available for
         * a later retry instead of permanently recording conversion.
         */
        if (
            emailResult.outcome ===
            'skipped'
        ) {
            console.warn(
                'Welcome-discount claim could not send its email.',
                {
                    emailHash,

                    dataMode,

                    reason:
                        emailResult.reason,
                },
            );

            throw new WelcomeDiscountClaimError(
                'temporarily-unavailable',
                503,
                'The Maxi Pawz welcome offer is temporarily unavailable. Please try again later.',
            );
        }

        /*
         * Do not expose:
         *
         * - promotion code
         * - Stripe IDs
         * - whether this was a duplicate claim
         * - whether this email already existed
         *
         * The response is deliberately identical for new and previously
         * completed legitimate claims.
         */
        return successResponse();
    } catch (
    error
    ) {
        if (
            error instanceof
            WelcomeDiscountClaimError
        ) {
            return jsonResponse(
                {
                    ok:
                        false,

                    accepted:
                        false,

                    code:
                        error.code,

                    message:
                        error.message,
                },
                error.status,
            );
        }

        console.error(
            'Welcome-discount claim failed.',
            error,
        );

        return jsonResponse(
            {
                ok:
                    false,

                accepted:
                    false,

                code:
                    'temporarily-unavailable',

                message:
                    'The Maxi Pawz welcome offer is temporarily unavailable. Please try again later.',
            },
            500,
        );
    }
}

export const config:
    Config = {
    path:
        '/api/welcome-discount/claim',

    method:
        'POST',

    /*
     * Public incentive endpoint protection.
     *
     * Three attempts per minute per IP/domain is comfortably above
     * normal human behavior while reducing automated Stripe promotion
     * creation and Resend traffic.
     */
    rateLimit: {
        windowLimit:
            3,

        windowSize:
            60,

        aggregateBy: [
            'ip',
            'domain',
        ],
    },
};