import {
    FOUNDING_PACK_LAUNCH_INTERESTS,
    FOUNDING_PACK_PET_PERSONALITIES,
    FOUNDING_PACK_PET_TYPES,
    type FoundingPackLaunchInterest,
    type FoundingPackPetPersonality,
    type FoundingPackPetProfileRecord,
    type FoundingPackPetType,
} from '../../types/founding-pack';

import {
    FOUNDING_PACK_SEGMENTS,
    type FoundingPackSegment,
} from '../../types/founding-pack-segmentation';

import type {
    FoundingPackInsightCount,
    FoundingPackInsightsData,
    FoundingPackRecentPetProfile,
    FoundingPackSegmentInsight,
    FoundingPackSegmentInsights,
} from '../../types/founding-pack-insights';

import type {
    NewsletterLeadRecord,
} from '../../types/newsletter';

import {
    buildFoundingPackSegments,
} from '../../lib/founding-pack-segmentation';

const RECENT_PROFILE_LIMIT =
    20;

interface BuildFoundingPackInsightsOptions {
    now?: Date;

    recentProfileLimit?: number;
}

function percentage(
    numerator: number,

    denominator: number,
): number {
    if (
        denominator <=
        0
    ) {
        return 0;
    }

    /*
     * Keep API responses stable and presentation-friendly.
     *
     * 2 / 3 becomes 66.7 rather than an indefinitely
     * repeating floating-point number.
     */
    return (
        Math.round(
            (numerator /
                denominator) *
            1000,
        ) /
        10
    );
}

function parseTimestamp(
    value: string,

    fieldName: string,
): number {
    const timestamp =
        new Date(
            value,
        ).getTime();

    if (
        Number.isNaN(
            timestamp,
        )
    ) {
        throw new Error(
            `Founding Pack insights encountered an invalid ${fieldName} timestamp.`,
        );
    }

    return timestamp;
}

function validateRecentProfileLimit(
    value:
        number | undefined,
): number {
    if (
        value ===
        undefined
    ) {
        return RECENT_PROFILE_LIMIT;
    }

    if (
        !Number.isSafeInteger(
            value,
        ) ||
        value <
        0 ||
        value >
        100
    ) {
        throw new Error(
            'Founding Pack insights recent-profile limit must be an integer between 0 and 100.',
        );
    }

    return value;
}

function uniqueNewsletterLeads(
    leads:
        readonly NewsletterLeadRecord[],
): NewsletterLeadRecord[] {
    const records =
        new Map<
            string,
            NewsletterLeadRecord
        >();

    leads.forEach(
        (
            lead,
        ) => {
            const emailHash =
                lead.emailHash
                    .trim()
                    .toLowerCase();

            if (
                !emailHash
            ) {
                throw new Error(
                    'Founding Pack insights encountered a newsletter lead without an email hash.',
                );
            }

            const existing =
                records.get(
                    emailHash,
                );

            if (
                !existing
            ) {
                records.set(
                    emailHash,
                    lead,
                );

                return;
            }

            const existingUpdatedAt =
                parseTimestamp(
                    existing.updatedAt,
                    'newsletter updatedAt',
                );

            const candidateUpdatedAt =
                parseTimestamp(
                    lead.updatedAt,
                    'newsletter updatedAt',
                );

            /*
             * Netlify Blobs should normally contain one record
             * per email hash.
             *
             * Deduplicating here keeps the aggregation resilient
             * if a migration/export ever supplies duplicates.
             */
            if (
                candidateUpdatedAt >
                existingUpdatedAt
            ) {
                records.set(
                    emailHash,
                    lead,
                );
            }
        },
    );

    return [
        ...records.values(),
    ];
}

function uniquePetProfiles(
    profiles:
        readonly FoundingPackPetProfileRecord[],
): FoundingPackPetProfileRecord[] {
    const records =
        new Map<
            string,
            FoundingPackPetProfileRecord
        >();

    profiles.forEach(
        (
            profile,
        ) => {
            const emailHash =
                profile.emailHash
                    .trim()
                    .toLowerCase();

            if (
                !emailHash
            ) {
                throw new Error(
                    'Founding Pack insights encountered a pet profile without an email hash.',
                );
            }

            const existing =
                records.get(
                    emailHash,
                );

            if (
                !existing
            ) {
                records.set(
                    emailHash,
                    profile,
                );

                return;
            }

            const existingUpdatedAt =
                parseTimestamp(
                    existing.updatedAt,
                    'pet-profile updatedAt',
                );

            const candidateUpdatedAt =
                parseTimestamp(
                    profile.updatedAt,
                    'pet-profile updatedAt',
                );

            if (
                candidateUpdatedAt >
                existingUpdatedAt
            ) {
                records.set(
                    emailHash,
                    profile,
                );
            }
        },
    );

    return [
        ...records.values(),
    ];
}

function buildDistribution<
    T extends string,
