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

const HASH_A =
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const HASH_B =
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const HASH_C =
    'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';

function createLead(
    overrides: Partial<NewsletterLeadRecord> = {},
): NewsletterLeadRecord {
    return {
        version:
            1,

        email:
            'one@example.com',

        emailHash:
            HASH_A,

        source:
            'homepage-join-the-pack',

        marketingConsent:
            true,

        marketingPreferenceMethod:
            'prechecked-checkbox-submission',

        consentTextVersion:
            'test-v1',

        firstSubmittedAt:
            '2026-08-20T10:00:00.000Z',

        lastSubmittedAt:
            '2026-08-20T10:00:00.000Z',

        marketingPreferenceUpdatedAt:
            '2026-08-20T10:00:00.000Z',

        lastOptInAt:
            '2026-08-20T10:00:00.000Z',

        submissionCount:
            1,

        resendContactId:
            'contact_1',

        resendTopicId:
            'topic_1',

        resendSyncStatus:
            'synced',

        createdAt:
            '2026-08-20T10:00:00.000Z',

        updatedAt:
            '2026-08-20T10:00:00.000Z',

        ...overrides,
    };
}

function createProfile(
    overrides: Partial<FoundingPackPetProfileRecord> = {},
): FoundingPackPetProfileRecord {
    return {
        version:
            1,

        emailHash:
            HASH_A,

        petName:
            'Luna',

        petType:
            'dog',

        petPersonality:
            'power-chewer',

        launchInterest:
            'toys',

        source:
            'homepage-founding-pack',

        firstSubmittedAt:
            '2026-08-20T10:05:00.000Z',

        lastSubmittedAt:
            '2026-08-20T10:05:00.000Z',

        submissionCount:
            1,

        createdAt:
            '2026-08-20T10:05:00.000Z',

        updatedAt:
            '2026-08-20T10:05:00.000Z',

        ...overrides,
    };
}

function getSegment(
    result: ReturnType<
        typeof buildFoundingPackInsights
    >,

    id:
        string,
) {
    const segment =
        result.segmentInsights.segments.find(
            (
                item,
            ) =>
                item.id ===
                id,
        );

    assert.ok(
        segment,
        `Expected segment ${id}.`,
    );

    return segment;
}

test(
    'counts profiled and campaign-ready members separately',
    () => {
        const result =
            buildFoundingPackInsights(
                [
                    createLead(),

                    createLead({
                        email:
                            'two@example.com',

                        emailHash:
                            HASH_B,

                        marketingConsent:
                            false,

                        marketingPreferenceMethod:
                            'checkbox-unchecked-submission',

                        resendContactId:
                            'contact_2',

                        lastOptInAt:
                            undefined,

                        lastOptOutAt:
                            '2026-08-20T11:00:00.000Z',
                    }),

                    createLead({
                        email:
                            'three@example.com',

                        emailHash:
                            HASH_C,

                        marketingConsent:
                            true,

                        resendContactId:
                            'contact_3',

                        resendSyncStatus:
                            'failed',
                    }),
                ],

                [
                    createProfile(),

                    createProfile({
                        emailHash:
                            HASH_B,

                        petName:
                            'Milo',
                    }),

                    createProfile({
                        emailHash:
                            HASH_C,

                        petName:
                            'Rocky',
                    }),
                ],
            );

        assert.equal(
            result.segmentInsights
                .totalProfiledMembers,
            3,
        );

        assert.equal(
            result.segmentInsights
                .totalMarketingEligibleProfiledMembers,
            1,
        );

        const completed =
            getSegment(
                result,
                'profile:completed',
            );

        assert.equal(
            completed.count,
            3,
        );

        assert.equal(
            completed.marketingEligibleCount,
            1,
        );

        assert.equal(
            completed.marketingEligibilityRate,
            33.3,
        );
    },
);

