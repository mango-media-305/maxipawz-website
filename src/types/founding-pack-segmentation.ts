import type {
    FoundingPackLaunchInterest,
    FoundingPackPetPersonality,
    FoundingPackPetType,
} from './founding-pack';

export const FOUNDING_PACK_SEGMENTATION_VERSION =
    1 as const;

export const FOUNDING_PACK_PROFILE_SEGMENTS = [
    'profile:completed',
] as const;

export const FOUNDING_PACK_PET_TYPE_SEGMENTS = [
    'pet-type:dog',
    'pet-type:cat',
    'pet-type:other',
] as const;

export const FOUNDING_PACK_PET_PERSONALITY_SEGMENTS = [
    'pet-personality:fetch-fanatic',
    'pet-personality:power-chewer',
    'pet-personality:puzzle-master',
    'pet-personality:professional-napper',
    'pet-personality:adventure-buddy',
    'pet-personality:something-else',
] as const;

export const FOUNDING_PACK_LAUNCH_INTEREST_SEGMENTS = [
    'launch-interest:toys',
    'launch-interest:treats',
    'launch-interest:walking',
    'launch-interest:travel',
    'launch-interest:feeding',
    'launch-interest:accessories',
] as const;

export const FOUNDING_PACK_SEGMENTS = [
    ...FOUNDING_PACK_PROFILE_SEGMENTS,
    ...FOUNDING_PACK_PET_TYPE_SEGMENTS,
    ...FOUNDING_PACK_PET_PERSONALITY_SEGMENTS,
    ...FOUNDING_PACK_LAUNCH_INTEREST_SEGMENTS,
] as const;

export type FoundingPackSegment =
    (typeof FOUNDING_PACK_SEGMENTS)[number];

/**
 * Privacy-minimized input accepted by the segmentation
 * domain.
 *
 * Do not expand this interface with customer identity,
 * pet name, email hashes, timestamps, Resend IDs, or
 * submission metadata.
 */
export interface FoundingPackSegmentationInput {
    petType: FoundingPackPetType;

    petPersonality?: FoundingPackPetPersonality;

    launchInterest?: FoundingPackLaunchInterest;
}

/**
 * Vendor-neutral segmentation state.
 *
 * This may later be projected into Resend contact
 * properties, admin reporting, exports, or campaign
 * selection without exposing the complete pet profile.
 */
export interface FoundingPackSegmentationSnapshot {
    version: typeof FOUNDING_PACK_SEGMENTATION_VERSION;

    profileCompleted: true;

    petType: FoundingPackPetType;

    petPersonality?: FoundingPackPetPersonality;

    launchInterest?: FoundingPackLaunchInterest;

    segments: FoundingPackSegment[];
}