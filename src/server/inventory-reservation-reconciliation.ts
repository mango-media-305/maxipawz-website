import { getDatabase } from '@netlify/database';

import Stripe from 'stripe';

import {
  completeInventoryReservation,
  expireInventoryReservation,
  markInventoryReservationPaymentPending,
  releaseInventoryReservationAfterPaymentFailure,
} from './inventory-reservation-lifecycle';

import type { InventoryReservationStatus } from '../types/inventory-reservation';

const ORPHAN_RESERVATION_GRACE_MS = 10 * 60 * 1000;

const PAYMENT_PENDING_RECHECK_MS = 10 * 60 * 1000;

const RECONCILIATION_BATCH_SIZE = 8;

type ReconciliationCandidateStatus = 'active' | 'payment-pending';

type ReconciliationAction =
  | 'completed'
  | 'expired'
  | 'released'
  | 'payment-pending'
  | 'unchanged'
  | 'error';

interface ReconciliationCandidateDatabaseRow {
  id: string;

  stripe_session_id: string | null;

  status: ReconciliationCandidateStatus;

  expires_at: string | Date;

  updated_at: string | Date;
}

interface ReconciliationCandidate {
  id: string;

  stripeSessionId?: string;

  status: ReconciliationCandidateStatus;

  expiresAt: Date;

  updatedAt: Date;
}

interface ReservationItemDatabaseRow {
  inventory_item_id: string | number;

  sku: string;

  quantity: string | number;
}

interface LockedInventoryDatabaseRow {
  id: string | number;

  reserved: string | number;
}

interface LockedReservationDatabaseRow {
  id: string;

  status: InventoryReservationStatus;

  stripe_session_id: string | null;

  expires_at: string | Date;
}

export interface InventoryReservationReconciliationDetail {
  reservationId: string;

  stripeSessionId?: string;

  action: ReconciliationAction;

  status?: string;

  error?: string;
}

export interface InventoryReservationReconciliationSummary {
  scanned: number;

  completed: number;

  expired: number;

  released: number;

  paymentPending: number;

  unchanged: number;

  errors: number;

  details: InventoryReservationReconciliationDetail[];
}

function normalizeDate(value: string | Date, fieldName: string): Date {
  const normalized = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(normalized.getTime())) {
    throw new Error(`Inventory reservation field "${fieldName}" contains an invalid timestamp.`);
  }

  return normalized;
}

function normalizeInteger(value: string | number, fieldName: string): number {
  const normalized = typeof value === 'number' ? value : Number(value);

  if (!Number.isSafeInteger(normalized)) {
    throw new Error(`Inventory reservation field "${fieldName}" contains an invalid integer.`);
  }

  return normalized;
}

function normalizeStripeId(
  value:
    | string
    | {
        id: string;
      }
    | null
    | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  return typeof value === 'string' ? value : value.id;
}

function validateStripeSessionOwnership(
  session: Stripe.Checkout.Session,
  reservationId: string,
): void {
  if (
    session.metadata?.storefront !== 'maxipawz' ||
    session.metadata?.inventory_reserved !== 'true' ||
    session.metadata?.inventory_reservation_id !== reservationId
  ) {
    throw new Error(
      `Stripe Checkout Session ${session.id} does not match inventory reservation ${reservationId}.`,
    );
  }
}

async function getReconciliationCandidates(now: Date): Promise<ReconciliationCandidate[]> {
  const db = getDatabase();

  const orphanCutoff = new Date(now.getTime() - ORPHAN_RESERVATION_GRACE_MS);

  const paymentPendingCutoff = new Date(now.getTime() - PAYMENT_PENDING_RECHECK_MS);

  const rows = await db.sql`
            SELECT
                id,
                stripe_session_id,
                status,
                expires_at,
                updated_at
            FROM inventory_reservations
            WHERE
                (
                    status = 'active'
                    AND stripe_session_id IS NULL
                    AND expires_at <= ${orphanCutoff}
                )
                OR
                (
                    status = 'active'
                    AND stripe_session_id IS NOT NULL
                    AND expires_at <= ${now}
                )
                OR
                (
                    status = 'payment-pending'
                    AND stripe_session_id IS NOT NULL
                    AND updated_at <= ${paymentPendingCutoff}
                )
            ORDER BY
                CASE
                    WHEN status = 'active'
                        THEN 0
                    ELSE 1
                END ASC,
                expires_at ASC,
                updated_at ASC
            LIMIT ${RECONCILIATION_BATCH_SIZE}
        `;

  return rows.map((row) => {
    const candidate = row as ReconciliationCandidateDatabaseRow;

    return {
      id: candidate.id,

      ...(candidate.stripe_session_id
        ? {
            stripeSessionId: candidate.stripe_session_id,
          }
        : {}),

      status: candidate.status,

      expiresAt: normalizeDate(candidate.expires_at, 'expires_at'),

      updatedAt: normalizeDate(candidate.updated_at, 'updated_at'),
    };
  });
}

