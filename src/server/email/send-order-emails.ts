import { getStore } from '@netlify/blobs';

import { Resend } from 'resend';

import type Stripe from 'stripe';

import type { EmailDeliveryRecord, TransactionalEmailKind } from '../../types/email';

import type { OrderRecord } from '../../types/order';

import { getEmailRuntimeConfig } from './config';

import { buildCustomerOrderConfirmation, buildInternalNewOrderNotification } from './templates';

interface SendPaidOrderEmailsOptions {
  session: Stripe.Checkout.Session;

  order: OrderRecord;
}

interface SendEmailOptions {
  resend: Resend;

  kind: TransactionalEmailKind;

  sessionId: string;

  recipient: string;

  from: string;

  replyTo?: string;

  subject: string;

  html: string;

  text: string;

  livemode: boolean;
}

function getEnvironmentSuffix(livemode: boolean): 'live' | 'test' {
  return livemode ? 'live' : 'test';
}

function getEmailDeliveryStore(livemode: boolean) {
  return getStore(`maxipawz-email-deliveries-${getEnvironmentSuffix(livemode)}`, {
    consistency: 'strong',
  });
}

function getDeliveryKey(
  kind: TransactionalEmailKind,

  sessionId: string,
): string {
  return `${kind}/${sessionId}`;
}

function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }

  return 'Unknown email delivery error.';
}

async function getDeliveryRecord(
  kind: TransactionalEmailKind,

  sessionId: string,

  livemode: boolean,
): Promise<EmailDeliveryRecord | null> {
  const store = getEmailDeliveryStore(livemode);

  return (await store.get(getDeliveryKey(kind, sessionId), {
    type: 'json',
  })) as EmailDeliveryRecord | null;
}

async function saveDeliveryRecord(record: EmailDeliveryRecord): Promise<void> {
  const store = getEmailDeliveryStore(record.sessionId.startsWith('cs_live_'));

  await store.setJSON(getDeliveryKey(record.kind, record.sessionId), record);
}

async function sendEmail(options: SendEmailOptions): Promise<EmailDeliveryRecord> {
  const { resend, kind, sessionId, recipient, from, replyTo, subject, html, text, livemode } =
    options;

  const existing = await getDeliveryRecord(kind, sessionId, livemode);

  if (existing?.status === 'sent') {
    return existing;
  }

  const now = new Date().toISOString();

  const attemptCount = (existing?.attemptCount ?? 0) + 1;

  try {
    const result = await resend.emails.send(
      {
        from,

        to: recipient,

        ...(replyTo
          ? {
              replyTo,
            }
          : {}),

        subject,

        html,

        text,

        tags: [
          {
            name: 'category',

            value: kind,
          },

          {
            name: 'storefront',

            value: 'maxipawz',
          },

          {
            name: 'mode',

            value: livemode ? 'live' : 'test',
          },

          {
            name: 'session_id',

            value: sessionId,
          },
        ],
      },
      {
        idempotencyKey: `${kind}/${sessionId}`,
      },
    );

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (!result.data?.id) {
      throw new Error('Resend did not return an email ID.');
    }

    const record: EmailDeliveryRecord = {
      version: 1,

      kind,

      sessionId,

      recipient,

      status: 'sent',

      provider: 'resend',

      providerMessageId: result.data.id,

      attemptCount,

      createdAt: existing?.createdAt ?? now,

      updatedAt: now,
    };

    await saveDeliveryRecord(record);

    return record;
  } catch (error) {
    const record: EmailDeliveryRecord = {
      version: 1,

      kind,

      sessionId,

      recipient,

      status: 'failed',

      provider: 'resend',

      attemptCount,

      lastError: getSafeErrorMessage(error),

      createdAt: existing?.createdAt ?? now,

      updatedAt: now,
    };

    await saveDeliveryRecord(record);

    throw error;
  }
}

export async function sendPaidOrderEmails(options: SendPaidOrderEmailsOptions): Promise<void> {
  const { session, order } = options;

  const config = getEmailRuntimeConfig();

  if (!config.enabled) {
    return;
  }

  if (order.paymentStatus !== 'paid') {
    return;
  }

  const resend = new Resend(config.apiKey);

  const from = `${config.fromName} <${config.fromEmail}>`;

  const checkoutEmail = session.customer_details?.email?.trim();

  const sandboxRecipient = !order.livemode ? config.sandboxRecipientEmail : undefined;

  if (config.customerOrderEmailsEnabled) {
    const customerRecipient = sandboxRecipient ?? checkoutEmail;

    if (customerRecipient) {
      const content = buildCustomerOrderConfirmation(session, order);

      await sendEmail({
        resend,

        kind: 'customer-order-confirmation',

        sessionId: session.id,

        recipient: customerRecipient,

        from,

        replyTo: config.replyToEmail,

        subject: content.subject,

        html: content.html,

        text: content.text,

        livemode: order.livemode,
      });
    } else {
      console.warn(
        'Customer order email skipped because the Checkout Session does not contain an email address.',
        {
          sessionId: session.id,
        },
      );
    }
  }

  if (config.internalOrderEmailsEnabled) {
    const internalRecipient = sandboxRecipient ?? config.orderNotificationEmail;

    if (!internalRecipient) {
      throw new Error('No internal order notification email is configured.');
    }

    const content = buildInternalNewOrderNotification(session, order);

    await sendEmail({
      resend,

      kind: 'internal-new-order',

      sessionId: session.id,

      recipient: internalRecipient,

      from,

      replyTo: config.replyToEmail,

      subject: content.subject,

      html: content.html,

      text: content.text,

      livemode: order.livemode,
    });
  }
}
