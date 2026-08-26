import type {
    FoundingPackSegment,
} from './founding-pack-segmentation';

export interface FoundingPackCampaignContact {
    email: string;

    firstName?: string;
}

export interface FoundingPackCampaignAudience {
    segment: FoundingPackSegment;

    count: number;

    contacts: FoundingPackCampaignContact[];

    generatedAt: string;
}