import type {
    Config,
} from '@netlify/functions';

import {
    inspectNewsletterUnsubscribeToken,
    NewsletterUnsubscribeError,
    unsubscribeNewsletterLeadByToken,
} from '../../src/server/email/unsubscribe';

const UNSUBSCRIBE_COOKIE_NAME =
    'maxipawz_marketing_unsubscribe';

const UNSUBSCRIBE_COOKIE_MAX_AGE_SECONDS =
    15 * 60;

function redirectResponse(
    request:
        Request,

    path:
        string,

    additionalHeaders:
        Record<
            string,
            string
        > = {},
): Response {
    const url =
        new URL(
            path,
            request.url,
        );

    return new Response(
        null,
        {
            status:
                303,

            headers: {
                Location:
                    url.toString(),

                'Cache-Control':
                    'no-store, max-age=0',

                'Referrer-Policy':
                    'no-referrer',

                ...additionalHeaders,
            },
        },
    );
}

function getCookieValue(
    request:
        Request,

    name:
        string,
): string | undefined {
    const cookieHeader =
        request
            .headers
            .get(
                'cookie',
            );

    if (!cookieHeader) {
        return undefined;
    }

    for (
        const part
        of cookieHeader.split(
            ';',
        )
    ) {
        const [
            rawName,
            ...rawValueParts
        ] =
            part
                .trim()
                .split(
                    '=',
                );

        if (
            rawName !==
            name
        ) {
            continue;
        }

        const rawValue =
            rawValueParts.join(
                '=',
            );

        if (!rawValue) {
            return undefined;
        }

        try {
            return decodeURIComponent(
                rawValue,
            );
        } catch {
            return undefined;
        }
    }

    return undefined;
}

function getQueryToken(
    request:
        Request,
): string | undefined {
    const value =
        new URL(
            request.url,
        )
            .searchParams
            .get(
                'token',
            )
            ?.trim();

    return value ||
        undefined;
}

function getUnsubscribeToken(
    request:
        Request,
): string | undefined {
    return (
        getQueryToken(
            request,
        ) ??
        getCookieValue(
            request,
            UNSUBSCRIBE_COOKIE_NAME,
        )
    );
}

function shouldUseSecureCookie(
    request:
        Request,
): boolean {
    return new URL(
        request.url,
    )
        .protocol ===
        'https:';
}

function buildUnsubscribeCookie(
    request:
        Request,

    token: string,
): string {
    const secure =
        shouldUseSecureCookie(
            request,
        )
            ? '; Secure'
            : '';

    return [
        `${UNSUBSCRIBE_COOKIE_NAME}=${encodeURIComponent(
            token,
        )}`,
        'Path=/api/newsletter/unsubscribe',
        'HttpOnly',
        'SameSite=Lax',
        `Max-Age=${UNSUBSCRIBE_COOKIE_MAX_AGE_SECONDS}`,
    ].join(
        '; ',
    ) +
        secure;
}

function buildExpiredUnsubscribeCookie(
    request:
        Request,
): string {
    const secure =
        shouldUseSecureCookie(
            request,
        )
            ? '; Secure'
            : '';

    return [
        `${UNSUBSCRIBE_COOKIE_NAME}=`,
        'Path=/api/newsletter/unsubscribe',
        'HttpOnly',
        'SameSite=Lax',
        'Max-Age=0',
    ].join(
        '; ',
    ) +
        secure;
}

async function handleGet(
    request:
        Request,
): Promise<Response> {
    const token =
        getQueryToken(
            request,
        );

    if (!token) {
        return redirectResponse(
            request,
            '/email/unsubscribe-problem',
        );
    }

    await inspectNewsletterUnsubscribeToken(
        token,
    );

    return redirectResponse(
        request,
        '/email/unsubscribe',
        {
            'Set-Cookie':
                buildUnsubscribeCookie(
                    request,
                    token,
                ),
        },
    );
}

async function handlePost(
    request:
        Request,
): Promise<Response> {
    const token =
        getUnsubscribeToken(
            request,
        );

    if (!token) {
        return redirectResponse(
            request,
            '/email/unsubscribe-problem',
        );
    }

    const result =
        await unsubscribeNewsletterLeadByToken(
            token,
        );

    if (
        result.resendSyncStatus ===
        'failed'
    ) {
        console.warn(
            'The marketing opt-out was recorded by Maxi Pawz, but Resend synchronization remains pending.',
        );
    }

    return redirectResponse(
        request,
        '/email/unsubscribed',
        {
            'Set-Cookie':
                buildExpiredUnsubscribeCookie(
                    request,
                ),
        },
    );
}

export default async function handler(
    request:
        Request,
): Promise<Response> {
    try {
        if (
            request.method ===
            'GET'
        ) {
            return await handleGet(
                request,
            );
        }

        if (
            request.method ===
            'POST'
        ) {
            return await handlePost(
                request,
            );
        }

        return new Response(
            'Method Not Allowed',
            {
                status:
                    405,

                headers: {
                    Allow:
                        'GET, POST',

                    'Cache-Control':
                        'no-store, max-age=0',
                },
            },
        );
    } catch (error) {
        if (
            error instanceof
            NewsletterUnsubscribeError
        ) {
            console.warn(
                'Newsletter unsubscribe request could not be completed.',
                {
                    code:
                        error.code,

                    status:
                        error.status,

                    message:
                        error.message,
                },
            );

            return redirectResponse(
                request,
                '/email/unsubscribe-problem',
                {
                    'Set-Cookie':
                        buildExpiredUnsubscribeCookie(
                            request,
                        ),
                },
            );
        }

        console.error(
            'Unexpected newsletter unsubscribe failure.',
            error,
        );

        return redirectResponse(
            request,
            '/email/unsubscribe-problem',
            {
                'Set-Cookie':
                    buildExpiredUnsubscribeCookie(
                        request,
                    ),
            },
        );
    }
}

export const config:
    Config = {
    path:
        '/api/newsletter/unsubscribe',
};