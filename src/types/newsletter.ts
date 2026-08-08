export type NewsletterSource =
    'homepage-join-the-pack';

export type NewsletterMarketingPreferenceMethod =
    | 'prechecked-checkbox-submission'
    | 'checkbox-unchecked-submission'
    | 'unsubscribe-link';

export type NewsletterResendSyncStatus =
    | 'pending'
    | 'synced'
    | 'failed';

export interface NewsletterLeadInput {
    email: string;

    firstName?: string;

    marketingConsent: boolean;

    source:
        NewsletterSource;
}

export interface NewsletterLeadRecord {
    version: 1;

    email: string;

    emailHash: string;

    firstName?: string;

    source:
        NewsletterSource;

    marketingConsent: boolean;

    marketingPreferenceMethod:
        NewsletterMarketingPreferenceMethod;

    consentTextVersion: string;

    firstSubmittedAt: string;

    lastSubmittedAt: string;

    marketingPreferenceUpdatedAt: string;

    lastOptInAt?: string;

    lastOptOutAt?: string;

    submissionCount: number;

    resendContactId?: string;

    resendTopicId: string;

    resendSyncStatus:
        NewsletterResendSyncStatus;

    lastError?: string;

    createdAt: string;

    updatedAt: string;
}

export interface NewsletterSubmissionResult {
    accepted: true;

    marketingConsent: boolean;

    resendSyncStatus:
        NewsletterResendSyncStatus;
}