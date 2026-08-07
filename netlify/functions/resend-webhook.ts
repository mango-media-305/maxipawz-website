import type {
    Config,
} from '@netlify/functions';

import {
    Resend,
} from 'resend';

import {
    hasProcessedResendWebhookEvent,
    recordProcessedResendWebhookEvent,
} from '../../src/server/email/resend-events';

import type {
    ProcessedResendWebhookEventRecord,
    ResendEmailDeliveryStatus,
    ResendTrackedEmailEventType,
    TransactionalEmailKind,
} from '../../src/types/email';

const trackedEmailEventTypes =
    new Set<string>([
        'email.sent',
        'email.delivered',
        'email.delivery_delayed',
        'email.bounced',
        'email.complained',
        'email.failed',
        'email.suppressed',
    ]);

const transactionalEmailKinds =
    new Set<string>([
        'customer-order-confirmation',
        'internal-new-order',
        'customer-shipping-confirmation',
    ]);

class WebhookError
    extends Error {
    readonly status:
        number;

    constructor(
        status: number,
        message: string,
    ) {
        super(
            message,
        );

        this.name =
            'WebhookError';

        this.status =
            status;
    }
}

interface VerifiedResendWebhookEvent {
    type: string;

    created_at: string;

    data:
    Record<
        string,
        unknown
    >;
}

interface ProcessableEmailMetadata {
    eventType:
    ResendTrackedEmailEventType;

    providerMessageId: string;

    kind:
    TransactionalEmailKind;

    sessionId: string;

    livemode: boolean;

    recipients: string[];

    deliveryStatus:
    ResendEmailDeliveryStatus;

    reason?: string;
}

function jsonResponse(
    value: unknown,

    status = 200,
): Response {
    return Response.json(
        value,
        {
            status,

            headers: {
                'Cache-Control':
                    'no-store, max-age=0',
            },
        },
    );
}

function isRecord(
    value: unknown,
): value is Record<
    string,
    unknown
> {
    return (
        typeof value ===
        'object' &&
        value !==
        null &&
        !Array.isArray(
            value,
        )
    );
}

function isStringArray(
    value: unknown,
): value is string[] {
    return (
        Array.isArray(
            value,
        ) &&
        value.every(
            (
                item,
            ) =>
                typeof item ===
                'string',
        )
    );
}

function isValidIsoDate(
    value: string,
): boolean {
    return Number.isFinite(
        new Date(
            value,
        ).getTime(),
    );
}

function isTrackedEmailEventType(
    value: string,
): value is ResendTrackedEmailEventType {
    return trackedEmailEventTypes.has(
        value,
    );
}

function isTransactionalEmailKind(
    value: string,
): value is TransactionalEmailKind {
    return transactionalEmailKinds.has(
        value,
    );
}

function isVerifiedResendWebhookEvent(
    value: unknown,
): value is VerifiedResendWebhookEvent {
    return (
        isRecord(
            value,
        ) &&
        typeof value.type ===
        'string' &&
        typeof value.created_at ===
        'string' &&
        isValidIsoDate(
            value.created_at,
        ) &&
        isRecord(
            value.data,
        )
    );
}

function getRequiredEnvironmentVariable(
    name: string,
    prefix: string,
): string {
    const value =
        process.env[
            name
        ]?.trim();

    if (
        !value ||
        !value.startsWith(
            prefix,
        )
    ) {
        throw new WebhookError(
            503,
            `${name} is missing or invalid.`,
        );
    }

    return value;
}

function getRequiredHeader(
    request: Request,
    name: string,
): string {
    const value =
        request.headers.get(
            name,
        );

    if (!value) {
        throw new WebhookError(
            400,
            `The ${name} header is missing.`,
        );
    }

    return value;
}

function getTags(
    data:
        Record<
            string,
            unknown
        >,
): Record<
    string,
    string
> {
    const value =
        data.tags;

    if (
        !isRecord(
            value,
        )
    ) {
        return {};
    }

    const tags:
        Record<
            string,
            string
        > = {};

    for (
        const [
            key,
            tagValue,
        ] of Object.entries(
            value,
        )
    ) {
        if (
            typeof tagValue ===
            'string'
        ) {
            tags[
                key
            ] =
                tagValue;
        }
    }

    return tags;
}

function getOptionalString(
    record:
        Record<
            string,
            unknown
        >,

    key: string,
): string | undefined {
    const value =
        record[
            key
        ];

    return typeof value ===
        'string'
        ? value
        : undefined;
}

