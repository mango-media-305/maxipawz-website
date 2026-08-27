import assert from 'node:assert/strict';

import test from 'node:test';

import {
    buildFoundingPackSegmentationSnapshot,
} from '../../src/lib/founding-pack-segmentation';

import {
    buildFoundingPackCampaignAudience,
} from '../../src/server/founding-pack/campaign-audience';

import type {
    FoundingPackSegmentationMember,
} from '../../src/server/founding-pack/segmentation-member';

const HASH_A =
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const HASH_B =
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const HASH_C =
    'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';

const ORIGINAL_DATA_MODE =
    process.env.NEWSLETTER_DATA_MODE;

function createMember(
    overrides: Partial<FoundingPackSegmentationMember> = {},
): FoundingPackSegmentationMember {
    return {
        email:
            'luna-owner@example.com',

        firstName:
            'Ana',

        marketingConsent:
            true,

        resendContactId:
            'contact_123',

        resendSyncStatus:
            'synced',

        segmentation:
            buildFoundingPackSegmentationSnapshot({
                petType:
                    'dog',

                petPersonality:
                    'power-chewer',

                launchInterest:
                    'toys',
            }),

        ...overrides,
    };
}

function createProfileListStore(
    hashes: string[],
) {
    return {
        async list() {
            return {
                blobs:
                    hashes.map(
                        (
                            hash,
                        ) => ({
                            key:
                                `email/${hash}`,
                        }),
                    ),
            };
        },
    };
}

test.beforeEach(
    () => {
        process.env.NEWSLETTER_DATA_MODE =
            'test';
    },
);

test.after(
    () => {
        if (
            ORIGINAL_DATA_MODE ===
            undefined
        ) {
            delete process.env
                .NEWSLETTER_DATA_MODE;
        } else {
            process.env.NEWSLETTER_DATA_MODE =
                ORIGINAL_DATA_MODE;
        }
    },
);

test(
    'returns only campaign-ready members matching the requested segment',
    async () => {
        const members =
            new Map<
                string,
                FoundingPackSegmentationMember
            >([
                [
                    HASH_A,
                    createMember(),
                ],

                [
                    HASH_B,
                    createMember({
                        email:
                            'travel@example.com',

                        segmentation:
                            buildFoundingPackSegmentationSnapshot({
                                petType:
                                    'dog',

                                petPersonality:
                                    'adventure-buddy',

                                launchInterest:
                                    'travel',
                            }),
                    }),
                ],
            ]);

        const audience =
            await buildFoundingPackCampaignAudience(
                'launch-interest:toys',
                {
                    getPetProfileListStore:
                        () =>
                            createProfileListStore([
                                HASH_A,
                                HASH_B,
                            ]),

                    resolveSegmentationMember:
                        async (
                            hash,
                        ) =>
                            members.get(
                                hash,
                            ) ??
                            null,

                    now:
                        new Date(
                            '2026-08-27T18:00:00.000Z',
                        ),
                },
            );

        assert.equal(
            audience.segment,
            'launch-interest:toys',
        );

        assert.equal(
            audience.count,
            1,
        );

        assert.deepEqual(
            audience.contacts,
            [
                {
                    email:
                        'luna-owner@example.com',

                    firstName:
                        'Ana',
                },
            ],
        );

        assert.equal(
            audience.generatedAt,
            '2026-08-27T18:00:00.000Z',
        );
    },
);

test(
    'excludes members who opted out of marketing',
    async () => {
        const audience =
            await buildFoundingPackCampaignAudience(
                'launch-interest:toys',
                {
                    getPetProfileListStore:
                        () =>
                            createProfileListStore([
                                HASH_A,
                            ]),

                    resolveSegmentationMember:
                        async () =>
                            createMember({
                                marketingConsent:
                                    false,
                            }),
                },
            );

        assert.equal(
            audience.count,
            0,
        );

        assert.deepEqual(
            audience.contacts,
            [],
        );
    },
);

test(
    'excludes members whose Resend synchronization failed',
    async () => {
        const audience =
            await buildFoundingPackCampaignAudience(
                'launch-interest:toys',
                {
                    getPetProfileListStore:
                        () =>
                            createProfileListStore([
                                HASH_A,
                            ]),

                    resolveSegmentationMember:
                        async () =>
                            createMember({
                                resendSyncStatus:
                                    'failed',
                            }),
                },
            );

        assert.equal(
            audience.count,
            0,
        );
    },
);

test(
    'excludes members whose Resend synchronization is pending',
    async () => {
        const audience =
            await buildFoundingPackCampaignAudience(
                'launch-interest:toys',
                {
                    getPetProfileListStore:
                        () =>
                            createProfileListStore([
                                HASH_A,
                            ]),

                    resolveSegmentationMember:
                        async () =>
                            createMember({
                                resendSyncStatus:
                                    'pending',
                            }),
                },
            );

        assert.equal(
            audience.count,
            0,
        );
    },
);

test(
    'excludes members without a Resend contact id',
    async () => {
        const audience =
            await buildFoundingPackCampaignAudience(
                'launch-interest:toys',
                {
                    getPetProfileListStore:
                        () =>
                            createProfileListStore([
                                HASH_A,
                            ]),

                    resolveSegmentationMember:
                        async () =>
                            createMember({
                                resendContactId:
                                    undefined,
                            }),
                },
            );

        assert.equal(
            audience.count,
            0,
        );
    },
);

