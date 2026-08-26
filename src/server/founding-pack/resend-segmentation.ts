import { createHash } from 'node:crypto';

import { Resend } from 'resend';

import {
    getFoundingPackSegmentationMember,
    type FoundingPackSegmentationMemberDependencies,
} from './segmentation-member';

const EMAIL_PATTERN =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const FOUNDING_PACK_RESEND_PROPERTY_KEYS = {
    profileCompleted:
        'founding_pack_profile_completed',

    petType:
        'founding_pack_pet_type',

    petPersonality:
        'founding_pack_pet_personality',

    launchInterest:
        'founding_pack_launch_interest',
} as const;

export interface FoundingPackResendProperties {
    founding_pack_profile_completed:
    number;

    founding_pack_pet_type:
    string;

    founding_pack_pet_personality:
    string;

    founding_pack_launch_interest:
    string;
}

export type FoundingPackResendSegmentationSyncStatus =
    | 'synced'
    | 'not-eligible'
    | 'member-not-found';

export interface FoundingPackResendSegmentationSyncResult {
    status:
    FoundingPackResendSegmentationSyncStatus;
}

interface ResendContactsClient {
    update(
        input: {
            id:
            string;

            properties:
            FoundingPackResendProperties;
        },
    ): Promise<{
        data?:
        {
            id?:
            string;
        } |
        null;

        error?:
        {
            message?:
            string;
        } |
        null;
    }>;
}

export interface FoundingPackResendSegmentationDependencies
    extends FoundingPackSegmentationMemberDependencies {
    getResendContactsClient?: (
        apiKey:
            string,
    ) => ResendContactsClient;
}

function normalizeEmail(
    value:
        string,
): string {
    const normalized =
        value
            .trim()
            .toLowerCase();

    if (
        !normalized ||
        normalized.length >
        254 ||
        !EMAIL_PATTERN.test(
            normalized,
        )
    ) {
        throw new Error(
            'A valid email address is required for Founding Pack segmentation synchronization.',
        );
    }

    return normalized;
}

function hashEmail(
    email:
        string,
): string {
    return createHash(
        'sha256',
    )
        .update(
            email,
            'utf8',
        )
        .digest(
            'hex',
        );
}

function getResendContactsApiKey():
    string {
    const apiKey =
        process.env.RESEND_CONTACTS_API_KEY
            ?.trim();

    if (
        !apiKey ||
        !apiKey.startsWith(
            're_',
        )
    ) {
        throw new Error(
            'RESEND_CONTACTS_API_KEY is missing or invalid.',
        );
    }

    return apiKey;
}

function getDefaultResendContactsClient(
    apiKey:
        string,
): ResendContactsClient {
    const resend =
        new Resend(
            apiKey,
        );

    return resend.contacts;
}

export function buildFoundingPackResendProperties(
    segmentation: {
        profileCompleted:
        true;

        petType:
        string;

        petPersonality?:
        string;

        launchInterest?:
        string;
    },
): FoundingPackResendProperties {
    return {
        [FOUNDING_PACK_RESEND_PROPERTY_KEYS.profileCompleted]:
            segmentation.profileCompleted
                ? 1
                : 0,

        [FOUNDING_PACK_RESEND_PROPERTY_KEYS.petType]:
            segmentation.petType,

        [FOUNDING_PACK_RESEND_PROPERTY_KEYS.petPersonality]:
            segmentation.petPersonality ??
            'not-provided',

        [FOUNDING_PACK_RESEND_PROPERTY_KEYS.launchInterest]:
            segmentation.launchInterest ??
            'not-provided',
    };
}

/**
 * Synchronize the privacy-safe Founding Pack segmentation
 * projection to an existing Resend Contact.
 *
 * Customer identity is used only to resolve the canonical
 * newsletter/profile records. It is never copied into the
 * custom Contact properties.
 */
export async function syncFoundingPackSegmentationToResend(
    emailValue:
        string,

    dependencies:
        FoundingPackResendSegmentationDependencies = {},
): Promise<FoundingPackResendSegmentationSyncResult> {
    const email =
        normalizeEmail(
            emailValue,
        );

    const emailHash =
        hashEmail(
            email,
        );

    const member =
        await getFoundingPackSegmentationMember(
            emailHash,
            dependencies,
        );

    if (!member) {
        return {
            status:
                'member-not-found',
        };
    }

    /*
     * A Founding Pack profile and marketing eligibility are
     * deliberately separate concepts.
     *
     * Opted-out members remain valid internal members but
     * are not enriched in the marketing provider.
     */
    if (
        !member.marketingConsent ||
        member.resendSyncStatus !==
        'synced' ||
        !member.resendContactId
    ) {
        return {
            status:
                'not-eligible',
        };
    }

    const properties =
        buildFoundingPackResendProperties(
            member.segmentation,
        );

    const apiKey =
        getResendContactsApiKey();

    const contacts =
        dependencies
            .getResendContactsClient?.(
                apiKey,
            ) ??
        getDefaultResendContactsClient(
            apiKey,
        );

    const result =
        await contacts.update({
            id:
                member.resendContactId,

            properties,
        });

    if (
        result.error
    ) {
        throw new Error(
            result.error.message ??
            'Resend rejected the Founding Pack segmentation update.',
        );
    }

    return {
        status:
            'synced',
    };
}