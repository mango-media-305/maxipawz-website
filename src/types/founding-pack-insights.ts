import type {
    FoundingPackLaunchInterest,
    FoundingPackPetPersonality,
    FoundingPackPetType,
} from './founding-pack';

export interface FoundingPackInsightCount<T extends string> {
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

export interface FoundingPackInsightsData {
    summary: FoundingPackInsightsSummary;

    petTypes: FoundingPackInsightCount<FoundingPackPetType>[];

    petPersonalities: FoundingPackInsightCount<FoundingPackPetPersonality>[];

    launchInterests: FoundingPackInsightCount<FoundingPackLaunchInterest>[];

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