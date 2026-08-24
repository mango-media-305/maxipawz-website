import {
    createHmac,
} from 'node:crypto';

import Stripe from 'stripe';

import type {
    WelcomeDiscountDataMode,
    WelcomeDiscountRecord,
} from '../../types/welcome-discount';

import {
    getWelcomeDiscountRuntimeConfig,
} from './welcome-discount-config';

import {
    getWelcomeDiscountRecord,
    markWelcomeDiscountFailure,
    markWelcomeDiscountPromotionCreated,
    validateWelcomeDiscountEmailHash,
} from './welcome-discount-store';

const PROMOTION_CODE_PREFIX =
    'MAXI';

const PROMOTION_CODE_HASH_LENGTH =
    10;

interface WelcomeDiscountPromotionResult {
    record: WelcomeDiscountRecord;

    created: boolean;
}

function buildPromotionCode(
    emailHash: string,
    codeSecret: string,
): string {
    const digest =
        createHmac(
            'sha256',
            codeSecret,
        )
            .update(
                emailHash,
                'utf8',
            )
            .digest(
                'hex',
            )
            .slice(
                0,
                PROMOTION_CODE_HASH_LENGTH,
            )
            .toUpperCase();

    return `${PROMOTION_CODE_PREFIX}-${digest}`;
}

function isStripeResourceMissingError(
    error: unknown,
): boolean {
    if (
        typeof error !==
        'object' ||
        error ===
        null
    ) {
        return false;
    }

    const candidate =
        error as {
            code?: unknown;

            statusCode?: unknown;
        };

    return (
        candidate.code ===
        'resource_missing' ||
        candidate.statusCode ===
        404
    );
}

function assertStripeMode(
    livemode: boolean,
    dataMode:
        WelcomeDiscountDataMode,
    objectName:
        string,
): void {
    const expectedLiveMode =
        dataMode ===
        'live';

    if (
        livemode !==
        expectedLiveMode
    ) {
        throw new Error(
            `${objectName} belongs to the wrong Stripe environment.`,
        );
    }
}

async function getOrCreateWelcomeCoupon(
    stripe: Stripe,
    config: ReturnType<
        typeof getWelcomeDiscountRuntimeConfig
    >,
): Promise<Stripe.Coupon> {
    try {
        const existing =
            await stripe.coupons.retrieve(
                config.couponId,
            );

        if (
            'deleted' in
            existing &&
            existing.deleted
        ) {
            throw new Error(
                'The configured Maxi Pawz welcome coupon has been deleted.',
            );
        }

        const coupon =
            existing as Stripe.Coupon;

        assertStripeMode(
            coupon.livemode,
            config.dataMode,
            'The Maxi Pawz welcome coupon',
        );

        if (
            coupon.percent_off !==
            config.percentOff
        ) {
            throw new Error(
                'The existing Maxi Pawz welcome coupon has an unexpected discount percentage.',
            );
        }

        if (
            !coupon.valid
        ) {
            throw new Error(
                'The existing Maxi Pawz welcome coupon is no longer valid.',
            );
        }

        return coupon;
    } catch (
    error
    ) {
        if (
            !isStripeResourceMissingError(
                error,
            )
        ) {
            throw error;
        }
    }

    const created =
        await stripe.coupons.create(
            {
                id:
                    config.couponId,

                name:
                    `Maxi Pawz Welcome ${config.percentOff}%`,

                percent_off:
                    config.percentOff,

                duration:
                    'once',

                metadata: {
                    storefront:
                        'maxipawz',

                    incentive:
                        'welcome-discount',

                    data_mode:
                        config.dataMode,

                    percent_off:
                        String(
                            config.percentOff,
                        ),
                },
            },

            {
                idempotencyKey:
                    `maxipawz-welcome-coupon/${config.dataMode}/${config.percentOff}`,
            },
        );

    assertStripeMode(
        created.livemode,
        config.dataMode,
        'The newly created Maxi Pawz welcome coupon',
    );

    return created;
}

async function findPromotionByCode(
    stripe: Stripe,
    code: string,
): Promise<Stripe.PromotionCode | null> {
    const result =
        await stripe
            .promotionCodes
            .list(
                {
                    code,

                    limit:
                        1,
                },
            );

    return (
        result.data[
        0
        ] ??
        null
    );
}

function assertExistingPromotionOwnership(
    promotion:
        Stripe.PromotionCode,
    emailHash:
        string,
    dataMode:
        WelcomeDiscountDataMode,
): void {
    assertStripeMode(
        promotion.livemode,
        dataMode,
        'The existing Maxi Pawz promotion code',
    );

    if (
        promotion.metadata && promotion.metadata
            .incentive !==
        'welcome-discount'
    ) {
        throw new Error(
            'The generated welcome-discount code is already assigned to a different Stripe promotion.',
        );
    }

    if (
        promotion.metadata && promotion.metadata
            .lead_hash !==
        emailHash
    ) {
        throw new Error(
            'The generated welcome-discount code belongs to a different lead.',
        );
    }

    if (
        promotion.metadata && promotion.metadata
            .data_mode !==
        dataMode
    ) {
        throw new Error(
            'The existing welcome-discount promotion belongs to a different data mode.',
        );
    }

    if (
        promotion.max_redemptions !==
        1
    ) {
        throw new Error(
            'The existing welcome-discount promotion has an unexpected redemption limit.',
        );
    }

    if (
        promotion.restrictions
            .first_time_transaction !==
        true
    ) {
        throw new Error(
            'The existing welcome-discount promotion is missing the first-transaction restriction.',
        );
    }
}

