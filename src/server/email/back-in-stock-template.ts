import { escapeEmailHtml } from './branding';

export interface BackInStockEmailTemplateInput {
    productName: string;

    variantLabel?: string;

    productUrl: string;

    siteUrl: string;

    testMode: boolean;
}

export interface BackInStockEmailContent {
    subject: string;

    html: string;

    text: string;
}

function getSelectionName({
    productName,
    variantLabel,
}: Pick<BackInStockEmailTemplateInput, 'productName' | 'variantLabel'>): string {
    return variantLabel ? `${productName} — ${variantLabel}` : productName;
}

export function buildBackInStockEmail(
    input: BackInStockEmailTemplateInput,
): BackInStockEmailContent {
    const selectionName = getSelectionName(input);

    const siteUrl = new URL('/', input.siteUrl).toString();

    const logoUrl = new URL('/images/brand/maxipawz-email-logo.png', siteUrl).toString();

    const subject = `${selectionName} is back in stock 🐾`;

    const preheader = `Good news — ${selectionName} is available again at Maxi Pawz.`;

    const testBanner = input.testMode
        ? `
        <tr>
            <td
            style="
                background:#fff3e8;
                color:#9a3e00;
                padding:11px 18px;
                text-align:center;
                font-size:12px;
                font-weight:800;
            "
            >
            TEST MODE — delivered to the controlled Maxi Pawz sandbox recipient.
            </td>
        </tr>
        `
            : '';

        const html = `
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta
            name="viewport"
            content="width=device-width,initial-scale=1"
            />

            <title>
            ${escapeEmailHtml(subject)}
            </title>
        </head>

        <body
            style="
            margin:0;
            padding:0;
            background:#fff8dc;
            font-family:Arial,Helvetica,sans-serif;
            color:#3f2f29;
            "
        >
            <div
            style="
                display:none;
                max-height:0;
                overflow:hidden;
                opacity:0;
                color:transparent;
            "
            >
            ${escapeEmailHtml(preheader)}
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
                    style="
                    width:100%;
                    max-width:620px;
                    background:#ffffff;
                    border:1px solid #ecdab7;
                    border-radius:28px;
                    overflow:hidden;
                    "
                >
                    ${testBanner}

                    <tr>
                    <td
                        align="center"
                        style="
                        padding:26px 30px 20px;
                        background:#fff8dc;
                        "
                    >
                        <a
                        href="${escapeEmailHtml(siteUrl)}"
                        style="
                            display:inline-block;
                            text-decoration:none;
                        "
                        >
                        <img
                            src="${escapeEmailHtml(logoUrl)}"
                            width="300"
                            alt="Maxi Pawz Store"
                            style="
                            display:block;
                            width:100%;
                            max-width:300px;
                            height:auto;
                            margin:0 auto;
                            border:0;
                            "
                        />
                        </a>

                        <div
                        style="
                            margin-top:8px;
                            font-size:10px;
                            letter-spacing:1.8px;
                            font-weight:800;
                            color:#654630;
                        "
                        >
                        HAPPY PETS • HAPPY LIFE
                        </div>
                    </td>
                    </tr>

                    <tr>
                    <td
                        style="
                        height:4px;
                        background:#ff6600;
                        font-size:0;
                        line-height:0;
                        "
                    >
                        &nbsp;
                    </td>
                    </tr>

                    <tr>
                    <td
                        style="
                        height:4px;
                        background:#008aff;
                        font-size:0;
                        line-height:0;
                        "
                    >
                        &nbsp;
                    </td>
                    </tr>

                    <tr>
                    <td style="padding:34px 30px 38px;">
                        <div
                        style="
                            font-size:12px;
                            letter-spacing:1.5px;
                            font-weight:800;
                            color:#008aff;
                        "
                        >
                        BACK IN STOCK
                        </div>

                        <h1
                        style="
                            margin:10px 0 0;
                            color:#3f2f29;
                            font-size:28px;
                            line-height:1.2;
                        "
                        >
                        Good news — it’s available again.
                        </h1>

                        <p
                        style="
                            margin:18px 0 0;
                            font-size:16px;
                            line-height:1.7;
                            color:#594840;
                        "
                        >
                        <strong>
                            ${escapeEmailHtml(selectionName)}
                        </strong>
                        is back in stock at Maxi Pawz.
                        </p>

                        <p
                        style="
                            margin:14px 0 0;
                            font-size:15px;
                            line-height:1.7;
                            color:#594840;
                        "
                        >
                        Stock can change quickly, so availability is not guaranteed
                        until checkout is completed.
                        </p>

                        <table
                        role="presentation"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        style="margin-top:24px;"
                        >
                        <tr>
                            <td
                            align="center"
                            style="
                                border-radius:999px;
                                background:#ff6600;
                            "
                            >
                            <a
                                href="${escapeEmailHtml(input.productUrl)}"
                                style="
                                display:inline-block;
                                padding:14px 24px;
                                color:#ffffff;
                                text-decoration:none;
                                font-size:15px;
                                font-weight:800;
                                "
                            >
                                Shop Now
                            </a>
                            </td>
                        </tr>
                        </table>

                        <div
                        style="
                            margin-top:28px;
                            padding:16px 18px;
                            border-radius:18px;
                            background:#f4f9ff;
                            color:#594840;
                            font-size:13px;
                            line-height:1.7;
                        "
                        >
                        You received this message because you asked Maxi Pawz for
                        a one-time alert when this item became available again.
                        This request does not subscribe you to marketing emails.
                        </div>
                    </td>
                    </tr>

                    <tr>
                    <td
                        align="center"
                        style="
                        padding:25px 24px 27px;
                        background:#654630;
                        "
                    >
                        <div
                        style="
                            color:#fff8dc;
                            font-size:11px;
                            letter-spacing:1.5px;
                            font-weight:800;
                        "
                        >
                        HAPPY PETS • HAPPY LIFE
                        </div>

                        <div
                        style="
                            margin-top:10px;
                            font-size:12px;
                        "
                        >
                        <a
                            href="${escapeEmailHtml(siteUrl)}"
                            style="
                            color:#8fcfff;
                            text-decoration:none;
                            font-weight:700;
                            "
                        >
                            maxipawz.com
                        </a>
                        </div>
                    </td>
                    </tr>
                </table>

                <div
                    style="
                    max-width:620px;
                    padding:16px 10px 0;
                    color:#846f63;
                    font-size:11px;
                    line-height:1.6;
                    text-align:center;
                    "
                >
                    Maxi Pawz Store
                </div>
                </td>
            </tr>
            </table>
        </body>
        </html>
    `;

    const text = [
        'MAXI PAWZ STORE',
        '',
        'BACK IN STOCK',
        '',
        `Good news — ${selectionName} is available again.`,
        '',
        'Stock can change quickly, so availability is not guaranteed until checkout is completed.',
        '',
        `Shop now: ${input.productUrl}`,
        '',
        'You received this message because you asked Maxi Pawz for a one-time back-in-stock alert.',
        'This request does not subscribe you to marketing emails.',
        '',
        'HAPPY PETS • HAPPY LIFE',
        siteUrl,
    ].join('\n');

    return {
        subject,
        html,
        text,
    };
}