>(
    values:
        readonly T[],

    possibleValues:
        readonly T[],
): FoundingPackInsightCount<T>[] {
    const counts =
        new Map<
            T,
            number
        >();

    possibleValues.forEach(
        (
            value,
        ) => {
            counts.set(
                value,
                0,
            );
        },
    );

    values.forEach(
        (
            value,
        ) => {
            const existing =
                counts.get(
                    value,
                );

            if (
                existing ===
                undefined
            ) {
                /*
                 * Persisted enum values should already have been
                 * validated when written. Unknown values indicate
                 * a data-integrity problem.
                 */
                throw new Error(
                    `Founding Pack insights encountered an unsupported value: ${value}.`,
                );
            }

            counts.set(
                value,
                existing +
                1,
            );
        },
    );

    const denominator =
        values.length;

    return possibleValues
        .map(
            (
                id,
            ) => {
                const count =
                    counts.get(
                        id,
                    ) ??
                    0;

                return {
                    id,

                    count,

                    percentage:
                        percentage(
                            count,
                            denominator,
                        ),
                };
            },
        )
        .sort(
            (
                left,
                right,
            ) => {
                if (
                    right.count !==
                    left.count
                ) {
                    return (
                        right.count -
                        left.count
                    );
                }

                return (
                    possibleValues.indexOf(
                        left.id,
                    ) -
                    possibleValues.indexOf(
                        right.id,
                    )
                );
            },
        );
}

function buildRecentProfiles(
    profiles:
        readonly FoundingPackPetProfileRecord[],

    limit:
        number,
): FoundingPackRecentPetProfile[] {
    if (
        limit ===
        0
    ) {
        return [];
    }

    return [
        ...profiles,
    ]
        .sort(
            (
                left,
                right,
            ) =>
                parseTimestamp(
                    right.lastSubmittedAt,
                    'pet-profile lastSubmittedAt',
                ) -
                parseTimestamp(
                    left.lastSubmittedAt,
                    'pet-profile lastSubmittedAt',
                ),
        )
        .slice(
            0,
            limit,
        )
        .map(
            (
                profile,
            ) => ({
                petName:
                    profile.petName,

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

                submissionCount:
                    profile.submissionCount,

                firstSubmittedAt:
                    profile.firstSubmittedAt,

                lastSubmittedAt:
                    profile.lastSubmittedAt,
            }),
        );
}

function getValidProfilesForMembers(
    leads:
        readonly NewsletterLeadRecord[],

    profiles:
        readonly FoundingPackPetProfileRecord[],
): FoundingPackPetProfileRecord[] {
    const memberHashes =
        new Set(
            leads.map(
                (
                    lead,
                ) =>
                    lead.emailHash
                        .trim()
                        .toLowerCase(),
            ),
        );

    return profiles.filter(
        (
            profile,
        ) =>
            memberHashes.has(
                profile.emailHash
                    .trim()
                    .toLowerCase(),
            ),
    );
}

function isMarketingEligible(
    lead:
        NewsletterLeadRecord,
): boolean {
    return (
        lead.marketingConsent ===
        true &&
        lead.resendSyncStatus ===
        'synced' &&
        typeof lead.resendContactId ===
        'string' &&
        lead.resendContactId.trim()
            .length >
        0
    );
}

