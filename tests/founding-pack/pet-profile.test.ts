import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { afterEach, beforeEach, test } from 'node:test';

import {
    FoundingPackPetProfileError,
    parseFoundingPackPetProfileInput,
    submitFoundingPackPetProfile,
    type FoundingPackPetProfileDependencies,
} from '../../src/server/founding-pack/pet-profile';

import type { FoundingPackPetProfileRecord } from '../../src/types/founding-pack';

const TEST_EMAIL = 'founder@example.com';

function hashEmail(email: string): string {
    return createHash('sha256').update(email.trim().toLowerCase(), 'utf8').digest('hex');
}

function getEmailKey(email: string): string {
    return `email/${hashEmail(email)}`;
}

class MemoryJsonStore {
    readonly records = new Map<string, unknown>();

    async get(
        key: string,

        options: {
            type: 'json';
        },
    ): Promise<unknown> {
        assert.equal(options.type, 'json');

        return this.records.get(key) ?? null;
    }

    async setJSON(key: string, value: unknown): Promise<void> {
        this.records.set(key, structuredClone(value));
    }
}

interface TestStores {
    newsletterTest: MemoryJsonStore;

    newsletterLive: MemoryJsonStore;

    profilesTest: MemoryJsonStore;

    profilesLive: MemoryJsonStore;

    dependencies: FoundingPackPetProfileDependencies;
}

function createTestStores(): TestStores {
    const newsletterTest = new MemoryJsonStore();

    const newsletterLive = new MemoryJsonStore();

    const profilesTest = new MemoryJsonStore();

    const profilesLive = new MemoryJsonStore();

    const dependencies: FoundingPackPetProfileDependencies = {
        getNewsletterLeadStore(dataMode) {
            return dataMode === 'live' ? newsletterLive : newsletterTest;
        },

        getPetProfileStore(dataMode) {
            return dataMode === 'live' ? profilesLive : profilesTest;
        },
    };

    return {
        newsletterTest,

        newsletterLive,

        profilesTest,

        profilesLive,

        dependencies,
    };
}

function seedNewsletterLead(store: MemoryJsonStore, email: string): void {
    const normalizedEmail = email.trim().toLowerCase();

    const emailHash = hashEmail(normalizedEmail);

    store.records.set(`email/${emailHash}`, {
        version: 1,

        email: normalizedEmail,

        emailHash,
    });
}

function readProfile(
    store: MemoryJsonStore,

    email: string,
): FoundingPackPetProfileRecord | null {
    const value = store.records.get(getEmailKey(email));

    return (value as FoundingPackPetProfileRecord | undefined) ?? null;
}

const originalNewsletterDataMode = process.env.NEWSLETTER_DATA_MODE;

beforeEach(() => {
    process.env.NEWSLETTER_DATA_MODE = 'test';
});

afterEach(() => {
    if (originalNewsletterDataMode === undefined) {
        delete process.env.NEWSLETTER_DATA_MODE;

        return;
    }

    process.env.NEWSLETTER_DATA_MODE = originalNewsletterDataMode;
});

test('parses and normalizes a complete Founding Pack pet profile', () => {
    const input = parseFoundingPackPetProfileInput(
        '  FOUNDER@EXAMPLE.COM ',
        '  Luna   Belle  ',
        ' DOG ',
        ' Adventure-Buddy ',
        ' Toys ',
    );

    assert.deepEqual(input, {
        email: 'founder@example.com',

        petName: 'Luna Belle',

        petType: 'dog',

        petPersonality: 'adventure-buddy',

        launchInterest: 'toys',

        source: 'homepage-founding-pack',
    });
});

test('allows optional personality and launch interest to be omitted', () => {
    const input = parseFoundingPackPetProfileInput(TEST_EMAIL, 'Rocky', 'dog');

    assert.equal(input.petPersonality, undefined);

    assert.equal(input.launchInterest, undefined);
});

test('rejects an invalid email address', () => {
    assert.throws(
        () => parseFoundingPackPetProfileInput('not-an-email', 'Maxi', 'dog'),

        (error: unknown) => {
            assert.ok(error instanceof FoundingPackPetProfileError);

            assert.equal(error.code, 'invalid-email');

            assert.equal(error.status, 400);

            return true;
        },
    );
});

