import assert from 'node:assert/strict';

import {
    test,
} from 'node:test';

import {
    parseCheckoutRequest,
} from '../../src/server/checkout-cart';

const validLine = {
    productSlug:
        'adventure-fit-harness',

    variantId:
        'medium',

    quantity:
        1,
};

test(
    'checkout request preserves sanitized featured-campaign attribution',

    () => {
        const request =
            parseCheckoutRequest(
                {
                    lines: [
                        validLine,
                    ],

                    attribution: {
                        landingPageSlug:
                            '  adventure-fit-harness-outdoor-ready  ',

                        campaignId:
                            '  harness-launch  ',

                        productSlug:
                            ' adventure-fit-harness ',

                        channel:
                            ' meta ',

                        audience:
                            ' dog owners outdoor lifestyle ',

                        utmSource:
                            ' facebook ',

                        utmMedium:
                            ' paid_social ',

                        utmCampaign:
                            ' harness_launch ',

                        utmContent:
                            ' video_01 ',

                        utmTerm:
                            ' dog   harness ',

                        referrerHost:
                            ' facebook.com ',

                        capturedAt:
                            1_786_800_000_000,
                    },
                },
            );

        assert.deepEqual(
            request.attribution,

            {
                landingPageSlug:
                    'adventure-fit-harness-outdoor-ready',

                campaignId:
                    'harness-launch',

                productSlug:
                    'adventure-fit-harness',

                channel:
                    'meta',

                audience:
                    'dog owners outdoor lifestyle',

                utmSource:
                    'facebook',

                utmMedium:
                    'paid_social',

                utmCampaign:
                    'harness_launch',

                utmContent:
                    'video_01',

                utmTerm:
                    'dog harness',

                referrerHost:
                    'facebook.com',

                capturedAt:
                    1_786_800_000_000,
            },
        );
    },
);

test(
    'malformed optional attribution never blocks a valid checkout request',

    () => {
        const request =
            parseCheckoutRequest(
                {
                    lines: [
                        validLine,
                    ],

                    attribution: {
                        landingPageSlug:
                            null,

                        campaignId: [
                            'invalid',
                        ],

                        productSlug: {
                            invalid:
                                true,
                        },

                        utmSource:
                            'facebook',
                    },
                },
            );

        assert.equal(
            request.attribution,

            undefined,
        );

        assert.deepEqual(
            request.lines,

            [
                validLine,
            ],
        );
    },
);

test(
    'checkout attribution strips control characters, collapses whitespace, and limits metadata length',

    () => {
        const longCampaign =
            'x'.repeat(
                500,
            );

        const request =
            parseCheckoutRequest(
                {
                    lines: [
                        validLine,
                    ],

                    attribution: {
                        landingPageSlug:
                            'landing\u0000page',

                        campaignId:
                            'campaign\n\tidentifier',

                        productSlug:
                            'adventure-fit-harness',

                        utmCampaign:
                            longCampaign,

                        capturedAt:
                            1234.9,
                    },
                },
            );

        assert.equal(
            request.attribution
                ?.landingPageSlug,

            'landing page',
        );

        assert.equal(
            request.attribution
                ?.campaignId,

            'campaign identifier',
        );

        assert.equal(
            request.attribution
                ?.utmCampaign
                ?.length,

            160,
        );

        assert.equal(
            request.attribution
                ?.capturedAt,

            1234,
        );
    },
);

test(
    'checkout request remains backward compatible when no attribution is present',

    () => {
        const request =
            parseCheckoutRequest(
                {
                    lines: [
                        validLine,
                    ],
                },
            );

        assert.deepEqual(
            request,

            {
                lines: [
                    validLine,
                ],
            },
        );
    },
);