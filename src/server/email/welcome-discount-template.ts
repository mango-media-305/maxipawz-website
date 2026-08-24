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

interface WelcomeDiscountEmailTemplateOptions {
    promotionCode: string;

    discountPercent: number;

    testMode: boolean;

    mailingAddress: string;

    unsubscribeUrl: string;
}

export interface WelcomeDiscountEmailContent {
    subject: string;

    html: string;

    text: string;
}

export function buildWelcomeDiscountEmail(
    options: WelcomeDiscountEmailTemplateOptions,
): WelcomeDiscountEmailContent {
    const {
        promotionCode,
        discountPercent,
        testMode,
        mailingAddress,
        unsubscribeUrl,
    } = options;

    const shopUrl =
        buildEmailSiteUrl('/shop');

    const escapedPromotionCode =
        escapeEmailHtml(
            promotionCode,
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

    const subject =
        `${testMode ? '[TEST] ' : ''}Your ${discountPercent}% Maxi Pawz treat is here 🐾`;

    const html =
        buildBrandedEmailShell({
            testMode,

            testBannerText:
                'MAXI PAWZ WELCOME DISCOUNT TEST — NOT A LIVE OFFER',

            preheader:
                `Your ${discountPercent}% off Maxi Pawz welcome code is ready.`,

            content: `
        <div
          style="
            margin:0 0 10px;
            color:#0074d4;
            font-size:12px;
            font-weight:900;
            letter-spacing:1.4px;
          "
        >
          A LITTLE TREAT FOR YOU 🐾
        </div>

        <h1
          style="
            margin:4px 0 12px;
            font-size:30px;
            line-height:1.2;
            color:#3f2f29;
          "
        >
          Your Maxi Pawz welcome treat is here.
        </h1>

        <p
          style="
            margin:0;
            color:#725c50;
            font-size:16px;
            line-height:1.75;
          "
        >
          Thanks for joining the Maxi Pawz community.
          To welcome you to the pack, here's
          <strong style="color:#3f2f29;">
            ${discountPercent}% off your first order.
          </strong>
        </p>

        <div
          style="
            margin:28px 0;
            padding:26px 22px;
            background:#fff8dc;
            border:1px solid #ecdab7;
            border-radius:22px;
            text-align:center;
          "
        >
          <div
            style="
              color:#654630;
              font-size:12px;
              font-weight:900;
              letter-spacing:1.2px;
            "
          >
            YOUR WELCOME OFFER
          </div>

          <div
            style="
              margin-top:10px;
              color:#ff6600;
              font-size:38px;
              line-height:1;
              font-weight:900;
            "
          >
            ${discountPercent}% OFF
          </div>

          <div
            style="
              margin-top:8px;
              color:#725c50;
              font-size:14px;
              font-weight:700;
            "
          >
            YOUR FIRST ORDER
          </div>

          <div
            style="
              margin:22px auto 0;
              max-width:360px;
              padding:17px 14px;
              border:2px dashed #008aff;
              border-radius:16px;
              background:#ffffff;
              color:#3f2f29;
              font-family:Courier New,Courier,monospace;
              font-size:22px;
              line-height:1.2;
              font-weight:900;
              letter-spacing:1px;
              word-break:break-all;
            "
          >
            ${escapedPromotionCode}
          </div>

          <div
            style="
              margin-top:13px;
              color:#846f63;
              font-size:12px;
              line-height:1.6;
            "
          >
            Use this code at checkout.
          </div>
        </div>

        ${buildWebsiteButton('Shop Maxi Pawz', '/shop')}

        <div
          style="
            margin:28px 0 0;
            padding:18px 20px;
            border:1px solid #d8ecff;
            border-radius:18px;
            background:#f4faff;
          "
        >
          <div
            style="
              color:#0074d4;
              font-size:12px;
              font-weight:900;
              letter-spacing:1px;
            "
          >
            OFFER DETAILS
          </div>

          <div
            style="
              margin-top:10px;
              color:#725c50;
              font-size:13px;
              line-height:1.8;
            "
          >
            • Valid on your first eligible Maxi Pawz order
            <br />

            • One redemption per promotion code
            <br />

            • Cannot be reused after successful redemption
            <br />

            • Subject to product availability and applicable store policies
          </div>
        </div>

        <p
          style="
            margin:26px 0 0;
            color:#725c50;
            font-size:14px;
            line-height:1.7;
          "
        >
          Ready to explore?
          <a
            href="${escapeEmailHtml(shopUrl)}"
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
          Happy shopping!
          <br />

          — The Maxi Pawz Team
        </p>

        ${complianceHtml}
      `,
        });

    const text = `
MAXI PAWZ STORE
HAPPY PETS • HAPPY LIFE

A LITTLE TREAT FOR YOU 🐾

Your Maxi Pawz welcome treat is here.

Thanks for joining the Maxi Pawz community.

WELCOME OFFER

${discountPercent}% OFF YOUR FIRST ORDER

Your code:
${promotionCode}

Use this code at checkout.

OFFER DETAILS

- Valid on your first eligible Maxi Pawz order
- One redemption per promotion code
- Cannot be reused after successful redemption
- Subject to product availability and applicable store policies

Shop Maxi Pawz:
${shopUrl}

Happy shopping!

— The Maxi Pawz Team
${complianceText}
  `.trim();

    return {
        subject,

        html,

        text,
    };
}