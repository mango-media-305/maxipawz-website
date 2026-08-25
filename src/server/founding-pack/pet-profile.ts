import { createHash } from 'node:crypto';

import { getStore } from '@netlify/blobs';

import {
    FOUNDING_PACK_LAUNCH_INTERESTS,
    FOUNDING_PACK_PET_PERSONALITIES,
    FOUNDING_PACK_PET_TYPES,
    type FoundingPackLaunchInterest,
    type FoundingPackPetPersonality,
    type FoundingPackPetProfileInput,
    type FoundingPackPetProfileRecord,
    type FoundingPackPetProfileSubmissionResult,
    type FoundingPackPetType,
} from '../../types/founding-pack';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_PET_NAME_LENGTH = 80;

type FoundingPackDataMode = 'test' | 'live';

interface NewsletterLeadReference {
    emailHash?: unknown;
}

export type FoundingPackPetProfileErrorCode =
    | 'invalid-email'
    | 'invalid-pet-name'
    | 'invalid-pet-type'
    | 'invalid-pet-personality'
    | 'invalid-launch-interest'
    | 'newsletter-lead-not-found'
    | 'configuration-error';

export class FoundingPackPetProfileError extends Error {
    readonly code: FoundingPackPetProfileErrorCode;

    readonly status: number;

    constructor(
        code: FoundingPackPetProfileErrorCode,

        status: number,

        message: string,
    ) {
        super(message);

        this.name = 'FoundingPackPetProfileError';

        this.code = code;

        this.status = status;
    }
}

function getDataMode(): FoundingPackDataMode {
    const configured = process.env.NEWSLETTER_DATA_MODE?.trim().toLowerCase();

    if (configured === 'test' || configured === 'live') {
        return configured;
    }

    throw new FoundingPackPetProfileError(
        'configuration-error',
        503,
        'NEWSLETTER_DATA_MODE must be explicitly configured as "test" or "live".',
    );
}

function getNewsletterLeadStore(dataMode: FoundingPackDataMode) {
    return getStore(`maxipawz-newsletter-leads-${dataMode}`, {
        consistency: 'strong',
    });
}

function getPetProfileStore(dataMode: FoundingPackDataMode) {
    return getStore(`maxipawz-founding-pack-profiles-${dataMode}`, {
        consistency: 'strong',
    });
}

function hashEmail(email: string): string {
    return createHash('sha256').update(email, 'utf8').digest('hex');
}

function getEmailKey(emailHash: string): string {
    return `email/${emailHash}`;
}

function normalizeEmail(value: string): string {
    const normalized = value.trim().toLowerCase();

    if (!normalized || normalized.length > 254 || !EMAIL_PATTERN.test(normalized)) {
        throw new FoundingPackPetProfileError(
            'invalid-email',
            400,
            'Please enter a valid email address.',
        );
    }

    return normalized;
}

function normalizePetName(value: string): string {
    const normalized = value.trim().replace(/\s+/g, ' ');

    if (!normalized) {
        throw new FoundingPackPetProfileError(
            'invalid-pet-name',
            400,
            "Please enter your pet's name.",
        );
    }

    if (normalized.length > MAX_PET_NAME_LENGTH) {
        throw new FoundingPackPetProfileError(
            'invalid-pet-name',
            400,
            "Your pet's name is too long.",
        );
    }

    return normalized;
}

function normalizePetType(value: string): FoundingPackPetType {
    const normalized = value.trim().toLowerCase();

    if (!FOUNDING_PACK_PET_TYPES.some((petType) => petType === normalized)) {
        throw new FoundingPackPetProfileError(
            'invalid-pet-type',
            400,
            'Please select a valid pet type.',
        );
    }

    return normalized as FoundingPackPetType;
}

function normalizeOptionalPetPersonality(
    value: string | undefined,
): FoundingPackPetPersonality | undefined {
    if (!value) {
        return undefined;
    }

    const normalized = value.trim().toLowerCase();

    if (!normalized) {
        return undefined;
    }

    if (
        !FOUNDING_PACK_PET_PERSONALITIES.some((petPersonality) => petPersonality === normalized)
    ) {
        throw new FoundingPackPetProfileError(
            'invalid-pet-personality',
            400,
            'Please select a valid pet personality.',
        );
    }

    return normalized as FoundingPackPetPersonality;
}

