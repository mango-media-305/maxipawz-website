import {
    FOUNDING_PACK_LAUNCH_INTERESTS,
    FOUNDING_PACK_PET_PERSONALITIES,
    FOUNDING_PACK_PET_TYPES,
    type FoundingPackLaunchInterest,
    type FoundingPackPetPersonality,
    type FoundingPackPetType,
} from '../types/founding-pack';

import {
    FOUNDING_PACK_PERSONALIZATION_VERSION,
    type FoundingPackPersonalizationProfile,
    type FoundingPackPersonalizedGuideSlug,
    type FoundingPackPersonalizedMessaging,
} from '../types/founding-pack-personalization';

const MAX_PET_NAME_LENGTH =
    80;

const PERSONALITY_LABELS:
    Record<
        FoundingPackPetPersonality,
        string
    > = {
    'fetch-fanatic':
        'Fetch Fanatic',

    'power-chewer':
        'Power Chewer',

    'puzzle-master':
        'Puzzle Master',

    'professional-napper':
        'Professional Napper',

    'adventure-buddy':
        'Adventure Buddy',

    'something-else':
        'One of a Kind',
};

const PET_TYPE_LABELS:
    Record<
        FoundingPackPetType,
        string
    > = {
    dog:
        'Dog',

    cat:
        'Cat',

    other:
        'Pet',
};

const PERSONALITY_GUIDE_PRIORITIES:
    Partial<
        Record<
            FoundingPackPetPersonality,
            readonly FoundingPackPersonalizedGuideSlug[]
        >
    > = {
    'fetch-fanatic': [
        'play-and-enrichment',
    ],

    'power-chewer': [
        'play-and-enrichment',
    ],

    'puzzle-master': [
        'play-and-enrichment',
    ],

    'adventure-buddy': [
        'walk-and-travel',
        'dog-hydration-miami-heat',
    ],
};

const LAUNCH_INTEREST_GUIDE_PRIORITIES:
    Record<
        FoundingPackLaunchInterest,
        readonly FoundingPackPersonalizedGuideSlug[]
    > = {
    toys: [
        'play-and-enrichment',
    ],

    /*
     * There is not yet a dedicated treats guide.
     *
     * Feeding & Hydration is the closest current content,
     * so we prioritize it without claiming that it is a
     * treats-specific article.
     */
    treats: [
        'feeding-and-hydration',
    ],

    walking: [
        'walk-and-travel',
        'dog-hydration-miami-heat',
    ],

    travel: [
        'walk-and-travel',
        'feeding-and-hydration',
    ],

    feeding: [
        'feeding-and-hydration',
    ],

    accessories: [
        'walk-and-travel',
        'feeding-and-hydration',
    ],
};

function isRecord(
    value: unknown,
): value is Record<string, unknown> {
    return (
        typeof value ===
        'object' &&
        value !==
        null &&
        !Array.isArray(
            value,
        )
    );
}

function isPetType(
    value: unknown,
): value is FoundingPackPetType {
    return (
        typeof value ===
        'string' &&
        FOUNDING_PACK_PET_TYPES.some(
            (
                candidate,
            ) =>
                candidate ===
                value,
        )
    );
}

function isPetPersonality(
    value: unknown,
): value is FoundingPackPetPersonality {
    return (
        typeof value ===
        'string' &&
        FOUNDING_PACK_PET_PERSONALITIES.some(
            (
                candidate,
            ) =>
                candidate ===
                value,
        )
    );
}

function isLaunchInterest(
    value: unknown,
): value is FoundingPackLaunchInterest {
    return (
        typeof value ===
        'string' &&
        FOUNDING_PACK_LAUNCH_INTERESTS.some(
            (
                candidate,
            ) =>
                candidate ===
                value,
        )
    );
}

function normalizePetName(
    value: string,
): string {
    return value
        .trim()
        .replace(
            /\s+/g,
            ' ',
        );
}

function isValidPetName(
    value: unknown,
): value is string {
    if (
        typeof value !==
        'string'
    ) {
        return false;
    }

    const normalized =
        normalizePetName(
            value,
        );

    return (
        normalized.length >
        0 &&
        normalized.length <=
        MAX_PET_NAME_LENGTH
    );
}

