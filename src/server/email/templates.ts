import type Stripe from 'stripe';

import type {
    OrderItem,
    OrderRecord,
} from '../../types/order';

export interface EmailContent {
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

function formatMoney(
    amount: number,
    currency: string,
): string {
    return new Intl.NumberFormat(
        'en-US',
        {
            style: 'currency',

            currency:
                currency.toUpperCase(),
        },
    ).format(
        amount / 100,
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
            .slice(-10)
            .toUpperCase();

    return `MPZ-${suffix}`;
}

function getShippingDetails(
    session: Stripe.Checkout.Session,
) {
    return (
        session
            .collected_information
            ?.shipping_details ??
        null
    );
}

function getCustomerName(
    session: Stripe.Checkout.Session,
): string {
    const name =
        getShippingDetails(
            session,
        )?.name?.trim();

    return name || 'there';
}

function formatShippingAddressText(
    session: Stripe.Checkout.Session,
): string {
    const shippingDetails =
        getShippingDetails(
            session,
        );

    if (!shippingDetails) {
        return 'Shipping address unavailable';
    }

    const {
        address,
    } = shippingDetails;

    const cityLine = [
        address.city,
        address.state,
        address.postal_code,
    ]
        .filter(Boolean)
        .join(' ');

    return [
        shippingDetails.name,
        address.line1,
        address.line2,
        cityLine,
        address.country,
    ]
        .filter(Boolean)
        .join('\n');
}

function formatShippingAddressHtml(
    session: Stripe.Checkout.Session,
): string {
    return escapeHtml(
        formatShippingAddressText(
            session,
        ),
    ).replaceAll(
        '\n',
        '<br />',
    );
}

function getItemLabel(
    item: OrderItem,
): string {
    if (!item.variantLabel) {
        return item.productName;
    }

    return `${item.productName} — ${item.variantLabel}`;
}

function buildItemsText(
    order: OrderRecord,
): string {
    return order.items
        .map(
            (item) =>
                `${item.quantity} × ${getItemLabel(
                    item,
                )} — ${formatMoney(
                    item.unitAmount *
                    item.quantity,
                    item.currency,
                )}`,
        )
        .join('\n');
}

function buildItemsHtml(
    order: OrderRecord,
): string {
    return order.items
        .map(
            (item) => {
                const label =
                    escapeHtml(
                        getItemLabel(
                            item,
                        ),
                    );

                const total =
                    escapeHtml(
                        formatMoney(
                            item.unitAmount *
                            item.quantity,
                            item.currency,
                        ),
                    );

                return `
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #ecdab7;color:#3f2f29;font-size:14px;line-height:1.5;">
              <strong>${item.quantity} × ${label}</strong>
            </td>

            <td style="padding:12px 0;border-bottom:1px solid #ecdab7;color:#3f2f29;font-size:14px;line-height:1.5;text-align:right;white-space:nowrap;">
              ${total}
            </td>
          </tr>
        `;
            },
        )
        .join('');
}

function buildTotalsText(
    order: OrderRecord,
): string {
    const lines = [
        `Merchandise subtotal: ${formatMoney(
            order.amountSubtotal,
            order.currency,
        )}`,
    ];

    if (
        order.amountDiscount > 0
    ) {
        lines.push(
            `Discount: -${formatMoney(
                order.amountDiscount,
                order.currency,
            )}`,
        );
    }

    lines.push(
        `Shipping: ${formatMoney(
            order.amountShipping,
            order.currency,
        )}`,
    );

    lines.push(
        `Tax: ${formatMoney(
            order.amountTax,
            order.currency,
        )}`,
    );

    lines.push(
        `Total: ${formatMoney(
            order.amountTotal,
            order.currency,
        )}`,
    );

    return lines.join('\n');
}

function buildTotalsHtml(
    order: OrderRecord,
): string {
    const rows: Array<
        [string, string]
    > = [
            [
                'Merchandise subtotal',

                formatMoney(
                    order.amountSubtotal,
                    order.currency,
                ),
            ],
        ];

    if (
        order.amountDiscount > 0
    ) {
        rows.push([
            'Discount',

            `−${formatMoney(
                order.amountDiscount,
                order.currency,
            )}`,
        ]);
    }

    rows.push([
        'Shipping',

        formatMoney(
            order.amountShipping,
            order.currency,
        ),
    ]);

    rows.push([
        'Tax',

        formatMoney(
            order.amountTax,
            order.currency,
        ),
    ]);

    rows.push([
        'Total',

        formatMoney(
            order.amountTotal,
            order.currency,
        ),
    ]);

    return rows
        .map(
            (
                [
                    label,
                    value,
                ],
                index,
            ) => {
                const isLast =
                    index ===
                    rows.length - 1;

                return `
          <tr>
            <td style="padding:${isLast ? '14px 0 0' : '5px 0'};color:${isLast ? '#3f2f29' : '#725c50'};font-size:${isLast ? '17px' : '14px'};font-weight:${isLast ? '800' : '600'};">
              ${escapeHtml(label)}
            </td>

            <td style="padding:${isLast ? '14px 0 0' : '5px 0'};color:#3f2f29;font-size:${isLast ? '19px' : '14px'};font-weight:${isLast ? '900' : '700'};text-align:right;">
              ${escapeHtml(value)}
            </td>
          </tr>
        `;
            },
        )
        .join('');
}

function emailShell(
    content: string,
    testMode: boolean,
): string {
    const testBanner =
        testMode
            ? `
        <div style="background:#fff3e8;color:#9a3e00;padding:12px 18px;text-align:center;font-size:13px;font-weight:800;">
          STRIPE SANDBOX TEST — NO REAL PAYMENT WAS PROCESSED
        </div>
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
        <title>MaxiPawz Store</title>
      </head>

      <body style="margin:0;padding:0;background:#fff8dc;font-family:Arial,Helvetica,sans-serif;color:#3f2f29;">
        <div style="display:none;max-height:0;overflow:hidden;">
          Your MaxiPawz order update.
        </div>

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="background:#fff8dc;"
        >
          <tr>
            <td align="center" style="padding:32px 16px;">
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
                    ${testBanner}
                  </td>
                </tr>

                <tr>
                  <td style="padding:30px 30px 18px;text-align:center;">
                    <div style="font-size:29px;line-height:1;font-weight:900;color:#ff6600;">
                      MAXI
                      <span style="color:#008aff;">
                        PAWZ
                      </span>
                    </div>

                    <div style="margin-top:7px;font-size:11px;letter-spacing:1.8px;font-weight:800;color:#725c50;">
                      HAPPY PETS • HAPPY LIFE
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 30px 34px;">
                    ${content}
                  </td>
                </tr>
              </table>

              <div style="max-width:620px;padding:18px 10px 0;color:#846f63;font-size:12px;line-height:1.6;text-align:center;">
                MaxiPawz Store<br />
                Made for pets. Built with care.
              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function buildCustomerOrderConfirmation(
    session: Stripe.Checkout.Session,
    order: OrderRecord,
): EmailContent {
    const customerName =
        getCustomerName(
            session,
        );

    const orderReference =
        getOrderReference(
            session.id,
        );

    const testPrefix =
        order.livemode
            ? ''
            : '[SANDBOX] ';

    const subject =
        `${testPrefix}We received your MaxiPawz order — ${orderReference}`;

    const html =
        emailShell(
            `
        <h1 style="margin:12px 0 12px;font-size:28px;line-height:1.15;color:#3f2f29;">
          Thanks, ${escapeHtml(
                customerName,
            )}! 🐾
        </h1>

        <p style="margin:0;color:#725c50;font-size:16px;line-height:1.7;">
          We received your MaxiPawz order. We'll use this email address for important order and shipping updates.
        </p>

        <div style="margin:24px 0;padding:16px 18px;background:#eef8ff;border:1px solid #b7ddff;border-radius:18px;">
          <div style="font-size:11px;letter-spacing:1px;font-weight:800;color:#0069b8;">
            ORDER REFERENCE
          </div>

          <div style="margin-top:5px;font-size:20px;font-weight:900;color:#3f2f29;">
            ${escapeHtml(
                orderReference,
            )}
          </div>
        </div>

        <h2 style="margin:25px 0 8px;font-size:18px;color:#3f2f29;">
          Order summary
        </h2>

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
        >
          ${buildItemsHtml(
                order,
            )}
        </table>

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="margin-top:14px;"
        >
          ${buildTotalsHtml(
                order,
            )}
        </table>

        <h2 style="margin:28px 0 8px;font-size:18px;color:#3f2f29;">
          Shipping to
        </h2>

        <div style="padding:15px 17px;background:#fff8dc;border-radius:16px;color:#725c50;font-size:14px;line-height:1.7;">
          ${formatShippingAddressHtml(
                session,
            )}
        </div>

        <p style="margin:26px 0 0;color:#725c50;font-size:13px;line-height:1.7;">
          This is your MaxiPawz order confirmation. Payment receipts and refund receipts are handled separately by Stripe.
        </p>
      `,
            !order.livemode,
        );

    const text = `
MaxiPawz Store
HAPPY PETS • HAPPY LIFE

Thanks, ${customerName}!

We received your MaxiPawz order.

Order reference: ${orderReference}

ORDER SUMMARY
${buildItemsText(order)}

${buildTotalsText(order)}

SHIPPING TO
${formatShippingAddressText(session)}

This is your MaxiPawz order confirmation. Payment receipts and refund receipts are handled separately by Stripe.
`.trim();

    return {
        subject,
        html,
        text,
    };
}

export function buildInternalNewOrderNotification(
    session: Stripe.Checkout.Session,
    order: OrderRecord,
): EmailContent {
    const orderReference =
        getOrderReference(
            session.id,
        );

    const customerEmail =
        session
            .customer_details
            ?.email ??
        'Unavailable';

    const testPrefix =
        order.livemode
            ? ''
            : '[SANDBOX] ';

    const subject =
        `${testPrefix}New MaxiPawz order — ${orderReference}`;

    const html =
        emailShell(
            `
        <h1 style="margin:12px 0 12px;font-size:28px;color:#3f2f29;">
            New order received 🐾
        </h1>

        <div style="margin:20px 0;padding:16px 18px;background:#eef8ff;border:1px solid #b7ddff;border-radius:18px;">
            <div style="font-size:13px;line-height:1.8;color:#3f2f29;">
                <strong>Reference:</strong>
                ${escapeHtml(
                    orderReference,
                )}
                <br />

                <strong>Stripe Session:</strong>
                ${escapeHtml(
                    session.id,
                )}
                <br />

                <strong>Customer:</strong>
                ${escapeHtml(
                    customerEmail,
                )}
                <br />

                <strong>Payment:</strong>
                ${escapeHtml(
                    order.paymentStatus,
                )}
            </div>
        </div>

        <h2 style="margin:25px 0 8px;font-size:18px;color:#3f2f29;">
            Items
        </h2>

        <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
        >
            ${buildItemsHtml(
                order,
            )}
        </table>

        <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="margin-top:14px;"
        >
            ${buildTotalsHtml(
                order,
            )}
        </table>

        <h2 style="margin:28px 0 8px;font-size:18px;color:#3f2f29;">
            Shipping address
        </h2>

        <div style="padding:15px 17px;background:#fff8dc;border-radius:16px;color:#725c50;font-size:14px;line-height:1.7;">
            ${formatShippingAddressHtml(
                session,
            )}
        </div>
        `,
            !order.livemode,
        );

    const text = `
NEW MAXIPAWZ ORDER

Reference: ${orderReference}
Stripe Session: ${session.id}
Customer: ${customerEmail}
Payment: ${order.paymentStatus}

ITEMS
${buildItemsText(order)}

${buildTotalsText(order)}

SHIPPING ADDRESS
${formatShippingAddressText(session)}
`.trim();

    return {
        subject,
        html,
        text,
    };
}