function normalizeOptionalLaunchInterest(
    value: string | undefined,
): FoundingPackLaunchInterest | undefined {
    if (!value) {
        return undefined;
    }

    const normalized = value.trim().toLowerCase();

    if (!normalized) {
        return undefined;
    }

    if (!FOUNDING_PACK_LAUNCH_INTERESTS.some((launchInterest) => launchInterest === normalized)) {
        throw new FoundingPackPetProfileError(
            'invalid-launch-interest',
            400,
            'Please select a valid launch preference.',
        );
    }

    return normalized as FoundingPackLaunchInterest;
}

async function newsletterLeadExists(
    dataMode: FoundingPackDataMode,

    emailHash: string,
): Promise<boolean> {
    const store = getNewsletterLeadStore(dataMode);

    const lead = (await store.get(getEmailKey(emailHash), {
        type: 'json',
    })) as NewsletterLeadReference | null;

    if (!lead) {
        return false;
    }

    return lead.emailHash === emailHash;
}

async function getPetProfile(
    dataMode: FoundingPackDataMode,

    emailHash: string,
): Promise<FoundingPackPetProfileRecord | null> {
    const store = getPetProfileStore(dataMode);

    return (await store.get(getEmailKey(emailHash), {
        type: 'json',
    })) as FoundingPackPetProfileRecord | null;
}

async function savePetProfile(
    dataMode: FoundingPackDataMode,

    record: FoundingPackPetProfileRecord,
): Promise<void> {
    const store = getPetProfileStore(dataMode);

    await store.setJSON(getEmailKey(record.emailHash), record);
}

export function parseFoundingPackPetProfileInput(
    emailValue: string,

    petNameValue: string,

    petTypeValue: string,

    petPersonalityValue?: string,

    launchInterestValue?: string,
): FoundingPackPetProfileInput {
    return {
        email: normalizeEmail(emailValue),

        petName: normalizePetName(petNameValue),

        petType: normalizePetType(petTypeValue),

        petPersonality: normalizeOptionalPetPersonality(petPersonalityValue),

        launchInterest: normalizeOptionalLaunchInterest(launchInterestValue),

        source: 'homepage-founding-pack',
    };
}

export async function submitFoundingPackPetProfile(
    input: FoundingPackPetProfileInput,
): Promise<FoundingPackPetProfileSubmissionResult> {
    const dataMode = getDataMode();

    /*
     * Normalize again at the persistence boundary.
     *
     * The public HTTP endpoint uses parseFoundingPackPetProfileInput(),
     * but keeping the persistence layer defensive means other future
     * callers cannot accidentally bypass normalization.
     */
    const email = normalizeEmail(input.email);

    const emailHash = hashEmail(email);

    const hasNewsletterLead = await newsletterLeadExists(dataMode, emailHash);

    /*
     * A Founding Pack profile is enrichment for an existing signup,
     * not an independent lead source.
     *
     * This also prevents the profile endpoint from becoming an
     * alternative way to populate customer data without first going
     * through the newsletter signup flow.
     */
    if (!hasNewsletterLead) {
        throw new FoundingPackPetProfileError(
            'newsletter-lead-not-found',
            409,
            'Please join the Maxi Pawz Founding Pack before creating a pet profile.',
        );
    }

    const existing = await getPetProfile(dataMode, emailHash);

    const now = new Date().toISOString();

    const record: FoundingPackPetProfileRecord = {
        version: 1,

        /*
         * Deliberately store only the hash here.
         *
         * The canonical plaintext email remains in the newsletter lead
         * record so we do not duplicate that identifier across stores.
         */
        emailHash,

        petName: normalizePetName(input.petName),

        petType: normalizePetType(input.petType),

        petPersonality: normalizeOptionalPetPersonality(input.petPersonality),

        launchInterest: normalizeOptionalLaunchInterest(input.launchInterest),

        source: input.source,

        firstSubmittedAt: existing?.firstSubmittedAt ?? now,

        lastSubmittedAt: now,

        submissionCount: (existing?.submissionCount ?? 0) + 1,

        createdAt: existing?.createdAt ?? now,

        updatedAt: now,
    };

    await savePetProfile(dataMode, record);

    return {
        accepted: true,

        profileSaved: true,
    };
}