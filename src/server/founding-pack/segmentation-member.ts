import { getStore } from '@netlify/blobs';

import {
    FOUNDING_PACK_LAUNCH_INTERESTS,
    FOUNDING_PACK_PET_PERSONALITIES,
    FOUNDING_PACK_PET_TYPES,
    type FoundingPackPetProfileRecord,
} from '../../types/founding-pack';

import type {
    NewsletterLeadRecord,
} from '../../types/newsletter';

import {
    buildFoundingPackSegmentationSnapshot,
} from '../../lib/founding-pack-segmentation';

import type {
    FoundingPackSegmentationSnapshot,
} from '../../types/founding-pack-segmentation';

export type FoundingPackSegmentationDataMode =
    | 'test'
    | 'live';

interface JsonStore {
    get(
        key: string,
        options: {
            type: 'json';
        },
    ): Promise<unknown>;
}

export interface FoundingPackSegmentationMemberDependencies {
    getNewsletterLeadStore?: (
        dataMode:
            FoundingPackSegmentationDataMode,
    ) => JsonStore;

    getPetProfileStore?: (
        dataMode:
            FoundingPackSegmentationDataMode,
    ) => JsonStore;
}

export interface FoundingPackSegmentationMember {
    /**
     * Canonical recipient identity.
     *
     * This value comes only from the newsletter lead store.
     * It must never be copied into the segmentation snapshot.
     */
    email: string;

    firstName?: string;

    marketingConsent: boolean;

    resendContactId?: string;

    resendSyncStatus:
    NewsletterLeadRecord['resendSyncStatus'];

    segmentation:
    FoundingPackSegmentationSnapshot;
}

const SHA256_PATTERN =
    /^[a-f0-9]{64}$/;

function getDataMode():
    FoundingPackSegmentationDataMode {
    const configured =
        process.env.NEWSLETTER_DATA_MODE
            ?.trim()
            .toLowerCase();

    if (
        configured ===
        'test' ||
        configured ===
        'live'
    ) {
        return configured;
    }

    throw new Error(
        'NEWSLETTER_DATA_MODE must be explicitly configured as "test" or "live".',
    );
}

function getDefaultNewsletterLeadStore(
    dataMode:
        FoundingPackSegmentationDataMode,
): JsonStore {
    return getStore(
        `maxipawz-newsletter-leads-${dataMode}`,
        {
            consistency:
                'strong',
        },
    );
}

function getDefaultPetProfileStore(
    dataMode:
        FoundingPackSegmentationDataMode,
): JsonStore {
    return getStore(
        `maxipawz-founding-pack-profiles-${dataMode}`,
        {
            consistency:
                'strong',
        },
    );
}

function normalizeEmailHash(
    value:
        string,
): string {
    const normalized =
        value
            .trim()
            .toLowerCase();

    if (
        !SHA256_PATTERN.test(
            normalized,
        )
    ) {
        throw new Error(
            'A valid SHA-256 email hash is required for Founding Pack segmentation.',
        );
    }

    return normalized;
}

function getEmailKey(
    emailHash:
        string,
): string {
    return `email/${emailHash}`;
}

function isRecord(
    value:
        unknown,
): value is Record<
    string,
    unknown
> {
    return (
        typeof value ===
        'object' &&
        value !==
        null &&
        !Array.isArray(
            value,
        )
    );
}

function isNewsletterLeadRecord(
    value:
        unknown,

    expectedEmailHash:
        string,
): value is NewsletterLeadRecord {
    if (
        !isRecord(
            value,
        )
    ) {
        return false;
    }

    return (
        value.version ===
        1 &&
        typeof value.email ===
        'string' &&
        value.email.length >
        0 &&
        value.emailHash ===
        expectedEmailHash &&
        typeof value.marketingConsent ===
        'boolean' &&
        (
            value.resendSyncStatus ===
            'pending' ||
            value.resendSyncStatus ===
            'synced' ||
            value.resendSyncStatus ===
            'failed'
        )
    );
}

