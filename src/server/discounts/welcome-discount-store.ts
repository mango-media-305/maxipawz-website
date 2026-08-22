import { createHash } from 'node:crypto';

import { getStore } from '@netlify/blobs';

import type {
    WelcomeDiscountDataMode,
    WelcomeDiscountFailureStage,
    WelcomeDiscountRecord,
} from '../../types/welcome-discount';

const EMAIL_HASH_PATTERN = /^[0-9a-f]{64}$/;

const MAXIMUM_ERROR_MESSAGE_LENGTH = 500;

export const WELCOME_DISCOUNT_PERCENT = 10;

function getWelcomeDiscountStore(dataMode: WelcomeDiscountDataMode) {
    return getStore(`maxipawz-welcome-discounts-${dataMode}`, {
        consistency: 'strong',
    });
}

export function normalizeWelcomeDiscountEmail(email: string): string {
    return email.trim().toLowerCase();
}

export function hashWelcomeDiscountEmail(email: string): string {
    const normalized = normalizeWelcomeDiscountEmail(email);

    return createHash('sha256').update(normalized, 'utf8').digest('hex');
}

export function validateWelcomeDiscountEmailHash(emailHash: string): string {
    const normalized = emailHash.trim().toLowerCase();

    if (!EMAIL_HASH_PATTERN.test(normalized)) {
        throw new Error('The welcome discount contains an invalid email hash.');
    }

    return normalized;
}

function getWelcomeDiscountKey(emailHash: string): string {
    return `email/${validateWelcomeDiscountEmailHash(emailHash)}`;
}

function getSafeErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message.slice(0, MAXIMUM_ERROR_MESSAGE_LENGTH);
    }

    if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof error.message === 'string'
    ) {
        return error.message.slice(0, MAXIMUM_ERROR_MESSAGE_LENGTH);
    }

    return 'Unknown welcome-discount error.';
}

export async function getWelcomeDiscountRecord(
    emailHash: string,
    dataMode: WelcomeDiscountDataMode,
): Promise<WelcomeDiscountRecord | null> {
    const store = getWelcomeDiscountStore(dataMode);

    return (await store.get(getWelcomeDiscountKey(emailHash), {
        type: 'json',
    })) as WelcomeDiscountRecord | null;
}

export async function saveWelcomeDiscountRecord(
    record: WelcomeDiscountRecord,
): Promise<void> {
    const store = getWelcomeDiscountStore(record.dataMode);

    await store.setJSON(getWelcomeDiscountKey(record.emailHash), record);
}

export async function registerWelcomeDiscountRequest(
    emailHash: string,
    dataMode: WelcomeDiscountDataMode,
): Promise<WelcomeDiscountRecord> {
    const normalizedEmailHash =
        validateWelcomeDiscountEmailHash(emailHash);

    const existing =
        await getWelcomeDiscountRecord(
            normalizedEmailHash,
            dataMode,
        );

    const now = new Date().toISOString();

    if (existing) {
        const updated: WelcomeDiscountRecord = {
            ...existing,

            requestCount:
                existing.requestCount + 1,

            lastRequestedAt:
                now,

            updatedAt:
                now,
        };

        await saveWelcomeDiscountRecord(
            updated,
        );

        return updated;
    }

    const record: WelcomeDiscountRecord = {
        version: 1,

        emailHash:
            normalizedEmailHash,

        dataMode,

        status:
            'pending',

        discountPercent:
            WELCOME_DISCOUNT_PERCENT,

        requestCount:
            1,

        firstRequestedAt:
            now,

        lastRequestedAt:
            now,

        createdAt:
            now,

        updatedAt:
            now,
    };

    await saveWelcomeDiscountRecord(
        record,
    );

    return record;
}

