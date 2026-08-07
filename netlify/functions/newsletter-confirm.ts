import type {
    Config,
} from '@netlify/functions';

import {
    confirmNewsletterSubscription,
    NewsletterError,
} from '../../src/server/email/newsletter';

function redirectResponse(
    request:
        Request,

    path:
        string,
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
            },
        },
    );
}

export default async function handler(
    request:
        Request,
): Promise<Response> {
    const requestUrl =
        new URL(
            request.url,
        );

    const token =
        requestUrl
            .searchParams
            .get(
                'token',
            )
            ?.trim();

    if (!token) {
        return redirectResponse(
            request,
            '/join/confirmation-problem',
        );
    }

    try {
        await confirmNewsletterSubscription(
            token,
        );

        return redirectResponse(
            request,
            '/join/success',
        );
    } catch (error) {
        if (
            error instanceof
            NewsletterError
        ) {
            console.warn(
                'Newsletter confirmation could not be completed.',
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
                '/join/confirmation-problem',
            );
        }

        console.error(
            'Unexpected newsletter confirmation error.',
            error,
        );

        return redirectResponse(
            request,
            '/join/confirmation-problem',
        );
    }
}

export const config:
    Config = {
    path:
        '/api/newsletter/confirm',

    method:
        'GET',
};