test('rejects an empty pet name', () => {
    assert.throws(
        () => parseFoundingPackPetProfileInput(TEST_EMAIL, '   ', 'dog'),

        (error: unknown) => {
            assert.ok(error instanceof FoundingPackPetProfileError);

            assert.equal(error.code, 'invalid-pet-name');

            assert.equal(error.status, 400);

            return true;
        },
    );
});

test('rejects a pet name longer than 80 characters', () => {
    assert.throws(
        () => parseFoundingPackPetProfileInput(TEST_EMAIL, 'M'.repeat(81), 'dog'),

        (error: unknown) => {
            assert.ok(error instanceof FoundingPackPetProfileError);

            assert.equal(error.code, 'invalid-pet-name');

            return true;
        },
    );
});

test('rejects an unsupported pet type', () => {
    assert.throws(
        () => parseFoundingPackPetProfileInput(TEST_EMAIL, 'Maxi', 'dragon'),

        (error: unknown) => {
            assert.ok(error instanceof FoundingPackPetProfileError);

            assert.equal(error.code, 'invalid-pet-type');

            return true;
        },
    );
});

test('rejects an unsupported pet personality', () => {
    assert.throws(
        () =>
            parseFoundingPackPetProfileInput(
                TEST_EMAIL,
                'Maxi',
                'dog',
                'professional-barker',
            ),

        (error: unknown) => {
            assert.ok(error instanceof FoundingPackPetProfileError);

            assert.equal(error.code, 'invalid-pet-personality');

            return true;
        },
    );
});

test('rejects an unsupported launch interest', () => {
    assert.throws(
        () =>
            parseFoundingPackPetProfileInput(
                TEST_EMAIL,
                'Maxi',
                'dog',
                undefined,
                'aquariums',
            ),

        (error: unknown) => {
            assert.ok(error instanceof FoundingPackPetProfileError);

            assert.equal(error.code, 'invalid-launch-interest');

            return true;
        },
    );
});

test('requires an existing newsletter lead before saving a profile', async () => {
    const stores = createTestStores();

    const input = parseFoundingPackPetProfileInput(
        TEST_EMAIL,
        'Maxi',
        'dog',
        'adventure-buddy',
        'toys',
    );

    await assert.rejects(
        () => submitFoundingPackPetProfile(input, stores.dependencies),

        (error: unknown) => {
            assert.ok(error instanceof FoundingPackPetProfileError);

            assert.equal(error.code, 'newsletter-lead-not-found');

            assert.equal(error.status, 409);

            return true;
        },
    );

    assert.equal(stores.profilesTest.records.size, 0);
});

test('saves a profile for an existing newsletter lead', async () => {
    const stores = createTestStores();

    seedNewsletterLead(stores.newsletterTest, TEST_EMAIL);

    const input = parseFoundingPackPetProfileInput(
        TEST_EMAIL,
        'Luna',
        'dog',
        'adventure-buddy',
        'travel',
    );

    const result = await submitFoundingPackPetProfile(input, stores.dependencies);

    assert.deepEqual(result, {
        accepted: true,

        profileSaved: true,
    });

    const profile = readProfile(stores.profilesTest, TEST_EMAIL);

    assert.ok(profile);

    assert.equal(profile.version, 1);

    assert.equal(profile.emailHash, hashEmail(TEST_EMAIL));

    assert.equal(profile.petName, 'Luna');

    assert.equal(profile.petType, 'dog');

    assert.equal(profile.petPersonality, 'adventure-buddy');

    assert.equal(profile.launchInterest, 'travel');

    assert.equal(profile.source, 'homepage-founding-pack');

    assert.equal(profile.submissionCount, 1);

    assert.ok(profile.firstSubmittedAt);

    assert.ok(profile.lastSubmittedAt);

    assert.ok(profile.createdAt);

    assert.ok(profile.updatedAt);

    /*
     * The profile store deliberately does not contain the plaintext
     * customer email.
     */
    assert.equal('email' in profile, false);
});

