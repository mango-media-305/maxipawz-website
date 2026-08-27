import { createHash } from 'node:crypto';

import type { Config } from '@netlify/functions';

import {
  NewsletterError,
  parseNewsletterLeadInput,
  submitNewsletterLead,
} from '../../src/server/email/newsletter';

import { queueWelcomeEmailJob } from '../../src/server/email/welcome-email-jobs';

import { syncFoundingPackSegmentationToResend } from '../../src/server/founding-pack/resend-segmentation';

import type { MarketingEmailDataMode } from '../../src/types/email';

type WelcomeEmailDispatchStatus =
  | 'not-requested'
  | 'queued'
  | 'already-processing'
  | 'already-completed'
  | 'dispatch-failed';

function getFormString(
  formData: FormData,

  name: string,
): string {
  const value = formData.get(name);

  return typeof value === 'string' ? value : '';
}

function wantsJson(request: Request): boolean {
  return request.headers.get('accept')?.includes('application/json') ?? false;
}

function jsonResponse(
  body: unknown,

  status: number,
): Response {
  return Response.json(body, {
    status,

    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

function redirectResponse(
  request: Request,

  path: string,
): Response {
  const url = new URL(path, request.url);

  return new Response(null, {
    status: 303,

    headers: {
      Location: url.toString(),

      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

function getNewsletterDataMode(): MarketingEmailDataMode {
  const configured = process.env.NEWSLETTER_DATA_MODE?.trim().toLowerCase();

  if (configured === 'test' || configured === 'live') {
    return configured;
  }

  throw new Error('NEWSLETTER_DATA_MODE must be explicitly configured as "test" or "live".');
}

function getInternalFunctionSecret(): string {
  const secret = process.env.MAXIPAWZ_INTERNAL_FUNCTION_SECRET?.trim();

  if (!secret || secret.length < 32) {
    throw new Error('MAXIPAWZ_INTERNAL_FUNCTION_SECRET is missing or too short.');
  }

  return secret;
}

function hashEmail(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase(), 'utf8').digest('hex');
}

async function reconcileFoundingPackSegmentation(
  email: string,
): Promise<void> {
  try {
    const result = await syncFoundingPackSegmentationToResend(email);

    /*
     * member-not-found is expected for subscribers who have never
     * completed a Founding Pack pet profile.
     *
     * not-eligible should be rare here because this reconciliation
     * runs only after a successful opted-in Resend synchronization,
     * but it remains a valid non-error domain result.
     */
    if (result.status === 'synced') {
      console.info('Founding Pack segmentation was reconciled after newsletter opt-in.', {
        emailHash: hashEmail(email),
      });
    }
  } catch (error) {
    /*
     * Newsletter preference synchronization is the primary operation.
     *
     * Segmentation enrichment is secondary and must never turn an
     * already-successful marketing opt-in into a failed signup.
     */
    console.error('Newsletter opt-in succeeded, but Founding Pack segmentation reconciliation failed.', {
      emailHash: hashEmail(email),

      error,
    });
  }
}

async function dispatchWelcomeEmail(
  request: Request,

  email: string,
): Promise<WelcomeEmailDispatchStatus> {
  const dataMode = getNewsletterDataMode();

  const emailHash = hashEmail(email);

  const job = await queueWelcomeEmailJob(emailHash, dataMode);

  /*
   * A completed Welcome Email is permanent. Re-submitting the Join
   * the Pack form must never cause another Welcome Email to be sent.
   */
  if (job.status === 'completed') {
    return 'already-completed';
  }

  /*
   * Do not deliberately create another concurrent background
   * invocation if one is already processing.
   */
  if (job.status === 'processing') {
    return 'already-processing';
  }

  /*
   * queueWelcomeEmailJob() converts failed or skipped jobs back to
   * queued. That allows a visitor who submitted while marketing was
   * disabled to trigger a fresh attempt later by submitting again.
   */
  const internalSecret = getInternalFunctionSecret();

  const endpoint = new URL('/api/internal/send-welcome-email', request.url);

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',

        'X-MaxiPawz-Internal-Secret': internalSecret,
      },

      body: JSON.stringify({
        emailHash,

        dataMode,
      }),
    });
  } catch (error) {
    console.error('The Welcome Email background function could not be invoked.', {
      emailHash,

      dataMode,

      error,
    });

    throw new Error('The Welcome Email background function could not be invoked.');
  }

  if (!response.ok) {
    const responseBody = (await response.text()).slice(0, 500);

    console.error('The Welcome Email background function rejected the invocation.', {
      emailHash,

      dataMode,

      status: response.status,

      responseBody,
    });

    throw new Error('The Welcome Email background function rejected the invocation.');
  }

  return 'queued';
}

export default async function handler(request: Request): Promise<Response> {
  try {
    const formData = await request.formData().catch(() => null);

    if (!formData) {
      if (wantsJson(request)) {
        return jsonResponse(
          {
            ok: false,

            message: 'The newsletter signup request is invalid.',
          },
          400,
        );
      }

      return redirectResponse(request, '/join/problem');
    }

    /*
     * Manual honeypot.
     *
     * Bots receive an apparent success response, but nothing is
     * written to Blobs or Resend.
     */
    const botField = getFormString(formData, 'bot-field').trim();

    if (botField) {
      if (wantsJson(request)) {
        return jsonResponse(
          {
            ok: true,

            accepted: true,
          },
          202,
        );
      }

      return redirectResponse(request, '/join/success');
    }

    const email = getFormString(formData, 'email');

    const firstName = getFormString(formData, 'first-name');

    /*
     * An unchecked HTML checkbox is omitted from FormData.
     *
     * Therefore:
     *
     * "yes" => marketing selected
     * missing => marketing declined
     */
    const marketingConsent = getFormString(formData, 'marketing-consent') === 'yes';

    const input = parseNewsletterLeadInput(
      email,
      firstName,
      marketingConsent,
      'homepage-join-the-pack',
    );

    /*
     * The Contact synchronization is the primary signup operation.
     *
     * Welcome Email dispatch and Founding Pack segmentation
     * reconciliation happen only after the preference has been
     * successfully stored and synchronized with Resend.
     */
    const result = await submitNewsletterLead(input);

    let welcomeEmailJobStatus: WelcomeEmailDispatchStatus = 'not-requested';

    if (result.marketingConsent && result.resendSyncStatus === 'synced') {
      /*
       * Reconcile any pet profile that may have been created during
       * an earlier opted-out state.
       *
       * A missing pet profile is a normal condition and does not
       * affect the newsletter signup.
       */
      await reconcileFoundingPackSegmentation(input.email);

      try {
        welcomeEmailJobStatus = await dispatchWelcomeEmail(request, input.email);
      } catch (error) {
        /*
         * A Welcome Email infrastructure problem must not turn
         * an otherwise successful newsletter signup into a
         * failed signup.
         *
         * The user's marketing preference is already safely
         * stored and synchronized at this point.
         */
        welcomeEmailJobStatus = 'dispatch-failed';

        console.error('Newsletter signup succeeded, but Welcome Email dispatch failed.', {
          emailHash: hashEmail(input.email),

          error,
        });
      }
    }

    if (wantsJson(request)) {
      return jsonResponse(
        {
          ok: true,

          ...result,

          welcomeEmailJobStatus,
        },
        201,
      );
    }

    return redirectResponse(request, marketingConsent ? '/join/success' : '/join/thanks');
  } catch (error) {
    if (error instanceof NewsletterError) {
      console.warn('Newsletter signup could not be completed.', {
        code: error.code,

        status: error.status,

        message: error.message,
      });

      if (wantsJson(request)) {
        return jsonResponse(
          {
            ok: false,

            code: error.code,

            message: error.message,
          },
          error.status,
        );
      }

      return redirectResponse(request, '/join/problem');
    }

    console.error('Unexpected newsletter signup failure.', error);

    if (wantsJson(request)) {
      return jsonResponse(
        {
          ok: false,

          message: 'Newsletter signup is temporarily unavailable.',
        },
        500,
      );
    }

    return redirectResponse(request, '/join/problem');
  }
}

export const config: Config = {
  path: '/api/newsletter/subscribe',

  method: 'POST',

  /*
   * Protect the public signup endpoint before requests reach
   * Netlify Blobs or the Resend Contacts API.
   *
   * Each IP address receives its own allowance for this domain:
   * 5 requests every 60 seconds.
   *
   * Requests above the limit are rejected by Netlify with HTTP 429.
   */
  rateLimit: {
    windowLimit: 5,

    windowSize: 60,

    aggregateBy: ['ip', 'domain'],
  },
};