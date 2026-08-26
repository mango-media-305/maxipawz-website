import {
    FOUNDING_PACK_LAUNCH_INTERESTS,
    FOUNDING_PACK_PET_PERSONALITIES,
    FOUNDING_PACK_PET_TYPES,
    type FoundingPackLaunchInterest,
    type FoundingPackPetPersonality,
    type FoundingPackPetProfileRecord,
    type FoundingPackPetType,
} from '../../types/founding-pack';

import type {
    FoundingPackInsightCount,
    FoundingPackInsightsData,
    FoundingPackRecentPetProfile,
} from '../../types/founding-pack-insights';

import type { NewsletterLeadRecord } from '../../types/newsletter';

const RECENT_PROFILE_LIMIT = 20;

interface BuildFoundingPackInsightsOptions {
    now?: Date;

    recentProfileLimit?: number;
}

function percentage(
    numerator: number,

    denominator: number,
): number {
    if (denominator <= 0) {
        return 0;
    }

    /*
     * Keep API responses stable and presentation-friendly.
     *
     * 2 / 3 becomes 66.7 rather than an indefinitely repeating
     * floating-point number.
     */
    return Math.round((numerator / denominator) * 1000) / 10;
}

function parseTimestamp(
    value: string,

    fieldName: string,
): number {
    const timestamp = new Date(value).getTime();

    if (Number.isNaN(timestamp)) {
        throw new Error(
            `Founding Pack insights encountered an invalid ${fieldName} timestamp.`,
        );
    }

    return timestamp;
}

function validateRecentProfileLimit(
    value: number | undefined,
): number {
    if (value === undefined) {
        return RECENT_PROFILE_LIMIT;
    }

    if (!Number.isSafeInteger(value) || value < 0 || value > 100) {
        throw new Error(
            'Founding Pack insights recent-profile limit must be an integer between 0 and 100.',
        );
    }

    return value;
}

function uniqueNewsletterLeads(
    leads: readonly NewsletterLeadRecord[],
): NewsletterLeadRecord[] {
    const records = new Map<string, NewsletterLeadRecord>();

    leads.forEach((lead) => {
        const emailHash = lead.emailHash.trim().toLowerCase();

        if (!emailHash) {
            throw new Error(
                'Founding Pack insights encountered a newsletter lead without an email hash.',
            );
        }

        const existing = records.get(emailHash);

        if (!existing) {
            records.set(emailHash, lead);

            return;
        }

        const existingUpdatedAt = parseTimestamp(
            existing.updatedAt,
            'newsletter updatedAt',
        );

        const candidateUpdatedAt = parseTimestamp(
            lead.updatedAt,
            'newsletter updatedAt',
        );

        /*
         * Netlify Blobs should normally contain one record per email hash.
         *
         * Deduplicating here makes the aggregation engine resilient if a
         * future storage migration or export accidentally supplies the same
         * member more than once.
         */
        if (candidateUpdatedAt > existingUpdatedAt) {
            records.set(emailHash, lead);
        }
    });

    return [...records.values()];
}

function uniquePetProfiles(
    profiles: readonly FoundingPackPetProfileRecord[],
): FoundingPackPetProfileRecord[] {
    const records = new Map<string, FoundingPackPetProfileRecord>();

    profiles.forEach((profile) => {
        const emailHash = profile.emailHash.trim().toLowerCase();

        if (!emailHash) {
            throw new Error(
                'Founding Pack insights encountered a pet profile without an email hash.',
            );
        }

        const existing = records.get(emailHash);

        if (!existing) {
            records.set(emailHash, profile);

            return;
        }

        const existingUpdatedAt = parseTimestamp(
            existing.updatedAt,
            'pet-profile updatedAt',
        );

        const candidateUpdatedAt = parseTimestamp(
            profile.updatedAt,
            'pet-profile updatedAt',
        );

        if (candidateUpdatedAt > existingUpdatedAt) {
            records.set(emailHash, profile);
        }
    });

    return [...records.values()];
}

function buildDistribution<T extends string>(
    values: readonly T[],

    possibleValues: readonly T[],
): FoundingPackInsightCount<T>[] {
    const counts = new Map<T, number>();

    possibleValues.forEach((value) => {
        counts.set(value, 0);
    });

    values.forEach((value) => {
        const existing = counts.get(value);

        if (existing === undefined) {
            /*
             * The storage record should already have been validated when it was
             * written. Treat an unknown persisted enum as a data-integrity issue
             * rather than silently hiding it from business reporting.
             */
            throw new Error(
                `Founding Pack insights encountered an unsupported value: ${value}.`,
            );
        }

        counts.set(value, existing + 1);
    });

    const denominator = values.length;

    return possibleValues
        .map((id) => {
            const count = counts.get(id) ?? 0;

            return {
                id,

                count,

                percentage: percentage(count, denominator),
            };
        })
        .sort((left, right) => {
            if (right.count !== left.count) {
                return right.count - left.count;
            }

            return possibleValues.indexOf(left.id) - possibleValues.indexOf(right.id);
        });
}