function getEventReason(
    eventType:
        ResendTrackedEmailEventType,

    data:
        Record<
            string,
            unknown
        >,
): string | undefined {
    if (
        eventType ===
        'email.complained'
    ) {
        return 'The recipient marked the message as spam.';
    }

    const detailKey =
        eventType ===
        'email.bounced'
            ? 'bounce'
            : eventType ===
                'email.failed'
                ? 'failed'
                : eventType ===
                    'email.suppressed'
                    ? 'suppressed'
                    : eventType ===
                        'email.delivery_delayed'
                        ? 'delivery_delayed'
                        : undefined;

    if (!detailKey) {
        return undefined;
    }

    const details =
        data[
            detailKey
        ];

    if (
        !isRecord(
            details,
        )
    ) {
        return undefined;
    }

    const values =
        [
            getOptionalString(
                details,
                'message',
            ),

            getOptionalString(
                details,
                'reason',
            ),

            getOptionalString(
                details,
                'type',
            ),

            getOptionalString(
                details,
                'subType',
            ),

            getOptionalString(
                details,
                'code',
            ),
        ]
            .filter(
                (
                    value,
                ): value is string =>
                    Boolean(
                        value,
                    ),
            );

    if (
        values.length ===
        0
    ) {
        return undefined;
    }

    return Array.from(
        new Set(
            values,
        ),
    )
        .join(
            ' — ',
        )
        .slice(
            0,
            500,
        );
}

function getDeliveryStatus(
    eventType:
        ResendTrackedEmailEventType,
): ResendEmailDeliveryStatus {
    switch (
        eventType
    ) {
        case 'email.sent':
            return 'sent';

        case 'email.delivered':
            return 'delivered';

        case 'email.delivery_delayed':
            return 'delivery-delayed';

        case 'email.bounced':
            return 'bounced';

        case 'email.complained':
            return 'complained';

        case 'email.failed':
            return 'failed';

        case 'email.suppressed':
            return 'suppressed';
    }
}

function resolveProcessableEmailMetadata(
    event:
        VerifiedResendWebhookEvent,
):
    | {
        processable: true;

        metadata:
        ProcessableEmailMetadata;
    }
    | {
        processable: false;

        reason: string;
    } {
    if (
        !isTrackedEmailEventType(
            event.type,
        )
    ) {
        return {
            processable:
                false,

            reason:
                'The Resend event type is not tracked by Maxi Pawz.',
        };
    }

    const tags =
        getTags(
            event.data,
        );

    if (
        tags.storefront !==
        'maxipawz'
    ) {
        return {
            processable:
                false,

            reason:
                'The email does not belong to the Maxi Pawz storefront.',
        };
    }

    const kind =
        tags.category;

    if (
        !kind ||
        !isTransactionalEmailKind(
            kind,
        )
    ) {
        return {
            processable:
                false,

            reason:
                'The email does not contain a supported transactional category.',
        };
    }

    const sessionId =
        tags.session_id;

    if (
        !sessionId ||
        (
            !sessionId.startsWith(
                'cs_test_',
            ) &&
            !sessionId.startsWith(
                'cs_live_',
            )
        )
    ) {
        return {
            processable:
                false,

            reason:
                'The email does not contain a valid Stripe Checkout Session tag.',
        };
    }

    const mode =
        tags.mode;

    if (
        mode !==
        'test' &&
        mode !==
        'live'
    ) {
        return {
            processable:
                false,

            reason:
                'The email does not contain a valid environment mode tag.',
        };
    }

    const livemode =
        mode ===
        'live';

    if (
        livemode !==
        sessionId.startsWith(
            'cs_live_',
        )
    ) {
        return {
            processable:
                false,

            reason:
                'The email mode tag does not match the Stripe Checkout Session mode.',
        };
    }

    const providerMessageId =
        event.data
            .email_id;

    if (
        typeof providerMessageId !==
        'string' ||
        !providerMessageId.trim()
    ) {
        return {
            processable:
                false,

            reason:
                'The Resend event does not contain an email ID.',
        };
    }

    const recipients =
        event.data.to;

    if (
        !isStringArray(
            recipients,
        ) ||
        recipients.length ===
        0
    ) {
        return {
            processable:
                false,

            reason:
                'The Resend event does not contain a valid recipient list.',
        };
    }

    return {
        processable:
            true,

        metadata: {
            eventType:
                event.type,

            providerMessageId:
                providerMessageId.trim(),

            kind,

            sessionId,

            livemode,

            recipients,

            deliveryStatus:
                getDeliveryStatus(
                    event.type,
                ),

            reason:
                getEventReason(
                    event.type,
                    event.data,
                ),
        },
    };
}