function isValidTimestamp(
    value: unknown,
): value is string {
    if (
        typeof value !==
        'string'
    ) {
        return false;
    }

    return !Number.isNaN(
        new Date(
            value,
        ).getTime(),
    );
}

function formatPossessivePetName(
    petName: string,
): string {
    if (
        /s$/i.test(
            petName,
        )
    ) {
        return `${petName}'`;
    }

    return `${petName}'s`;
}

function uniqueGuideSlugs(
    values:
        readonly FoundingPackPersonalizedGuideSlug[],
): FoundingPackPersonalizedGuideSlug[] {
    return [
        ...new Set(
            values,
        ),
    ];
}

function buildLaunchMessage(
    profile:
        FoundingPackPersonalizationProfile,
): string | undefined {
    if (
        !profile.launchInterest
    ) {
        return undefined;
    }

    const possessiveName =
        formatPossessivePetName(
            profile.petName,
        );

    switch (
    profile.launchInterest
    ) {
        case 'toys':
            return `Toys are at the top of ${possessiveName} Maxi Pawz wish list. We'll keep that in mind as the first collection takes shape.`;

        case 'treats':
            return `You told us treats matter for ${profile.petName}. We'll keep that signal in mind as Maxi Pawz grows.`;

        case 'walking':
            return `${possessiveName} profile says walks matter. We'll keep walking gear and everyday adventures in mind as we build the collection.`;

        case 'travel':
            return `${possessiveName} profile says travel matters. We'll keep adventures away from home in mind as Maxi Pawz grows.`;

        case 'feeding':
            return `${possessiveName} profile says feeding essentials matter. We'll keep everyday mealtime routines in mind as we shape the collection.`;

        case 'accessories':
            return `${possessiveName} profile says accessories matter. We'll keep practical everyday gear in mind as Maxi Pawz grows.`;
    }
}

export function createFoundingPackPersonalizationProfile(
    input: {
        petName: string;

        petType: FoundingPackPetType;

        petPersonality?: FoundingPackPetPersonality;

        launchInterest?: FoundingPackLaunchInterest;
    },

    now:
        Date =
        new Date(),
): FoundingPackPersonalizationProfile {
    const petName =
        normalizePetName(
            input.petName,
        );

    if (
        !isValidPetName(
            petName,
        )
    ) {
        throw new Error(
            'Founding Pack personalization requires a valid pet name.',
        );
    }

    if (
        !isPetType(
            input.petType,
        )
    ) {
        throw new Error(
            'Founding Pack personalization requires a valid pet type.',
        );
    }

    if (
        input.petPersonality !==
        undefined &&
        !isPetPersonality(
            input.petPersonality,
        )
    ) {
        throw new Error(
            'Founding Pack personalization received an invalid pet personality.',
        );
    }

    if (
        input.launchInterest !==
        undefined &&
        !isLaunchInterest(
            input.launchInterest,
        )
    ) {
        throw new Error(
            'Founding Pack personalization received an invalid launch interest.',
        );
    }

    if (
        Number.isNaN(
            now.getTime(),
        )
    ) {
        throw new Error(
            'Founding Pack personalization cannot be created with an invalid date.',
        );
    }

    return {
        version:
            FOUNDING_PACK_PERSONALIZATION_VERSION,

        petName,

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

        savedAt:
            now.toISOString(),
    };
}

