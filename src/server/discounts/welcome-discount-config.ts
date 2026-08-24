import type {
    WelcomeDiscountDataMode,
} from '../../types/welcome-discount';

interface WelcomeDiscountRuntimeConfig {
    enabled: boolean;

    dataMode: WelcomeDiscountDataMode;

    percentOff: number;

    stripeSecretKey: string;

    codeSecret: string;

    couponId: string;
}

function parseBoolean(
    value: string | undefined,
    fallback: boolean,
): boolean {
    const normalized =
        value?.trim().toLowerCase();

    if (
        normalized ===
        'true'
    ) {
        return true;
    }

    if (
        normalized ===
        'false'
    ) {
        return false;
    }

    return fallback;
}

function getWelcomeDiscountDataMode():
    WelcomeDiscountDataMode {
    const configured =
        process.env
            .WELCOME_DISCOUNT_DATA_MODE
            ?.trim()
            .toLowerCase();

    if (
        configured ===
        'test' ||
        configured ===
        'live'
    ) {
        return configured;
    }

    throw new Error(
        'WELCOME_DISCOUNT_DATA_MODE must be explicitly configured as "test" or "live".',
    );
}

function getWelcomeDiscountPercent():
    number {
    const configured =
        process.env
            .WELCOME_DISCOUNT_PERCENT
            ?.trim();

    if (
        !configured
    ) {
        return 10;
    }

    const parsed =
        Number(
            configured,
        );

    if (
        !Number.isFinite(
            parsed,
        ) ||
        parsed <=
        0 ||
        parsed >
        100
    ) {
        throw new Error(
            'WELCOME_DISCOUNT_PERCENT must be a number greater than 0 and less than or equal to 100.',
        );
    }

    return parsed;
}

function getStripeSecretKey(
    dataMode:
        WelcomeDiscountDataMode,
): string {
    const stripeSecretKey =
        process.env
            .STRIPE_SECRET_KEY
            ?.trim();

    if (
        !stripeSecretKey
    ) {
        throw new Error(
            'STRIPE_SECRET_KEY is required for the welcome discount.',
        );
    }

    if (
        dataMode ===
        'test' &&
        !stripeSecretKey.startsWith(
            'sk_test_',
        )
    ) {
        throw new Error(
            'WELCOME_DISCOUNT_DATA_MODE=test requires a Stripe test secret key.',
        );
    }

    if (
        dataMode ===
        'live' &&
        !stripeSecretKey.startsWith(
            'sk_live_',
        )
    ) {
        throw new Error(
            'WELCOME_DISCOUNT_DATA_MODE=live requires a Stripe live secret key.',
        );
    }

    return stripeSecretKey;
}

function getCodeSecret():
    string {
    const secret =
        process.env
            .WELCOME_DISCOUNT_CODE_SECRET
            ?.trim();

    if (
        !secret ||
        secret.length <
        32
    ) {
        throw new Error(
            'WELCOME_DISCOUNT_CODE_SECRET must contain at least 32 characters.',
        );
    }

    return secret;
}

function validateEnvironmentAlignment(
    dataMode:
        WelcomeDiscountDataMode,
): void {
    const newsletterDataMode =
        process.env
            .NEWSLETTER_DATA_MODE
            ?.trim()
            .toLowerCase();

    if (
        newsletterDataMode &&
        newsletterDataMode !==
        dataMode
    ) {
        throw new Error(
            'WELCOME_DISCOUNT_DATA_MODE must match NEWSLETTER_DATA_MODE.',
        );
    }

    const checkoutMode =
        process.env
            .PUBLIC_CHECKOUT_MODE
            ?.trim()
            .toLowerCase();

    /*
     * "disabled" is allowed while preparing the system because the
     * promotion service will not be exposed to visitors yet.
     *
     * Once checkout is enabled, its Stripe environment must agree
     * with the welcome-discount environment.
     */
    if (
        checkoutMode &&
        checkoutMode !==
        'disabled' &&
        checkoutMode !==
        dataMode
    ) {
        throw new Error(
            'WELCOME_DISCOUNT_DATA_MODE must match PUBLIC_CHECKOUT_MODE when checkout is enabled.',
        );
    }
}

function buildCouponId(
    dataMode:
        WelcomeDiscountDataMode,
    percentOff:
        number,
): string {
    const normalizedPercent =
        String(
            percentOff,
        ).replace(
            '.',
            '_',
        );

    return [
        'maxipawz',
        'welcome',
        normalizedPercent,
        dataMode,
    ].join(
        '_',
    );
}

export function getWelcomeDiscountRuntimeConfig():
    WelcomeDiscountRuntimeConfig {
    const enabled =
        parseBoolean(
            process.env
                .WELCOME_DISCOUNT_ENABLED,
            false,
        );

    const dataMode =
        getWelcomeDiscountDataMode();

    const percentOff =
        getWelcomeDiscountPercent();

    validateEnvironmentAlignment(
        dataMode,
    );

    if (
        !enabled
    ) {
        throw new Error(
            'The Maxi Pawz welcome discount is currently disabled.',
        );
    }

    return {
        enabled,

        dataMode,

        percentOff,

        stripeSecretKey:
            getStripeSecretKey(
                dataMode,
            ),

        codeSecret:
            getCodeSecret(),

        couponId:
            buildCouponId(
                dataMode,
                percentOff,
            ),
    };
}