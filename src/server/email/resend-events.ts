import {
  getStore,
} from '@netlify/blobs';

import type {
  MarketingEmailKind,
  ProcessedResendWebhookEventRecord,
  ResendEmailStatusRecord,
  ResendMarketingEmailStatusRecord,
  ResendTrackedEmailEventType,
} from '../../types/email';

interface CommonProcessedDeliveryEvent {
  eventId: string;

  eventType: ResendTrackedEmailEventType;

  providerMessageId: string;

  recipients: string[];

  deliveryStatus:
    ResendEmailStatusRecord['status'];

  reason?: string;

  eventCreatedAt: string;

  receivedAt: string;
}

type ExistingStatusRecord =
  | ResendEmailStatusRecord
  | ResendMarketingEmailStatusRecord;

const marketingEmailKinds =
  new Set<MarketingEmailKind>([
    'welcome-to-the-pack',
    'welcome-discount',
  ]);

function isMarketingEmailKind(
  value:
    | string
    | undefined,
): value is MarketingEmailKind {
  return (
    typeof value ===
      'string' &&
    marketingEmailKinds.has(
      value as MarketingEmailKind,
    )
  );
}

function getEnvironmentSuffix(
  livemode: boolean,
): 'live' | 'test' {
  return livemode
    ? 'live'
    : 'test';
}

function getWebhookEventStore() {
  return getStore(
    'maxipawz-resend-webhook-events',
    {
      consistency:
        'strong',
    },
  );
}

function getTransactionalEmailStatusStore(
  livemode: boolean,
) {
  return getStore(
    `maxipawz-resend-email-status-${getEnvironmentSuffix(livemode)}`,
    {
      consistency:
        'strong',
    },
  );
}

function getMarketingEmailStatusStore(
  dataMode:
    'test' | 'live',
) {
  return getStore(
    `maxipawz-resend-marketing-email-status-${dataMode}`,
    {
      consistency:
        'strong',
    },
  );
}

function getWebhookEventKey(
  eventId: string,
): string {
  return `event/${eventId}`;
}

function getEmailStatusKey(
  providerMessageId: string,
): string {
  return `email/${providerMessageId}`;
}

function getTimestampMilliseconds(
  value: string,
): number {
  const milliseconds =
    new Date(
      value,
    ).getTime();

  return Number.isFinite(
    milliseconds,
  )
    ? milliseconds
    : 0;
}

function getLaterTimestamp(
  existing:
    | string
    | undefined,

  incoming: string,
): string {
  if (
    !existing
  ) {
    return incoming;
  }

  return getTimestampMilliseconds(
    incoming,
  ) >=
    getTimestampMilliseconds(
      existing,
    )
    ? incoming
    : existing;
}

function getCommonProcessedDeliveryEvent(
  event:
    ProcessedResendWebhookEventRecord,
): CommonProcessedDeliveryEvent | null {
  if (
    event.outcome !==
      'processed' ||
    !event.providerMessageId ||
    !event.recipients ||
    !event.deliveryStatus
  ) {
    return null;
  }

  const trackedEventTypes:
    ResendTrackedEmailEventType[] = [
    'email.sent',
    'email.delivered',
    'email.delivery_delayed',
    'email.bounced',
    'email.complained',
    'email.failed',
    'email.suppressed',
  ];

  if (
    !trackedEventTypes.includes(
      event.eventType as
        ResendTrackedEmailEventType,
    )
  ) {
    return null;
  }

  return {
    eventId:
      event.eventId,

    eventType:
      event.eventType as
        ResendTrackedEmailEventType,

    providerMessageId:
      event.providerMessageId,

    recipients:
      event.recipients,

    deliveryStatus:
      event.deliveryStatus,

    reason:
      event.reason,

    eventCreatedAt:
      event.eventCreatedAt,

    receivedAt:
      event.receivedAt,
  };
}

function buildTimeline(
  existing:
    ExistingStatusRecord | null,

  event:
    CommonProcessedDeliveryEvent,
) {
  const isNewestEvent =
    !existing ||
    getTimestampMilliseconds(
      event.eventCreatedAt,
    ) >=
      getTimestampMilliseconds(
        existing.lastEventCreatedAt,
      );

  return {
    status:
      isNewestEvent
        ? event.deliveryStatus
        : (existing?.status ??
          event.deliveryStatus),

    lastEventId:
      isNewestEvent
        ? event.eventId
        : (existing?.lastEventId ??
          event.eventId),

    lastEventType:
      isNewestEvent
        ? event.eventType
        : (existing?.lastEventType ??
          event.eventType),

    lastEventCreatedAt:
      isNewestEvent
        ? event.eventCreatedAt
        : (existing?.lastEventCreatedAt ??
          event.eventCreatedAt),

    lastReason:
      isNewestEvent
        ? event.reason
        : existing?.lastReason,

    sentAt:
      event.deliveryStatus ===
      'sent'
        ? getLaterTimestamp(
            existing?.sentAt,
            event.eventCreatedAt,
          )
        : existing?.sentAt,

    deliveredAt:
      event.deliveryStatus ===
      'delivered'
        ? getLaterTimestamp(
            existing?.deliveredAt,
            event.eventCreatedAt,
          )
        : existing?.deliveredAt,

    deliveryDelayedAt:
      event.deliveryStatus ===
      'delivery-delayed'
        ? getLaterTimestamp(
            existing?.deliveryDelayedAt,
            event.eventCreatedAt,
          )
        : existing?.deliveryDelayedAt,

    bouncedAt:
      event.deliveryStatus ===
      'bounced'
        ? getLaterTimestamp(
            existing?.bouncedAt,
            event.eventCreatedAt,
          )
        : existing?.bouncedAt,

    complainedAt:
      event.deliveryStatus ===
      'complained'
        ? getLaterTimestamp(
            existing?.complainedAt,
            event.eventCreatedAt,
          )
        : existing?.complainedAt,

    failedAt:
      event.deliveryStatus ===
      'failed'
        ? getLaterTimestamp(
            existing?.failedAt,
            event.eventCreatedAt,
          )
        : existing?.failedAt,

    suppressedAt:
      event.deliveryStatus ===
      'suppressed'
        ? getLaterTimestamp(
            existing?.suppressedAt,
            event.eventCreatedAt,
          )
        : existing?.suppressedAt,

    createdAt:
      existing?.createdAt ??
      event.receivedAt,

    updatedAt:
      event.receivedAt,
  };
}