function isFoundingPackPetProfileRecord(
    value:
        unknown,

    expectedEmailHash:
        string,
): value is FoundingPackPetProfileRecord {
    if (
        !isRecord(
            value,
        )
    ) {
        return false;
    }

    if (
        value.version !==
        1 ||
        value.emailHash !==
        expectedEmailHash ||
        typeof value.petName !==
        'string'
    ) {
        return false;
    }

    if (
        typeof value.petType !==
        'string' ||
        !FOUNDING_PACK_PET_TYPES.some(
            (petType) =>
                petType ===
                value.petType,
        )
    ) {
        return false;
    }

    if (
        value.petPersonality !==
        undefined &&
        (
            typeof value.petPersonality !==
            'string' ||
            !FOUNDING_PACK_PET_PERSONALITIES.some(
                (petPersonality) =>
                    petPersonality ===
                    value.petPersonality,
            )
        )
    ) {
        return false;
    }

    if (
        value.launchInterest !==
        undefined &&
        (
            typeof value.launchInterest !==
            'string' ||
            !FOUNDING_PACK_LAUNCH_INTERESTS.some(
                (launchInterest) =>
                    launchInterest ===
                    value.launchInterest,
            )
        )
    ) {
        return false;
    }

    return true;
}

async function readNewsletterLead(
    store:
        JsonStore,

    emailHash:
        string,
): Promise<NewsletterLeadRecord | null> {
    const value =
        await store.get(
            getEmailKey(
                emailHash,
            ),
            {
                type:
                    'json',
            },
        );

    if (
        !value
    ) {
        return null;
    }

    if (
        !isNewsletterLeadRecord(
            value,
            emailHash,
        )
    ) {
        return null;
    }

    return value;
}

async function readPetProfile(
    store:
        JsonStore,

    emailHash:
        string,
): Promise<FoundingPackPetProfileRecord | null> {
    const value =
        await store.get(
            getEmailKey(
                emailHash,
            ),
            {
                type:
                    'json',
            },
        );

    if (
        !value
    ) {
        return null;
    }

    if (
        !isFoundingPackPetProfileRecord(
            value,
            emailHash,
        )
    ) {
        return null;
    }

    return value;
}

/**
 * Resolve a Founding Pack member from the two canonical
 * data stores.
 *
 * The join happens exclusively through emailHash.
 *
 * Identity remains in the newsletter side of the result,
 * while pet-profile data is reduced to the privacy-safe
 * segmentation snapshot before leaving this function.
 */
export async function getFoundingPackSegmentationMember(
    emailHashValue:
        string,

    dependencies:
        FoundingPackSegmentationMemberDependencies = {},
): Promise<FoundingPackSegmentationMember | null> {
    const emailHash =
        normalizeEmailHash(
            emailHashValue,
        );

    const dataMode =
        getDataMode();

    const newsletterStore =
        dependencies
            .getNewsletterLeadStore?.(
                dataMode,
            ) ??
        getDefaultNewsletterLeadStore(
            dataMode,
        );

    const profileStore =
        dependencies
            .getPetProfileStore?.(
                dataMode,
            ) ??
        getDefaultPetProfileStore(
            dataMode,
        );

    const [
        newsletterLead,
        petProfile,
    ] =
        await Promise.all([
            readNewsletterLead(
                newsletterStore,
                emailHash,
            ),

            readPetProfile(
                profileStore,
                emailHash,
            ),
        ]);

    /*
     * A segmentation member only exists when both canonical
     * records agree on the same hash.
     *
     * Never manufacture a partial member from one side.
     */
    if (
        !newsletterLead ||
        !petProfile
    ) {
        return null;
    }

    const segmentation =
        buildFoundingPackSegmentationSnapshot(
            {
                petType:
                    petProfile.petType,

                petPersonality:
                    petProfile.petPersonality,

                launchInterest:
                    petProfile.launchInterest,
            },
        );

    return {
        email:
            newsletterLead.email,

        ...(newsletterLead.firstName
            ? {
                firstName:
                    newsletterLead.firstName,
            }
            : {}),

        marketingConsent:
            newsletterLead.marketingConsent,

        ...(newsletterLead.resendContactId
            ? {
                resendContactId:
                    newsletterLead.resendContactId,
            }
            : {}),

        resendSyncStatus:
            newsletterLead.resendSyncStatus,

        segmentation,
    };
}