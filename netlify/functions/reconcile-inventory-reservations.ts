import type { Config } from '@netlify/functions';

import Stripe from 'stripe';

import { reconcileInventoryReservations } from '../../src/server/inventory-reservation-reconciliation';

function getStripeClient(): Stripe {
    const stripeSecretKey = Netlify.env.get('STRIPE_SECRET_KEY')?.trim();

    const isTestKey = stripeSecretKey?.startsWith('sk_test_') ?? false;

    const isLiveKey = stripeSecretKey?.startsWith('sk_live_') ?? false;

    if (!stripeSecretKey || (!isTestKey && !isLiveKey)) {
        throw new Error('A valid Stripe secret key has not been configured.');
    }

    return new Stripe(stripeSecretKey, {
        maxNetworkRetries: 2,
    });
}

export default async function handler(): Promise<void> {
    const stripe = getStripeClient();

    const summary = await reconcileInventoryReservations(stripe);

    console.log('Inventory reservation reconciliation completed.', summary);
}

export const config: Config = {
    schedule: '*/5 * * * *',
};