test(
    'builds campaign readiness for launch interest segments',
    () => {
        const result =
            buildFoundingPackInsights(
                [
                    createLead(),

                    createLead({
                        email:
                            'two@example.com',

                        emailHash:
                            HASH_B,

                        resendContactId:
                            'contact_2',
                    }),
                ],

                [
                    createProfile(),

                    createProfile({
                        emailHash:
                            HASH_B,

                        petName:
                            'Max',

                        launchInterest:
                            'travel',
                    }),
                ],
            );

        const toys =
            getSegment(
                result,
                'launch-interest:toys',
            );

        assert.equal(
            toys.count,
            1,
        );

        assert.equal(
            toys.marketingEligibleCount,
            1,
        );

        assert.equal(
            toys.marketingEligibilityRate,
            100,
        );

        const travel =
            getSegment(
                result,
                'launch-interest:travel',
            );

        assert.equal(
            travel.count,
            1,
        );

        assert.equal(
            travel.marketingEligibleCount,
            1,
        );
    },
);

test(
    'requires consent, synced Resend state and contact id for campaign readiness',
    () => {
        const result =
            buildFoundingPackInsights(
                [
                    createLead(),

                    createLead({
                        email:
                            'opted-out@example.com',

                        emailHash:
                            HASH_B,

                        marketingConsent:
                            false,

                        marketingPreferenceMethod:
                            'checkbox-unchecked-submission',

                        resendContactId:
                            'contact_2',

                        lastOptInAt:
                            undefined,

                        lastOptOutAt:
                            '2026-08-21T10:00:00.000Z',
                    }),

                    createLead({
                        email:
                            'no-contact@example.com',

                        emailHash:
                            HASH_C,

                        resendContactId:
                            undefined,
                    }),
                ],

                [
                    createProfile(),

                    createProfile({
                        emailHash:
                            HASH_B,

                        petName:
                            'Milo',
                    }),

                    createProfile({
                        emailHash:
                            HASH_C,

                        petName:
                            'Charlie',
                    }),
                ],
            );

        const toys =
            getSegment(
                result,
                'launch-interest:toys',
            );

        assert.equal(
            toys.count,
            3,
        );

        assert.equal(
            toys.marketingEligibleCount,
            1,
        );

        assert.equal(
            toys.marketingEligibilityRate,
            33.3,
        );
    },
);

test(
    'segment insight objects contain aggregate values only',
    () => {
        const result =
            buildFoundingPackInsights(
                [
                    createLead(),
                ],

                [
                    createProfile(),
                ],
            );

        const serialized =
            JSON.stringify(
                result.segmentInsights,
            );

        for (
            const prohibitedValue of [
                'one@example.com',
                HASH_A,
                'Luna',
                'contact_1',
            ]
        ) {
            assert.equal(
                serialized.includes(
                    prohibitedValue,
                ),
                false,
                `Segment insights unexpectedly leaked ${prohibitedValue}.`,
            );
        }

        for (
            const prohibitedField of [
                'email',
                'emailHash',
                'firstName',
                'petName',
                'resendContactId',
            ]
        ) {
            assert.equal(
                serialized.includes(
                    `"${prohibitedField}"`,
                ),
                false,
                `Segment insights unexpectedly contain ${prohibitedField}.`,
            );
        }
    },
);

test(
    'empty data produces zeroed segment insights safely',
    () => {
        const result =
            buildFoundingPackInsights(
                [],
                [],
            );

        assert.equal(
            result.segmentInsights
                .totalProfiledMembers,
            0,
        );

        assert.equal(
            result.segmentInsights
                .totalMarketingEligibleProfiledMembers,
            0,
        );

        for (
            const segment of
            result.segmentInsights
                .segments
        ) {
            assert.equal(
                segment.count,
                0,
            );

            assert.equal(
                segment.marketingEligibleCount,
                0,
            );

            assert.equal(
                segment.percentageOfProfiles,
                0,
            );

            assert.equal(
                segment.marketingEligibilityRate,
                0,
            );
        }
    },
);