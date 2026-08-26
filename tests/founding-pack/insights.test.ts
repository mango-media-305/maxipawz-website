import assert from 'node:assert/strict';

import test from 'node:test';

import {
    buildFoundingPackInsights,
} from '../../src/server/founding-pack/insights';

import type {
    FoundingPackPetProfileRecord,
} from '../../src/types/founding-pack';

import type {
    NewsletterLeadRecord,
} from '../../src/types/newsletter';

function createNewsletterLead(
    overrides: Partial<NewsletterLeadRecord> = {},
): NewsletterLeadRecord {
    return {
        version: 1,

        email: 'person@example.com',

        emailHash:
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',

        source:
            'homepage-join-the-pack',

        marketingConsent: true,

        marketingPreferenceMethod:
            'prechecked-checkbox-submission',

        consentTextVersion: '2026-08-01',

        firstSubmittedAt:
            '2026-08-20T10:00:00.000Z',

        lastSubmittedAt:
            '2026-08-20T10:00:00.000Z',

        marketingPreferenceUpdatedAt:
            '2026-08-20T10:00:00.000Z',

        lastOptInAt:
            '2026-08-20T10:00:00.000Z',

        submissionCount: 1,

        resendContactId: 'contact_123',

        resendTopicId: 'topic_123',

        resendSyncStatus: 'synced',

        createdAt:
            '2026-08-20T10:00:00.000Z',

        updatedAt:
            '2026-08-20T10:00:00.000Z',

        ...overrides,
    };
}

function createPetProfile(
    overrides: Partial<FoundingPackPetProfileRecord> = {},
): FoundingPackPetProfileRecord {
    return {
        version: 1,

        emailHash:
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',

        petName: 'Luna',

        petType: 'dog',

        petPersonality:
            'adventure-buddy',

        launchInterest: 'toys',

        source:
            'homepage-founding-pack',

        firstSubmittedAt:
            '2026-08-20T10:05:00.000Z',

        lastSubmittedAt:
            '2026-08-20T10:05:00.000Z',

        submissionCount: 1,

        createdAt:
            '2026-08-20T10:05:00.000Z',

        updatedAt:
            '2026-08-20T10:05:00.000Z',

        ...overrides,
    };
}

test(
    'returns empty insights when no records exist',
    () => {
        const result =
            buildFoundingPackInsights(
                [],
                [],
                {
                    now:
                        new Date(
                            '2026-08-26T12:00:00.000Z',
                        ),
                },
            );

        assert.equal(
            result.summary.members,
            0,
        );

        assert.equal(
            result.summary.profilesCompleted,
            0,
        );

        assert.equal(
            result.summary.profileCompletionRate,
            0,
        );

        assert.equal(
            result.summary.marketingOptInRate,
            0,
        );

        assert.equal(
            result.recentProfiles.length,
            0,
        );

        assert.equal(
            result.generatedAt,
            '2026-08-26T12:00:00.000Z',
        );
    },
);

test(
    'calculates summary metrics and percentages correctly',
    () => {
        const leads = [
            createNewsletterLead(),

            createNewsletterLead({
                email:
                    'second@example.com',

                emailHash:
                    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',

                marketingConsent:
                    false,

                marketingPreferenceMethod:
                    'checkbox-unchecked-submission',

                lastOptInAt:
                    undefined,

                lastOptOutAt:
                    '2026-08-21T10:00:00.000Z',
            }),

            createNewsletterLead({
                email:
                    'third@example.com',

                emailHash:
                    'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',

                marketingConsent:
                    true,
            }),
        ];

        const profiles = [
            createPetProfile(),

            createPetProfile({
                emailHash:
                    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',

                petName:
                    'Milo',

                petType:
                    'cat',

                petPersonality:
                    undefined,

                launchInterest:
                    'treats',
            }),
        ];

        const result =
            buildFoundingPackInsights(
                leads,
                profiles,
            );

        assert.equal(
            result.summary.members,
            3,
        );

        assert.equal(
            result.summary.profilesCompleted,
            2,
        );

        assert.equal(
            result.summary.profilesMissing,
            1,
        );

        assert.equal(
            result.summary.profileCompletionRate,
            66.7,
        );

        assert.equal(
            result.summary.marketingOptedIn,
            2,
        );

        assert.equal(
            result.summary.marketingOptedOut,
            1,
        );

        assert.equal(
            result.summary.marketingOptInRate,
            66.7,
        );

        assert.equal(
            result.summary.personalityResponses,
            1,
        );

        assert.equal(
            result.summary.personalityResponseRate,
            50,
        );

        assert.equal(
            result.summary.launchInterestResponses,
            2,
        );

        assert.equal(
            result.summary.launchInterestResponseRate,
            100,
        );
    },
);

