export type WelcomeDiscountDataMode = 'test' | 'live';

export type WelcomeDiscountStatus =
    | 'pending'
    | 'promotion-created'
    | 'email-sent'
    | 'failed';

export type WelcomeDiscountFailureStage =
    | 'stripe-promotion'
    | 'email-delivery';

export interface WelcomeDiscountRecord {
    version: 1;

    emailHash: string;

    dataMode: WelcomeDiscountDataMode;

    status: WelcomeDiscountStatus;

    discountPercent: number;

    promotionCode?: string;

    stripeCouponId?: string;

    stripePromotionCodeId?: string;

    providerMessageId?: string;

    requestCount: number;

    firstRequestedAt: string;

    lastRequestedAt: string;

    promotionCreatedAt?: string;

    emailSentAt?: string;

    failureStage?: WelcomeDiscountFailureStage;

    lastError?: string;

    createdAt: string;

    updatedAt: string;
}