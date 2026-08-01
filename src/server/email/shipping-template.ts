import type {
    OrderRecord,
} from '../../types/order';

import {
    buildBrandedEmailShell,
    buildEmailSiteUrl,
    escapeEmailHtml,
} from './branding';

export interface ShippingEmailContent {
    subject: string;

    html: string;

    text: string;
}

function getOrderReference(
    sessionId: string,
): string {
    const suffix =
        sessionId
        .replace(
            /^cs_(?:test|live)_/,
            '',
        )
        .slice(
            -10,
        )
        .toUpperCase();

    return `MPZ-${suffix}`;
}

function buildTrackingButton(
    trackingUrl: string,
): string {
    return `
        <table
        role="presentation"
        cellspacing="0"
        cellpadding="0"
        border="0"
        style="margin-top:20px;"
        >
        <tr>
            <td
            align="center"
            style="border-radius:999px;background:#008aff;"
            >
            <a
                href="${escapeEmailHtml(
                trackingUrl,
                )}"
                style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:800;"
            >
                Track your package
            </a>
            </td>
        </tr>
        </table>
    `;
}

function buildVisitWebsiteButton():
    string {
    const homeUrl =
        buildEmailSiteUrl(
        '/',
        );

    return `
        <table
        role="presentation"
        cellspacing="0"
        cellpadding="0"
        border="0"
        style="margin-top:12px;"
        >
        <tr>
            <td
            align="center"
            style="border-radius:999px;border:1px solid #ecdab7;background:#fff8dc;"
            >
            <a
                href="${escapeEmailHtml(
                homeUrl,
                )}"
                style="display:inline-block;padding:12px 20px;color:#654630;text-decoration:none;font-size:13px;font-weight:800;"
            >
                Visit MaxiPawz
            </a>
            </td>
        </tr>
        </table>
    `;
}

export function buildCustomerShippingConfirmation(
    order:
        OrderRecord,
): ShippingEmailContent {
    const fulfillment =
        order.fulfillment;

    if (!fulfillment) {
        throw new Error(
        'The order does not contain fulfillment information.',
        );
    }

    const customerName =
        order.customer
        ?.name ??
        'there';

    const orderReference =
        getOrderReference(
        order.sessionId,
        );

    const testPrefix =
        order.livemode
        ? ''
        : '[SANDBOX] ';

    const subject =
        `${testPrefix}Your MaxiPawz order is on the way — ${orderReference}`;

    const serviceLine =
        fulfillment.service
        ? `${fulfillment.carrier} ${fulfillment.service}`
        : fulfillment.carrier;

    const trackingButton =
        fulfillment.trackingUrl
        ? buildTrackingButton(
            fulfillment
                .trackingUrl,
            )
        : '';

    const homeUrl =
        buildEmailSiteUrl(
        '/',
        );

    const html =
        buildBrandedEmailShell({
        testMode:
            !order.livemode,

        testBannerText:
            'SANDBOX TEST — THIS IS NOT A REAL SHIPMENT',

        preheader:
            `Your MaxiPawz order ${orderReference} is on the way.`,

        content: `
            <h1
            style="margin:4px 0 12px;font-size:28px;line-height:1.2;color:#3f2f29;"
            >
            Your order is on the way! 🐾
            </h1>

            <p
            style="margin:0;color:#725c50;font-size:16px;line-height:1.7;"
            >
            Hi ${escapeEmailHtml(
                customerName,
            )}, your MaxiPawz order has been shipped.
            </p>

            <div
            style="margin:24px 0;padding:18px;background:#eef8ff;border:1px solid #b7ddff;border-radius:18px;"
            >
            <div
                style="font-size:13px;line-height:1.9;color:#3f2f29;"
            >
                <strong>
                Order:
                </strong>

                ${escapeEmailHtml(
                orderReference,
                )}

                <br />

                <strong>
                Carrier:
                </strong>

                ${escapeEmailHtml(
                serviceLine,
                )}

                <br />

                <strong>
                Tracking:
                </strong>

                ${escapeEmailHtml(
                fulfillment
                    .trackingNumber,
                )}
            </div>

            ${trackingButton}
            </div>

            <p
            style="margin:0;color:#725c50;font-size:13px;line-height:1.7;"
            >
            Tracking information can take some time to update after the carrier receives the package.
            </p>

            ${buildVisitWebsiteButton()}
        `,
    });

    const text = `
MaxiPawz Store
HAPPY PETS • HAPPY LIFE

Hi ${customerName},

Your MaxiPawz order is on the way!

Order: ${orderReference}
Carrier: ${serviceLine}
Tracking: ${fulfillment.trackingNumber}

${
    fulfillment.trackingUrl
        ? `Track package: ${fulfillment.trackingUrl}`
        : ''
}

Visit MaxiPawz:
${homeUrl}

Tracking information can take some time to update after the carrier receives the package.
`.trim();

    return {
        subject,

        html,

        text,
    };
}