test(
    'deduplicates newsletter leads by email hash and keeps the newest record',
    () => {
        const older =
            createNewsletterLead({
                marketingConsent:
                    true,

                updatedAt:
                    '2026-08-20T10:00:00.000Z',
            });

        const newer =
            createNewsletterLead({
                marketingConsent:
                    false,

                marketingPreferenceMethod:
                    'unsubscribe-link',

                updatedAt:
                    '2026-08-21T10:00:00.000Z',
            });

        const result =
            buildFoundingPackInsights(
                [
                    older,
                    newer,
                ],
                [],
            );

        assert.equal(
            result.summary.members,
            1,
        );

        assert.equal(
            result.summary.marketingOptedIn,
            0,
        );

        assert.equal(
            result.summary.marketingOptedOut,
            1,
        );
    },
);

test(
    'deduplicates pet profiles by email hash and keeps the newest record',
    () => {
        const lead =
            createNewsletterLead();

        const older =
            createPetProfile({
                petName:
                    'Old Name',

                petType:
                    'dog',

                updatedAt:
                    '2026-08-20T10:00:00.000Z',

                lastSubmittedAt:
                    '2026-08-20T10:00:00.000Z',
            });

        const newer =
            createPetProfile({
                petName:
                    'New Name',

                petType:
                    'cat',

                updatedAt:
                    '2026-08-21T10:00:00.000Z',

                lastSubmittedAt:
                    '2026-08-21T10:00:00.000Z',
            });

        const result =
            buildFoundingPackInsights(
                [
                    lead,
                ],
                [
                    older,
                    newer,
                ],
            );

        assert.equal(
            result.summary.profilesCompleted,
            1,
        );

        assert.equal(
            result.recentProfiles[0]?.petName,
            'New Name',
        );

        assert.equal(
            result.recentProfiles[0]?.petType,
            'cat',
        );
    },
);

test(
    'ignores profiles that do not belong to a known newsletter member',
    () => {
        const profile =
            createPetProfile({
                emailHash:
                    'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
            });

        const result =
            buildFoundingPackInsights(
                [
                    createNewsletterLead(),
                ],
                [
                    profile,
                ],
            );

        assert.equal(
            result.summary.members,
            1,
        );

        assert.equal(
            result.summary.profilesCompleted,
            0,
        );

        assert.equal(
            result.recentProfiles.length,
            0,
        );
    },
);

test(
    'calculates pet type distribution percentages using completed profiles',
    () => {
        const leads = [
            createNewsletterLead(),

            createNewsletterLead({
                email:
                    'second@example.com',

                emailHash:
                    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            }),

            createNewsletterLead({
                email:
                    'third@example.com',

                emailHash:
                    'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
            }),
        ];

        const profiles = [
            createPetProfile(),

            createPetProfile({
                emailHash:
                    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',

                petType:
                    'dog',
            }),

            createPetProfile({
                emailHash:
                    'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',

                petType:
                    'cat',
            }),
        ];

        const result =
            buildFoundingPackInsights(
                leads,
                profiles,
            );

        const dog =
            result.petTypes.find(
                (
                    item,
                ) =>
                    item.id ===
                    'dog',
            );

        const cat =
            result.petTypes.find(
                (
                    item,
                ) =>
                    item.id ===
                    'cat',
            );

        const other =
            result.petTypes.find(
                (
                    item,
                ) =>
                    item.id ===
                    'other',
            );

        assert.equal(
            dog?.count,
            2,
        );

        assert.equal(
            dog?.percentage,
            66.7,
        );

        assert.equal(
            cat?.count,
            1,
        );

        assert.equal(
            cat?.percentage,
            33.3,
        );

        assert.equal(
            other?.count,
            0,
        );

        assert.equal(
            other?.percentage,
            0,
        );
    },
);

