import type { Config } from '@netlify/functions';

import {
    FoundingPackPetProfileError,
    parseFoundingPackPetProfileInput,
    submitFoundingPackPetProfile,
} from '../../src/server/founding-pack/pet-profile';

import {
    syncFoundingPackSegmentationToResend,
} from '../../src/server/founding-pack/resend-segmentation';

interface FoundingPackProfileSuccessResponse {
    ok: true;

    accepted: true;

    profileSaved: true;

    message: string;
}

interface FoundingPackProfileErrorResponse {
    ok: false;

    code?: string;

    message: string;
}

type FoundingPackProfileResponse =
    | FoundingPackProfileSuccessResponse
    | FoundingPackProfileErrorResponse;

function isRecord(
    value: unknown,
): value is Record<
    string,
    unknown
> {
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

function optionalString(
    value: unknown,
): string | undefined {
    if (
        typeof value !==
        'string'
    ) {
        return undefined;
    }

    const normalized =
        value.trim();

    return normalized ||
        undefined;
}

function requiredString(
    value:
        unknown,

    message:
        string,
): string {
    const normalized =
        optionalString(
            value,
        );

    if (!normalized) {
        throw new FoundingPackPetProfileError(
            'invalid-pet-name',
            400,
            message,
        );
    }

    return normalized;
}

function parseRequest(
    value:
        unknown,
) {
    if (
        !isRecord(
            value,
        )
    ) {
        throw new FoundingPackPetProfileError(
            'invalid-pet-name',
            400,
            'The Founding Pack profile request is invalid.',
        );
    }

    const email =
        requiredString(
            value.email,
            'An email address is required.',
        );

    const petName =
        requiredString(
            value.petName,
            "Please enter your pet's name.",
        );

    const petType =
        requiredString(
            value.petType,
            'Please select your pet type.',
        );

    const petPersonality =
        optionalString(
            value.petPersonality,
        );

    const launchInterest =
        optionalString(
            value.launchInterest,
        );

    const botField =
        optionalString(
            value.botField,
        );

    return {
        email,
        petName,
        petType,
        petPersonality,
        launchInterest,
        botField,
    };
}

function jsonResponse(
    body:
        FoundingPackProfileResponse,

    status:
        number,
): Response {
    return Response.json(
        body,
        {
            status,

            headers: {
                'Cache-Control':
                    'no-store, max-age=0',
            },
        },
    );
}

export default async function handler(
    request:
        Request,
): Promise<Response> {
    if (
        request.method !==
        'POST'
    ) {
        return jsonResponse(
            {
                ok:
                    false,

                message:
                    'This endpoint accepts POST requests only.',
            },
            405,
        );
    }

    try {
        const rawRequest =
            await request
                .json()
                .catch(
                    () =>
                        null,
                );

        const payload =
            parseRequest(
                rawRequest,
            );

        /*
         * Manual honeypot.
         *
         * Bots receive an apparent successful response while
         * no profile or segmentation data is written.
         */
        if (
            payload.botField
        ) {
            return jsonResponse(
                {
                    ok:
                        true,

                    accepted:
                        true,

                    profileSaved:
                        true,

                    message:
                        'Your pet profile has been saved.',
                },
                202,
            );
        }

        const input =
            parseFoundingPackPetProfileInput(
                payload.email,
                payload.petName,
                payload.petType,
                payload.petPersonality,
                payload.launchInterest,
            );

        const result =
            await submitFoundingPackPetProfile(
                input,
            );

        /*
         * The pet-profile write is the primary operation.
         *
         * Resend segmentation is secondary enrichment.
         * A provider/configuration failure must never convert
         * an already-saved profile into a failed customer
         * experience.
         */
        try {
            await syncFoundingPackSegmentationToResend(
                input.email,
            );
        } catch (error) {
            console.error(
                'Founding Pack profile was saved, but Resend segmentation synchronization failed.',
                {
                    error,
                },
            );
        }

        return jsonResponse(
            {
                ok:
                    true,

                ...result,

                message:
                    `Thanks for introducing ${input.petName} to Maxi.`,
            },
            201,
        );
    } catch (error) {
        if (
            error instanceof
            FoundingPackPetProfileError
        ) {
            console.warn(
                'Founding Pack pet profile could not be saved.',
                {
                    code:
                        error.code,

                    status:
                        error.status,

                    message:
                        error.message,
                },
            );

            return jsonResponse(
                {
                    ok:
                        false,

                    code:
                        error.code,

                    message:
                        error.message,
                },
                error.status,
            );
        }

        console.error(
            'Unexpected Founding Pack pet profile failure.',
            error,
        );

        return jsonResponse(
            {
                ok:
                    false,

                message:
                    'Pet profiles are temporarily unavailable. Please try again.',
            },
            500,
        );
    }
}

export const config: Config = {
    path:
        '/api/founding-pack/profile',

    method:
        'POST',

    /*
     * Public profile-enrichment endpoint.
     *
     * Five attempts per minute per IP/domain is more than
     * enough for a normal visitor while limiting automated
     * writes to Netlify Blobs and Resend.
     */
    rateLimit: {
        windowLimit:
            5,

        windowSize:
            60,

        aggregateBy: [
            'ip',
            'domain',
        ],
    },
};