async function expireOrphanedInventoryReservation(
  reservationId: string,
  now: Date,
): Promise<'expired' | 'unchanged'> {
  const db = getDatabase();

  const client = await db.pool.connect();

  const orphanCutoff = new Date(now.getTime() - ORPHAN_RESERVATION_GRACE_MS);

  try {
    await client.query('BEGIN');

    const reservationResult = await client.query(
      `
                    SELECT
                        id,
                        status,
                        stripe_session_id,
                        expires_at
                    FROM inventory_reservations
                    WHERE id = $1
                    FOR UPDATE
                `,
      [reservationId],
    );

    const reservation = reservationResult.rows[0] as LockedReservationDatabaseRow | undefined;

    if (!reservation) {
      await client.query('COMMIT');

      return 'unchanged';
    }

    if (reservation.status !== 'active') {
      await client.query('COMMIT');

      return 'unchanged';
    }

    /*
     * A Stripe Session may have been attached between the initial
     * reconciliation query and this transaction.
     *
     * If so, we must not release inventory without asking Stripe for
     * its authoritative Session state first.
     */
    if (reservation.stripe_session_id) {
      await client.query('COMMIT');

      return 'unchanged';
    }

    const expiresAt = normalizeDate(reservation.expires_at, 'expires_at');

    if (expiresAt.getTime() > orphanCutoff.getTime()) {
      await client.query('COMMIT');

      return 'unchanged';
    }

    const itemResult = await client.query(
      `
                    SELECT
                        inventory_item_id,
                        sku,
                        quantity
                    FROM inventory_reservation_items
                    WHERE reservation_id = $1
                    ORDER BY sku ASC
                `,
      [reservationId],
    );

    const items = itemResult.rows as ReservationItemDatabaseRow[];

    if (items.length === 0) {
      throw new Error(
        `Orphaned inventory reservation ${reservationId} contains no reservation items.`,
      );
    }

    /*
     * Lock inventory in deterministic SKU order, matching the
     * reservation/create and lifecycle transition code.
     */
    for (const item of items) {
      const quantity = normalizeInteger(item.quantity, 'quantity');

      if (quantity < 1) {
        throw new Error(`Inventory reservation ${reservationId} contains an invalid quantity.`);
      }

      const inventoryResult = await client.query(
        `
                        SELECT
                            id,
                            reserved
                        FROM inventory_items
                        WHERE id = $1
                        FOR UPDATE
                    `,
        [item.inventory_item_id],
      );

      const inventory = inventoryResult.rows[0] as LockedInventoryDatabaseRow | undefined;

      if (!inventory) {
        throw new Error(`Reserved inventory for reservation ${reservationId} could not be found.`);
      }

      const reserved = normalizeInteger(inventory.reserved, 'reserved');

      if (reserved < quantity) {
        throw new Error(
          `Reserved inventory for reservation ${reservationId} is below its reservation quantity.`,
        );
      }

      await client.query(
        `
                    UPDATE inventory_items
                    SET reserved =
                        reserved - $1
                    WHERE id = $2
                `,
        [quantity, item.inventory_item_id],
      );
    }

    await client.query(
      `
                UPDATE inventory_reservations
                SET
                    status = 'expired',
                    release_reason =
                        'stale-reservation-timeout',
                    expired_at =
                        COALESCE(
                            expired_at,
                            NOW()
                        )
                WHERE id = $1
            `,
      [reservationId],
    );

    await client.query('COMMIT');

    return 'expired';
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);

    throw error;
  } finally {
    client.release();
  }
}

async function reconcileCompletedCheckoutSession(
  stripe: Stripe,
  candidate: ReconciliationCandidate,
  session: Stripe.Checkout.Session,
): Promise<Exclude<ReconciliationAction, 'error'>> {
  if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
    await completeInventoryReservation(candidate.id, session.id);

    return 'completed';
  }

  const paymentIntentId = normalizeStripeId(session.payment_intent);

  if (!paymentIntentId) {
    await markInventoryReservationPaymentPending(candidate.id, session.id);

    return 'payment-pending';
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status === 'succeeded') {
    await completeInventoryReservation(candidate.id, session.id);

    return 'completed';
  }

  /*
   * A completed Checkout Session cannot be retried by the customer.
   * If its underlying PaymentIntent has reached one of these failed
   * states, the inventory hold can be safely returned.
   */
  if (paymentIntent.status === 'canceled' || paymentIntent.status === 'requires_payment_method') {
    await releaseInventoryReservationAfterPaymentFailure(candidate.id, session.id);

    return 'released';
  }

  /*
   * processing / requires_action / requires_confirmation /
   * requires_capture remain fail-closed. Keep the units reserved.
   */
  await markInventoryReservationPaymentPending(candidate.id, session.id);

  return 'payment-pending';
}