export async function markWelcomeDiscountPromotionCreated(
    emailHash: string,
    dataMode: WelcomeDiscountDataMode,
    promotion: {
        promotionCode: string;

        stripeCouponId: string;

        stripePromotionCodeId: string;
    },
): Promise<WelcomeDiscountRecord> {
    const existing =
        await getWelcomeDiscountRecord(
            emailHash,
            dataMode,
        );

    if (!existing) {
        throw new Error(
            'The welcome discount must exist before its Stripe promotion can be recorded.',
        );
    }

    /*
     * Never replace an existing promotion with a different one.
     *
     * Once a code has been associated with an email hash, that
     * association becomes permanent for this incentive.
     */
    if (
        existing.promotionCode &&
        existing.promotionCode !==
        promotion.promotionCode
    ) {
        throw new Error(
            'The welcome discount already has a different promotion code.',
        );
    }

    if (
        existing.stripeCouponId &&
        existing.stripeCouponId !==
        promotion.stripeCouponId
    ) {
        throw new Error(
            'The welcome discount already references a different Stripe coupon.',
        );
    }

    if (
        existing.stripePromotionCodeId &&
        existing.stripePromotionCodeId !==
        promotion.stripePromotionCodeId
    ) {
        throw new Error(
            'The welcome discount already references a different Stripe promotion code.',
        );
    }

    const now =
        new Date().toISOString();

    const updated: WelcomeDiscountRecord = {
        ...existing,

        status:
            existing.status === 'email-sent'
                ? 'email-sent'
                : 'promotion-created',

        promotionCode:
            promotion.promotionCode,

        stripeCouponId:
            promotion.stripeCouponId,

        stripePromotionCodeId:
            promotion.stripePromotionCodeId,

        promotionCreatedAt:
            existing.promotionCreatedAt ??
            now,

        failureStage:
            undefined,

        lastError:
            undefined,

        updatedAt:
            now,
    };

    await saveWelcomeDiscountRecord(
        updated,
    );

    return updated;
}

export async function markWelcomeDiscountEmailSent(
    emailHash: string,
    dataMode: WelcomeDiscountDataMode,
    providerMessageId: string,
): Promise<WelcomeDiscountRecord> {
    const existing =
        await getWelcomeDiscountRecord(
            emailHash,
            dataMode,
        );

    if (!existing) {
        throw new Error(
            'The welcome discount must exist before email delivery can be recorded.',
        );
    }

    if (
        !existing.promotionCode ||
        !existing.stripeCouponId ||
        !existing.stripePromotionCodeId
    ) {
        throw new Error(
            'The welcome discount must have a Stripe promotion before email delivery can be recorded.',
        );
    }

    const normalizedProviderMessageId =
        providerMessageId.trim();

    if (!normalizedProviderMessageId) {
        throw new Error(
            'The welcome discount email requires a provider message ID.',
        );
    }

    const now =
        new Date().toISOString();

    const updated: WelcomeDiscountRecord = {
        ...existing,

        status:
            'email-sent',

        providerMessageId:
            normalizedProviderMessageId,

        emailSentAt:
            existing.emailSentAt ??
            now,

        failureStage:
            undefined,

        lastError:
            undefined,

        updatedAt:
            now,
    };

    await saveWelcomeDiscountRecord(
        updated,
    );

    return updated;
}

export async function markWelcomeDiscountFailure(
    emailHash: string,
    dataMode: WelcomeDiscountDataMode,
    failureStage: WelcomeDiscountFailureStage,
    error: unknown,
): Promise<WelcomeDiscountRecord> {
    const existing =
        await getWelcomeDiscountRecord(
            emailHash,
            dataMode,
        );

    if (!existing) {
        throw new Error(
            'The welcome discount must exist before a failure can be recorded.',
        );
    }

    /*
     * Once the email has been successfully delivered, a later retry
     * or duplicate request must never downgrade the durable state.
     */
    if (
        existing.status ===
        'email-sent'
    ) {
        return existing;
    }

    const now =
        new Date().toISOString();

    const updated: WelcomeDiscountRecord = {
        ...existing,

        status:
            'failed',

        failureStage,

        lastError:
            getSafeErrorMessage(error),

        updatedAt:
            now,
    };

    await saveWelcomeDiscountRecord(
        updated,
    );

    return updated;
}