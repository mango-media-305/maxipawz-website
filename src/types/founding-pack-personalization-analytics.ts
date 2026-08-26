import type {
    FoundingPackLaunchInterest,
    FoundingPackPetPersonality,
    FoundingPackPetType,
} from './founding-pack';

import type {
    FoundingPackPersonalizedGuideSlug,
} from './founding-pack-personalization';

export const FOUNDING_PACK_PERSONALIZATION_ANALYTICS_EVENTS = [
    'founding_pet_personalization_loaded',
    'founding_pet_welcome_viewed',
    'founding_pet_guide_recommended',
    'founding_pet_guide_clicked',
    'founding_pet_personalization_forgotten',
] as const;

export type FoundingPackPersonalizationAnalyticsEvent =
    (typeof FOUNDING_PACK_PERSONALIZATION_ANALYTICS_EVENTS)[number];

export interface FoundingPackPersonalizationAnalyticsContext {
    petType: FoundingPackPetType;

    petPersonality?: FoundingPackPetPersonality;

    launchInterest?: FoundingPackLaunchInterest;
}

export interface FoundingPackPersonalizationLoadedAnalyticsEvent
    extends FoundingPackPersonalizationAnalyticsContext {
    event:
    'founding_pet_personalization_loaded';

    personalizedGuideCount:
    number;
}

export interface FoundingPackWelcomeViewedAnalyticsEvent
    extends FoundingPackPersonalizationAnalyticsContext {
    event:
    'founding_pet_welcome_viewed';
}

export interface FoundingPackGuideRecommendedAnalyticsEvent
    extends FoundingPackPersonalizationAnalyticsContext {
    event:
    'founding_pet_guide_recommended';

    guideSlug:
    FoundingPackPersonalizedGuideSlug;

    recommendationPosition:
    number;
}

export interface FoundingPackGuideClickedAnalyticsEvent
    extends FoundingPackPersonalizationAnalyticsContext {
    event:
    'founding_pet_guide_clicked';

    guideSlug:
    FoundingPackPersonalizedGuideSlug;

    recommendationPosition:
    number;

    personalized:
    boolean;
}

export interface FoundingPackPersonalizationForgottenAnalyticsEvent
    extends FoundingPackPersonalizationAnalyticsContext {
    event:
    'founding_pet_personalization_forgotten';
}

export type FoundingPackPersonalizationAnalyticsPayload =
    | FoundingPackPersonalizationLoadedAnalyticsEvent
    | FoundingPackWelcomeViewedAnalyticsEvent
    | FoundingPackGuideRecommendedAnalyticsEvent
    | FoundingPackGuideClickedAnalyticsEvent
    | FoundingPackPersonalizationForgottenAnalyticsEvent;