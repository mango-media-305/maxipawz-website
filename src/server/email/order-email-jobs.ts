import { getStore } from '@netlify/blobs';

import type { PaidOrderEmailJobRecord } from '../../types/email';

const MAXIMUM_ERROR_MESSAGE_LENGTH = 500;

function getEnvironmentSuffix(livemode: boolean): 'live' | 'test' {
    return livemode ? 'live' : 'test';
}

function getJobStore(livemode: boolean) {
    return getStore(
        `maxipawz-paid-order-email-jobs-${getEnvironmentSuffix(livemode)}`,
        {
            consistency: 'strong',
        },
    );
}

function getJobKey(sessionId: string): string {
    return `session/${sessionId}`;
}

function getSafeErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message.slice(0, MAXIMUM_ERROR_MESSAGE_LENGTH);
    }

    return 'Unknown paid-order email job error.';
}

export async function getPaidOrderEmailJob(
    sessionId: string,
    livemode: boolean,
): Promise<PaidOrderEmailJobRecord | null> {
    const store = getJobStore(livemode);

    return (await store.get(getJobKey(sessionId), {
        type: 'json',
    })) as PaidOrderEmailJobRecord | null;
}

export async function queuePaidOrderEmailJob(
    sessionId: string,
    livemode: boolean,
): Promise<PaidOrderEmailJobRecord> {
    const store = getJobStore(livemode);
    const key = getJobKey(sessionId);

    const existing = await getPaidOrderEmailJob(
        sessionId,
        livemode,
    );

    if (
        existing &&
        (existing.status === 'queued' ||
            existing.status === 'processing' ||
            existing.status === 'completed')
    ) {
        return existing;
    }

    const now = new Date().toISOString();

    const record: PaidOrderEmailJobRecord = {
        version: 1,
        sessionId,
        livemode,
        status: 'queued',
        attemptCount: existing?.attemptCount ?? 0,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
    };

    await store.setJSON(key, record);

    return record;
}

export async function markPaidOrderEmailJobProcessing(
    sessionId: string,
    livemode: boolean,
): Promise<PaidOrderEmailJobRecord> {
    const store = getJobStore(livemode);

    const existing = await getPaidOrderEmailJob(
        sessionId,
        livemode,
    );

    if (!existing) {
        throw new Error(
            'The paid-order email job does not exist.',
        );
    }

    if (existing.status === 'completed') {
        return existing;
    }

    const record: PaidOrderEmailJobRecord = {
        ...existing,
        status: 'processing',
        attemptCount: existing.attemptCount + 1,
        lastError: undefined,
        updatedAt: new Date().toISOString(),
    };

    await store.setJSON(
        getJobKey(sessionId),
        record,
    );

    return record;
}

export async function markPaidOrderEmailJobCompleted(
    sessionId: string,
    livemode: boolean,
): Promise<PaidOrderEmailJobRecord> {
    const store = getJobStore(livemode);

    const existing = await getPaidOrderEmailJob(
        sessionId,
        livemode,
    );

    if (!existing) {
        throw new Error(
            'The paid-order email job does not exist.',
        );
    }

    if (existing.status === 'completed') {
        return existing;
    }

    const now = new Date().toISOString();

    const record: PaidOrderEmailJobRecord = {
        ...existing,
        status: 'completed',
        lastError: undefined,
        updatedAt: now,
        completedAt: now,
    };

    await store.setJSON(
        getJobKey(sessionId),
        record,
    );

    return record;
}

export async function markPaidOrderEmailJobFailed(
    sessionId: string,
    livemode: boolean,
    error: unknown,
): Promise<PaidOrderEmailJobRecord> {
    const store = getJobStore(livemode);

    const existing = await getPaidOrderEmailJob(
        sessionId,
        livemode,
    );

    if (!existing) {
        throw new Error(
            'The paid-order email job does not exist.',
        );
    }

    /*
     * A duplicate background invocation must never downgrade a
     * successfully completed job to failed.
     */
    if (existing.status === 'completed') {
        return existing;
    }

    const record: PaidOrderEmailJobRecord = {
        ...existing,
        status: 'failed',
        lastError: getSafeErrorMessage(error),
        updatedAt: new Date().toISOString(),
    };

    await store.setJSON(
        getJobKey(sessionId),
        record,
    );

    return record;
}