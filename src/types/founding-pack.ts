export const FOUNDING_PACK_PET_TYPES = ['dog', 'cat', 'other'] as const;

export type FoundingPackPetType = (typeof FOUNDING_PACK_PET_TYPES)[number];

export const FOUNDING_PACK_PET_PERSONALITIES = [
    'fetch-fanatic',
    'power-chewer',
    'puzzle-master',
    'professional-napper',
    'adventure-buddy',
    'something-else',
] as const;

export type FoundingPackPetPersonality = (typeof FOUNDING_PACK_PET_PERSONALITIES)[number];

export const FOUNDING_PACK_LAUNCH_INTERESTS = [
    'toys',
    'treats',
    'walking',
    'travel',
    'feeding',
    'accessories',
] as const;

export type FoundingPackLaunchInterest = (typeof FOUNDING_PACK_LAUNCH_INTERESTS)[number];

export interface FoundingPackPetProfileInput {
    email: string;

    petName: string;

    petType: FoundingPackPetType;

    petPersonality?: FoundingPackPetPersonality;

    launchInterest?: FoundingPackLaunchInterest;

    source: 'homepage-founding-pack';
}

export interface FoundingPackPetProfileRecord {
    version: 1;

    emailHash: string;

    petName: string;

    petType: FoundingPackPetType;

    petPersonality?: FoundingPackPetPersonality;

    launchInterest?: FoundingPackLaunchInterest;

    source: 'homepage-founding-pack';

    firstSubmittedAt: string;

    lastSubmittedAt: string;

    submissionCount: number;

    createdAt: string;

    updatedAt: string;
}

export interface FoundingPackPetProfileSubmissionResult {
    accepted: true;

    profileSaved: true;
}