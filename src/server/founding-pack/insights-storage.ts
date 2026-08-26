import { getStore } from '@netlify/blobs';

import {
    FOUNDING_PACK_LAUNCH_INTERESTS,
    FOUNDING_PACK_PET_PERSONALITIES,
    FOUNDING_PACK_PET_TYPES,
    type FoundingPackPetProfileRecord,
} from '../../types/founding-pack';

import type { FoundingPackInsightsData } from '../../types/founding-pack-insights';

import type {
    NewsletterLeadRecord,
    NewsletterMarketingPreferenceMethod,
    NewsletterResendSyncStatus,
    NewsletterSource,
} from '../../types/newsletter';

import { buildFoundingPackInsights } from './insights';

type FoundingPackInsightsDataMode = 'test' | 'live';

interface BlobListEntry {
    key: string;
}

interface BlobListResult {
    blobs: BlobListEntry[];
}

interface JsonListStore {
    list(options?: {
        prefix?: string;
    }): Promise<BlobListResult>;

    get(
        key: string,
        options: {
            type: 'json';
        },
    ): Promise<unknown>;
}

export interface FoundingPackInsightsStorageDependencies {
    getNewsletterLeadStore?: (
        dataMode: FoundingPackInsightsDataMode,
    ) => JsonListStore;

    getPetProfileStore?: (
        dataMode: FoundingPackInsightsDataMode,
    ) => JsonListStore;

    now?: Date;
}

const NEWSLETTER_SOURCES = [
    'homepage-join-the-pack',
    'homepage-welcome-discount-popup',
] as const satisfies readonly NewsletterSource[];

const NEWSLETTER_MARKETING_PREFERENCE_METHODS = [
    'prechecked-checkbox-submission',
    'checkbox-unchecked-submission',
    'unsubscribe-link',
] as const satisfies readonly NewsletterMarketingPreferenceMethod[];

const NEWSLETTER_RESEND_SYNC_STATUSES = [
    'pending',
    'synced',
    'failed',
] as const satisfies readonly NewsletterResendSyncStatus[];

function getDataMode(): FoundingPackInsightsDataMode {
    const configured =
        process.env.NEWSLETTER_DATA_MODE?.trim().toLowerCase();

    if (configured === 'test' || configured === 'live') {
        return configured;
    }

    throw new Error(
        'NEWSLETTER_DATA_MODE must be explicitly configured as "test" or "live".',
    );
}

function getDefaultNewsletterLeadStore(
    dataMode: FoundingPackInsightsDataMode,
): JsonListStore {
    return getStore(`maxipawz-newsletter-leads-${dataMode}`, {
        consistency: 'strong',
    });
}

function getDefaultPetProfileStore(
    dataMode: FoundingPackInsightsDataMode,
): JsonListStore {
    return getStore(`maxipawz-founding-pack-profiles-${dataMode}`, {
        consistency: 'strong',
    });
}

function isRecord(
    value: unknown,
): value is Record<string, unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
    );
}

function isNonEmptyString(
    value: unknown,
): value is string {
    return (
        typeof value === 'string' &&
        value.trim().length > 0
    );
}

function isOptionalString(
    value: unknown,
): value is string | undefined {
    return (
        value === undefined ||
        typeof value === 'string'
    );
}

function isBoolean(
    value: unknown,
): value is boolean {
    return typeof value === 'boolean';
}

function isPositiveInteger(
    value: unknown,
): value is number {
    return (
        typeof value === 'number' &&
        Number.isSafeInteger(value) &&
        value >= 1
    );
}

function isNewsletterSource(
    value: unknown,
): value is NewsletterSource {
    return (
        typeof value === 'string' &&
        NEWSLETTER_SOURCES.some(
            (candidate) => candidate === value,
        )
    );
}

function isNewsletterMarketingPreferenceMethod(
    value: unknown,
): value is NewsletterMarketingPreferenceMethod {
    return (
        typeof value === 'string' &&
        NEWSLETTER_MARKETING_PREFERENCE_METHODS.some(
            (candidate) => candidate === value,
        )
    );
}

function isNewsletterResendSyncStatus(
    value: unknown,
): value is NewsletterResendSyncStatus {
    return (
        typeof value === 'string' &&
        NEWSLETTER_RESEND_SYNC_STATUSES.some(
            (candidate) => candidate === value,
        )
    );
}

function isFoundingPackPetType(
    value: unknown,
): value is FoundingPackPetProfileRecord['petType'] {
    return (
        typeof value === 'string' &&
        FOUNDING_PACK_PET_TYPES.some(
            (candidate) => candidate === value,
        )
    );
}

function isFoundingPackPetPersonality(
    value: unknown,
): value is NonNullable<
    FoundingPackPetProfileRecord['petPersonality']
