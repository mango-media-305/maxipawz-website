import { timingSafeEqual } from 'node:crypto';

import type { Config } from '@netlify/functions';
import Stripe from 'stripe';

import {
    getPaidOrderEmailJob,
    markPaidOrderEmailJobCompleted,
    markPaidOrderEmailJobFailed,
    markPaidOrderEmailJobProcessing,
} from '../../src/server/email/order-email-jobs';

import { sendPaidOrderEmails } from '../../src/server/email/send-order-emails';

import { getOrderBySessionId } from '../../src/utils/orders';

interface PaidOrderEmailJobPayload {
    sessionId: string;
    livemode: boolean;
}

function isRecord(
    value: unknown,
): value is Record<string, unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
    );
}

function isPaidOrderEmailJobPayload(
    value: unknown,
): value is PaidOrderEmailJobPayload {
    return (
        isRecord(value) &&
        typeof value.sessionId === 'string' &&
        (value.sessionId.startsWith('cs_test_') ||
            value.sessionId.startsWith('cs_live_')) &&
        typeof value.livemode === 'boolean'
    );
}

function getInternalFunctionSecret(): string {
    const secret =
        process.env.MAXIPAWZ_INTERNAL_FUNCTION_SECRET?.trim();

    if (!secret || secret.length < 32) {
        throw new Error(
            'MAXIPAWZ_INTERNAL_FUNCTION_SECRET is missing or too short.',
        );
    }

    return secret;
}

function secretsMatch(
    provided: string | null,
    expected: string,
): boolean {
    if (!provided) {
        return false;
    }

    const providedBuffer = Buffer.from(
        provided,
        'utf8',
    );

    const expectedBuffer = Buffer.from(
        expected,
        'utf8',
    );

    if (
        providedBuffer.length !== expectedBuffer.length
    ) {
        return false;
    }

    return timingSafeEqual(
        providedBuffer,
        expectedBuffer,
    );
}

function getStripeClient(
    livemode: boolean,
): Stripe {
    const secretKey =
        process.env.STRIPE_SECRET_KEY?.trim();

    const expectedPrefix = livemode
        ? 'sk_live_'
        : 'sk_test_';

    if (
        !secretKey ||
        !secretKey.startsWith(expectedPrefix)
    ) {
        throw new Error(
            livemode
                ? 'A Stripe live secret key has not been configured.'
                : 'A Stripe test secret key has not been configured.',
        );
    }

    return new Stripe(secretKey);
}

async function parsePayload(
    request: Request,
): Promise<PaidOrderEmailJobPayload | null> {
    try {
        const value: unknown = await request.json();

        return isPaidOrderEmailJobPayload(value)
            ? value
            : null;
    } catch {
        return null;
    }
}

export default async function handler(
    request: Request,
): Promise<void> {
    let expectedSecret: string;

    try {
        expectedSecret =
            getInternalFunctionSecret();
    } catch (error) {
        console.error(
            'Paid-order email background function configuration failed.',
            error,
        );

        throw error;
    }

    if (
        !secretsMatch(
            request.headers.get(
                'x-maxipawz-internal-secret',
            ),
            expectedSecret,
        )
    ) {
        console.warn(
            'Rejected an unauthorized paid-order email background invocation.',
        );

        return;
    }

    const payload = await parsePayload(request);

    if (!payload) {
        console.warn(
            'Rejected an invalid paid-order email background payload.',
        );

        return;
    }

    const { sessionId, livemode } = payload;

    const existingJob =
        await getPaidOrderEmailJob(
            sessionId,
            livemode,
        );

    if (!existingJob) {
        console.warn(
            'Paid-order email background invocation skipped because the job does not exist.',
            {
                sessionId,
                livemode,
            },
        );

        return;
    }

    if (existingJob.status === 'completed') {
        return;
    }

    await markPaidOrderEmailJobProcessing(
        sessionId,
        livemode,
    );

    try {
        const order =
            await getOrderBySessionId(sessionId);

        if (!order) {
            throw new Error(
                'The paid order could not be found.',
            );
        }

        if (order.livemode !== livemode) {
            throw new Error(
                'The paid-order email job mode does not match the saved order mode.',
            );
        }

        if (order.paymentStatus !== 'paid') {
            throw new Error(
                'Paid-order emails can only be sent for a paid order.',
            );
        }

        const stripe = getStripeClient(livemode);

        const session =
            await stripe.checkout.sessions.retrieve(
                sessionId,
            );

        if (session.livemode !== livemode) {
            throw new Error(
                'The Stripe Checkout Session mode does not match the email job mode.',
            );
        }

        /*
         * sendPaidOrderEmails already maintains one Resend delivery
         * record and one Resend idempotency key per email type and
         * Checkout Session.
         */
        await sendPaidOrderEmails({
            session,
            order,
        });

        await markPaidOrderEmailJobCompleted(
            sessionId,
            livemode,
        );
    } catch (error) {
        try {
            await markPaidOrderEmailJobFailed(
                sessionId,
                livemode,
                error,
            );
        } catch (recordError) {
            console.error(
                'The paid-order email job failure could not be recorded.',
                recordError,
            );
        }

        console.error(
            'Paid-order email background processing failed.',
            {
                sessionId,
                livemode,
                error,
            },
        );

        /*
         * Throwing allows Netlify Background Functions to retry a
         * temporary Stripe, Resend, or Blobs failure.
         */
        throw error;
    }
}

export const config: Config = {
    background: true,
    method: 'POST',
    path: '/api/internal/send-paid-order-emails',
};