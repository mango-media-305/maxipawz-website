import assert from 'node:assert/strict';

import test from 'node:test';

import {
    buildFoundingPackAnalyticsContext,
    buildFoundingPackAnalyticsEvent,
} from '../../src/lib/founding-pack-personalization-analytics';

import {
    FOUNDING_PACK_PERSONALIZATION_ANALYTICS_EVENTS,
    type FoundingPackPersonalizationAnalyticsPayload,
} from '../../src/types/founding-pack-personalization-analytics';

import type {
    FoundingPackPersonalizationProfile,
} from '../../src/types/founding-pack-personalization';

function createProfile(
    overrides: Partial<FoundingPackPersonalizationProfile> = {},
): FoundingPackPersonalizationProfile {
    return {
        version: 1,
        petName: 'Luna',
        petType: 'dog',
        petPersonality: 'adventure-buddy',
        launchInterest: 'travel',
        savedAt: '2026-08-26T12:00:00.000Z',

        ...overrides,
    };
}

test(
    'defines the complete founding pet personalization analytics event contract',
    () => {
        assert.deepEqual(
            FOUNDING_PACK_PERSONALIZATION_ANALYTICS_EVENTS,
            [
                'founding_pet_personalization_loaded',
                'founding_pet_welcome_viewed',
                'founding_pet_guide_recommended',
                'founding_pet_guide_clicked',
                'founding_pet_personalization_forgotten',
            ],
        );
    },
);

test(
    'builds analytics context from only anonymous pet categories',
    () => {
        const profile =
            createProfile();

        const context =
            buildFoundingPackAnalyticsContext(
                profile,
            );

        assert.deepEqual(
            context,
            {
                petType:
                    'dog',

                petPersonality:
                    'adventure-buddy',

                launchInterest:
                    'travel',
            },
        );
    },
);

test(
    'does not expose pet name or profile metadata in analytics context',
    () => {
        const profile =
            createProfile();

        const context =
            buildFoundingPackAnalyticsContext(
                profile,
            );

        const contextRecord =
            context as Record<
                string,
                unknown
            >;

        assert.equal(
            'petName' in
            contextRecord,
            false,
        );

        assert.equal(
            'savedAt' in
            contextRecord,
            false,
        );

        assert.equal(
            'version' in
            contextRecord,
            false,
        );
    },
);

test(
    'omits optional analytics context values when the pet profile does not contain them',
    () => {
        const profile =
            createProfile({
                petPersonality:
                    undefined,

                launchInterest:
                    undefined,
            });

        const context =
            buildFoundingPackAnalyticsContext(
                profile,
            );

        assert.deepEqual(
            context,
            {
                petType:
                    'dog',
            },
        );

        assert.equal(
            'petPersonality' in
            context,
            false,
        );

        assert.equal(
            'launchInterest' in
            context,
            false,
        );
    },
);

test(
    'builds personalization-loaded analytics payload',
    () => {
        const event =
            buildFoundingPackAnalyticsEvent(
                {
                    event:
                        'founding_pet_personalization_loaded',

                    petType:
                        'dog',

                    petPersonality:
                        'adventure-buddy',

                    launchInterest:
                        'travel',

                    personalizedGuideCount:
                        3,
                },
            );

        assert.deepEqual(
            event,
            {
                eventName:
                    'founding_pet_personalization_loaded',

                parameters:
                {
                    pet_type:
                        'dog',

                    pet_personality:
                        'adventure-buddy',

                    launch_interest:
                        'travel',

                    personalized_guide_count:
                        3,
                },
            },
        );
    },
);

test(
    'builds Welcome Back impression analytics payload',
    () => {
        const event =
            buildFoundingPackAnalyticsEvent(
                {
                    event:
                        'founding_pet_welcome_viewed',

                    petType:
                        'dog',

                    petPersonality:
                        'adventure-buddy',

                    launchInterest:
                        'travel',
                },
            );

        assert.deepEqual(
            event,
            {
                eventName:
                    'founding_pet_welcome_viewed',

                parameters:
                {
                    pet_type:
                        'dog',

                    pet_personality:
                        'adventure-buddy',

                    launch_interest:
                        'travel',
                },
            },
        );
    },
);