async function reconcileStripeBackedReservation(
  stripe: Stripe,
  candidate: ReconciliationCandidate,
  now: Date,
): Promise<Exclude<ReconciliationAction, 'error'>> {
  if (!candidate.stripeSessionId) {
    return 'unchanged';
  }

  const session = await stripe.checkout.sessions.retrieve(candidate.stripeSessionId);

  validateStripeSessionOwnership(session, candidate.id);

  if (session.status === 'complete') {
    return reconcileCompletedCheckoutSession(stripe, candidate, session);
  }

  if (session.status === 'expired') {
    if (candidate.status === 'active') {
      await expireInventoryReservation(candidate.id, session.id);

      return 'expired';
    }

    return 'unchanged';
  }

  if (session.status !== 'open') {
    return 'unchanged';
  }

  /*
   * payment-pending reservations should correspond to a completed
   * Checkout Session. If Stripe unexpectedly reports one as open,
   * retain inventory and let a later reconciliation inspect it again.
   */
  if (candidate.status === 'payment-pending') {
    return 'unchanged';
  }

  const stripeExpiresAt = session.expires_at * 1000;

  if (stripeExpiresAt > now.getTime()) {
    return 'unchanged';
  }

  /*
   * Stripe remains authoritative while an attached Session exists.
   * We request Session expiration first and only release inventory
   * after Stripe confirms that the Session is expired.
   *
   * Any Stripe/network error propagates out of this candidate and the
   * inventory remains reserved.
   */
  const expiredSession = await stripe.checkout.sessions.expire(session.id);

  if (expiredSession.status !== 'expired') {
    return 'unchanged';
  }

  await expireInventoryReservation(candidate.id, session.id);

  return 'expired';
}

async function reconcileCandidate(
  stripe: Stripe,
  candidate: ReconciliationCandidate,
  now: Date,
): Promise<Exclude<ReconciliationAction, 'error'>> {
  if (candidate.status === 'active' && !candidate.stripeSessionId) {
    return expireOrphanedInventoryReservation(candidate.id, now);
  }

  return reconcileStripeBackedReservation(stripe, candidate, now);
}

function createEmptySummary(): InventoryReservationReconciliationSummary {
  return {
    scanned: 0,

    completed: 0,

    expired: 0,

    released: 0,

    paymentPending: 0,

    unchanged: 0,

    errors: 0,

    details: [],
  };
}

function recordAction(
  summary: InventoryReservationReconciliationSummary,
  candidate: ReconciliationCandidate,
  action: Exclude<ReconciliationAction, 'error'>,
): void {
  switch (action) {
    case 'completed':
      summary.completed += 1;
      break;

    case 'expired':
      summary.expired += 1;
      break;

    case 'released':
      summary.released += 1;
      break;

    case 'payment-pending':
      summary.paymentPending += 1;
      break;

    case 'unchanged':
      summary.unchanged += 1;
      break;
  }

  summary.details.push({
    reservationId: candidate.id,

    ...(candidate.stripeSessionId
      ? {
          stripeSessionId: candidate.stripeSessionId,
        }
      : {}),

    action,
  });
}

export async function reconcileInventoryReservations(
  stripe: Stripe,
  now = new Date(),
): Promise<InventoryReservationReconciliationSummary> {
  const candidates = await getReconciliationCandidates(now);

  const summary = createEmptySummary();

  summary.scanned = candidates.length;

  for (const candidate of candidates) {
    try {
      const action = await reconcileCandidate(stripe, candidate, now);

      recordAction(summary, candidate, action);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown reconciliation error.';

      summary.errors += 1;

      summary.details.push({
        reservationId: candidate.id,

        ...(candidate.stripeSessionId
          ? {
              stripeSessionId: candidate.stripeSessionId,
            }
          : {}),

        action: 'error',

        error: message,
      });

      console.error('Inventory reservation reconciliation failed for one reservation.', {
        reservationId: candidate.id,

        stripeSessionId: candidate.stripeSessionId,

        error,
      });
    }
  }

  return summary;
}