export function parseFoundingPackPersonalizationProfile(
    value: unknown,
): FoundingPackPersonalizationProfile | null {
    if (
        !isRecord(
            value,
        )
    ) {
        return null;
    }

    if (
        value.version !==
        FOUNDING_PACK_PERSONALIZATION_VERSION ||
        !isValidPetName(
            value.petName,
        ) ||
        !isPetType(
            value.petType,
        ) ||
        !isValidTimestamp(
            value.savedAt,
        )
    ) {
        return null;
    }

    if (
        value.petPersonality !==
        undefined &&
        !isPetPersonality(
            value.petPersonality,
        )
    ) {
        return null;
    }

    if (
        value.launchInterest !==
        undefined &&
        !isLaunchInterest(
            value.launchInterest,
        )
    ) {
        return null;
    }

    return {
        version:
            FOUNDING_PACK_PERSONALIZATION_VERSION,

        petName:
            normalizePetName(
                value.petName,
            ),

        petType:
            value.petType,

        ...(value.petPersonality
            ? {
                petPersonality:
                    value.petPersonality,
            }
            : {}),

        ...(value.launchInterest
            ? {
                launchInterest:
                    value.launchInterest,
            }
            : {}),

        savedAt:
            new Date(
                value.savedAt,
            ).toISOString(),
    };
}

export function serializeFoundingPackPersonalizationProfile(
    profile:
        FoundingPackPersonalizationProfile,
): string {
    const validated =
        parseFoundingPackPersonalizationProfile(
            profile,
        );

    if (
        !validated
    ) {
        throw new Error(
            'Cannot serialize an invalid Founding Pack personalization profile.',
        );
    }

    return JSON.stringify(
        validated,
    );
}

export function deserializeFoundingPackPersonalizationProfile(
    serialized:
        string,
): FoundingPackPersonalizationProfile | null {
    try {
        return parseFoundingPackPersonalizationProfile(
            JSON.parse(
                serialized,
            ),
        );
    } catch {
        /*
         * Browser storage is user-controlled and can contain
         * malformed or stale data.
         *
         * Personalization should fail gracefully rather than
         * breaking the storefront.
         */
        return null;
    }
}

export function getPersonalizedGuidePriorities(
    profile:
        FoundingPackPersonalizationProfile,
): FoundingPackPersonalizedGuideSlug[] {
    /*
     * The current homepage Pet Guides are dog-specific.
     *
     * Do not imply that dog guidance applies to cats or
     * other animals. Personalization for those pets can
     * expand naturally as appropriate content is published.
     */
    if (
        profile.petType !==
        'dog'
    ) {
        return [];
    }

    const priorities:
        FoundingPackPersonalizedGuideSlug[] =
        [];

    if (
        profile.launchInterest
    ) {
        priorities.push(
            ...LAUNCH_INTEREST_GUIDE_PRIORITIES[
            profile.launchInterest
            ],
        );
    }

    if (
        profile.petPersonality
    ) {
        priorities.push(
            ...(
                PERSONALITY_GUIDE_PRIORITIES[
                profile.petPersonality
                ] ??
                []
            ),
        );
    }

    return uniqueGuideSlugs(
        priorities,
    );
}

export function buildFoundingPackPersonalizedMessaging(
    profile:
        FoundingPackPersonalizationProfile,
): FoundingPackPersonalizedMessaging {
    const petTypeLabel =
        PET_TYPE_LABELS[
        profile.petType
        ];

    const personalityLabel =
        profile.petPersonality
            ? PERSONALITY_LABELS[
            profile.petPersonality
            ]
            : undefined;

    const profileSummary =
        personalityLabel
            ? `${petTypeLabel} · ${personalityLabel}`
            : petTypeLabel;

    const guidePriorities =
        getPersonalizedGuidePriorities(
            profile,
        );

    const hasPersonalizedDogGuides =
        guidePriorities.length >
        0;

    return {
        greeting:
            `Welcome back, ${profile.petName} 🐾`,

        profileSummary,

        guideHeading:
            hasPersonalizedDogGuides
                ? `A few guides picked with ${profile.petName} in mind.`
                : 'Explore the latest Maxi Pawz pet guides.',

        guideDescription:
            hasPersonalizedDogGuides
                ? `Based on ${formatPossessivePetName(
                    profile.petName,
                )} profile, we're putting a few especially relevant guides first.`
                : `We're still growing our guide library, so we won't pretend dog-specific advice is right for every pet.`,

        ...(profile.launchInterest
            ? {
                launchMessage:
                    buildLaunchMessage(
                        profile,
                    ),
            }
            : {}),
    };
}