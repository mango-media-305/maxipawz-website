import assert from 'node:assert/strict';

import test from 'node:test';

import handler, {
    buildCsv,
    spreadsheetSafeText,
} from '../../netlify/functions/admin-founding-pack-audience-export';

const ORIGINAL_ADMIN_TOKEN =
    process.env.MAXIPAWZ_ADMIN_TOKEN;

const ADMIN_TOKEN =
    'this-is-a-valid-admin-token-with-at-least-thirty-two-characters';

test.beforeEach(
    () => {
        process.env.MAXIPAWZ_ADMIN_TOKEN =
            ADMIN_TOKEN;
    },
);

test.after(
    () => {
        if (
            ORIGINAL_ADMIN_TOKEN ===
            undefined
        ) {
            delete process.env
                .MAXIPAWZ_ADMIN_TOKEN;
        } else {
            process.env.MAXIPAWZ_ADMIN_TOKEN =
                ORIGINAL_ADMIN_TOKEN;
        }
    },
);

test(
    'rejects unauthenticated audience exports before resolving a segment',
    async () => {
        const request =
            new Request(
                'https://example.com/api/admin/founding-pack/audience-export?segment=launch-interest:toys',
            );

        const response =
            await handler(
                request,
            );

        assert.equal(
            response.status,
            401,
        );

        assert.equal(
            response.headers.get(
                'cache-control',
            ),
            'no-store, max-age=0',
        );

        const body =
            await response.json();

        assert.deepEqual(
            body,
            {
                ok:
                    false,

                message:
                    'Administrator authentication is required.',
            },
        );
    },
);

test(
    'rejects an invalid admin token',
    async () => {
        const request =
            new Request(
                'https://example.com/api/admin/founding-pack/audience-export?segment=launch-interest:toys',
                {
                    headers: {
                        Authorization:
                            'Bearer this-token-is-definitely-not-the-real-administrator-token',
                    },
                },
            );

        const response =
            await handler(
                request,
            );

        assert.equal(
            response.status,
            401,
        );
    },
);

test(
    'rejects a missing segment after successful authentication',
    async () => {
        const request =
            new Request(
                'https://example.com/api/admin/founding-pack/audience-export',
                {
                    headers: {
                        Authorization:
                            `Bearer ${ADMIN_TOKEN}`,
                    },
                },
            );

        const response =
            await handler(
                request,
            );

        assert.equal(
            response.status,
            400,
        );

        const body =
            await response.json();

        assert.deepEqual(
            body,
            {
                ok:
                    false,

                message:
                    'A Founding Pack segment is required.',
            },
        );
    },
);

test(
    'rejects unsupported segments after successful authentication',
    async () => {
        const request =
            new Request(
                'https://example.com/api/admin/founding-pack/audience-export?segment=banana',
                {
                    headers: {
                        Authorization:
                            `Bearer ${ADMIN_TOKEN}`,
                    },
                },
            );

        const response =
            await handler(
                request,
            );

        assert.equal(
            response.status,
            400,
        );

        const body =
            await response.json();

        assert.deepEqual(
            body,
            {
                ok:
                    false,

                message:
                    'The requested Founding Pack segment is not supported.',
            },
        );
    },
);

test(
    'rejects non-GET requests',
    async () => {
        const request =
            new Request(
                'https://example.com/api/admin/founding-pack/audience-export?segment=launch-interest:toys',
                {
                    method:
                        'POST',

                    headers: {
                        Authorization:
                            `Bearer ${ADMIN_TOKEN}`,
                    },
                },
            );

        const response =
            await handler(
                request,
            );

        assert.equal(
            response.status,
            405,
        );

        assert.equal(
            response.headers.get(
                'cache-control',
            ),
            'no-store, max-age=0',
        );
    },
);

test(
    'buildCsv exports only email and first name columns',
    () => {
        const csv =
            buildCsv([
                {
                    email:
                        'ana@example.com',

                    firstName:
                        'Ana',
                },

                {
                    email:
                        'john@example.com',
                },
            ]);

        assert.equal(
            csv,
            [
                'email,first_name',
                '"ana@example.com","Ana"',
                '"john@example.com",""',
                '',
            ].join(
                '\r\n',
            ),
        );
    },
);

test(
    'CSV export does not introduce pet or internal metadata columns',
    () => {
        const csv =
            buildCsv([
                {
                    email:
                        'ana@example.com',

                    firstName:
                        'Ana',
                },
            ]);

        for (
            const prohibited of [
                'pet_name',
                'petName',
                'email_hash',
                'emailHash',
                'resendContactId',
                'pet_personality',
                'launch_interest',
                'submissionCount',
            ]
        ) {
            assert.equal(
                csv.includes(
                    prohibited,
                ),
                false,
            );
        }
    },
);

test(
    'escapes double quotes in CSV values',
    () => {
        const csv =
            buildCsv([
                {
                    email:
                        'ana@example.com',

                    firstName:
                        'Ana "Maxi" Test',
                },
            ]);

        assert.ok(
            csv.includes(
                '"Ana ""Maxi"" Test"',
            ),
        );
    },
);

test(
    'removes newlines from spreadsheet text',
    () => {
        assert.equal(
            spreadsheetSafeText(
                'Ana\r\nGarcia',
            ),
            'Ana Garcia',
        );
    },
);

test(
    'neutralizes Excel-style formula injection in first names',
    () => {
        const dangerousValues = [
            '=HYPERLINK("https://example.com")',
            '+SUM(1,1)',
            '-10+20',
            '@SUM(A1:A2)',
        ];

        for (
            const value of
            dangerousValues
        ) {
            const safe =
                spreadsheetSafeText(
                    value,
                );

            assert.equal(
                safe.startsWith(
                    "'",
                ),
                true,
                `Expected "${value}" to be neutralized.`,
            );
        }
    },
);

test(
    'does not modify normal spreadsheet text',
    () => {
        assert.equal(
            spreadsheetSafeText(
                'Maria',
            ),
            'Maria',
        );

        assert.equal(
            spreadsheetSafeText(
                'María José',
            ),
            'María José',
        );
    },
);