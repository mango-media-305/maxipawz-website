import assert from 'node:assert/strict';

import test from 'node:test';

import {
    buildFoundingPackPersonalizedMessaging,
    createFoundingPackPersonalizationProfile,
    deserializeFoundingPackPersonalizationProfile,
    getPersonalizedGuidePriorities,
    parseFoundingPackPersonalizationProfile,
    serializeFoundingPackPersonalizationProfile,
} from '../../src/lib/founding-pack-personalization';

import {
    FOUNDING_PACK_PERSONALIZATION_STORAGE_KEY,
    FOUNDING_PACK_PERSONALIZATION_VERSION,
    type FoundingPackPersonalizationProfile,
} from '../../src/types/founding-pack-personalization';

function createProfile(
    overrides: Partial<FoundingPackPersonalizationProfile> = {},
): FoundingPackPersonalizationProfile {
    return {
        version:
            FOUNDING_PACK_PERSONALIZATION_VERSION,

        petName:
            'Luna',

        petType:
            'dog',

        petPersonality:
            'adventure-buddy',

        launchInterest:
            'travel',

        savedAt:
            '2026-08-26T12:00:00.000Z',

        ...overrides,
    };
}

test(
    'uses a versioned browser storage key without personal identifiers',
    () => {
        assert.equal(
            FOUNDING_PACK_PERSONALIZATION_STORAGE_KEY,
            'maxipawz-founding-pet',
        );

        assert.equal(
            FOUNDING_PACK_PERSONALIZATION_VERSION,
            1,
        );

        const lowerKey =
            FOUNDING_PACK_PERSONALIZATION_STORAGE_KEY.toLowerCase();

        assert.equal(
            lowerKey.includes(
                'email',
            ),
            false,
        );

        assert.equal(
            lowerKey.includes(
                'hash',
            ),
            false,
        );
    },
);

test(
    'creates a normalized personalization profile',
    () => {
        const profile =
            createFoundingPackPersonalizationProfile(
                {
                    petName:
                        '   Luna    Marie   ',

                    petType:
                        'dog',

                    petPersonality:
                        'adventure-buddy',

                    launchInterest:
                        'travel',
                },

                new Date(
                    '2026-08-26T15:30:00.000Z',
                ),
            );

        assert.deepEqual(
            profile,
            {
                version:
                    1,

                petName:
                    'Luna Marie',

                petType:
                    'dog',

                petPersonality:
                    'adventure-buddy',

                launchInterest:
                    'travel',

                savedAt:
                    '2026-08-26T15:30:00.000Z',
            },
        );
    },
);

test(
    'does not add optional profile fields when they were not provided',
    () => {
        const profile =
            createFoundingPackPersonalizationProfile(
                {
                    petName:
                        'Max',

                    petType:
                        'dog',
                },

                new Date(
                    '2026-08-26T15:30:00.000Z',
                ),
            );

        assert.deepEqual(
            profile,
            {
                version:
                    1,

                petName:
                    'Max',

                petType:
                    'dog',

                savedAt:
                    '2026-08-26T15:30:00.000Z',
            },
        );

        assert.equal(
            'petPersonality' in
            profile,
            false,
        );

        assert.equal(
            'launchInterest' in
            profile,
            false,
        );
    },
);

test(
    'rejects empty pet names when creating a personalization profile',
    () => {
        assert.throws(
            () =>
                createFoundingPackPersonalizationProfile(
                    {
                        petName:
                            '    ',

                        petType:
                            'dog',
                    },
                ),

            /valid pet name/i,
        );
    },
);

test(
    'rejects pet names longer than the profile limit',
    () => {
        assert.throws(
            () =>
                createFoundingPackPersonalizationProfile(
                    {
                        petName:
                            'a'.repeat(
                                81,
                            ),

                        petType:
                            'dog',
                    },
                ),

            /valid pet name/i,
        );
    },
);

test(
    'rejects invalid dates when creating a personalization profile',
    () => {
        assert.throws(
            () =>
                createFoundingPackPersonalizationProfile(
                    {
                        petName:
                            'Luna',

                        petType:
                            'dog',
                    },

                    new Date(
                        'not-a-date',
                    ),
                ),

            /invalid date/i,
        );
    },
);

test(
    'parses a valid personalization profile',
    () => {
        const result =
            parseFoundingPackPersonalizationProfile(
                {
                    version:
                        1,

                    petName:
                        '  Luna   ',

                    petType:
                        'dog',

                    petPersonality:
                        'adventure-buddy',

                    launchInterest:
                        'travel',

                    savedAt:
                        '2026-08-26T12:00:00.000Z',
                },
            );

        assert.deepEqual(
            result,
            createProfile(),
        );
    },
);

