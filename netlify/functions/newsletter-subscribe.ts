import type {
    Config,
} from '@netlify/functions';

import {
    NewsletterError,
    parseNewsletterLeadInput,
    submitNewsletterLead,
} from '../../src/server/email/newsletter';

function getFormString(
    formData:
        FormData,

    name:
        string,
): string {
    const value =
        formData.get(
            name,
        );

    return typeof value ===
        'string'
        ? value
        : '';
}

function wantsJson(
    request:
        Request,
): boolean {
    return request
        .headers
        .get(
            'accept',
        )
        ?.includes(
            'application/json',
        ) ??
        false;
}

function jsonResponse(
    body:
        unknown,

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
    try {
        const formData =
            await request
                .formData()
                .catch(
                    () =>
                        null,
                );

        if (!formData) {
            if (
                wantsJson(
                    request,
                )
            ) {
                return jsonResponse(
                    {
                        ok:
                            false,

                        message:
                            'The newsletter signup request is invalid.',
                    },
                    400,
                );
            }

            return redirectResponse(
                request,
                '/join/problem',
            );
        }

        /*
         * Manual honeypot.
         *
         * Bots receive an apparent success response, but nothing is
         * written to Blobs or Resend.
         */
        const botField =
            getFormString(
                formData,
                'bot-field',
            )
                .trim();

        if (botField) {
            if (
                wantsJson(
                    request,
                )
            ) {
                return jsonResponse(
                    {
                        ok:
                            true,

                        accepted:
                            true,
                    },
                    202,
                );
            }

            return redirectResponse(
                request,
                '/join/success',
            );
        }

        const email =
            getFormString(
                formData,
                'email',
            );

        const firstName =
            getFormString(
                formData,
                'first-name',
            );

        /*
         * An unchecked HTML checkbox is omitted from FormData.
         *
         * Therefore:
         *
         * "yes" => marketing selected
         * missing => marketing declined
         */
        const marketingConsent =
            getFormString(
                formData,
                'marketing-consent',
            ) ===
            'yes';

        const input =
            parseNewsletterLeadInput(
                email,
                firstName,
                marketingConsent,
                'homepage-join-the-pack',
            );

        const result =
            await submitNewsletterLead(
                input,
            );

        if (
            wantsJson(
                request,
            )
        ) {
            return jsonResponse(
                {
                    ok:
                        true,

                    ...result,
                },
                201,
            );
        }

        return redirectResponse(
            request,
            marketingConsent
                ? '/join/success'
                : '/join/thanks',
        );
    } catch (error) {
        if (
            error instanceof
            NewsletterError
        ) {
            console.warn(
                'Newsletter signup could not be completed.',
                {
                    code:
                        error.code,

                    status:
                        error.status,

                    message:
                        error.message,
                },
            );

            if (
                wantsJson(
                    request,
                )
            ) {
                return jsonResponse(
                    {
                        ok:
                            false,

                        code:
                            error.code,

                        message:
                            error.message,
                    },
                    error.status,
                );
            }

            return redirectResponse(
                request,
                '/join/problem',
            );
        }

        console.error(
            'Unexpected newsletter signup failure.',
            error,
        );

        if (
            wantsJson(
                request,
            )
        ) {
            return jsonResponse(
                {
                    ok:
                        false,

                    message:
                        'Newsletter signup is temporarily unavailable.',
                },
                500,
            );
        }

        return redirectResponse(
            request,
            '/join/problem',
        );
    }
}

export const config:
    Config = {
    path:
        '/api/newsletter/subscribe',

    method:
        'POST',
};