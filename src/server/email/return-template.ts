import type {
    OrderRecord,
    OrderReturnRecord,
} from '../../types/order';

import {
    buildBrandedEmailShell,
    buildEmailSiteUrl,
    buildWebsiteButton,
    escapeEmailHtml,
} from './branding';

export type ReturnEmailStage =
    | 'request-received'
    | 'approved'
    | 'rejected'
    | 'return-received';

export interface ReturnEmailContent {
    subject: string;

    html: string;

    text: string;
}

function formatMoney(
    amount: number,
    currency: string,
): string {
    return new Intl.NumberFormat(
        'en-US',
        {
            style:
                'currency',

            currency:
                currency.toUpperCase(),
        },
    ).format(
        amount /
        100,
    );
}

function formatDateOnly(
    value: string,
): string {
    const date =
        new Date(
            `${value}T12:00:00Z`,
        );

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return value;
    }

    return new Intl.DateTimeFormat(
        'en-US',
        {
            month:
                'long',

            day:
                'numeric',

            year:
                'numeric',

            timeZone:
                'UTC',
        },
    ).format(
        date,
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

function buildItemsHtml(
    returnRecord:
        OrderReturnRecord,
): string {
    return returnRecord.items
        .map(
            (
                item,
            ) => `
        <tr>
          <td
            style="padding:10px 0;border-bottom:1px solid #ecdab7;color:#3f2f29;font-size:14px;line-height:1.5;"
          >
            <strong>
              ${item.quantity} × ${escapeEmailHtml(
                item.productName,
            )}
            </strong>

            ${item.variantLabel
                    ? `
                  <div style="margin-top:3px;color:#725c50;font-size:12px;">
                    ${escapeEmailHtml(
                        item.variantLabel,
                    )}
                  </div>
                `
                    : ''
                }
          </td>
        </tr>
      `,
        )
        .join(
            '',
        );
}

function buildItemsText(
    returnRecord:
        OrderReturnRecord,
): string {
    return returnRecord.items
        .map(
            (
                item,
            ) =>
                `${item.quantity} × ${item.productName}${item.variantLabel
                    ? ` — ${item.variantLabel}`
                    : ''
                }`,
        )
        .join(
            '\n',
        );
}

function getStageContent(
    stage:
        ReturnEmailStage,

    returnRecord:
        OrderReturnRecord,
): {
    title: string;

    introduction: string;

    details: string;

    textDetails: string;
} {
    if (
        stage ===
        'request-received'
    ) {
        return {
            title:
                'We received your return request 🐾',

            introduction:
                'Your return request has been recorded and is now under review.',

            details:
                'We will contact you again after the request has been reviewed. Please do not mail any product until MaxiPawz provides return instructions.',

            textDetails:
                'We will contact you again after the request has been reviewed. Please do not mail any product until MaxiPawz provides return instructions.',
        };
    }

    if (
        stage ===
        'approved'
    ) {
        const deadline =
            returnRecord
                .returnDeadline
                ? formatDateOnly(
                    returnRecord
                        .returnDeadline,
                )
                : 'the date provided by MaxiPawz';

        const decisionMessage =
            returnRecord
                .decisionMessage
                ? `
          <div
            style="margin-top:16px;padding:15px 17px;background:#fff8dc;border-radius:16px;color:#3f2f29;font-size:14px;line-height:1.7;"
          >
            ${escapeEmailHtml(
                    returnRecord
                        .decisionMessage,
                ).replaceAll(
                    '\n',
                    '<br />',
                )}
          </div>
        `
                : '';

        return {
            title:
                'Your return request was approved',

            introduction:
                `Please follow the return instructions and send the approved items by ${deadline}.`,

            details: `
        A refund is not issued until the returned merchandise is received and reviewed.

        ${decisionMessage}
      `,

            textDetails:
                `Please send the approved items by ${deadline}.\n\n${returnRecord
                    .decisionMessage ??
                'Reply to this email before mailing the return if you need return instructions.'
                }\n\nA refund is not issued until the returned merchandise is received and reviewed.`,
        };
    }

    if (
        stage ===
        'rejected'
    ) {
        const decisionMessage =
            returnRecord
                .decisionMessage ??
            'The return request does not meet the current return requirements.';

        return {
            title:
                'Update about your return request',

            introduction:
                'We were unable to approve this return request.',

            details: `
        <div
          style="margin-top:16px;padding:15px 17px;background:#fff8dc;border-radius:16px;color:#3f2f29;font-size:14px;line-height:1.7;"
        >
          ${escapeEmailHtml(
                decisionMessage,
            ).replaceAll(
                '\n',
                '<br />',
            )}
        </div>
      `,

            textDetails:
                decisionMessage,
        };
    }

    return {
        title:
            'We received your return',

        introduction:
            'The returned merchandise has been received by MaxiPawz.',

        details:
            'If a refund is due, it will be issued separately through Stripe to the original payment method. Stripe will provide the financial refund confirmation or receipt.',

        textDetails:
            'If a refund is due, it will be issued separately through Stripe to the original payment method. Stripe will provide the financial refund confirmation or receipt.',
    };
}

export function buildCustomerReturnUpdate(
    order:
        OrderRecord,

    returnRecord:
        OrderReturnRecord,

    stage:
        ReturnEmailStage,
): ReturnEmailContent {
    const customerName =
        order.customer
            ?.name ??
        'there';

    const orderReference =
        getOrderReference(
            order.sessionId,
        );

    const stageContent =
        getStageContent(
            stage,
            returnRecord,
        );

    const testPrefix =
        order.livemode
            ? ''
            : '[SANDBOX] ';

    const subject =
        `${testPrefix}${stageContent.title} — ${orderReference}`;

    const homeUrl =
        buildEmailSiteUrl(
            '/',
        );

    const html =
        buildBrandedEmailShell({
            testMode:
                !order.livemode,

            testBannerText:
                'SANDBOX TEST — THIS IS NOT A REAL RETURN',

            preheader:
                `${stageContent.title} for order ${orderReference}.`,

            content: `
        <h1
          style="margin:4px 0 12px;font-size:28px;line-height:1.2;color:#3f2f29;"
        >
          ${escapeEmailHtml(
                stageContent.title,
            )}
        </h1>

        <p
          style="margin:0;color:#725c50;font-size:16px;line-height:1.7;"
        >
          Hi ${escapeEmailHtml(
                customerName,
            )}, ${escapeEmailHtml(
                stageContent
                    .introduction,
            )}
        </p>

        <div
          style="margin:24px 0;padding:16px 18px;background:#eef8ff;border:1px solid #b7ddff;border-radius:18px;"
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
              Return:
            </strong>

            ${escapeEmailHtml(
                returnRecord
                    .returnId,
            )}

            <br />

            <strong>
              Status:
            </strong>

            ${escapeEmailHtml(
                returnRecord
                    .status
                    .replaceAll(
                        '-',
                        ' ',
                    ),
            )}
          </div>
        </div>

        <h2
          style="margin:25px 0 8px;font-size:18px;color:#3f2f29;"
        >
          Return items
        </h2>

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
        >
          ${buildItemsHtml(
                returnRecord,
            )}
        </table>

        ${stage ===
                    'approved' ||
                    stage ===
                    'return-received'
                    ? `
              <div
                style="margin-top:20px;padding:15px 17px;background:#fff8dc;border-radius:16px;color:#3f2f29;font-size:14px;line-height:1.7;"
              >
                <strong>
                  Expected refund:
                </strong>

                ${escapeEmailHtml(
                        formatMoney(
                            returnRecord
                                .expectedRefundAmount,
                            order.currency,
                        ),
                    )}

                <br />

                <span style="color:#725c50;font-size:12px;">
                  The actual completed refund is controlled by the Stripe transaction.
                </span>
              </div>
            `
                    : ''
                }

        <div
          style="margin-top:22px;color:#725c50;font-size:14px;line-height:1.7;"
        >
          ${stageContent.details}
        </div>

        ${buildWebsiteButton(
                    'Contact MaxiPawz',
                    '/contact',
                )}
      `,
        });

    const text = `
MaxiPawz Store
HAPPY PETS • HAPPY LIFE

Hi ${customerName},

${stageContent.title}

${stageContent.introduction}

Order: ${orderReference}
Return: ${returnRecord.returnId}
Status: ${returnRecord.status.replaceAll('-', ' ')}

RETURN ITEMS
${buildItemsText(returnRecord)}

${stage ===
            'approved' ||
            stage ===
            'return-received'
            ? `Expected refund: ${formatMoney(
                returnRecord.expectedRefundAmount,
                order.currency,
            )}\n`
            : ''
        }

${stageContent.textDetails}

Contact MaxiPawz:
${buildEmailSiteUrl('/contact')}

Website:
${homeUrl}
`.trim();

    return {
        subject,

        html,

        text,
    };
}