test(
    'rejects personalization data from an unsupported version',
    () => {
        const result =
            parseFoundingPackPersonalizationProfile(
                {
                    ...createProfile(),

                    version:
                        2,
                },
            );

        assert.equal(
            result,
            null,
        );
    },
);

test(
    'rejects an invalid pet type from browser-controlled storage',
    () => {
        const result =
            parseFoundingPackPersonalizationProfile(
                {
                    ...createProfile(),

                    petType:
                        'dragon',
                },
            );

        assert.equal(
            result,
            null,
        );
    },
);

test(
    'rejects an invalid personality from browser-controlled storage',
    () => {
        const result =
            parseFoundingPackPersonalizationProfile(
                {
                    ...createProfile(),

                    petPersonality:
                        'very-good-boy',
                },
            );

        assert.equal(
            result,
            null,
        );
    },
);

test(
    'rejects an invalid launch interest from browser-controlled storage',
    () => {
        const result =
            parseFoundingPackPersonalizationProfile(
                {
                    ...createProfile(),

                    launchInterest:
                        'everything',
                },
            );

        assert.equal(
            result,
            null,
        );
    },
);

test(
    'rejects invalid saved timestamps from browser-controlled storage',
    () => {
        const result =
            parseFoundingPackPersonalizationProfile(
                {
                    ...createProfile(),

                    savedAt:
                        'yesterday-ish',
                },
            );

        assert.equal(
            result,
            null,
        );
    },
);

test(
    'returns null instead of throwing for malformed serialized browser storage',
    () => {
        const result =
            deserializeFoundingPackPersonalizationProfile(
                '{ definitely not valid json',
            );

        assert.equal(
            result,
            null,
        );
    },
);

test(
    'serializes and deserializes a valid profile without changing its data',
    () => {
        const profile =
            createProfile();

        const serialized =
            serializeFoundingPackPersonalizationProfile(
                profile,
            );

        const restored =
            deserializeFoundingPackPersonalizationProfile(
                serialized,
            );

        assert.deepEqual(
            restored,
            profile,
        );
    },
);

test(
    'strips unexpected personal identifiers before browser serialization',
    () => {
        const unsafeProfile = {
            ...createProfile(),

            email:
                'person@example.com',

            emailHash:
                'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',

            firstName:
                'Michel',

            marketingConsent:
                true,

            resendContactId:
                'contact_123',
        };

        const serialized =
            serializeFoundingPackPersonalizationProfile(
                unsafeProfile,
            );

        const parsed =
            JSON.parse(
                serialized,
            ) as Record<
                string,
                unknown
            >;

        assert.deepEqual(
            Object.keys(
                parsed,
            ).sort(),
            [
                'launchInterest',
                'petName',
                'petPersonality',
                'petType',
                'savedAt',
                'version',
            ].sort(),
        );

        assert.equal(
            'email' in
            parsed,
            false,
        );

        assert.equal(
            'emailHash' in
            parsed,
            false,
        );

        assert.equal(
            'firstName' in
            parsed,
            false,
        );

        assert.equal(
            'marketingConsent' in
            parsed,
            false,
        );

        assert.equal(
            'resendContactId' in
            parsed,
            false,
        );

        assert.equal(
            serialized.includes(
                'person@example.com',
            ),
            false,
        );

        assert.equal(
            serialized.includes(
                'contact_123',
            ),
            false,
        );
    },
);

test(
    'strips unexpected fields when parsing user-controlled browser data',
    () => {
        const parsed =
            parseFoundingPackPersonalizationProfile(
                {
                    ...createProfile(),

                    arbitrarySecret:
                        'should-not-survive',

                    email:
                        'person@example.com',
                },
            );

        assert.ok(
            parsed,
        );

        assert.deepEqual(
            Object.keys(
                parsed,
            ).sort(),
            [
                'launchInterest',
                'petName',
                'petPersonality',
                'petType',
                'savedAt',
                'version',
            ].sort(),
        );

        assert.equal(
            'arbitrarySecret' in
            parsed,
            false,
        );

        assert.equal(
            'email' in
            parsed,
            false,
        );
    },
);

test(
    'gives explicit travel interest priority over adventure personality inference',
    () => {
        const priorities =
            getPersonalizedGuidePriorities(
                createProfile({
                    petPersonality:
                        'adventure-buddy',

                    launchInterest:
                        'travel',
                }),
            );

        assert.deepEqual(
            priorities,
            [
                'walk-and-travel',
                'feeding-and-hydration',
                'dog-hydration-miami-heat',
            ],
        );
    },
);