async function verifyWebhookEvent(
    request: Request,
): Promise<{
    eventId: string;

    event:
    VerifiedResendWebhookEvent;
}> {
    const apiKey =
        getRequiredEnvironmentVariable(
            'RESEND_API_KEY',
            're_',
        );

    const webhookSecret =
        getRequiredEnvironmentVariable(
            'RESEND_WEBHOOK_SECRET',
            'whsec_',
        );

    const eventId =
        getRequiredHeader(
            request,
            'svix-id',
        );

    const timestamp =
        getRequiredHeader(
            request,
            'svix-timestamp',
        );

    const signature =
        getRequiredHeader(
            request,
            'svix-signature',
        );

    const payload =
        await request.text();

    const resend =
        new Resend(
            apiKey,
        );

    let verified:
        unknown;

    try {
        verified =
            await Promise.resolve(
                resend
                    .webhooks
                    .verify({
                        payload,

                        headers: {
                            id:
                                eventId,

                            timestamp,

                            signature,
                        },

                        webhookSecret,
                    }),
            );
    } catch {
        throw new WebhookError(
            400,
            'The Resend webhook signature could not be verified.',
        );
    }

    if (
        !isVerifiedResendWebhookEvent(
            verified,
        )
    ) {
        throw new WebhookError(
            400,
            'The verified Resend webhook payload is invalid.',
        );
    }

    return {
        eventId,
        event:
            verified,
    };
}

export default async function handler(
    request: Request,
): Promise<Response> {
    if (
        request.method !==
        'POST'
    ) {
        return jsonResponse(
            {
                received:
                    false,

                message:
                    'This endpoint accepts POST requests only.',
            },
            405,
        );
    }

    try {
        const {
            eventId,
            event,
        } =
            await verifyWebhookEvent(
                request,
            );

        const duplicate =
            await hasProcessedResendWebhookEvent(
                eventId,
            );

        if (duplicate) {
            return jsonResponse({
                received:
                    true,

                duplicate:
                    true,

                eventId,
            });
        }

        const resolved =
            resolveProcessableEmailMetadata(
                event,
            );

        const receivedAt =
            new Date()
                .toISOString();

        let record:
            ProcessedResendWebhookEventRecord;

        if (
            resolved.processable
        ) {
            record = {
                version: 1,

                eventId,

                eventType:
                    resolved
                        .metadata
                        .eventType,

                providerMessageId:
                    resolved
                        .metadata
                        .providerMessageId,

                kind:
                    resolved
                        .metadata
                        .kind,

                sessionId:
                    resolved
                        .metadata
                        .sessionId,

                livemode:
                    resolved
                        .metadata
                        .livemode,

                recipients:
                    resolved
                        .metadata
                        .recipients,

                deliveryStatus:
                    resolved
                        .metadata
                        .deliveryStatus,

                outcome:
                    'processed',

                reason:
                    resolved
                        .metadata
                        .reason,

                eventCreatedAt:
                    event
                        .created_at,

                receivedAt,
            };
        } else {
            record = {
                version: 1,

                eventId,

                eventType:
                    event.type,

                providerMessageId:
                    typeof event
                        .data
                        .email_id ===
                        'string'
                        ? event
                            .data
                            .email_id
                        : undefined,

                outcome:
                    'ignored',

                reason:
                    resolved.reason,

                eventCreatedAt:
                    event
                        .created_at,

                receivedAt,
            };
        }

        await recordProcessedResendWebhookEvent(
            record,
        );

        return jsonResponse({
            received:
                true,

            duplicate:
                false,

            processed:
                record.outcome ===
                'processed',

            eventId,

            eventType:
                record.eventType,

            deliveryStatus:
                record
                    .deliveryStatus,

            reason:
                record.reason,
        });
    } catch (error) {
        if (
            error instanceof
            WebhookError
        ) {
            return jsonResponse(
                {
                    received:
                        false,

                    message:
                        error.message,
                },
                error.status,
            );
        }

        console.error(
            'Resend webhook processing failed.',
            error,
        );

        return jsonResponse(
            {
                received:
                    false,

                message:
                    'The Resend webhook could not be processed.',
            },
            500,
        );
    }
}

export const config:
    Config = {
    path:
        '/api/resend-webhook',
};