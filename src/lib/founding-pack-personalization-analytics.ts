import type {
    FoundingPackPersonalizationProfile,
} from '../types/founding-pack-personalization';

import type {
    FoundingPackPersonalizationAnalyticsContext,
    FoundingPackPersonalizationAnalyticsPayload,
} from '../types/founding-pack-personalization-analytics';

export interface FoundingPackAnalyticsEventData {
    eventName:
    FoundingPackPersonalizationAnalyticsPayload['event'];

    parameters:
    Record<
        string,
        boolean |
        number |
        string
    >;
}

export function buildFoundingPackAnalyticsContext(
    profile:
        FoundingPackPersonalizationProfile,
): FoundingPackPersonalizationAnalyticsContext {
    return {
        petType:
            profile.petType,

        ...(profile.petPersonality
            ? {
                petPersonality:
                    profile.petPersonality,
            }
            : {}),

        ...(profile.launchInterest
            ? {
                launchInterest:
                    profile.launchInterest,
            }
            : {}),
    };
}

export function buildFoundingPackAnalyticsEvent(
    payload:
        FoundingPackPersonalizationAnalyticsPayload,
): FoundingPackAnalyticsEventData {
    const parameters: Record<
        string,
        boolean |
        number |
        string
    > = {
        pet_type:
            payload.petType,
    };

    if (
        payload.petPersonality
    ) {
        parameters.pet_personality =
            payload.petPersonality;
    }

    if (
        payload.launchInterest
    ) {
        parameters.launch_interest =
            payload.launchInterest;
    }

    switch (
    payload.event
    ) {
        case 'founding_pet_personalization_loaded':
            parameters.personalized_guide_count =
                payload.personalizedGuideCount;

            break;

        case 'founding_pet_guide_recommended':
            parameters.guide_slug =
                payload.guideSlug;

            parameters.recommendation_position =
                payload.recommendationPosition;

            break;

        case 'founding_pet_guide_clicked':
            parameters.guide_slug =
                payload.guideSlug;

            parameters.recommendation_position =
                payload.recommendationPosition;

            parameters.personalized =
                payload.personalized;

            break;

        case 'founding_pet_welcome_viewed':
        case 'founding_pet_personalization_forgotten':
            break;
    }

    return {
        eventName:
            payload.event,

        parameters,
    };
}