test(
    'deduplicates guide priorities when interest and personality point to the same guide',
    () => {
        const priorities =
            getPersonalizedGuidePriorities(
                createProfile({
                    petPersonality:
                        'power-chewer',

                    launchInterest:
                        'toys',
                }),
            );

        assert.deepEqual(
            priorities,
            [
                'play-and-enrichment',
            ],
        );
    },
);

test(
    'maps walking interest to walk and warm-weather hydration guidance',
    () => {
        const priorities =
            getPersonalizedGuidePriorities(
                createProfile({
                    petPersonality:
                        undefined,

                    launchInterest:
                        'walking',
                }),
            );

        assert.deepEqual(
            priorities,
            [
                'walk-and-travel',
                'dog-hydration-miami-heat',
            ],
        );
    },
);

test(
    'maps feeding interest to feeding and hydration guidance',
    () => {
        const priorities =
            getPersonalizedGuidePriorities(
                createProfile({
                    petPersonality:
                        undefined,

                    launchInterest:
                        'feeding',
                }),
            );

        assert.deepEqual(
            priorities,
            [
                'feeding-and-hydration',
            ],
        );
    },
);

test(
    'does not personalize dog-specific guides for cat profiles',
    () => {
        const priorities =
            getPersonalizedGuidePriorities(
                createProfile({
                    petType:
                        'cat',

                    petPersonality:
                        'puzzle-master',

                    launchInterest:
                        'toys',
                }),
            );

        assert.deepEqual(
            priorities,
            [],
        );
    },
);

test(
    'does not personalize dog-specific guides for other pet profiles',
    () => {
        const priorities =
            getPersonalizedGuidePriorities(
                createProfile({
                    petType:
                        'other',

                    petPersonality:
                        'adventure-buddy',

                    launchInterest:
                        'travel',
                }),
            );

        assert.deepEqual(
            priorities,
            [],
        );
    },
);

test(
    'does not manufacture guide priorities when no current content matches the profile',
    () => {
        const priorities =
            getPersonalizedGuidePriorities(
                createProfile({
                    petPersonality:
                        'professional-napper',

                    launchInterest:
                        undefined,
                }),
            );

        assert.deepEqual(
            priorities,
            [],
        );
    },
);

test(
    'builds personalized messaging for a dog profile with matching guides',
    () => {
        const messaging =
            buildFoundingPackPersonalizedMessaging(
                createProfile({
                    petName:
                        'Luna',

                    petType:
                        'dog',

                    petPersonality:
                        'adventure-buddy',

                    launchInterest:
                        'travel',
                }),
            );

        assert.equal(
            messaging.greeting,
            'Welcome back, Luna 🐾',
        );

        assert.equal(
            messaging.profileSummary,
            'Dog · Adventure Buddy',
        );

        assert.equal(
            messaging.guideHeading,
            'A few guides picked with Luna in mind.',
        );

        assert.equal(
            messaging.guideDescription,
            "Based on Luna's profile, we're putting a few especially relevant guides first.",
        );

        assert.equal(
            messaging.launchMessage,
            "Luna's profile says travel matters. We'll keep adventures away from home in mind as Maxi Pawz grows.",
        );
    },
);

test(
    'uses safe fallback guide messaging for a cat profile',
    () => {
        const messaging =
            buildFoundingPackPersonalizedMessaging(
                createProfile({
                    petName:
                        'Milo',

                    petType:
                        'cat',

                    petPersonality:
                        'professional-napper',

                    launchInterest:
                        'toys',
                }),
            );

        assert.equal(
            messaging.greeting,
            'Welcome back, Milo 🐾',
        );

        assert.equal(
            messaging.profileSummary,
            'Cat · Professional Napper',
        );

        assert.equal(
            messaging.guideHeading,
            'Explore the latest Maxi Pawz pet guides.',
        );

        assert.equal(
            messaging.guideDescription,
            "We're still growing our guide library, so we won't pretend dog-specific advice is right for every pet.",
        );
    },
);

test(
    'handles pet names ending in s when building possessive messaging',
    () => {
        const messaging =
            buildFoundingPackPersonalizedMessaging(
                createProfile({
                    petName:
                        'James',

                    petPersonality:
                        undefined,

                    launchInterest:
                        'walking',
                }),
            );

        assert.equal(
            messaging.launchMessage,
            "James' profile says walks matter. We'll keep walking gear and everyday adventures in mind as we build the collection.",
        );
    },
);