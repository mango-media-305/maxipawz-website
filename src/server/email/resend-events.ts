import {
    getStore,
} from '@netlify/blobs';

import type {
    ProcessedResendWebhookEventRecord,
    ResendEmailStatusRecord,
} from '../../types/email';

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

function getEmailStatusStore(
    livemode: boolean,
) {
    return getStore(
        `maxipawz-resend-email-status-${getEnvironmentSuffix(
            livemode,
        )}`,
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
        string
        | undefined,

    incoming: string,
): string {
    if (!existing) {
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

async function updateResendEmailStatus(
    event:
        ProcessedResendWebhookEventRecord,
): Promise<void> {
    if (
        event.outcome !==
        'processed' ||
        !event.providerMessageId ||
        !event.kind ||
        !event.sessionId ||
        typeof event.livemode !==
        'boolean' ||
        !event.recipients ||
        !event.deliveryStatus
    ) {
        return;
    }

    const store =
        getEmailStatusStore(
            event.livemode,
        );

    const key =
        getEmailStatusKey(
            event.providerMessageId,
        );

    const existing =
        await store.get(
            key,
            {
                type:
                    'json',
            },
        ) as
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
            'The Resend email event metadata does not match the existing email status record.',
        );
    }

    const isNewestEvent =
        !existing ||
        getTimestampMilliseconds(
            event.eventCreatedAt,
        ) >=
        getTimestampMilliseconds(
            existing
                .lastEventCreatedAt,
        );

    const next:
        ResendEmailStatusRecord = {
        version: 1,

        providerMessageId:
            event.providerMessageId,

        kind:
            event.kind,

        sessionId:
            event.sessionId,

        livemode:
            event.livemode,

        recipients:
            event.recipients,

        status:
            isNewestEvent
                ? event.deliveryStatus
                : existing
                    ?.status ??
                event.deliveryStatus,

        lastEventId:
            isNewestEvent
                ? event.eventId
                : existing
                    ?.lastEventId ??
                event.eventId,

        lastEventType:
            isNewestEvent
                ? event.eventType
                : existing
                    ?.lastEventType ??
                event.eventType,

        lastEventCreatedAt:
            isNewestEvent
                ? event.eventCreatedAt
                : existing
                    ?.lastEventCreatedAt ??
                event.eventCreatedAt,

        lastReason:
            isNewestEvent
                ? event.reason
                : existing
                    ?.lastReason,

        sentAt:
            event.deliveryStatus ===
            'sent'
                ? getLaterTimestamp(
                    existing
                        ?.sentAt,
                    event.eventCreatedAt,
                )
                : existing
                    ?.sentAt,

        deliveredAt:
            event.deliveryStatus ===
            'delivered'
                ? getLaterTimestamp(
                    existing
                        ?.deliveredAt,
                    event.eventCreatedAt,
                )
                : existing
                    ?.deliveredAt,

        deliveryDelayedAt:
            event.deliveryStatus ===
            'delivery-delayed'
                ? getLaterTimestamp(
                    existing
                        ?.deliveryDelayedAt,
                    event.eventCreatedAt,
                )
                : existing
                    ?.deliveryDelayedAt,

        bouncedAt:
            event.deliveryStatus ===
            'bounced'
                ? getLaterTimestamp(
                    existing
                        ?.bouncedAt,
                    event.eventCreatedAt,
                )
                : existing
                    ?.bouncedAt,

        complainedAt:
            event.deliveryStatus ===
            'complained'
                ? getLaterTimestamp(
                    existing
                        ?.complainedAt,
                    event.eventCreatedAt,
                )
                : existing
                    ?.complainedAt,

        failedAt:
            event.deliveryStatus ===
            'failed'
                ? getLaterTimestamp(
                    existing
                        ?.failedAt,
                    event.eventCreatedAt,
                )
                : existing
                    ?.failedAt,

        suppressedAt:
            event.deliveryStatus ===
            'suppressed'
                ? getLaterTimestamp(
                    existing
                        ?.suppressedAt,
                    event.eventCreatedAt,
                )
                : existing
                    ?.suppressedAt,

        createdAt:
            existing
                ?.createdAt ??
            event.receivedAt,

        updatedAt:
            event.receivedAt,
    };

    await store.setJSON(
        key,
        next,
    );
}

export async function recordProcessedResendWebhookEvent(
    event:
        ProcessedResendWebhookEventRecord,
): Promise<void> {
    /*
     * Update the derived status before recording the event as
     * processed. If the final write fails, Resend can retry and
     * safely rebuild the same status.
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