test(
    'ignores profile hashes that cannot resolve to a canonical member',
    async () => {
        const audience =
            await buildFoundingPackCampaignAudience(
                'profile:completed',
                {
                    getPetProfileListStore:
                        () =>
                            createProfileListStore([
                                HASH_A,
                            ]),

                    resolveSegmentationMember:
                        async () =>
                            null,
                },
            );

        assert.equal(
            audience.count,
            0,
        );
    },
);

test(
    'supports pet type audiences',
    async () => {
        const audience =
            await buildFoundingPackCampaignAudience(
                'pet-type:dog',
                {
                    getPetProfileListStore:
                        () =>
                            createProfileListStore([
                                HASH_A,
                            ]),

                    resolveSegmentationMember:
                        async () =>
                            createMember(),
                },
            );

        assert.equal(
            audience.count,
            1,
        );
    },
);

test(
    'supports personality audiences',
    async () => {
        const audience =
            await buildFoundingPackCampaignAudience(
                'pet-personality:power-chewer',
                {
                    getPetProfileListStore:
                        () =>
                            createProfileListStore([
                                HASH_A,
                            ]),

                    resolveSegmentationMember:
                        async () =>
                            createMember(),
                },
            );

        assert.equal(
            audience.count,
            1,
        );
    },
);

test(
    'supports the profile completed audience',
    async () => {
        const audience =
            await buildFoundingPackCampaignAudience(
                'profile:completed',
                {
                    getPetProfileListStore:
                        () =>
                            createProfileListStore([
                                HASH_A,
                            ]),

                    resolveSegmentationMember:
                        async () =>
                            createMember(),
                },
            );

        assert.equal(
            audience.count,
            1,
        );
    },
);

test(
    'deduplicates contacts by normalized email address',
    async () => {
        let calls =
            0;

        const audience =
            await buildFoundingPackCampaignAudience(
                'launch-interest:toys',
                {
                    getPetProfileListStore:
                        () =>
                            createProfileListStore([
                                HASH_A,
                                HASH_B,
                            ]),

                    resolveSegmentationMember:
                        async () => {
                            calls +=
                                1;

                            return createMember({
                                email:
                                    calls === 1
                                        ? 'Ana@Example.com'
                                        : 'ana@example.com',
                            });
                        },
                },
            );

        assert.equal(
            audience.count,
            1,
        );
    },
);

test(
    'sorts campaign contacts deterministically by email',
    async () => {
        const members =
            new Map<
                string,
                FoundingPackSegmentationMember
            >([
                [
                    HASH_A,
                    createMember({
                        email:
                            'zebra@example.com',
                    }),
                ],

                [
                    HASH_B,
                    createMember({
                        email:
                            'alpha@example.com',
                    }),
                ],

                [
                    HASH_C,
                    createMember({
                        email:
                            'middle@example.com',
                    }),
                ],
            ]);

        const audience =
            await buildFoundingPackCampaignAudience(
                'launch-interest:toys',
                {
                    getPetProfileListStore:
                        () =>
                            createProfileListStore([
                                HASH_A,
                                HASH_B,
                                HASH_C,
                            ]),

                    resolveSegmentationMember:
                        async (
                            hash,
                        ) =>
                            members.get(
                                hash,
                            ) ??
                            null,
                },
            );

        assert.deepEqual(
            audience.contacts.map(
                (
                    contact,
                ) =>
                    contact.email,
            ),
            [
                'alpha@example.com',
                'middle@example.com',
                'zebra@example.com',
            ],
        );
    },
);

test(
    'campaign audience exposes only the minimum recipient identity',
    async () => {
        const audience =
            await buildFoundingPackCampaignAudience(
                'launch-interest:toys',
                {
                    getPetProfileListStore:
                        () =>
                            createProfileListStore([
                                HASH_A,
                            ]),

                    resolveSegmentationMember:
                        async () =>
                            createMember(),
                },
            );

        const contact =
            audience.contacts[0];

        assert.ok(
            contact,
        );

        assert.deepEqual(
            Object.keys(
                contact,
            ).sort(),
            [
                'email',
                'firstName',
            ],
        );

        const serialized =
            JSON.stringify(
                audience.contacts,
            );

        for (
            const prohibitedField of [
                'petName',
                'emailHash',
                'resendContactId',
                'petPersonality',
                'launchInterest',
                'submissionCount',
                'createdAt',
                'updatedAt',
            ]
        ) {
            assert.equal(
                serialized.includes(
                    `"${prohibitedField}"`,
                ),
                false,
                `Campaign audience unexpectedly contains ${prohibitedField}.`,
            );
        }
    },
);

test(
    'rejects unsupported campaign segments',
    async () => {
        await assert.rejects(
            () =>
                buildFoundingPackCampaignAudience(
                    'launch-interest:banana',
                    {
                        getPetProfileListStore:
                            () =>
                                createProfileListStore(
                                    [],
                                ),
                    },
                ),
            /Unsupported Founding Pack campaign segment/,
        );
    },
);

test(
    'rejects malformed profile keys before resolving members',
    async () => {
        await assert.rejects(
            () =>
                buildFoundingPackCampaignAudience(
                    'profile:completed',
                    {
                        getPetProfileListStore:
                            () => ({
                                async list() {
                                    return {
                                        blobs: [
                                            {
                                                key:
                                                    'email/not-a-sha256',
                                            },
                                        ],
                                    };
                                },
                            }),
                    },
                ),
            /invalid profile email hash/,
        );
    },
);