function buildRecentProfiles(
    profiles: readonly FoundingPackPetProfileRecord[],

    limit: number,
): FoundingPackRecentPetProfile[] {
    if (limit === 0) {
        return [];
    }

    return [...profiles]
        .sort(
            (left, right) =>
                parseTimestamp(right.lastSubmittedAt, 'pet-profile lastSubmittedAt') -
                parseTimestamp(left.lastSubmittedAt, 'pet-profile lastSubmittedAt'),
        )
        .slice(0, limit)
        .map((profile) => ({
            petName: profile.petName,

            petType: profile.petType,

            ...(profile.petPersonality
                ? {
                    petPersonality: profile.petPersonality,
                }
                : {}),

            ...(profile.launchInterest
                ? {
                    launchInterest: profile.launchInterest,
                }
                : {}),

            submissionCount: profile.submissionCount,

            firstSubmittedAt: profile.firstSubmittedAt,

            lastSubmittedAt: profile.lastSubmittedAt,
        }));
}

function getValidProfilesForMembers(
    leads: readonly NewsletterLeadRecord[],

    profiles: readonly FoundingPackPetProfileRecord[],
): FoundingPackPetProfileRecord[] {
    const memberHashes = new Set(
        leads.map((lead) => lead.emailHash.trim().toLowerCase()),
    );

    return profiles.filter((profile) =>
        memberHashes.has(profile.emailHash.trim().toLowerCase()),
    );
}

export function buildFoundingPackInsights(
    newsletterLeads: readonly NewsletterLeadRecord[],

    petProfiles: readonly FoundingPackPetProfileRecord[],

    options: BuildFoundingPackInsightsOptions = {},
): FoundingPackInsightsData {
    const recentProfileLimit = validateRecentProfileLimit(
        options.recentProfileLimit,
    );

    const now = options.now ?? new Date();

    if (Number.isNaN(now.getTime())) {
        throw new Error(
            'Founding Pack insights cannot be generated with an invalid date.',
        );
    }

    const leads = uniqueNewsletterLeads(newsletterLeads);

    const profiles = getValidProfilesForMembers(
        leads,

        uniquePetProfiles(petProfiles),
    );

    const members = leads.length;

    const profilesCompleted = profiles.length;

    const profilesMissing = Math.max(
        members - profilesCompleted,
        0,
    );

    const marketingOptedIn = leads.filter(
        (lead) => lead.marketingConsent,
    ).length;

    const marketingOptedOut = members - marketingOptedIn;

    const personalities = profiles
        .map((profile) => profile.petPersonality)
        .filter(
            (
                value,
            ): value is FoundingPackPetPersonality => value !== undefined,
        );

    const launchInterests = profiles
        .map((profile) => profile.launchInterest)
        .filter(
            (
                value,
            ): value is FoundingPackLaunchInterest => value !== undefined,
        );

    const petTypes: FoundingPackPetType[] = profiles.map(
        (profile) => profile.petType,
    );

    return {
        summary: {
            members,

            profilesCompleted,

            profilesMissing,

            profileCompletionRate: percentage(
                profilesCompleted,
                members,
            ),

            marketingOptedIn,

            marketingOptedOut,

            marketingOptInRate: percentage(
                marketingOptedIn,
                members,
            ),

            personalityResponses: personalities.length,

            personalityResponseRate: percentage(
                personalities.length,
                profilesCompleted,
            ),

            launchInterestResponses: launchInterests.length,

            launchInterestResponseRate: percentage(
                launchInterests.length,
                profilesCompleted,
            ),
        },

        petTypes: buildDistribution(
            petTypes,
            FOUNDING_PACK_PET_TYPES,
        ),

        petPersonalities: buildDistribution(
            personalities,
            FOUNDING_PACK_PET_PERSONALITIES,
        ),

        launchInterests: buildDistribution(
            launchInterests,
            FOUNDING_PACK_LAUNCH_INTERESTS,
        ),

        recentProfiles: buildRecentProfiles(
            profiles,
            recentProfileLimit,
        ),

        generatedAt: now.toISOString(),
    };
}