test(
    'builds personalized guide recommendation analytics payload',
    () => {
        const event =
            buildFoundingPackAnalyticsEvent(
                {
                    event:
                        'founding_pet_guide_recommended',

                    petType:
                        'dog',

                    petPersonality:
                        'adventure-buddy',

                    launchInterest:
                        'travel',

                    guideSlug:
                        'walk-and-travel',

                    recommendationPosition:
                        1,
                },
            );

        assert.deepEqual(
            event,
            {
                eventName:
                    'founding_pet_guide_recommended',

                parameters:
                {
                    pet_type:
                        'dog',

                    pet_personality:
                        'adventure-buddy',

                    launch_interest:
                        'travel',

                    guide_slug:
                        'walk-and-travel',

                    recommendation_position:
                        1,
                },
            },
        );
    },
);

test(
    'builds personalized guide click analytics payload',
    () => {
        const event =
            buildFoundingPackAnalyticsEvent(
                {
                    event:
                        'founding_pet_guide_clicked',

                    petType:
                        'dog',

                    petPersonality:
                        'adventure-buddy',

                    launchInterest:
                        'travel',

                    guideSlug:
                        'walk-and-travel',

                    recommendationPosition:
                        1,

                    personalized:
                        true,
                },
            );

        assert.deepEqual(
            event,
            {
                eventName:
                    'founding_pet_guide_clicked',

                parameters:
                {
                    pet_type:
                        'dog',

                    pet_personality:
                        'adventure-buddy',

                    launch_interest:
                        'travel',

                    guide_slug:
                        'walk-and-travel',

                    recommendation_position:
                        1,

                    personalized:
                        true,
                },
            },
        );
    },
);

test(
    'distinguishes non-recommended guide clicks from personalized clicks',
    () => {
        const event =
            buildFoundingPackAnalyticsEvent(
                {
                    event:
                        'founding_pet_guide_clicked',

                    petType:
                        'dog',

                    petPersonality:
                        'adventure-buddy',

                    launchInterest:
                        'travel',

                    guideSlug:
                        'play-and-enrichment',

                    recommendationPosition:
                        4,

                    personalized:
                        false,
                },
            );

        assert.equal(
            event.parameters
                .guide_slug,
            'play-and-enrichment',
        );

        assert.equal(
            event.parameters
                .recommendation_position,
            4,
        );

        assert.equal(
            event.parameters
                .personalized,
            false,
        );
    },
);

test(
    'builds personalization-forgotten analytics payload',
    () => {
        const event =
            buildFoundingPackAnalyticsEvent(
                {
                    event:
                        'founding_pet_personalization_forgotten',

                    petType:
                        'dog',

                    petPersonality:
                        'adventure-buddy',

                    launchInterest:
                        'travel',
                },
            );

        assert.deepEqual(
            event,
            {
                eventName:
                    'founding_pet_personalization_forgotten',

                parameters:
                {
                    pet_type:
                        'dog',

                    pet_personality:
                        'adventure-buddy',

                    launch_interest:
                        'travel',
                },
            },
        );
    },
);

test(
    'supports analytics for cat profiles without manufacturing guide recommendations',
    () => {
        const context =
            buildFoundingPackAnalyticsContext(
                createProfile({
                    petType:
                        'cat',

                    petPersonality:
                        'professional-napper',

                    launchInterest:
                        'toys',
                }),
            );

        const event =
            buildFoundingPackAnalyticsEvent(
                {
                    event:
                        'founding_pet_personalization_loaded',

                    ...context,

                    personalizedGuideCount:
                        0,
                },
            );

        assert.deepEqual(
            event.parameters,
            {
                pet_type:
                    'cat',

                pet_personality:
                    'professional-napper',

                launch_interest:
                    'toys',

                personalized_guide_count:
                    0,
            },
        );
    },
);