async function createOrRecoverPromotion(
    stripe: Stripe,
    coupon: Stripe.Coupon,
    code: string,
    emailHash: string,
    dataMode:
        WelcomeDiscountDataMode,
): Promise<{
    promotion:
    Stripe.PromotionCode;

    created:
    boolean;
}> {
    const existing =
        await findPromotionByCode(
            stripe,
            code,
        );

    if (
        existing
    ) {
        assertExistingPromotionOwnership(
            existing,
            emailHash,
            dataMode,
        );

        return {
            promotion:
                existing,

            created:
                false,
        };
    }

    try {
        const promotion =
            await stripe
                .promotionCodes
                .create(
                    {
                        promotion: {
                            type:
                                'coupon',

                            coupon:
                                coupon.id,
                        },

                        code,

                        active:
                            true,

                        max_redemptions:
                            1,

                        restrictions: {
                            first_time_transaction:
                                true,
                        },

                        metadata: {
                            storefront:
                                'maxipawz',

                            incentive:
                                'welcome-discount',

                            lead_hash:
                                emailHash,

                            data_mode:
                                dataMode,

                            coupon_id:
                                coupon.id,
                        },
                    },

                    {
                        idempotencyKey:
                            `maxipawz-welcome-promotion/${dataMode}/${emailHash}`,
                    },
                );

        assertExistingPromotionOwnership(
            promotion,
            emailHash,
            dataMode,
        );

        return {
            promotion,

            created:
                true,
        };
    } catch (
    error
    ) {
        /*
         * Stripe creation failures can occasionally be indeterminate:
         * the object might have been created even if this request did
         * not receive a successful response.
         *
         * Because our customer-facing code is deterministic, we can
         * safely look it up before deciding that creation failed.
         */
        const recovered =
            await findPromotionByCode(
                stripe,
                code,
            ).catch(
                () =>
                    null,
            );

        if (
            recovered
        ) {
            assertExistingPromotionOwnership(
                recovered,
                emailHash,
                dataMode,
            );

            return {
                promotion:
                    recovered,

                created:
                    false,
            };
        }

        throw error;
    }
}

export async function ensureWelcomeDiscountPromotion(
    emailHash: string,
    dataMode:
        WelcomeDiscountDataMode,
): Promise<WelcomeDiscountPromotionResult> {
    const normalizedEmailHash =
        validateWelcomeDiscountEmailHash(
            emailHash,
        );

    const config =
        getWelcomeDiscountRuntimeConfig();

    if (
        config.dataMode !==
        dataMode
    ) {
        throw new Error(
            'The requested welcome-discount data mode does not match the configured environment.',
        );
    }

    const existingRecord =
        await getWelcomeDiscountRecord(
            normalizedEmailHash,
            dataMode,
        );

    if (
        !existingRecord
    ) {
        throw new Error(
            'A welcome-discount request must be registered before Stripe promotion creation.',
        );
    }

    /*
     * The durable Maxi Pawz record is authoritative once all Stripe
     * identifiers have been stored.
     *
     * Duplicate submissions therefore do not create new Stripe
     * Promotion Codes.
     */
    if (
        existingRecord
            .promotionCode &&
        existingRecord
            .stripeCouponId &&
        existingRecord
            .stripePromotionCodeId
    ) {
        return {
            record:
                existingRecord,

            created:
                false,
        };
    }

    const stripe =
        new Stripe(
            config.stripeSecretKey,
            {
                maxNetworkRetries:
                    2,
            },
        );

    try {
        const coupon =
            await getOrCreateWelcomeCoupon(
                stripe,
                config,
            );

        const promotionCode =
            buildPromotionCode(
                normalizedEmailHash,
                config.codeSecret,
            );

        const {
            promotion,
            created,
        } =
            await createOrRecoverPromotion(
                stripe,
                coupon,
                promotionCode,
                normalizedEmailHash,
                dataMode,
            );

        const updatedRecord =
            await markWelcomeDiscountPromotionCreated(
                normalizedEmailHash,
                dataMode,
                {
                    promotionCode:
                        promotion.code,

                    stripeCouponId:
                        coupon.id,

                    stripePromotionCodeId:
                        promotion.id,
                },
            );

        return {
            record:
                updatedRecord,

            created,
        };
    } catch (
    error
    ) {
        try {
            await markWelcomeDiscountFailure(
                normalizedEmailHash,
                dataMode,
                'stripe-promotion',
                error,
            );
        } catch (
        persistenceError
        ) {
            console.error(
                'The welcome-discount Stripe failure could not be persisted.',
                {
                    emailHash:
                        normalizedEmailHash,

                    dataMode,

                    persistenceError,
                },
            );
        }

        throw error;
    }
}