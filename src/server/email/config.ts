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

function parseBoolean(
    value: string | undefined,
    fallback: boolean,
): boolean {
    const normalized =
        value
            ?.trim()
            .toLowerCase();

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

function optionalEmail(
    value: string | undefined,
): string | undefined {
    const normalized =
        value?.trim();

    if (!normalized) {
        return undefined;
    }

    if (!normalized.includes('@')) {
        return undefined;
    }

    return normalized;
}

export function getEmailRuntimeConfig():
    EmailRuntimeConfig {
    const enabled =
        parseBoolean(
            process.env
                .RESEND_EMAILS_ENABLED,
            false,
        );

    const customerOrderEmailsEnabled =
        parseBoolean(
            process.env
                .RESEND_CUSTOMER_ORDER_EMAILS_ENABLED,
            true,
        );

    const internalOrderEmailsEnabled =
        parseBoolean(
            process.env
                .RESEND_INTERNAL_ORDER_EMAILS_ENABLED,
            true,
        );

    if (!enabled) {
        return {
            enabled: false,

            customerOrderEmailsEnabled,
            internalOrderEmailsEnabled,

            apiKey: '',

            fromName:
                'MaxiPawz Store',

            fromEmail: '',
        };
    }

    const apiKey =
        process.env
            .RESEND_API_KEY
            ?.trim();

    if (
        !apiKey ||
        !apiKey.startsWith(
            're_',
        )
    ) {
        throw new Error(
            'RESEND_API_KEY is missing or invalid.',
        );
    }

    const fromName =
        process.env
            .RESEND_FROM_NAME
            ?.trim() ||
        'MaxiPawz Store';

    const fromEmail =
        optionalEmail(
            process.env
                .RESEND_FROM_EMAIL,
        );

    if (!fromEmail) {
        throw new Error(
            'RESEND_FROM_EMAIL is missing or invalid.',
        );
    }

    const replyToEmail =
        optionalEmail(
            process.env
                .RESEND_REPLY_TO_EMAIL,
        );

    const orderNotificationEmail =
        optionalEmail(
            process.env
                .RESEND_ORDER_NOTIFICATION_EMAIL,
        );

    const sandboxRecipientEmail =
        optionalEmail(
            process.env
                .RESEND_SANDBOX_RECIPIENT_EMAIL,
        );

    if (
        internalOrderEmailsEnabled &&
        !orderNotificationEmail &&
        !sandboxRecipientEmail
    ) {
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