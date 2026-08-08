export type TransactionalEmailKind =
    | 'customer-order-confirmation'
    | 'internal-new-order'
    | 'customer-shipping-confirmation';

export type MarketingEmailKind =
    'welcome-to-the-pack';

export type MarketingEmailDataMode =
    | 'test'
    | 'live';

export type EmailDeliveryStatus =
    | 'sent'
    | 'failed';

export interface EmailDeliveryRecord {
    version: 1;

    kind:
        TransactionalEmailKind;

    sessionId: string;

    recipient: string;

    status:
        EmailDeliveryStatus;

    provider:
        'resend';

    providerMessageId?: string;

    attemptCount: number;

    lastError?: string;

    createdAt: string;

    updatedAt: string;
}

export interface MarketingEmailDeliveryRecord {
    version: 1;

    kind:
        MarketingEmailKind;

    emailHash: string;

    dataMode:
        MarketingEmailDataMode;

    intendedRecipient: string;

    recipient: string;

    status:
        EmailDeliveryStatus;

    provider:
        'resend';

    providerMessageId?: string;

    attemptCount: number;

    lastError?: string;

    createdAt: string;

    updatedAt: string;
}

export type PaidOrderEmailJobStatus =
    | 'queued'
    | 'processing'
    | 'completed'
    | 'failed';

export interface PaidOrderEmailJobRecord {
    version: 1;

    sessionId: string;

    livemode: boolean;

    status:
        PaidOrderEmailJobStatus;

    attemptCount: number;

    lastError?: string;

    createdAt: string;

    updatedAt: string;

    completedAt?: string;
}

export type WelcomeEmailJobStatus =
    | 'queued'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'skipped';

export interface WelcomeEmailJobRecord {
    version: 1;

    emailHash: string;

    dataMode:
        MarketingEmailDataMode;

    status:
        WelcomeEmailJobStatus;

    attemptCount: number;

    lastError?: string;

    skipReason?: string;

    createdAt: string;

    updatedAt: string;

    completedAt?: string;

    skippedAt?: string;
}