function buildSegmentInsights(
    leads:
        readonly NewsletterLeadRecord[],

    profiles:
        readonly FoundingPackPetProfileRecord[],
): FoundingPackSegmentInsights {
    const leadsByHash =
        new Map<
            string,
            NewsletterLeadRecord
        >();

    for (
        const lead of
        leads
    ) {
        leadsByHash.set(
            lead.emailHash
                .trim()
                .toLowerCase(),
            lead,
        );
    }

    const segmentCounts =
        new Map<
            FoundingPackSegment,
            number
        >();

    const eligibleCounts =
        new Map<
            FoundingPackSegment,
            number
        >();

    for (
        const segment of
        FOUNDING_PACK_SEGMENTS
    ) {
        segmentCounts.set(
            segment,
            0,
        );

        eligibleCounts.set(
            segment,
            0,
        );
    }

    let totalMarketingEligibleProfiledMembers =
        0;

    for (
        const profile of
        profiles
    ) {
        const emailHash =
            profile.emailHash
                .trim()
                .toLowerCase();

        const lead =
            leadsByHash.get(
                emailHash,
            );

        if (
            !lead
        ) {
            continue;
        }

        const marketingEligible =
            isMarketingEligible(
                lead,
            );

        if (
            marketingEligible
        ) {
            totalMarketingEligibleProfiledMembers +=
                1;
        }

        const segments =
            buildFoundingPackSegments(
                {
                    petType:
                        profile.petType,

                    petPersonality:
                        profile.petPersonality,

                    launchInterest:
                        profile.launchInterest,
                },
            );

        for (
            const segment of
            segments
        ) {
            segmentCounts.set(
                segment,
                (
                    segmentCounts.get(
                        segment,
                    ) ??
                    0
                ) +
                1,
            );

            if (
                marketingEligible
            ) {
                eligibleCounts.set(
                    segment,
                    (
                        eligibleCounts.get(
                            segment,
                        ) ??
                        0
                    ) +
                    1,
                );
            }
        }
    }

    const totalProfiledMembers =
        profiles.length;

    const segments:
        FoundingPackSegmentInsight[] =
        FOUNDING_PACK_SEGMENTS
            .map(
                (
                    id,
                ) => {
                    const count =
                        segmentCounts.get(
                            id,
                        ) ??
                        0;

                    const marketingEligibleCount =
                        eligibleCounts.get(
                            id,
                        ) ??
                        0;

                    return {
                        id,

                        count,

                        percentageOfProfiles:
                            percentage(
                                count,
                                totalProfiledMembers,
                            ),

                        marketingEligibleCount,

                        marketingEligibilityRate:
                            percentage(
                                marketingEligibleCount,
                                count,
                            ),
                    };
                },
            )
            .sort(
                (
                    left,
                    right,
                ) => {
                    if (
                        right.marketingEligibleCount !==
                        left.marketingEligibleCount
                    ) {
                        return (
                            right.marketingEligibleCount -
                            left.marketingEligibleCount
                        );
                    }

                    if (
                        right.count !==
                        left.count
                    ) {
                        return (
                            right.count -
                            left.count
                        );
                    }

                    return (
                        FOUNDING_PACK_SEGMENTS.indexOf(
                            left.id,
                        ) -
                        FOUNDING_PACK_SEGMENTS.indexOf(
                            right.id,
                        )
                    );
                },
            );

    return {
        totalProfiledMembers,

        totalMarketingEligibleProfiledMembers,

        segments,
    };
}

export function buildFoundingPackInsights(
    newsletterLeads:
        readonly NewsletterLeadRecord[],

    petProfiles:
        readonly FoundingPackPetProfileRecord[],

    options:
        BuildFoundingPackInsightsOptions = {},
): FoundingPackInsightsData {
    const recentProfileLimit =
        validateRecentProfileLimit(
            options.recentProfileLimit,
        );

    const now =
        options.now ??
        new Date();

    if (
        Number.isNaN(
            now.getTime(),
        )
    ) {
        throw new Error(
            'Founding Pack insights cannot be generated with an invalid date.',
        );
    }

    const leads =
        uniqueNewsletterLeads(
            newsletterLeads,
        );

    const profiles =
        getValidProfilesForMembers(
            leads,

            uniquePetProfiles(
                petProfiles,
            ),
        );

    const members =
        leads.length;

    const profilesCompleted =
        profiles.length;

    const profilesMissing =
        Math.max(
            members -
            profilesCompleted,
            0,
        );

    const marketingOptedIn =
        leads.filter(
            (
                lead,
            ) =>
                lead.marketingConsent,
        ).length;

    const marketingOptedOut =
        members -
        marketingOptedIn;

    const personalities =
        profiles
            .map(
                (
                    profile,
                ) =>
                    profile.petPersonality,
            )
            .filter(
                (
                    value,
                ): value is FoundingPackPetPersonality =>
                    value !==
                    undefined,
            );

    const launchInterests =
        profiles
            .map(
                (
                    profile,
                ) =>
                    profile.launchInterest,
            )
            .filter(
                (
                    value,
                ): value is FoundingPackLaunchInterest =>
                    value !==
                    undefined,
            );

    const petTypes:
        FoundingPackPetType[] =
        profiles.map(
            (
                profile,
            ) =>
                profile.petType,
        );

    return {
        summary: {
            members,

            profilesCompleted,

            profilesMissing,

            profileCompletionRate:
                percentage(
                    profilesCompleted,
                    members,
                ),

            marketingOptedIn,

            marketingOptedOut,

            marketingOptInRate:
                percentage(
                    marketingOptedIn,
                    members,
                ),

            personalityResponses:
                personalities.length,

            personalityResponseRate:
                percentage(
                    personalities.length,
                    profilesCompleted,
                ),

            launchInterestResponses:
                launchInterests.length,

            launchInterestResponseRate:
                percentage(
                    launchInterests.length,
                    profilesCompleted,
                ),
        },

        petTypes:
            buildDistribution(
                petTypes,
                FOUNDING_PACK_PET_TYPES,
            ),

        petPersonalities:
            buildDistribution(
                personalities,
                FOUNDING_PACK_PET_PERSONALITIES,
            ),

        launchInterests:
            buildDistribution(
                launchInterests,
                FOUNDING_PACK_LAUNCH_INTERESTS,
            ),

        segmentInsights:
            buildSegmentInsights(
                leads,
                profiles,
            ),

        recentProfiles:
            buildRecentProfiles(
                profiles,
                recentProfileLimit,
            ),

        generatedAt:
            now.toISOString(),
    };
}