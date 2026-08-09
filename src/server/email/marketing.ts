import {
    businessConfig,
} from '../../config/business';

import type {
    MarketingEmailDataMode,
} from '../../types/email';

import {
    buildEmailSiteUrl,
    escapeEmailHtml,
} from './branding';

const EMAIL_PATTERN =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface DisabledMarketingEmailRuntimeConfig {
    enabled: false;

    mode:
        MarketingEmailDataMode;
}

interface EnabledMarketingEmailRuntimeConfig {
    enabled: true;

    mode:
        MarketingEmailDataMode;

    apiKey: string;

    fromName: string;

    fromEmail: string;

    replyToEmail: string;

    mailingAddress: string;

    sandboxRecipientEmail?: string;
}

export type MarketingEmailRuntimeConfig =
    | DisabledMarketingEmailRuntimeConfig
    | EnabledMarketingEmailRuntimeConfig;

interface MarketingComplianceOptions {
    mailingAddress: string;

    unsubscribeUrl: string;
}

export class MarketingEmailConfigurationError
    extends Error {
    constructor(
        message: string,
    ) {
        super(
            message,
        );

        this.name =
            'MarketingEmailConfigurationError';
    }
}

function parseBoolean(
    value:
        string
        | undefined,

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

function getRequiredEnvironmentVariable(
    name: string,
): string {
    const value =
        process.env[
            name
        ]?.trim();

    if (!value) {
        throw new MarketingEmailConfigurationError(
            `${name} is missing.`,
        );
    }

    return value;
}

function getMarketingEmailMode():
    MarketingEmailDataMode {
    const configured =
        process.env
            .NEWSLETTER_DATA_MODE
            ?.trim()
            .toLowerCase();

    if (
        configured ===
        'test' ||
        configured ===
        'live'
    ) {
        return configured;
    }

    throw new MarketingEmailConfigurationError(
        'NEWSLETTER_DATA_MODE must be explicitly configured as "test" or "live".',
    );
}

function validateEmailAddress(
    value: string,

    environmentVariableName:
        string,
): string {
    const normalized =
        value
            .trim()
            .toLowerCase();

    if (
        !normalized ||
        normalized.length >
            254 ||
        !EMAIL_PATTERN.test(
            normalized,
        )
    ) {
        throw new MarketingEmailConfigurationError(
            `${environmentVariableName} is not a valid email address.`,
        );
    }

    return normalized;
}

export function getMarketingEmailRuntimeConfig():
    MarketingEmailRuntimeConfig {
    const enabled =
        parseBoolean(
            process.env
                .MARKETING_EMAILS_ENABLED,
            false,
        );

    const mode =
        getMarketingEmailMode();

    if (!enabled) {
        return {
            enabled:
                false,

            mode,
        };
    }

    const apiKey =
        getRequiredEnvironmentVariable(
            'RESEND_API_KEY',
        );

    if (
        !apiKey.startsWith(
            're_',
        )
    ) {
        throw new MarketingEmailConfigurationError(
            'RESEND_API_KEY is invalid.',
        );
    }

    const fromName =
        getRequiredEnvironmentVariable(
            'RESEND_MARKETING_FROM_NAME',
        );

    const fromEmail =
        validateEmailAddress(
            getRequiredEnvironmentVariable(
                'RESEND_MARKETING_FROM_EMAIL',
            ),
            'RESEND_MARKETING_FROM_EMAIL',
        );

    const replyToEmail =
        validateEmailAddress(
            getRequiredEnvironmentVariable(
                'RESEND_REPLY_TO_EMAIL',
            ),
            'RESEND_REPLY_TO_EMAIL',
        );

    const mailingAddress =
        getRequiredEnvironmentVariable(
            'MARKETING_MAILING_ADDRESS',
        );

    if (
        mailingAddress.length <
        10
    ) {
        throw new MarketingEmailConfigurationError(
            'MARKETING_MAILING_ADDRESS is too short to be a valid postal address.',
        );
    }

    /*
     * Test-mode marketing is deliberately fail-closed.
     *
     * Once marketing email is enabled in a test environment, every
     * outbound marketing message must be routed to one controlled inbox.
     * A missing override is treated as configuration failure rather than
     * risking delivery to a submitted lead.
     */
    const sandboxRecipientEmail =
        mode ===
        'test'
            ? validateEmailAddress(
                getRequiredEnvironmentVariable(
                    'RESEND_MARKETING_SANDBOX_RECIPIENT_EMAIL',
                ),
                'RESEND_MARKETING_SANDBOX_RECIPIENT_EMAIL',
            )
            : undefined;

    return {
        enabled:
            true,

        mode,

        apiKey,

        fromName,

        fromEmail,

        replyToEmail,

        mailingAddress,

        ...(sandboxRecipientEmail
            ? {
                sandboxRecipientEmail,
            }
            : {}),
    };
}

export function buildMarketingComplianceHtml(
    options:
        MarketingComplianceOptions,
): string {
    const {
        mailingAddress,
        unsubscribeUrl,
    } = options;

    const privacyUrl =
        buildEmailSiteUrl(
            '/privacy-policy',
        );

    return `
        <div
            style="
                margin-top:30px;
                padding-top:22px;
                border-top:1px solid #ecdab7;
                color:#846f63;
                font-size:11px;
                line-height:1.7;
                text-align:center;
            "
        >
            <div>
                You're receiving this marketing email because your Maxi Pawz email preference
                is currently set to receive news, product updates, pet guides, or offers.
            </div>

            <div
                style="
                    margin-top:10px;
                    font-weight:700;
                    color:#654630;
                "
            >
                ${escapeEmailHtml(
                    businessConfig.publicName,
                )}
            </div>

            <div
                style="
                    margin-top:3px;
                "
            >
                ${escapeEmailHtml(
                    mailingAddress,
                )}
            </div>

            <div
                style="
                    margin-top:12px;
                "
            >
                <a
                    href="${escapeEmailHtml(
                        unsubscribeUrl,
                    )}"
                    style="
                        color:#0074d4;
                        text-decoration:underline;
                        font-weight:700;
                    "
                >
                    Unsubscribe from marketing emails
                </a>

                <span
                    style="
                        padding:0 7px;
                        color:#b6a398;
                    "
                >
                    •
                </span>

                <a
                    href="${escapeEmailHtml(
                        privacyUrl,
                    )}"
                    style="
                        color:#0074d4;
                        text-decoration:underline;
                    "
                >
                    Privacy Policy
                </a>
            </div>

            <div
                style="
                    margin-top:10px;
                "
            >
                Questions?
                <a
                    href="mailto:${escapeEmailHtml(
                        businessConfig.supportEmail,
                    )}"
                    style="
                        color:#0074d4;
                        text-decoration:none;
                        font-weight:700;
                    "
                >
                    ${escapeEmailHtml(
                        businessConfig.supportEmail,
                    )}
                </a>
            </div>
        </div>
    `.trim();
}

export function buildMarketingComplianceText(
    options:
        MarketingComplianceOptions,
): string {
    const {
        mailingAddress,
        unsubscribeUrl,
    } = options;

    const privacyUrl =
        buildEmailSiteUrl(
            '/privacy-policy',
        );

    return [
        '',
        '---',
        '',
        `You're receiving this marketing email because your ${businessConfig.shortName} email preference is currently set to receive news, product updates, pet guides, or offers.`,
        '',
        businessConfig.publicName,
        mailingAddress,
        '',
        `Unsubscribe from marketing emails: ${unsubscribeUrl}`,
        `Privacy Policy: ${privacyUrl}`,
        `Questions: ${businessConfig.supportEmail}`,
    ].join(
        '\n',
    );
}