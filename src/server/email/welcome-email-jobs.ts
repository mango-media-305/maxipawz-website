import { getStore } from '@netlify/blobs';

import type { MarketingEmailDataMode, WelcomeEmailJobRecord } from '../../types/email';

const EMAIL_HASH_PATTERN = /^[0-9a-f]{64}$/;

const MAXIMUM_ERROR_MESSAGE_LENGTH = 500;

function validateEmailHash(emailHash: string): string {
  const normalized = emailHash.trim().toLowerCase();

  if (!EMAIL_HASH_PATTERN.test(normalized)) {
    throw new Error('The welcome-email job contains an invalid email hash.');
  }

  return normalized;
}

function getJobStore(dataMode: MarketingEmailDataMode) {
  return getStore(`maxipawz-welcome-email-jobs-${dataMode}`, {
    consistency: 'strong',
  });
}

function getJobKey(emailHash: string): string {
  return `email/${emailHash}`;
}

function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, MAXIMUM_ERROR_MESSAGE_LENGTH);
  }

  return 'Unknown welcome-email job error.';
}

export async function getWelcomeEmailJob(
  emailHash: string,

  dataMode: MarketingEmailDataMode,
): Promise<WelcomeEmailJobRecord | null> {
  const normalizedEmailHash = validateEmailHash(emailHash);

  const store = getJobStore(dataMode);

  return (await store.get(getJobKey(normalizedEmailHash), {
    type: 'json',
  })) as WelcomeEmailJobRecord | null;
}

export async function queueWelcomeEmailJob(
  emailHash: string,

  dataMode: MarketingEmailDataMode,
): Promise<WelcomeEmailJobRecord> {
  const normalizedEmailHash = validateEmailHash(emailHash);

  const store = getJobStore(dataMode);

  const existing = await getWelcomeEmailJob(normalizedEmailHash, dataMode);

  /*
   * A completed welcome email must never be sent again.
   *
   * A skipped job may be queued again later. This matters when a
   * visitor opts out before the background job runs and then chooses
   * to join the pack again in the future.
   */
  if (
    existing &&
    (existing.status === 'queued' ||
      existing.status === 'processing' ||
      existing.status === 'completed')
  ) {
    return existing;
  }

  const now = new Date().toISOString();

  const record: WelcomeEmailJobRecord = {
    version: 1,

    emailHash: normalizedEmailHash,

    dataMode,

    status: 'queued',

    attemptCount: existing?.attemptCount ?? 0,

    lastError: undefined,

    skipReason: undefined,

    createdAt: existing?.createdAt ?? now,

    updatedAt: now,

    completedAt: undefined,

    skippedAt: undefined,
  };

  await store.setJSON(getJobKey(normalizedEmailHash), record);

  return record;
}

export async function markWelcomeEmailJobProcessing(
  emailHash: string,

  dataMode: MarketingEmailDataMode,
): Promise<WelcomeEmailJobRecord> {
  const normalizedEmailHash = validateEmailHash(emailHash);

  const store = getJobStore(dataMode);

  const existing = await getWelcomeEmailJob(normalizedEmailHash, dataMode);

  if (!existing) {
    throw new Error('The welcome-email job does not exist.');
  }

  if (existing.status === 'completed' || existing.status === 'skipped') {
    return existing;
  }

  const record: WelcomeEmailJobRecord = {
    ...existing,

    status: 'processing',

    attemptCount: existing.attemptCount + 1,

    lastError: undefined,

    skipReason: undefined,

    updatedAt: new Date().toISOString(),
  };

  await store.setJSON(getJobKey(normalizedEmailHash), record);

  return record;
}

export async function markWelcomeEmailJobCompleted(
  emailHash: string,

  dataMode: MarketingEmailDataMode,
): Promise<WelcomeEmailJobRecord> {
  const normalizedEmailHash = validateEmailHash(emailHash);

  const store = getJobStore(dataMode);

  const existing = await getWelcomeEmailJob(normalizedEmailHash, dataMode);

  if (!existing) {
    throw new Error('The welcome-email job does not exist.');
  }

  if (existing.status === 'completed') {
    return existing;
  }

  const now = new Date().toISOString();

  const record: WelcomeEmailJobRecord = {
    ...existing,

    status: 'completed',

    lastError: undefined,

    skipReason: undefined,

    updatedAt: now,

    completedAt: now,

    skippedAt: undefined,
  };

  await store.setJSON(getJobKey(normalizedEmailHash), record);

  return record;
}

export async function markWelcomeEmailJobSkipped(
  emailHash: string,

  dataMode: MarketingEmailDataMode,

  reason: string,
): Promise<WelcomeEmailJobRecord> {
  const normalizedEmailHash = validateEmailHash(emailHash);

  const store = getJobStore(dataMode);

  const existing = await getWelcomeEmailJob(normalizedEmailHash, dataMode);

  if (!existing) {
    throw new Error('The welcome-email job does not exist.');
  }

  /*
   * A duplicate invocation can never downgrade a completed job.
   */
  if (existing.status === 'completed') {
    return existing;
  }

  const now = new Date().toISOString();

  const record: WelcomeEmailJobRecord = {
    ...existing,

    status: 'skipped',

    lastError: undefined,

    skipReason: reason.slice(0, MAXIMUM_ERROR_MESSAGE_LENGTH),

    updatedAt: now,

    completedAt: undefined,

    skippedAt: now,
  };

  await store.setJSON(getJobKey(normalizedEmailHash), record);

  return record;
}

export async function markWelcomeEmailJobFailed(
  emailHash: string,

  dataMode: MarketingEmailDataMode,

  error: unknown,
): Promise<WelcomeEmailJobRecord> {
  const normalizedEmailHash = validateEmailHash(emailHash);

  const store = getJobStore(dataMode);

  const existing = await getWelcomeEmailJob(normalizedEmailHash, dataMode);

  if (!existing) {
    throw new Error('The welcome-email job does not exist.');
  }

  if (existing.status === 'completed') {
    return existing;
  }

  const record: WelcomeEmailJobRecord = {
    ...existing,

    status: 'failed',

    lastError: getSafeErrorMessage(error),

    skipReason: undefined,

    updatedAt: new Date().toISOString(),

    completedAt: undefined,

    skippedAt: undefined,
  };

  await store.setJSON(getJobKey(normalizedEmailHash), record);

  return record;
}
