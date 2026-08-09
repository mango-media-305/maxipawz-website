import {
    buildBrandedEmailShell,
    buildEmailSiteUrl,
    buildWebsiteButton,
    escapeEmailHtml,
} from './branding';

import {
    buildMarketingComplianceHtml,
    buildMarketingComplianceText,
} from './marketing';

interface WelcomeEmailTemplateOptions {
    firstName?:
    string;

    testMode:
    boolean;

    mailingAddress:
    string;

    unsubscribeUrl:
    string;
}

export interface WelcomeEmailContent {
    subject: string;

    html: string;

    text: string;
}

function getGreetingName(
    firstName:
        string
        | undefined,
): string {
    const normalized =
        firstName
            ?.trim();

    return normalized ||
        'there';
}

export function buildWelcomeToPackEmail(
    options:
        WelcomeEmailTemplateOptions,
): WelcomeEmailContent {
    const {
        firstName,
        testMode,
        mailingAddress,
        unsubscribeUrl,
    } = options;

    const greetingName =
        getGreetingName(
            firstName,
        );

    const subject =
        `${testMode
            ? '[TEST] '
            : ''
        }Welcome to Maxi Pawz 🐾`;

    const petGuidesUrl =
        buildEmailSiteUrl(
            '/pet-guides',
        );

    const shopUrl =
        buildEmailSiteUrl(
            '/shop',
        );

    const complianceHtml =
        buildMarketingComplianceHtml({
            mailingAddress,

            unsubscribeUrl,
        });

    const complianceText =
        buildMarketingComplianceText({
            mailingAddress,

            unsubscribeUrl,
        });

    const html =
        buildBrandedEmailShell({
            testMode,

            testBannerText:
                'MAXI PAWZ MARKETING TEST — NOT A LIVE CAMPAIGN',

            preheader:
                'Welcome to Maxi Pawz. Happy pets, happy life!',

            content: `
                <h1
                    style="
                        margin:4px 0 12px;
                        font-size:30px;
                        line-height:1.2;
                        color:#3f2f29;
                    "
                >
                    Welcome to Maxi Pawz, ${escapeEmailHtml(
                greetingName,
            )}! 🐾
                </h1>

                <p
                    style="
                        margin:0;
                        color:#725c50;
                        font-size:16px;
                        line-height:1.75;
                    "
                >
                    We're really happy you're here. You're now part of the Maxi Pawz community,
                    where everything we build starts with one simple idea:
                    happier pets make happier homes.
                </p>

                <div
                    style="
                        margin:26px 0;
                        padding:20px;
                        background:#fff8dc;
                        border:1px solid #ecdab7;
                        border-radius:20px;
                    "
                >
                    <div
                        style="
                            margin-bottom:13px;
                            color:#654630;
                            font-size:12px;
                            font-weight:900;
                            letter-spacing:1.1px;
                        "
                    >
                        WHAT YOU CAN EXPECT
                    </div>

                    <div
                        style="
                            color:#725c50;
                            font-size:14px;
                            line-height:1.8;
                        "
                    >
                        🐾 Helpful pet guides and practical ideas
                        <br />

                        🧸 New Maxi Pawz products and launches
                        <br />

                        🎉 Occasional offers and subscriber-only updates
                    </div>
                </div>

                <h2
                    style="
                        margin:28px 0 10px;
                        color:#3f2f29;
                        font-size:20px;
                        line-height:1.3;
                    "
                >
                    Start with something useful
                </h2>

                <p
                    style="
                        margin:0;
                        color:#725c50;
                        font-size:15px;
                        line-height:1.75;
                    "
                >
                    Our Pet Guides are made to help you choose, use, and enjoy pet products
                    with more confidence — without making things complicated.
                </p>

                ${buildWebsiteButton(
                'Explore Pet Guides',
                '/pet-guides',
            )}

                <p
                    style="
                        margin:26px 0 0;
                        color:#725c50;
                        font-size:14px;
                        line-height:1.7;
                    "
                >
                    Want to see what's happening in the store?
                    <a
                        href="${escapeEmailHtml(
                shopUrl,
            )}"
                        style="
                            color:#0074d4;
                            text-decoration:none;
                            font-weight:800;
                        "
                    >
                        Visit the Maxi Pawz Shop
                    </a>
                </p>

                <p
                    style="
                        margin:28px 0 0;
                        color:#654630;
                        font-size:15px;
                        line-height:1.7;
                        font-weight:700;
                    "
                >
                    Thanks for joining us.
                    <br />

                    — The Maxi Pawz Team
                </p>

                ${complianceHtml}
            `,
        });

    const text =
        `
MAXI PAWZ STORE
HAPPY PETS • HAPPY LIFE

Welcome to Maxi Pawz, ${greetingName}! 🐾

We're really happy you're here.

You're now part of the Maxi Pawz community, where everything we build starts with one simple idea: happier pets make happier homes.

WHAT YOU CAN EXPECT

- Helpful pet guides and practical ideas
- New Maxi Pawz products and launches
- Occasional offers and subscriber-only updates

START WITH SOMETHING USEFUL

Our Pet Guides are made to help you choose, use, and enjoy pet products with more confidence — without making things complicated.

Explore Pet Guides:
${petGuidesUrl}

Visit the Maxi Pawz Shop:
${shopUrl}

Thanks for joining us.

— The Maxi Pawz Team
${complianceText}
        `.trim();

    return {
        subject,

        html,

        text,
    };
}