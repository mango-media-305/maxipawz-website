import { getStore } from '@netlify/blobs';

import {
    isFoundingPackSegment,
} from '../../lib/founding-pack-segmentation';

import type {
    FoundingPackCampaignAudience,
    FoundingPackCampaignContact,
} from '../../types/founding-pack-campaign';

import type {
    FoundingPackSegment,
} from '../../types/founding-pack-segmentation';

import {
    getFoundingPackSegmentationMember,
    type FoundingPackSegmentationMember,
    type FoundingPackSegmentationMemberDependencies,
} from './segmentation-member';

type FoundingPackCampaignDataMode =
    | 'test'
    | 'live';

interface BlobListEntry {
    key: string;
}

interface BlobListResult {
    blobs: BlobListEntry[];
}

interface ListStore {
    list(options?: {
        prefix?: string;
    }): Promise<BlobListResult>;
}

export interface FoundingPackCampaignAudienceDependencies
    extends FoundingPackSegmentationMemberDependencies {
    getPetProfileListStore?: (
        dataMode: FoundingPackCampaignDataMode,
    ) => ListStore;

    resolveSegmentationMember?: (
        emailHash: string,
    ) => Promise<FoundingPackSegmentationMember | null>;

    now?: Date;
}

const EMAIL_KEY_PREFIX =
    'email/';

const SHA256_PATTERN =
    /^[a-f0-9]{64}$/;

function getDataMode():
    FoundingPackCampaignDataMode {
    const configured =
        process.env.NEWSLETTER_DATA_MODE
            ?.trim()
            .toLowerCase();

    if (
        configured === 'test' ||
        configured === 'live'
    ) {
        return configured;
    }

    throw new Error(
        'NEWSLETTER_DATA_MODE must be explicitly configured as "test" or "live".',
    );
}

function getDefaultPetProfileListStore(
    dataMode: FoundingPackCampaignDataMode,
): ListStore {
    return getStore(
        `maxipawz-founding-pack-profiles-${dataMode}`,
        {
            consistency:
                'strong',
        },
    );
}

function parseSegment(
    value: string,
): FoundingPackSegment {
    const normalized =
        value
            .trim()
            .toLowerCase();

    if (
        !isFoundingPackSegment(
            normalized,
        )
    ) {
        throw new Error(
            `Unsupported Founding Pack campaign segment: ${value}.`,
        );
    }

    return normalized;
}

function getEmailHashFromKey(
    key: string,
): string {
    if (
        !key.startsWith(
            EMAIL_KEY_PREFIX,
        )
    ) {
        throw new Error(
            `Unexpected Founding Pack profile key: "${key}".`,
        );
    }

    const emailHash =
        key
            .slice(
                EMAIL_KEY_PREFIX.length,
            )
            .trim()
            .toLowerCase();

    if (
        !SHA256_PATTERN.test(
            emailHash,
        )
    ) {
        throw new Error(
            `Founding Pack campaign audience encountered an invalid profile email hash at key "${key}".`,
        );
    }

    return emailHash;
}

function isMarketingEligible(
    member: FoundingPackSegmentationMember,
): boolean {
    return (
        member.marketingConsent ===
        true &&
        member.resendSyncStatus ===
        'synced' &&
        typeof member.resendContactId ===
        'string' &&
        member.resendContactId.trim()
            .length >
        0
    );
}

function memberMatchesSegment(
    member: FoundingPackSegmentationMember,

    segment: FoundingPackSegment,
): boolean {
    return member.segmentation.segments.includes(
        segment,
    );
}

function toCampaignContact(
    member: FoundingPackSegmentationMember,
): FoundingPackCampaignContact {
    return {
        email:
            member.email,

        ...(member.firstName
            ? {
                firstName:
                    member.firstName,
            }
            : {}),
    };
}

function deduplicateContacts(
    contacts: readonly FoundingPackCampaignContact[],
): FoundingPackCampaignContact[] {
    const unique =
        new Map<
            string,
            FoundingPackCampaignContact
        >();

    for (
        const contact of
        contacts
    ) {
        const emailKey =
            contact.email
                .trim()
                .toLowerCase();

        if (
            !emailKey
        ) {
            throw new Error(
                'Founding Pack campaign audience encountered a contact without an email address.',
            );
        }

        const existing =
            unique.get(
                emailKey,
            );

        /*
         * The canonical stores should already guarantee one
         * record per email hash.
         *
         * Keeping the first resolved contact makes the export
         * defensive against accidental duplicate profile keys.
         */
        if (
            !existing
        ) {
            unique.set(
                emailKey,
                contact,
            );
        }
    }

    return [
        ...unique.values(),
    ].sort(
        (
            left,
            right,
        ) =>
            left.email.localeCompare(
                right.email,
                'en',
                {
                    sensitivity:
                        'base',
                },
            ),
    );
}

function validateNow(
    value:
        Date | undefined,
): Date {
    const now =
        value ??
        new Date();

    if (
        Number.isNaN(
            now.getTime(),
        )
    ) {
        throw new Error(
            'Founding Pack campaign audience cannot be generated with an invalid date.',
        );
    }

    return now;
}

/**
 * Resolve a campaign-ready Founding Pack audience.
 *
 * Identity is exposed only inside this server-side domain
 * because an actual campaign ultimately needs a recipient.
 *
 * Eligibility requires:
 *
 * - matching Founding Pack profile segment
 * - active marketing consent
 * - successfully synchronized Resend Contact
 * - an existing Resend Contact ID
 *
 * Pet names, email hashes and profile metadata are never
 * projected into the result.
 */
export async function buildFoundingPackCampaignAudience(
    segmentValue: string,

    dependencies:
        FoundingPackCampaignAudienceDependencies = {},
): Promise<FoundingPackCampaignAudience> {
    const segment =
        parseSegment(
            segmentValue,
        );

    const dataMode =
        getDataMode();

    const now =
        validateNow(
            dependencies.now,
        );

    const profileListStore =
        dependencies
            .getPetProfileListStore?.(
                dataMode,
            ) ??
        getDefaultPetProfileListStore(
            dataMode,
        );

    /*
     * Founding Pack profile keys are already canonicalized as:
     *
     * email/<sha256>
     *
     * Listing profiles instead of newsletter leads means visitors
     * without a completed profile never enter the campaign resolver.
     */
    const {
        blobs,
    } =
        await profileListStore.list({
            prefix:
                EMAIL_KEY_PREFIX,
        });

    const emailHashes =
        blobs.map(
            ({
                key,
            }) =>
                getEmailHashFromKey(
                    key,
                ),
        );

    const resolvedMembers =
        await Promise.all(
            emailHashes.map(
                async (
                    emailHash,
                ) => {
                    if (
                        dependencies.resolveSegmentationMember
                    ) {
                        return dependencies.resolveSegmentationMember(
                            emailHash,
                        );
                    }

                    return getFoundingPackSegmentationMember(
                        emailHash,
                        dependencies,
                    );
                },
            ),
        );

    const contacts =
        resolvedMembers
            .filter(
                (
                    member,
                ): member is FoundingPackSegmentationMember =>
                    member !==
                    null,
            )
            .filter(
                (
                    member,
                ) =>
                    isMarketingEligible(
                        member,
                    ),
            )
            .filter(
                (
                    member,
                ) =>
                    memberMatchesSegment(
                        member,
                        segment,
                    ),
            )
            .map(
                toCampaignContact,
            );

    const uniqueContacts =
        deduplicateContacts(
            contacts,
        );

    return {
        segment,

        count:
            uniqueContacts.length,

        contacts:
            uniqueContacts,

        generatedAt:
            now.toISOString(),
    };
}