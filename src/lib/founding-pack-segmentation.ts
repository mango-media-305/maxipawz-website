import {
    FOUNDING_PACK_SEGMENTS,
    FOUNDING_PACK_SEGMENTATION_VERSION,
    type FoundingPackSegment,
    type FoundingPackSegmentationInput,
    type FoundingPackSegmentationSnapshot,
} from '../types/founding-pack-segmentation';

const FOUNDING_PACK_SEGMENT_SET =
    new Set<string>(
        FOUNDING_PACK_SEGMENTS,
    );

export function isFoundingPackSegment(
    value: unknown,
): value is FoundingPackSegment {
    return (
        typeof value === 'string' &&
        FOUNDING_PACK_SEGMENT_SET.has(
            value,
        )
    );
}

export function buildFoundingPackSegments(
    input: FoundingPackSegmentationInput,
): FoundingPackSegment[] {
    const segments: FoundingPackSegment[] = [
        'profile:completed',
        `pet-type:${input.petType}`,
    ];

    if (
        input.petPersonality
    ) {
        segments.push(
            `pet-personality:${input.petPersonality}`,
        );
    }

    if (
        input.launchInterest
    ) {
        segments.push(
            `launch-interest:${input.launchInterest}`,
        );
    }

    return segments;
}

export function buildFoundingPackSegmentationSnapshot(
    input: FoundingPackSegmentationInput,
): FoundingPackSegmentationSnapshot {
    return {
        version:
            FOUNDING_PACK_SEGMENTATION_VERSION,

        profileCompleted:
            true,

        petType:
            input.petType,

        ...(input.petPersonality
            ? {
                petPersonality:
                    input.petPersonality,
            }
            : {}),

        ...(input.launchInterest
            ? {
                launchInterest:
                    input.launchInterest,
            }
            : {}),

        segments:
            buildFoundingPackSegments(
                input,
            ),
    };
}