> {
    return (
        typeof value === 'string' &&
        FOUNDING_PACK_PET_PERSONALITIES.some(
            (candidate) => candidate === value,
        )
    );
}

function isFoundingPackLaunchInterest(
    value: unknown,
): value is NonNullable<
    FoundingPackPetProfileRecord['launchInterest']
> {
    return (
        typeof value === 'string' &&
        FOUNDING_PACK_LAUNCH_INTERESTS.some(
            (candidate) => candidate === value,
        )
    );
}

function isNewsletterLeadRecord(
    value: unknown,
): value is NewsletterLeadRecord {
    if (!isRecord(value)) {
        return false;
    }

    return (
        value.version === 1 &&
        isNonEmptyString(value.email) &&
        isNonEmptyString(value.emailHash) &&
        isOptionalString(value.firstName) &&
        isNewsletterSource(value.source) &&
        isBoolean(value.marketingConsent) &&
        isNewsletterMarketingPreferenceMethod(
            value.marketingPreferenceMethod,
        ) &&
        isNonEmptyString(value.consentTextVersion) &&
        isNonEmptyString(value.firstSubmittedAt) &&
        isNonEmptyString(value.lastSubmittedAt) &&
        isNonEmptyString(
            value.marketingPreferenceUpdatedAt,
        ) &&
        isOptionalString(value.lastOptInAt) &&
        isOptionalString(value.lastOptOutAt) &&
        isPositiveInteger(value.submissionCount) &&
        isOptionalString(value.resendContactId) &&
        isNonEmptyString(value.resendTopicId) &&
        isNewsletterResendSyncStatus(
            value.resendSyncStatus,
        ) &&
        isOptionalString(value.lastError) &&
        isNonEmptyString(value.createdAt) &&
        isNonEmptyString(value.updatedAt)
    );
}

function isFoundingPackPetProfileRecord(
    value: unknown,
): value is FoundingPackPetProfileRecord {
    if (!isRecord(value)) {
        return false;
    }

    const petPersonalityValid =
        value.petPersonality === undefined ||
        isFoundingPackPetPersonality(
            value.petPersonality,
        );

    const launchInterestValid =
        value.launchInterest === undefined ||
        isFoundingPackLaunchInterest(
            value.launchInterest,
        );

    return (
        value.version === 1 &&
        isNonEmptyString(value.emailHash) &&
        isNonEmptyString(value.petName) &&
        isFoundingPackPetType(value.petType) &&
        petPersonalityValid &&
        launchInterestValid &&
        value.source === 'homepage-founding-pack' &&
        isNonEmptyString(value.firstSubmittedAt) &&
        isNonEmptyString(value.lastSubmittedAt) &&
        isPositiveInteger(value.submissionCount) &&
        isNonEmptyString(value.createdAt) &&
        isNonEmptyString(value.updatedAt)
    );
}

async function readAllJsonRecords<T>(
    store: JsonListStore,

    validate: (
        value: unknown,
    ) => value is T,

    recordLabel: string,
): Promise<T[]> {
    /*
     * Every relevant record currently uses:
     *
     * email/<sha256>
     *
     * Filtering by prefix avoids accidentally processing unrelated
     * metadata if either store gains additional keys later.
     *
     * Netlify Blobs automatically follows all list pages when
     * paginate is omitted.
     */
    const { blobs } = await store.list({
        prefix: 'email/',
    });

    const records = await Promise.all(
        blobs.map(async ({ key }) => {
            const value = await store.get(key, {
                type: 'json',
            });

            if (!validate(value)) {
                throw new Error(
                    `Founding Pack insights encountered an invalid ${recordLabel} record at key "${key}".`,
                );
            }

            return value;
        }),
    );

    return records;
}

export async function inspectFoundingPackInsights(
    dependencies: FoundingPackInsightsStorageDependencies = {},
): Promise<FoundingPackInsightsData> {
    const dataMode = getDataMode();

    const newsletterStore =
        dependencies.getNewsletterLeadStore?.(
            dataMode,
        ) ??
        getDefaultNewsletterLeadStore(
            dataMode,
        );

    const profileStore =
        dependencies.getPetProfileStore?.(
            dataMode,
        ) ??
        getDefaultPetProfileStore(
            dataMode,
        );

    const [
        newsletterLeads,
        petProfiles,
    ] = await Promise.all([
        readAllJsonRecords(
            newsletterStore,
            isNewsletterLeadRecord,
            'newsletter lead',
        ),

        readAllJsonRecords(
            profileStore,
            isFoundingPackPetProfileRecord,
            'pet profile',
        ),
    ]);

    return buildFoundingPackInsights(
        newsletterLeads,
        petProfiles,
        {
            now: dependencies.now,
        },
    );
}