test(
    'analytics event builder strips unexpected personal identifiers',
    () => {
        const unsafePayload = {
            event:
                'founding_pet_guide_clicked',

            petType:
                'dog',

            petPersonality:
                'adventure-buddy',

            launchInterest:
                'travel',

            guideSlug:
                'walk-and-travel',

            recommendationPosition:
                1,

            personalized:
                true,

            petName:
                'Luna',

            email:
                'person@example.com',

            emailHash:
                'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',

            firstName:
                'Michel',

            resendContactId:
                'contact_123',

            savedAt:
                '2026-08-26T12:00:00.000Z',
        } as FoundingPackPersonalizationAnalyticsPayload & {
            petName:
            string;

            email:
            string;

            emailHash:
            string;

            firstName:
            string;

            resendContactId:
            string;

            savedAt:
            string;
        };

        const event =
            buildFoundingPackAnalyticsEvent(
                unsafePayload,
            );

        assert.deepEqual(
            Object.keys(
                event.parameters,
            ).sort(),
            [
                'guide_slug',
                'launch_interest',
                'personalized',
                'pet_personality',
                'pet_type',
                'recommendation_position',
            ].sort(),
        );

        assert.equal(
            'pet_name' in
            event.parameters,
            false,
        );

        assert.equal(
            'petName' in
            event.parameters,
            false,
        );

        assert.equal(
            'email' in
            event.parameters,
            false,
        );

        assert.equal(
            'email_hash' in
            event.parameters,
            false,
        );

        assert.equal(
            'emailHash' in
            event.parameters,
            false,
        );

        assert.equal(
            'first_name' in
            event.parameters,
            false,
        );

        assert.equal(
            'firstName' in
            event.parameters,
            false,
        );

        assert.equal(
            'resendContactId' in
            event.parameters,
            false,
        );

        assert.equal(
            'savedAt' in
            event.parameters,
            false,
        );

        const serialized =
            JSON.stringify(
                event,
            );

        assert.equal(
            serialized.includes(
                'Luna',
            ),
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
    'every analytics event emits only approved parameter names',
    () => {
        const approvedParameters =
            new Set([
                'pet_type',
                'pet_personality',
                'launch_interest',
                'personalized_guide_count',
                'guide_slug',
                'recommendation_position',
                'personalized',
            ]);

        const events: FoundingPackPersonalizationAnalyticsPayload[] =
            [
                {
                    event:
                        'founding_pet_personalization_loaded',

                    petType:
                        'dog',

                    petPersonality:
                        'adventure-buddy',

                    launchInterest:
                        'travel',

                    personalizedGuideCount:
                        3,
                },

                {
                    event:
                        'founding_pet_welcome_viewed',

                    petType:
                        'dog',

                    petPersonality:
                        'adventure-buddy',

                    launchInterest:
                        'travel',
                },

                {
                    event:
                        'founding_pet_guide_recommended',

                    petType:
                        'dog',

                    petPersonality:
                        'adventure-buddy',

                    launchInterest:
                        'travel',

                    guideSlug:
                        'walk-and-travel',

                    recommendationPosition:
                        1,
                },

                {
                    event:
                        'founding_pet_guide_clicked',

                    petType:
                        'dog',

                    petPersonality:
                        'adventure-buddy',

                    launchInterest:
                        'travel',

                    guideSlug:
                        'walk-and-travel',

                    recommendationPosition:
                        1,

                    personalized:
                        true,
                },

                {
                    event:
                        'founding_pet_personalization_forgotten',

                    petType:
                        'dog',

                    petPersonality:
                        'adventure-buddy',

                    launchInterest:
                        'travel',
                },
            ];

        for (
            const payload of
            events
        ) {
            const event =
                buildFoundingPackAnalyticsEvent(
                    payload,
                );

            for (
                const parameterName of
                Object.keys(
                    event.parameters,
                )
            ) {
                assert.equal(
                    approvedParameters.has(
                        parameterName,
                    ),
                    true,
                    `Unexpected analytics parameter: ${parameterName}`,
                );
            }
        }
    },
);