test(
    'sorts distributions by count while preserving configured order for ties',
    () => {
        const leads = [
            createNewsletterLead(),

            createNewsletterLead({
                email:
                    'second@example.com',

                emailHash:
                    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            }),
        ];

        const profiles = [
            createPetProfile({
                petPersonality:
                    'power-chewer',
            }),

            createPetProfile({
                emailHash:
                    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',

                petPersonality:
                    'fetch-fanatic',
            }),
        ];

        const result =
            buildFoundingPackInsights(
                leads,
                profiles,
            );

        assert.equal(
            result.petPersonalities[0]?.id,
            'fetch-fanatic',
        );

        assert.equal(
            result.petPersonalities[1]?.id,
            'power-chewer',
        );
    },
);

test(
    'orders recent profiles by lastSubmittedAt descending',
    () => {
        const leads = [
            createNewsletterLead(),

            createNewsletterLead({
                email:
                    'second@example.com',

                emailHash:
                    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            }),

            createNewsletterLead({
                email:
                    'third@example.com',

                emailHash:
                    'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
            }),
        ];

        const profiles = [
            createPetProfile({
                petName:
                    'Oldest',

                lastSubmittedAt:
                    '2026-08-20T10:00:00.000Z',
            }),

            createPetProfile({
                emailHash:
                    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',

                petName:
                    'Newest',

                lastSubmittedAt:
                    '2026-08-22T10:00:00.000Z',
            }),

            createPetProfile({
                emailHash:
                    'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',

                petName:
                    'Middle',

                lastSubmittedAt:
                    '2026-08-21T10:00:00.000Z',
            }),
        ];

        const result =
            buildFoundingPackInsights(
                leads,
                profiles,
            );

        assert.deepEqual(
            result.recentProfiles.map(
                (
                    profile,
                ) =>
                    profile.petName,
            ),
            [
                'Newest',
                'Middle',
                'Oldest',
            ],
        );
    },
);

test(
    'respects recent profile display limit',
    () => {
        const leads = [
            createNewsletterLead(),

            createNewsletterLead({
                email:
                    'second@example.com',

                emailHash:
                    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            }),
        ];

        const profiles = [
            createPetProfile(),

            createPetProfile({
                emailHash:
                    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',

                petName:
                    'Milo',
            }),
        ];

        const result =
            buildFoundingPackInsights(
                leads,
                profiles,
                {
                    recentProfileLimit:
                        1,
                },
            );

        assert.equal(
            result.recentProfiles.length,
            1,
        );
    },
);

test(
    'does not expose email identifiers in recent profile output',
    () => {
        const result =
            buildFoundingPackInsights(
                [
                    createNewsletterLead(),
                ],
                [
                    createPetProfile(),
                ],
            );

        const serialized =
            JSON.stringify(
                result.recentProfiles,
            );

        assert.equal(
            serialized.includes(
                '"email"',
            ),
            false,
        );

        assert.equal(
            serialized.includes(
                '"emailHash"',
            ),
            false,
        );

        assert.equal(
            serialized.includes(
                '"resendContactId"',
            ),
            false,
        );
    },
);

test(
    'throws for invalid recent profile limit',
    () => {
        assert.throws(
            () =>
                buildFoundingPackInsights(
                    [],
                    [],
                    {
                        recentProfileLimit:
                            101,
                    },
                ),
            /recent-profile limit/,
        );
    },
);

test(
    'throws when a newsletter lead has an invalid updated timestamp',
    () => {
        assert.throws(
            () =>
                buildFoundingPackInsights(
                    [
                        createNewsletterLead(),

                        createNewsletterLead({
                            updatedAt:
                                'not-a-date',
                        }),
                    ],
                    [],
                ),
            /newsletter updatedAt/,
        );
    },
);