import type { Config } from '@netlify/functions';

import {
    isFoundingPackSegment,
} from '../../src/lib/founding-pack-segmentation';

import {
    AdminAuthError,
    assertAdminAuthorized,
} from '../../src/server/admin-auth';

import {
    buildFoundingPackCampaignAudience,
} from '../../src/server/founding-pack/campaign-audience';

import type {
    FoundingPackCampaignContact,
} from '../../src/types/founding-pack-campaign';

import type {
    FoundingPackSegment,
} from '../../src/types/founding-pack-segmentation';

interface ErrorResponse {
    ok: false;

    message: string;
}

function jsonError(
    body: ErrorResponse,

    status: number,
): Response {
    return Response.json(
        body,
        {
            status,

            headers: {
                'Cache-Control':
                    'no-store, max-age=0',

                'X-Content-Type-Options':
                    'nosniff',
            },
        },
    );
}

function parseSegment(
    request: Request,
): FoundingPackSegment {
    const url =
        new URL(
            request.url,
        );

    const rawSegment =
        url.searchParams
            .get(
                'segment',
            )
            ?.trim()
            .toLowerCase();

    if (
        !rawSegment
    ) {
        throw new Error(
            'A Founding Pack segment is required.',
        );
    }

    if (
        !isFoundingPackSegment(
            rawSegment,
        )
    ) {
        throw new Error(
            'The requested Founding Pack segment is not supported.',
        );
    }

    return rawSegment;
}

function csvEscape(
    value: string,
): string {
    const escaped =
        value.replace(
            /"/g,
            '""',
        );

    return `"${escaped}"`;
}

/**
 * Spreadsheet applications can interpret cells beginning
 * with these characters as formulas.
 *
 * firstName is user-provided content, so neutralize formula
 * execution before placing it inside a CSV intended for
 * human/admin use.
 */
function spreadsheetSafeText(
    value: string,
): string {
    const normalized =
        value.replace(
            /[\r\n]+/g,
            ' ',
        );

    if (
        /^[=+\-@]/.test(
            normalized,
        )
    ) {
        return `'${normalized}`;
    }

    return normalized;
}

function campaignContactToCsvRow(
    contact: FoundingPackCampaignContact,
): string {
    /*
     * Email is the canonical campaign destination and must not
     * be altered with spreadsheet prefixes.
     *
     * It has already passed newsletter email validation before
     * entering the canonical store.
     */
    const email =
        contact.email
            .trim()
            .toLowerCase();

    const firstName =
        contact.firstName
            ? spreadsheetSafeText(
                contact.firstName,
            )
            : '';

    return [
        csvEscape(
            email,
        ),

        csvEscape(
            firstName,
        ),
    ].join(
        ',',
    );
}

function buildCsv(
    contacts:
        readonly FoundingPackCampaignContact[],
): string {
    const rows = [
        'email,first_name',

        ...contacts.map(
            campaignContactToCsvRow,
        ),
    ];

    /*
     * CRLF keeps the export friendly to spreadsheet tools and
     * standard CSV consumers.
     *
     * The trailing newline is intentional.
     */
    return `${rows.join(
        '\r\n',
    )}\r\n`;
}

function getExportFilename(
    segment: FoundingPackSegment,
): string {
    const safeSegment =
        segment.replace(
            /[^a-z0-9]+/g,
            '-',
        );

    return `maxipawz-founding-pack-${safeSegment}.csv`;
}

export default async function handler(
    request: Request,
): Promise<Response> {
    if (
        request.method !==
        'GET'
    ) {
        return jsonError(
            {
                ok:
                    false,

                message:
                    'This endpoint accepts GET requests only.',
            },
            405,
        );
    }

    try {
        /*
         * Authenticate before validating or resolving the
         * requested audience.
         *
         * Unauthorized callers should not be able to inspect
         * available campaign segments or recipient counts.
         */
        assertAdminAuthorized(
            request,
        );

        let segment:
            FoundingPackSegment;

        try {
            segment =
                parseSegment(
                    request,
                );
        } catch (
        error
        ) {
            return jsonError(
                {
                    ok:
                        false,

                    message:
                        error instanceof
                            Error
                            ? error.message
                            : 'The requested Founding Pack segment is invalid.',
                },
                400,
            );
        }

        const audience =
            await buildFoundingPackCampaignAudience(
                segment,
            );

        const csv =
            buildCsv(
                audience.contacts,
            );

        return new Response(
            csv,
            {
                status:
                    200,

                headers: {
                    'Content-Type':
                        'text/csv; charset=utf-8',

                    'Content-Disposition':
                        `attachment; filename="${getExportFilename(
                            segment,
                        )}"`,

                    'Cache-Control':
                        'no-store, max-age=0',

                    Pragma:
                        'no-cache',

                    Expires:
                        '0',

                    'X-Content-Type-Options':
                        'nosniff',

                    'X-MaxiPawz-Audience-Segment':
                        segment,

                    'X-MaxiPawz-Audience-Count':
                        String(
                            audience.count,
                        ),
                },
            },
        );
    } catch (
    error
    ) {
        if (
            error instanceof
            AdminAuthError
        ) {
            return jsonError(
                {
                    ok:
                        false,

                    message:
                        error.message,
                },
                error.status,
            );
        }

        console.error(
            'Founding Pack campaign audience export failed.',
            error,
        );

        return jsonError(
            {
                ok:
                    false,

                message:
                    'The Founding Pack campaign audience could not be exported.',
            },
            500,
        );
    }
}

export const config: Config = {
    path:
        '/api/admin/founding-pack/audience-export',
};