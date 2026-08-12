import { businessConfig } from '../../config/business';

export interface EmailRuntimeConfig {
  enabled: boolean;

  customerOrderEmailsEnabled: boolean;
  internalOrderEmailsEnabled: boolean;

  apiKey: string;

  fromName: string;
  fromEmail: string;

  replyToEmail?: string;

  orderNotificationEmail?: string;

  sandboxRecipientEmail?: string;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return fallback;
  }

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  return fallback;
}

function resolveEmail(
  value: string | undefined,
  fallback: string | undefined,
  variableName: string,
): string | undefined {
  const normalized = value?.trim();

  if (!normalized) {
    return fallback;
  }

  if (!normalized.includes('@')) {
    throw new Error(`${variableName} is invalid.`);
  }

  return normalized;
}

export function getEmailRuntimeConfig(): EmailRuntimeConfig {
  const enabled = parseBoolean(process.env.RESEND_EMAILS_ENABLED, false);

  const customerOrderEmailsEnabled = parseBoolean(
    process.env.RESEND_CUSTOMER_ORDER_EMAILS_ENABLED,
    true,
  );

  const internalOrderEmailsEnabled = parseBoolean(
    process.env.RESEND_INTERNAL_ORDER_EMAILS_ENABLED,
    true,
  );

  const defaultFromName = businessConfig.automatedEmailSenderName;

  const defaultFromEmail = businessConfig.automatedEmailSenderAddress;

  const defaultReplyToEmail = businessConfig.supportEmail;

  const defaultOrderNotificationEmail = businessConfig.ordersEmail;

  if (!enabled) {
    return {
      enabled: false,

      customerOrderEmailsEnabled,
      internalOrderEmailsEnabled,

      apiKey: '',

      fromName: defaultFromName,

      fromEmail: defaultFromEmail,

      replyToEmail: defaultReplyToEmail,

      orderNotificationEmail: defaultOrderNotificationEmail,
    };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey || !apiKey.startsWith('re_')) {
    throw new Error('RESEND_API_KEY is missing or invalid.');
  }

  const fromName = process.env.RESEND_FROM_NAME?.trim() || defaultFromName;

  const fromEmail = resolveEmail(
    process.env.RESEND_FROM_EMAIL,
    defaultFromEmail,
    'RESEND_FROM_EMAIL',
  );

  if (!fromEmail) {
    throw new Error('RESEND_FROM_EMAIL is missing or invalid.');
  }

  const replyToEmail = resolveEmail(
    process.env.RESEND_REPLY_TO_EMAIL,
    defaultReplyToEmail,
    'RESEND_REPLY_TO_EMAIL',
  );

  const orderNotificationEmail = resolveEmail(
    process.env.RESEND_ORDER_NOTIFICATION_EMAIL,
    defaultOrderNotificationEmail,
    'RESEND_ORDER_NOTIFICATION_EMAIL',
  );

  const sandboxRecipientEmail = resolveEmail(
    process.env.RESEND_SANDBOX_RECIPIENT_EMAIL,
    undefined,
    'RESEND_SANDBOX_RECIPIENT_EMAIL',
  );

  if (internalOrderEmailsEnabled && !orderNotificationEmail && !sandboxRecipientEmail) {
    throw new Error(
      'RESEND_ORDER_NOTIFICATION_EMAIL must be configured when internal order emails are enabled.',
    );
  }

  return {
    enabled,

    customerOrderEmailsEnabled,
    internalOrderEmailsEnabled,

    apiKey,

    fromName,
    fromEmail,

    replyToEmail,

    orderNotificationEmail,

    sandboxRecipientEmail,
  };
}
