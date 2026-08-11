import type { Config } from '@netlify/functions';

import {
  inspectNewsletterUnsubscribeToken,
  NewsletterUnsubscribeError,
  unsubscribeNewsletterLeadByToken,
} from '../../src/server/email/unsubscribe';

const UNSUBSCRIBE_COOKIE_NAME = 'maxipawz_marketing_unsubscribe';

const UNSUBSCRIBE_COOKIE_MAX_AGE_SECONDS = 15 * 60;

function redirectResponse(
  request: Request,

  path: string,

  additionalHeaders: Record<string, string> = {},
): Response {
  const url = new URL(path, request.url);

  return new Response(null, {
    status: 303,

    headers: {
      Location: url.toString(),

      'Cache-Control': 'no-store, max-age=0',

      'Referrer-Policy': 'no-referrer',

      ...additionalHeaders,
    },
  });
}

function emptyResponse(status: number): Response {
  return new Response(null, {
    status,

    headers: {
      'Cache-Control': 'no-store, max-age=0',

      'Referrer-Policy': 'no-referrer',
    },
  });
}

function getCookieValue(
  request: Request,

  name: string,
): string | undefined {
  const cookieHeader = request.headers.get('cookie');

  if (!cookieHeader) {
    return undefined;
  }

  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rawValueParts] = part.trim().split('=');

    if (rawName !== name) {
      continue;
    }

    const rawValue = rawValueParts.join('=');

    if (!rawValue) {
      return undefined;
    }

    try {
      return decodeURIComponent(rawValue);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function getQueryToken(request: Request): string | undefined {
  const value = new URL(request.url).searchParams.get('token')?.trim();

  return value || undefined;
}

function getUnsubscribeToken(request: Request): string | undefined {
  return getQueryToken(request) ?? getCookieValue(request, UNSUBSCRIBE_COOKIE_NAME);
}

function shouldUseSecureCookie(request: Request): boolean {
  return new URL(request.url).protocol === 'https:';
}

function buildUnsubscribeCookie(
  request: Request,

  token: string,
): string {
  const secure = shouldUseSecureCookie(request) ? '; Secure' : '';

  return (
    [
      `${UNSUBSCRIBE_COOKIE_NAME}=${encodeURIComponent(token)}`,
      'Path=/api/newsletter/unsubscribe',
      'HttpOnly',
      'SameSite=Lax',
      `Max-Age=${UNSUBSCRIBE_COOKIE_MAX_AGE_SECONDS}`,
    ].join('; ') + secure
  );
}

function buildExpiredUnsubscribeCookie(request: Request): string {
  const secure = shouldUseSecureCookie(request) ? '; Secure' : '';

  return (
    [
      `${UNSUBSCRIBE_COOKIE_NAME}=`,
      'Path=/api/newsletter/unsubscribe',
      'HttpOnly',
      'SameSite=Lax',
      'Max-Age=0',
    ].join('; ') + secure
  );
}

async function isOneClickUnsubscribeRequest(request: Request): Promise<boolean> {
  if (request.method !== 'POST') {
    return false;
  }

  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';

  if (
    !contentType.includes('application/x-www-form-urlencoded') &&
    !contentType.includes('multipart/form-data')
  ) {
    return false;
  }

  try {
    /*
     * Clone the request so the detection step never consumes the
     * original request body.
     */
    const formData = await request.clone().formData();

    return formData.get('List-Unsubscribe') === 'One-Click';
  } catch {
    return false;
  }
}

async function handleGet(request: Request): Promise<Response> {
  const token = getQueryToken(request);

  if (!token) {
    return redirectResponse(request, '/email/unsubscribe-problem');
  }

  /*
   * GET verifies the signed token but intentionally performs no
   * unsubscribe action.
   *
   * This prevents security scanners that automatically visit links
   * from changing a visitor's marketing preference.
   */
  await inspectNewsletterUnsubscribeToken(token);

  return redirectResponse(request, '/email/unsubscribe', {
    'Set-Cookie': buildUnsubscribeCookie(request, token),
  });
}

async function handlePost(
  request: Request,

  oneClickRequest: boolean,
): Promise<Response> {
  const token = getUnsubscribeToken(request);

  if (!token) {
    return oneClickRequest
      ? emptyResponse(400)
      : redirectResponse(request, '/email/unsubscribe-problem');
  }

  const result = await unsubscribeNewsletterLeadByToken(token);

  if (result.resendSyncStatus === 'failed') {
    console.warn(
      'The marketing opt-out was recorded by Maxi Pawz, but Resend synchronization remains pending.',
    );
  }

  /*
   * RFC 8058 / email-provider one-click requests expect an empty
   * successful response rather than a browser redirect.
   */
  if (oneClickRequest) {
    return emptyResponse(200);
  }

  return redirectResponse(request, '/email/unsubscribed', {
    'Set-Cookie': buildExpiredUnsubscribeCookie(request),
  });
}

export default async function handler(request: Request): Promise<Response> {
  const oneClickRequest =
    request.method === 'POST' ? await isOneClickUnsubscribeRequest(request) : false;

  try {
    if (request.method === 'GET') {
      return await handleGet(request);
    }

    if (request.method === 'POST') {
      return await handlePost(request, oneClickRequest);
    }

    return new Response('Method Not Allowed', {
      status: 405,

      headers: {
        Allow: 'GET, POST',

        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    if (error instanceof NewsletterUnsubscribeError) {
      console.warn('Newsletter unsubscribe request could not be completed.', {
        code: error.code,

        status: error.status,

        message: error.message,
      });

      if (oneClickRequest) {
        return emptyResponse(error.status >= 500 ? 503 : 400);
      }

      return redirectResponse(request, '/email/unsubscribe-problem', {
        'Set-Cookie': buildExpiredUnsubscribeCookie(request),
      });
    }

    console.error('Unexpected newsletter unsubscribe failure.', error);

    if (oneClickRequest) {
      return emptyResponse(500);
    }

    return redirectResponse(request, '/email/unsubscribe-problem', {
      'Set-Cookie': buildExpiredUnsubscribeCookie(request),
    });
  }
}

export const config: Config = {
  path: '/api/newsletter/unsubscribe',
};
