import assert from 'node:assert/strict';

import test from 'node:test';

import {
    buildFoundingPackSegmentationSnapshot,
    buildFoundingPackSegments,
    isFoundingPackSegment,
} from '../../src/lib/founding-pack-segmentation';

import {
    FOUNDING_PACK_SEGMENTS,
} from '../../src/types/founding-pack-segmentation';

test(
    'builds the expected complete segmentation set',
    () => {
        const segments =
            buildFoundingPackSegments({
                petType:
                    'dog',

                petPersonality:
                    'power-chewer',

                launchInterest:
                    'toys',
            });

        assert.deepEqual(
            segments,
            [
                'profile:completed',
                'pet-type:dog',
                'pet-personality:power-chewer',
                'launch-interest:toys',
            ],
        );
    },
);

test(
    'omits optional segments when profile answers are missing',
    () => {
        const segments =
            buildFoundingPackSegments({
                petType:
                    'cat',
            });

        assert.deepEqual(
            segments,
            [
                'profile:completed',
                'pet-type:cat',
            ],
        );
    },
);

test(
    'builds a privacy-minimized segmentation snapshot',
    () => {
        const snapshot =
            buildFoundingPackSegmentationSnapshot({
                petType:
                    'dog',

                petPersonality:
                    'adventure-buddy',

                launchInterest:
                    'travel',
            });

        assert.deepEqual(
            snapshot,
            {
                version:
                    1,

                profileCompleted:
                    true,

                petType:
                    'dog',

                petPersonality:
                    'adventure-buddy',

                launchInterest:
                    'travel',

                segments: [
                    'profile:completed',
                    'pet-type:dog',
                    'pet-personality:adventure-buddy',
                    'launch-interest:travel',
                ],
            },
        );
    },
);

test(
    'segmentation snapshot cannot contain member identity fields',
    () => {
        const snapshot =
            buildFoundingPackSegmentationSnapshot({
                petType:
                    'dog',

                petPersonality:
                    'fetch-fanatic',

                launchInterest:
                    'toys',
            });

        const serialized =
            JSON.stringify(
                snapshot,
            );

        for (
            const prohibitedField of [
                'email',
                'emailHash',
                'firstName',
                'petName',
                'resendContactId',
                'submissionCount',
                'createdAt',
                'updatedAt',
            ]
        ) {
            assert.equal(
                serialized.includes(
                    `"${prohibitedField}"`,
                ),
                false,
                `Segmentation snapshot unexpectedly contains ${prohibitedField}.`,
            );
        }
    },
);

test(
    'recognizes every canonical Founding Pack segment',
    () => {
        for (
            const segment of
            FOUNDING_PACK_SEGMENTS
        ) {
            assert.equal(
                isFoundingPackSegment(
                    segment,
                ),
                true,
            );
        }
    },
);

test(
    'rejects unsupported segments',
    () => {
        assert.equal(
            isFoundingPackSegment(
                'launch-interest:banana',
            ),
            false,
        );

        assert.equal(
            isFoundingPackSegment(
                '',
            ),
            false,
        );

        assert.equal(
            isFoundingPackSegment(
                null,
            ),
            false,
        );
    },
);