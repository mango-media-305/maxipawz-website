import assert from 'node:assert/strict';

import test from 'node:test';

import {
    inspectFoundingPackInsights,
} from '../../src/server/founding-pack/insights-storage';

import type {
    FoundingPackPetProfileRecord,
} from '../../src/types/founding-pack';

import type {
    NewsletterLeadRecord,
} from '../../src/types/newsletter';

interface MemoryStoreRecord {
    key: string;

    value: unknown;
}

class MemoryJsonListStore {
    readonly records =
        new Map<
            string,
            unknown
        >();

    constructor(
        records: MemoryStoreRecord[] = [],
    ) {
        records.forEach(
            (
                record,
            ) => {
                this.records.set(
                    record.key,
                    record.value,
                );
            },
        );
    }

    async list(
        options: {
            prefix?: string;
        } = {},
    ): Promise<{
        blobs: {
            key: string;
        }[];
    }> {
        const prefix =
            options.prefix ??
            '';

        return {
            blobs:
                [
                    ...this.records.keys(),
                ]
                    .filter(
                        (
                            key,
                        ) =>
                            key.startsWith(
                                prefix,
                            ),
                    )
                    .map(
                        (
                            key,
                        ) => ({
                            key,
                        }),
                    ),
        };
    }

    async get(
        key: string,

        options: {
            type: 'json';
        },
    ): Promise<unknown> {
        assert.equal(
            options.type,
            'json',
        );

        return (
            this.records.get(
                key,
            ) ??
            null
        );
    }
}

function createNewsletterLead(
    overrides: Partial<NewsletterLeadRecord> = {},
): NewsletterLeadRecord {
    return {
        version: 1,

        email:
            'person@example.com',

        emailHash:
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',

        source:
            'homepage-join-the-pack',

        marketingConsent:
            true,

        marketingPreferenceMethod:
            'prechecked-checkbox-submission',

        consentTextVersion:
            '2026-08-01',

        firstSubmittedAt:
            '2026-08-20T10:00:00.000Z',

        lastSubmittedAt:
            '2026-08-20T10:00:00.000Z',

        marketingPreferenceUpdatedAt:
            '2026-08-20T10:00:00.000Z',

        lastOptInAt:
            '2026-08-20T10:00:00.000Z',

        submissionCount:
            1,

        resendContactId:
            'contact_123',

        resendTopicId:
            'topic_123',

        resendSyncStatus:
            'synced',

        createdAt:
            '2026-08-20T10:00:00.000Z',

        updatedAt:
            '2026-08-20T10:00:00.000Z',

        ...overrides,
    };
}

function createPetProfile(
    overrides: Partial<FoundingPackPetProfileRecord> = {},
): FoundingPackPetProfileRecord {
    return {
        version:
            1,

        emailHash:
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',

        petName:
            'Luna',

        petType:
            'dog',

        petPersonality:
            'adventure-buddy',

        launchInterest:
            'toys',

        source:
            'homepage-founding-pack',

        firstSubmittedAt:
            '2026-08-20T10:05:00.000Z',

        lastSubmittedAt:
            '2026-08-20T10:05:00.000Z',

        submissionCount:
            1,

        createdAt:
            '2026-08-20T10:05:00.000Z',

        updatedAt:
            '2026-08-20T10:05:00.000Z',

        ...overrides,
    };
}

test(
    'loads newsletter and pet-profile records from test-mode stores',
    async () => {
        process.env.NEWSLETTER_DATA_MODE =
            'test';

        const newsletterStore =
            new MemoryJsonListStore([
                {
                    key:
                        'email/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',

                    value:
                        createNewsletterLead(),
                },
            ]);

        const profileStore =
            new MemoryJsonListStore([
                {
                    key:
                        'email/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',

                    value:
                        createPetProfile(),
                },
            ]);

        let newsletterMode:
            string |
            undefined;

        let profileMode:
            string |
            undefined;

        const result =
            await inspectFoundingPackInsights(
                {
                    getNewsletterLeadStore: (
                        dataMode,
                    ) => {
                        newsletterMode =
                            dataMode;

                        return newsletterStore;
                    },

                    getPetProfileStore: (
                        dataMode,
                    ) => {
                        profileMode =
                            dataMode;

                        return profileStore;
                    },

                    now:
                        new Date(
                            '2026-08-26T12:00:00.000Z',
                        ),
                },
            );

        assert.equal(
            newsletterMode,
            'test',
        );

        assert.equal(
            profileMode,
            'test',
        );

        assert.equal(
            result.summary.members,
            1,
        );

        assert.equal(
            result.summary.profilesCompleted,
            1,
        );

        assert.equal(
            result.generatedAt,
            '2026-08-26T12:00:00.000Z',
        );
    },
);

