import type {
    FoundingPackLaunchInterest,
    FoundingPackPetPersonality,
    FoundingPackPetType,
} from './founding-pack';

import type {
    FoundingPackSegment,
} from './founding-pack-segmentation';

export interface FoundingPackInsightCount<
    T extends string,
> {
    id: T;

    count: number;

    percentage: number;
}

export interface FoundingPackInsightsSummary {
    members: number;

    profilesCompleted: number;

    profilesMissing: number;

    profileCompletionRate: number;

    marketingOptedIn: number;

    marketingOptedOut: number;

    marketingOptInRate: number;

    personalityResponses: number;

    personalityResponseRate: number;

    launchInterestResponses: number;

    launchInterestResponseRate: number;
}

export interface FoundingPackRecentPetProfile {
    petName: string;

    petType: FoundingPackPetType;

    petPersonality?: FoundingPackPetPersonality;

    launchInterest?: FoundingPackLaunchInterest;

    submissionCount: number;

    firstSubmittedAt: string;

    lastSubmittedAt: string;
}

/**
 * Aggregated audience data only.
 *
 * No email, emailHash, firstName, petName, contact ID,
 * or other member-level identifier belongs here.
 */
export interface FoundingPackSegmentInsight {
    id: FoundingPackSegment;

    count: number;

    percentageOfProfiles: number;

    marketingEligibleCount: number;

    marketingEligibilityRate: number;
}

export interface FoundingPackSegmentInsights {
    totalProfiledMembers: number;

    totalMarketingEligibleProfiledMembers: number;

    segments: FoundingPackSegmentInsight[];
}

export interface FoundingPackInsightsData {
    summary: FoundingPackInsightsSummary;

    petTypes:
    FoundingPackInsightCount<FoundingPackPetType>[];

    petPersonalities:
    FoundingPackInsightCount<FoundingPackPetPersonality>[];

    launchInterests:
    FoundingPackInsightCount<FoundingPackLaunchInterest>[];

    segmentInsights: FoundingPackSegmentInsights;

    recentProfiles: FoundingPackRecentPetProfile[];

    generatedAt: string;
}

export interface AdminFoundingPackInsightsSuccessResponse
    extends FoundingPackInsightsData {
    ok: true;
}

export interface AdminFoundingPackInsightsErrorResponse {
    ok: false;

    message: string;
}

export type AdminFoundingPackInsightsResponse =
    | AdminFoundingPackInsightsSuccessResponse
    | AdminFoundingPackInsightsErrorResponse;