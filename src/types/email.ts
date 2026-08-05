export type TransactionalEmailKind =
    | 'customer-order-confirmation'
    | 'internal-new-order'
    | 'customer-shipping-confirmation';

export type EmailDeliveryStatus = 'sent' | 'failed';

export interface EmailDeliveryRecord {
    version: 1;
    kind: TransactionalEmailKind;
    sessionId: string;
    recipient: string;
    status: EmailDeliveryStatus;
    provider: 'resend';
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
    status: PaidOrderEmailJobStatus;
    attemptCount: number;
    lastError?: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
}