test(
    'loads live-mode stores when NEWSLETTER_DATA_MODE is live',
    async () => {
        process.env.NEWSLETTER_DATA_MODE =
            'live';

        const emptyStore =
            new MemoryJsonListStore();

        const seenModes:
            string[] =
            [];

        await inspectFoundingPackInsights(
            {
                getNewsletterLeadStore: (
                    dataMode,
                ) => {
                    seenModes.push(
                        dataMode,
                    );

                    return emptyStore;
                },

                getPetProfileStore: (
                    dataMode,
                ) => {
                    seenModes.push(
                        dataMode,
                    );

                    return emptyStore;
                },
            },
        );

        assert.deepEqual(
            seenModes,
            [
                'live',
                'live',
            ],
        );
    },
);

test(
    'fails closed when NEWSLETTER_DATA_MODE is missing',
    async () => {
        delete process.env
            .NEWSLETTER_DATA_MODE;

        await assert.rejects(
            () =>
                inspectFoundingPackInsights(
                    {
                        getNewsletterLeadStore:
                            () =>
                                new MemoryJsonListStore(),

                        getPetProfileStore:
                            () =>
                                new MemoryJsonListStore(),
                    },
                ),
            /NEWSLETTER_DATA_MODE/,
        );
    },
);

test(
    'ignores non-email metadata keys in blob stores',
    async () => {
        process.env.NEWSLETTER_DATA_MODE =
            'test';

        const newsletterStore =
            new MemoryJsonListStore([
                {
                    key:
                        'metadata/summary',

                    value: {
                        invalid:
                            true,
                    },
                },

                {
                    key:
                        'email/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',

                    value:
                        createNewsletterLead(),
                },
            ]);

        const profileStore =
            new MemoryJsonListStore([
                {
                    key:
                        'metadata/version',

                    value:
                        'something',
                },
            ]);

        const result =
            await inspectFoundingPackInsights(
                {
                    getNewsletterLeadStore:
                        () =>
                            newsletterStore,

                    getPetProfileStore:
                        () =>
                            profileStore,
                },
            );

        assert.equal(
            result.summary.members,
            1,
        );

        assert.equal(
            result.summary.profilesCompleted,
            0,
        );
    },
);

test(
    'rejects invalid persisted newsletter records',
    async () => {
        process.env.NEWSLETTER_DATA_MODE =
            'test';

        const newsletterStore =
            new MemoryJsonListStore([
                {
                    key:
                        'email/bad',

                    value: {
                        version:
                            1,

                        email:
                            'broken@example.com',
                    },
                },
            ]);

        await assert.rejects(
            () =>
                inspectFoundingPackInsights(
                    {
                        getNewsletterLeadStore:
                            () =>
                                newsletterStore,

                        getPetProfileStore:
                            () =>
                                new MemoryJsonListStore(),
                    },
                ),
            /invalid newsletter lead record/,
        );
    },
);

test(
    'rejects invalid persisted pet-profile records',
    async () => {
        process.env.NEWSLETTER_DATA_MODE =
            'test';

        const profileStore =
            new MemoryJsonListStore([
                {
                    key:
                        'email/bad',

                    value: {
                        version:
                            1,

                        emailHash:
                            'bad',

                        petName:
                            '',
                    },
                },
            ]);

        await assert.rejects(
            () =>
                inspectFoundingPackInsights(
                    {
                        getNewsletterLeadStore:
                            () =>
                                new MemoryJsonListStore(),

                        getPetProfileStore:
                            () =>
                                profileStore,
                    },
                ),
            /invalid pet profile record/,
        );
    },
);

test(
    'does not expose newsletter email data in the returned insights object',
    async () => {
        process.env.NEWSLETTER_DATA_MODE =
            'test';

        const newsletterStore =
            new MemoryJsonListStore([
                {
                    key:
                        'email/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',

                    value:
                        createNewsletterLead(),
                },
            ]);

        const profileStore =
            new MemoryJsonListStore([
                {
                    key:
                        'email/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',

                    value:
                        createPetProfile(),
                },
            ]);

        const result =
            await inspectFoundingPackInsights(
                {
                    getNewsletterLeadStore:
                        () =>
                            newsletterStore,

                    getPetProfileStore:
                        () =>
                            profileStore,
                },
            );

        const serialized =
            JSON.stringify(
                result,
            );

        assert.equal(
            serialized.includes(
                'person@example.com',
            ),
            false,
        );

        assert.equal(
            serialized.includes(
                '"emailHash"',
            ),
            false,
        );

        assert.equal(
            serialized.includes(
                '"resendContactId"',
            ),
            false,
        );
    },
);