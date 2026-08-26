import type {
    FoundingPackLaunchInterest,
    FoundingPackPetPersonality,
    FoundingPackPetType,
} from './founding-pack';

export const FOUNDING_PACK_PERSONALIZATION_VERSION = 1 as const;

export const FOUNDING_PACK_PERSONALIZATION_STORAGE_KEY = 'maxipawz-founding-pet';

export interface FoundingPackPersonalizationProfile {
    version: typeof FOUNDING_PACK_PERSONALIZATION_VERSION;

    petName: string;

    petType: FoundingPackPetType;

    petPersonality?: FoundingPackPetPersonality;

    launchInterest?: FoundingPackLaunchInterest;

    savedAt: string;
}

export type FoundingPackPersonalizedGuideSlug =
    | 'dog-hydration-miami-heat'
    | 'play-and-enrichment'
    | 'walk-and-travel'
    | 'feeding-and-hydration';

export interface FoundingPackPersonalizedMessaging {
    greeting: string;

    profileSummary: string;

    guideHeading: string;

    guideDescription: string;

    launchMessage?: string;
}