test('saves the minimum pet profile without optional fields', async () => {
    const stores = createTestStores();

    seedNewsletterLead(stores.newsletterTest, TEST_EMAIL);

    const input = parseFoundingPackPetProfileInput(TEST_EMAIL, 'Rocky', 'dog');

    await submitFoundingPackPetProfile(input, stores.dependencies);

    const profile = readProfile(stores.profilesTest, TEST_EMAIL);

    assert.ok(profile);

    assert.equal(profile.petName, 'Rocky');

    assert.equal(profile.petType, 'dog');

    assert.equal(profile.petPersonality, undefined);

    assert.equal(profile.launchInterest, undefined);
});

test('updates an existing profile instead of creating a duplicate', async () => {
    const stores = createTestStores();

    seedNewsletterLead(stores.newsletterTest, TEST_EMAIL);

    const firstInput = parseFoundingPackPetProfileInput(
        TEST_EMAIL,
        'Luna',
        'dog',
        'professional-napper',
        'treats',
    );

    await submitFoundingPackPetProfile(firstInput, stores.dependencies);

    const firstProfile = readProfile(stores.profilesTest, TEST_EMAIL);

    assert.ok(firstProfile);

    const secondInput = parseFoundingPackPetProfileInput(
        TEST_EMAIL,
        'Luna',
        'dog',
        'power-chewer',
        'toys',
    );

    await submitFoundingPackPetProfile(secondInput, stores.dependencies);

    assert.equal(stores.profilesTest.records.size, 1);

    const updatedProfile = readProfile(stores.profilesTest, TEST_EMAIL);

    assert.ok(updatedProfile);

    assert.equal(updatedProfile.submissionCount, 2);

    assert.equal(updatedProfile.petPersonality, 'power-chewer');

    assert.equal(updatedProfile.launchInterest, 'toys');

    assert.equal(updatedProfile.firstSubmittedAt, firstProfile.firstSubmittedAt);

    assert.equal(updatedProfile.createdAt, firstProfile.createdAt);
});

test('uses the test stores when NEWSLETTER_DATA_MODE is test', async () => {
    const stores = createTestStores();

    process.env.NEWSLETTER_DATA_MODE = 'test';

    seedNewsletterLead(stores.newsletterTest, TEST_EMAIL);

    const input = parseFoundingPackPetProfileInput(TEST_EMAIL, 'Maxi', 'dog');

    await submitFoundingPackPetProfile(input, stores.dependencies);

    assert.equal(stores.profilesTest.records.size, 1);

    assert.equal(stores.profilesLive.records.size, 0);
});

test('uses the live stores when NEWSLETTER_DATA_MODE is live', async () => {
    const stores = createTestStores();

    process.env.NEWSLETTER_DATA_MODE = 'live';

    seedNewsletterLead(stores.newsletterLive, TEST_EMAIL);

    const input = parseFoundingPackPetProfileInput(TEST_EMAIL, 'Maxi', 'dog');

    await submitFoundingPackPetProfile(input, stores.dependencies);

    assert.equal(stores.profilesLive.records.size, 1);

    assert.equal(stores.profilesTest.records.size, 0);
});

test('does not allow a test lead to satisfy a live profile request', async () => {
    const stores = createTestStores();

    seedNewsletterLead(stores.newsletterTest, TEST_EMAIL);

    process.env.NEWSLETTER_DATA_MODE = 'live';

    const input = parseFoundingPackPetProfileInput(TEST_EMAIL, 'Maxi', 'dog');

    await assert.rejects(
        () => submitFoundingPackPetProfile(input, stores.dependencies),

        (error: unknown) => {
            assert.ok(error instanceof FoundingPackPetProfileError);

            assert.equal(error.code, 'newsletter-lead-not-found');

            return true;
        },
    );

    assert.equal(stores.profilesLive.records.size, 0);
});

test('requires NEWSLETTER_DATA_MODE to be explicitly configured', async () => {
    const stores = createTestStores();

    delete process.env.NEWSLETTER_DATA_MODE;

    const input = parseFoundingPackPetProfileInput(TEST_EMAIL, 'Maxi', 'dog');

    await assert.rejects(
        () => submitFoundingPackPetProfile(input, stores.dependencies),

        (error: unknown) => {
            assert.ok(error instanceof FoundingPackPetProfileError);

            assert.equal(error.code, 'configuration-error');

            assert.equal(error.status, 503);

            return true;
        },
    );
});