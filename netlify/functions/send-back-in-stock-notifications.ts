import type { Config } from '@netlify/functions';

import { businessConfig } from '../../src/config/business';

import {
    processBackInStockNotifications,
    type BackInStockNotificationMode,
    type BackInStockNotificationRuntimeConfig,
} from '../../src/server/back-in-stock-notifications';

function parseBoolean(
    value:
        string |
        undefined,

    fallback:
        boolean,
): boolean {
    const normalized =
        value
            ?.trim()
            .toLowerCase();

    if (
        normalized ===
        'true'
    ) {
        return true;
    }

    if (
        normalized ===
        'false'
    ) {
        return false;
    }

    return fallback;
}

function requireEmail(
    value:
        string |
        undefined,

    variableName:
        string,
): string {
    const normalized =
        value?.trim();

    if (
        !normalized ||
        !normalized.includes(
            '@',
        )
    ) {
        throw new Error(
            `${variableName} is missing or invalid.`,
        );
    }

    return normalized;
}

function parseMode(
    value:
        string |
        undefined,
): BackInStockNotificationMode {
    const normalized =
        value
            ?.trim()
            .toLowerCase();

    if (
        normalized ===
        'test' ||
        normalized ===
        'live'
    ) {
        return normalized;
    }

    throw new Error(
        'BACK_IN_STOCK_EMAIL_MODE must be explicitly configured as "test" or "live".',
    );
}

function resolveSiteUrl(
    value:
        string |
        undefined,
): string {
    const candidate =
        value?.trim();

    if (
        !candidate
    ) {
        throw new Error(
            'A site URL is required for back-in-stock notifications.',
        );
    }

    const url =
        new URL(
            candidate,
        );

    if (
        url.protocol !==
        'https:' &&
        url.protocol !==
        'http:'
    ) {
        throw new Error(
            'The back-in-stock site URL is invalid.',
        );
    }

    return url.origin;
}

function getRuntimeConfig():
    BackInStockNotificationRuntimeConfig {
    /*
     * RESEND_EMAILS_ENABLED remains the global transactional-email kill
     * switch.
     *
     * BACK_IN_STOCK_EMAILS_ENABLED adds a separate feature-specific switch
     * so this worker can be deployed without immediately sending mail.
     */
    const globallyEnabled =
        parseBoolean(
            Netlify.env.get(
                'RESEND_EMAILS_ENABLED',
            ),
            false,
        );

    const featureEnabled =
        parseBoolean(
            Netlify.env.get(
                'BACK_IN_STOCK_EMAILS_ENABLED',
            ),
            false,
        );

    const enabled =
        globallyEnabled &&
        featureEnabled;

    const defaultSiteUrl =
        Netlify.env.get(
            'URL',
        )?.trim() ||
        'https://maxipawz.com';

    if (
        !enabled
    ) {
        return {
            enabled:
                false,

            mode:
                'test',

            apiKey:
                '',

            fromName:
                businessConfig
                    .automatedEmailSenderName,

            fromEmail:
                businessConfig
                    .automatedEmailSenderAddress,

            replyToEmail:
                businessConfig
                    .supportEmail,

            siteUrl:
                resolveSiteUrl(
                    defaultSiteUrl,
                ),
        };
    }

    const mode =
        parseMode(
            Netlify.env.get(
                'BACK_IN_STOCK_EMAIL_MODE',
            ),
        );

    const apiKey =
        Netlify.env
            .get(
                'RESEND_API_KEY',
            )
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
        Netlify.env
            .get(
                'RESEND_FROM_NAME',
            )
            ?.trim() ||
        businessConfig
            .automatedEmailSenderName;

    const fromEmail =
        requireEmail(
            Netlify.env.get(
                'RESEND_FROM_EMAIL',
            ) ||
            businessConfig
                .automatedEmailSenderAddress,

            'RESEND_FROM_EMAIL',
        );

    const replyToEmail =
        requireEmail(
            Netlify.env.get(
                'RESEND_REPLY_TO_EMAIL',
            ) ||
            businessConfig
                .supportEmail,

            'RESEND_REPLY_TO_EMAIL',
        );

    const sandboxRecipientEmail =
        mode ===
            'test'
            ? requireEmail(
                Netlify.env.get(
                    'RESEND_SANDBOX_RECIPIENT_EMAIL',
                ),

                'RESEND_SANDBOX_RECIPIENT_EMAIL',
            )
            : undefined;

    const siteUrl =
        resolveSiteUrl(
            Netlify.env.get(
                'BACK_IN_STOCK_SITE_URL',
            ) ||
            defaultSiteUrl,
        );

    return {
        enabled:
            true,

        mode,

        apiKey,

        fromName,

        fromEmail,

        replyToEmail,

        ...(sandboxRecipientEmail
            ? {
                sandboxRecipientEmail,
            }
            : {}),

        siteUrl,
    };
}

export default async function handler():
    Promise<void> {
    const config =
        getRuntimeConfig();

    const summary =
        await processBackInStockNotifications(
            config,
        );

    console.log(
        'Back-in-stock notification processing completed.',
        summary,
    );
}

export const config:
    Config = {
    schedule:
        '*/5 * * * *',
};