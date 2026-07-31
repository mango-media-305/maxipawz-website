import type {
    OrderRecord,
} from '../../types/order';

export interface ShippingEmailContent {
    subject: string;

    html: string;

    text: string;
}

function escapeHtml(
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

    const trackingLink =
        fulfillment
            .trackingUrl
            ? `
            <a
            href="${escapeHtml(
                    fulfillment
                        .trackingUrl,
                )}"
                style="display:inline-block;margin-top:20px;padding:13px 22px;background:#008aff;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:800;"
            >
            Track your package
            </a>
        `
            : '';

    const sandboxBanner =
        order.livemode
            ? ''
            : `
            <div style="background:#fff3e8;color:#9a3e00;padding:12px 18px;text-align:center;font-size:13px;font-weight:800;">
                SANDBOX TEST — THIS IS NOT A REAL SHIPMENT
            </div>
        `;

    const html = `
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta
        name="viewport"
        content="width=device-width,initial-scale=1"
        />
        <title>MaxiPawz Shipping Update</title>
    </head>

    <body style="margin:0;padding:0;background:#fff8dc;font-family:Arial,Helvetica,sans-serif;color:#3f2f29;">
        <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        border="0"
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
                style="max-width:620px;background:#ffffff;border:1px solid #ecdab7;border-radius:28px;overflow:hidden;"
            >
                <tr>
                <td>
                    ${sandboxBanner}
                </td>
                </tr>

                <tr>
                <td style="padding:30px;">
                    <div style="text-align:center;font-size:29px;font-weight:900;color:#ff6600;">
                    MAXI
                    <span style="color:#008aff;">
                        PAWZ
                    </span>
                    </div>

                    <h1 style="margin:30px 0 12px;font-size:28px;color:#3f2f29;">
                    Your order is on the way! 🐾
                    </h1>

                    <p style="color:#725c50;font-size:16px;line-height:1.7;">
                    Hi ${escapeHtml(
            customerName,
        )}, your MaxiPawz order has been shipped.
                    </p>

                    <div style="margin:24px 0;padding:18px;background:#eef8ff;border:1px solid #b7ddff;border-radius:18px;">
                    <div style="font-size:13px;line-height:1.9;color:#3f2f29;">
                        <strong>Order:</strong>
                        ${escapeHtml(
            orderReference,
        )}
                        <br />

                        <strong>Carrier:</strong>
                        ${escapeHtml(
            serviceLine,
        )}
                        <br />

                        <strong>Tracking:</strong>
                        ${escapeHtml(
            fulfillment
                .trackingNumber,
        )}
                    </div>

                    ${trackingLink}
                    </div>

                    <p style="color:#725c50;font-size:13px;line-height:1.7;">
                    Tracking information can take some time to update after the carrier receives the package.
                    </p>
                </td>
                </tr>
            </table>
            </td>
        </tr>
        </table>
    </body>
</html>
`.trim();

    const text = `
MaxiPawz Store
HAPPY PETS • HAPPY LIFE

Hi ${customerName},

Your MaxiPawz order is on the way!

Order: ${orderReference}
Carrier: ${serviceLine}
Tracking: ${fulfillment.trackingNumber}
${fulfillment.trackingUrl
            ? `Track package: ${fulfillment.trackingUrl}`
            : ''}

Tracking information can take some time to update after the carrier receives the package.
`.trim();

    return {
        subject,

        html,

        text,
    };
}