export async function hasProcessedResendWebhookEvent(
  eventId: string,
): Promise<boolean> {
  const store =
    getWebhookEventStore();

  const value =
    await store.get(
      getWebhookEventKey(
        eventId,
      ),
    );

  return value !==
    null;
}

async function updateTransactionalEmailStatus(
  event:
    ProcessedResendWebhookEventRecord,

  common:
    CommonProcessedDeliveryEvent,
): Promise<void> {
  if (
    !event.kind ||
    isMarketingEmailKind(
      event.kind,
    ) ||
    !event.sessionId ||
    typeof event.livemode !==
      'boolean'
  ) {
    return;
  }

  const store =
    getTransactionalEmailStatusStore(
      event.livemode,
    );

  const key =
    getEmailStatusKey(
      common.providerMessageId,
    );

  const existing =
    (await store.get(
      key,
      {
        type:
          'json',
      },
    )) as
      | ResendEmailStatusRecord
      | null;

  if (
    existing &&
    (
      existing.kind !==
        event.kind ||
      existing.sessionId !==
        event.sessionId ||
      existing.livemode !==
        event.livemode
    )
  ) {
    throw new Error(
      'The Resend transactional email event metadata does not match the existing email status record.',
    );
  }

  const record:
    ResendEmailStatusRecord = {
    version:
      1,

    providerMessageId:
      common.providerMessageId,

    kind:
      event.kind,

    sessionId:
      event.sessionId,

    livemode:
      event.livemode,

    recipients:
      common.recipients,

    ...buildTimeline(
      existing,
      common,
    ),
  };

  await store.setJSON(
    key,
    record,
  );
}

async function updateMarketingEmailStatus(
  event:
    ProcessedResendWebhookEventRecord,

  common:
    CommonProcessedDeliveryEvent,
): Promise<void> {
  if (
    !isMarketingEmailKind(
      event.kind,
    ) ||
    !event.emailHash ||
    (
      event.dataMode !==
        'test' &&
      event.dataMode !==
        'live'
    )
  ) {
    return;
  }

  const store =
    getMarketingEmailStatusStore(
      event.dataMode,
    );

  const key =
    getEmailStatusKey(
      common.providerMessageId,
    );

  const existing =
    (await store.get(
      key,
      {
        type:
          'json',
      },
    )) as
      | ResendMarketingEmailStatusRecord
      | null;

  if (
    existing &&
    (
      existing.kind !==
        event.kind ||
      existing.emailHash !==
        event.emailHash ||
      existing.dataMode !==
        event.dataMode
    )
  ) {
    throw new Error(
      'The Resend marketing email event metadata does not match the existing email status record.',
    );
  }

  const record:
    ResendMarketingEmailStatusRecord = {
    version:
      1,

    providerMessageId:
      common.providerMessageId,

    kind:
      event.kind,

    emailHash:
      event.emailHash,

    dataMode:
      event.dataMode,

    recipients:
      common.recipients,

    ...buildTimeline(
      existing,
      common,
    ),
  };

  await store.setJSON(
    key,
    record,
  );
}

async function updateResendEmailStatus(
  event:
    ProcessedResendWebhookEventRecord,
): Promise<void> {
  const common =
    getCommonProcessedDeliveryEvent(
      event,
    );

  if (
    !common
  ) {
    return;
  }

  if (
    isMarketingEmailKind(
      event.kind,
    )
  ) {
    await updateMarketingEmailStatus(
      event,
      common,
    );

    return;
  }

  await updateTransactionalEmailStatus(
    event,
    common,
  );
}

export async function recordProcessedResendWebhookEvent(
  event:
    ProcessedResendWebhookEventRecord,
): Promise<void> {
  /*
   * Update the derived status before recording the webhook event
   * as processed.
   *
   * If the final event write fails, Resend may retry the webhook
   * and safely rebuild the same derived status.
   */
  await updateResendEmailStatus(
    event,
  );

  const store =
    getWebhookEventStore();

  await store.setJSON(
    getWebhookEventKey(
      event.eventId,
    ),
    event,
  );
}