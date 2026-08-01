import {
    primaryNavigation,
} from '../../data/navigation';

interface BrandedEmailShellOptions {
    content: string;

    preheader: string;

    testMode: boolean;

    testBannerText?: string;
}

const fallbackSiteUrl =
    'https://maxipawz.com';

export function escapeEmailHtml(
    value: string,
): string {
    return value
        .replaceAll(
            '&',
            '&amp;',
        )
        .replaceAll(
            '<',
            '&lt;',
        )
        .replaceAll(
            '>',
            '&gt;',
        )
        .replaceAll(
            '"',
            '&quot;',
        )
        .replaceAll(
            "'",
            '&#039;',
        );
}

function getEmailSiteOrigin():
    string {
    const configured =
        process.env
            .PUBLIC_SITE_URL
            ?.trim();

    if (!configured) {
        return fallbackSiteUrl;
    }

    try {
        const url =
            new URL(
                configured,
            );

        if (
            url.protocol !==
            'https:' &&
            url.protocol !==
            'http:'
        ) {
            return fallbackSiteUrl;
        }

        return url.origin;
    } catch {
        return fallbackSiteUrl;
    }
}

export function buildEmailSiteUrl(
    path = '/',
): string {
    const origin =
        getEmailSiteOrigin();

    return new URL(
        path,
        `${origin}/`,
    ).toString();
}

function buildNavigationHtml():
        string {
        return primaryNavigation
            .map(
                (
                    item,
                ) => {
                    const href =
                        buildEmailSiteUrl(
                            item.href,
                        );

                    return `
            <a
                href="${escapeEmailHtml(
                        href,
                    )}"
                style="color:#fff8dc;text-decoration:none;font-size:13px;font-weight:700;"
            >
                ${escapeEmailHtml(
                        item.label,
                    )}
            </a>
            `;
                },
            )
            .join(
                `
            <span style="padding:0 8px;color:#ecdab7;">•</span>
        `,
            );
}

export function buildWebsiteButton(
        label: string,

        path = '/',
    ): string {
        const href =
            buildEmailSiteUrl(
                path,
            );

        return `
        <table
        role="presentation"
        cellspacing="0"
        cellpadding="0"
        border="0"
        style="margin-top:22px;"
        >
        <tr>
            <td
            align="center"
            style="border-radius:999px;background:#ff6600;"
            >
            <a
                href="${escapeEmailHtml(
            href,
        )}"
                style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;"
            >
                ${escapeEmailHtml(
            label,
        )}
            </a>
            </td>
        </tr>
        </table>
    `;
}

export function buildBrandedEmailShell({
        content,
        preheader,
        testMode,
        testBannerText,
    }: BrandedEmailShellOptions): string {
        const homeUrl =
            buildEmailSiteUrl(
                '/',
            );

        const logoUrl =
            buildEmailSiteUrl(
                '/images/brand/maxipawz-email-logo.png',
            );

        const navigation =
            buildNavigationHtml();

        const banner =
            testMode &&
                testBannerText
                ? `
            <tr>
            <td
                style="background:#fff3e8;color:#9a3e00;padding:11px 18px;text-align:center;font-size:12px;font-weight:800;"
            >
                ${escapeEmailHtml(
                    testBannerText,
                )}
            </td>
            </tr>
        `
                : '';

        return `
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />

            <meta
            name="viewport"
            content="width=device-width,initial-scale=1"
            />

            <title>
            MaxiPawz Store
            </title>
        </head>

        <body
            style="margin:0;padding:0;background:#fff8dc;font-family:Arial,Helvetica,sans-serif;color:#3f2f29;"
        >
            <div
            style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;"
            >
            ${escapeEmailHtml(
            preheader,
        )}
            </div>

            <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="width:100%;background:#fff8dc;"
            >
            <tr>
                <td
                align="center"
                style="padding:32px 16px;"
                >
                <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    style="width:100%;max-width:620px;background:#ffffff;border:1px solid #ecdab7;border-radius:28px;overflow:hidden;"
                >
                    ${banner}

                    <tr>
                    <td
                        align="center"
                        style="padding:26px 30px 20px;background:#fff8dc;"
                    >
                        <a
                        href="${escapeEmailHtml(
            homeUrl,
        )}"
                        style="display:inline-block;text-decoration:none;"
                        >
                        <img
                            src="${escapeEmailHtml(
            logoUrl,
        )}"
                            width="300"
                            alt="MaxiPawz Store"
                            style="display:block;width:100%;max-width:300px;height:auto;margin:0 auto;border:0;outline:none;text-decoration:none;"
                        />
                        </a>

                        <div
                        style="margin-top:8px;font-size:10px;letter-spacing:1.8px;font-weight:800;color:#654630;"
                        >
                        HAPPY PETS • HAPPY LIFE
                        </div>
                    </td>
                    </tr>

                    <tr>
                    <td
                        style="height:4px;background:#ff6600;font-size:0;line-height:0;"
                    >
                        &nbsp;
                    </td>
                    </tr>

                    <tr>
                    <td
                        style="height:4px;background:#008aff;font-size:0;line-height:0;"
                    >
                        &nbsp;
                    </td>
                    </tr>

                    <tr>
                    <td
                        style="padding:30px 30px 34px;"
                    >
                        ${content}
                    </td>
                    </tr>

                    <tr>
                    <td
                        align="center"
                        style="padding:25px 24px 27px;background:#654630;"
                    >
                        <div
                        style="font-size:13px;line-height:2;"
                        >
                        ${navigation}
                        </div>

                        <div
                        style="margin-top:16px;color:#fff8dc;font-size:11px;letter-spacing:1.5px;font-weight:800;"
                        >
                        HAPPY PETS • HAPPY LIFE
                        </div>

                        <div
                        style="margin-top:9px;font-size:12px;"
                        >
                        <a
                            href="${escapeEmailHtml(
            homeUrl,
        )}"
                            style="color:#8fcfff;text-decoration:none;font-weight:700;"
                        >
                            maxipawz.com
                        </a>
                        </div>
                    </td>
                    </tr>
                </table>

                <div
                    style="max-width:620px;padding:16px 10px 0;color:#846f63;font-size:11px;line-height:1.6;text-align:center;"
                >
                    MaxiPawz Store
                    <br />

                    Made for pets. Built with care.
                </div>
                </td>
            </tr>
            </table>
        </body>
        </html>
    `.trim();
}