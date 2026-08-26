import {
    useEffect,
    useState,
} from 'preact/hooks';

import type {
    AdminFoundingPackInsightsResponse,
    FoundingPackInsightCount,
    FoundingPackInsightsData,
    FoundingPackRecentPetProfile,
} from '../../types/founding-pack-insights';

const ADMIN_TOKEN_KEY =
    'maxipawz-admin-token';

const PET_TYPE_LABELS = {
    dog: 'Dogs',
    cat: 'Cats',
    other: 'Other',
} as const;

const PET_PERSONALITY_LABELS = {
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
        'Something Else',
} as const;

const LAUNCH_INTEREST_LABELS = {
    toys: 'Toys',
    treats: 'Treats',
    walking: 'Walking',

    travel: 'Travel',

    feeding: 'Feeding',

    accessories:
        'Accessories',
} as const;

function formatPercentage(
    value:
        number,
): string {
    return `${value.toFixed(
        value % 1 ===
            0
            ? 0
            : 1,
    )}%`;
}

function formatDate(
    value:
        string,
): string {
    const date =
        new Date(
            value,
        );

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return 'Unknown';
    }

    return new Intl.DateTimeFormat(
        'en-US',
        {
            month:
                'short',

            day:
                'numeric',

            year:
                'numeric',

            hour:
                'numeric',

            minute:
                '2-digit',
        },
    ).format(
        date,
    );
}

function formatSimpleDate(
    value:
        string,
): string {
    const date =
        new Date(
            value,
        );

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return 'Unknown';
    }

    return new Intl.DateTimeFormat(
        'en-US',
        {
            month:
                'short',

            day:
                'numeric',

            year:
                'numeric',
        },
    ).format(
        date,
    );
}

function MetricCard({
    eyebrow,

    value,

    description,

    emphasis =
        false,
}: {
    eyebrow:
        string;

    value:
        string;

    description:
        string;

    emphasis?:
        boolean;
}) {
    return (
        <article
            className={[
                'rounded-3xl border p-5 shadow-sm sm:p-6',

                emphasis
                    ? 'border-brand-200 bg-brand-50'
                    : 'border-sand bg-white-warm',
            ].join(
                ' ',
            )}
        >
            <p
                className={[
                    'text-xs font-extrabold tracking-[0.08em] uppercase',

                    emphasis
                        ? 'text-brand-700'
                        : 'text-ink-500',
                ].join(
                    ' ',
                )}
            >
                {
                    eyebrow
                }
            </p>

            <p
                className={[
                    'mt-3 text-4xl font-black tracking-tight sm:text-5xl',

                    emphasis
                        ? 'text-brand-700'
                        : 'text-ink-900',
                ].join(
                    ' ',
                )}
            >
                {
                    value
                }
            </p>

            <p className="mt-3 text-sm leading-6 text-ink-600">
                {
                    description
                }
            </p>
        </article>
    );
}

function DistributionBar({
    label,

    count,

    percentage,
}: {
    label:
        string;

    count:
        number;

    percentage:
        number;
}) {
    const width =
        Math.min(
            Math.max(
                percentage,
                0,
            ),
            100,
        );

    return (
        <div>
            <div className="flex items-end justify-between gap-4">
                <div>
                    <p className="font-extrabold text-ink-900">
                        {
                            label
                        }
                    </p>

                    <p className="mt-0.5 text-xs font-bold text-ink-500">
                        {
                            count
                        }{' '}
                        {
                            count ===
                                1
                                ? 'response'
                                : 'responses'
                        }
                    </p>
                </div>

                <p className="shrink-0 text-sm font-black text-brand-700">
                    {
                        formatPercentage(
                            percentage,
                        )
                    }
                </p>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-cream-soft">
                <div
                    className="h-full rounded-full bg-brand-500 transition-[width] duration-500"
                    style={{
                        width:
                            `${width}%`,
                    }}
                />
            </div>
        </div>
    );
}

function DistributionSection<T extends string>({
    eyebrow,

    title,

    description,

    items,

    labels,
}: {
    eyebrow:
        string;

    title:
        string;

    description:
        string;

    items:
        FoundingPackInsightCount<T>[];

    labels:
        Record<
            T,
            string
        >;
}) {
    const totalResponses =
        items.reduce(
            (
                sum,

                item,
            ) =>
                sum +
                item.count,
            0,
        );

    return (
        <section className="rounded-[2.25rem] border border-sand bg-white-warm p-5 shadow-card sm:p-6 lg:p-7">
            <div>
                <p className="text-xs font-extrabold tracking-[0.08em] text-brand-700 uppercase">
                    {
                        eyebrow
                    }
                </p>

                <h2 className="mt-2 text-2xl font-black text-ink-900">
                    {
                        title
                    }
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">
                    {
                        description
                    }
                </p>
            </div>

            {totalResponses >
                0 ? (
                <div className="mt-7 grid gap-6">
                    {
                        items.map(
                            (
                                item,
                            ) => (
                                <DistributionBar
                                    key={
                                        item.id
                                    }
                                    label={
                                        labels[
                                            item.id
                                        ]
                                    }
                                    count={
                                        item.count
                                    }
                                    percentage={
                                        item.percentage
                                    }
                                />
                            ),
                        )
                    }
                </div>
            ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-sand bg-cream-soft p-5">
                    <p className="font-extrabold text-ink-700">
                        No responses yet
                    </p>

                    <p className="mt-1 text-sm leading-6 text-ink-600">
                        This section will populate automatically as Founding Pack members complete pet profiles.
                    </p>
                </div>
            )}
        </section>
    );
}

function ProfileBadge({
    children,
}: {
    children:
        string;
}) {
    return (
        <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-extrabold text-brand-700">
            {
                children
            }
        </span>
    );
}

function RecentProfileCard({
    profile,
}: {
    profile:
        FoundingPackRecentPetProfile;
}) {
    return (
        <article className="rounded-3xl border border-sand bg-cream-soft p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-extrabold tracking-[0.08em] text-brand-700 uppercase">
                        Founding Pet
                    </p>

                    <h3 className="mt-2 text-2xl font-black text-ink-900">
                        {
                            profile.petName
                        }
                    </h3>
                </div>

                <div className="sm:text-right">
                    <p className="text-xs font-extrabold tracking-[0.07em] text-ink-500 uppercase">
                        Last Updated
                    </p>

                    <p className="mt-1 text-sm font-bold text-ink-700">
                        {
                            formatSimpleDate(
                                profile.lastSubmittedAt,
                            )
                        }
                    </p>
                </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
                <ProfileBadge>
                    {
                        PET_TYPE_LABELS[
                            profile.petType
                        ]
                    }
                </ProfileBadge>

                {profile.petPersonality && (
                    <ProfileBadge>
                        {
                            PET_PERSONALITY_LABELS[
                                profile.petPersonality
                            ]
                        }
                    </ProfileBadge>
                )}

                {profile.launchInterest && (
                    <ProfileBadge>
                        {
                            LAUNCH_INTEREST_LABELS[
                                profile.launchInterest
                            ]
                        }
                    </ProfileBadge>
                )}
            </div>

            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white-warm p-4">
                    <dt className="text-xs font-extrabold tracking-[0.06em] text-ink-500 uppercase">
                        Joined Profile
                    </dt>

                    <dd className="mt-1 text-sm font-bold text-ink-900">
                        {
                            formatSimpleDate(
                                profile.firstSubmittedAt,
                            )
                        }
                    </dd>
                </div>

                <div className="rounded-2xl bg-white-warm p-4">
                    <dt className="text-xs font-extrabold tracking-[0.06em] text-ink-500 uppercase">
                        Profile Submissions
                    </dt>

                    <dd className="mt-1 text-xl font-black text-ink-900">
                        {
                            profile.submissionCount
                        }
                    </dd>
                </div>
            </dl>
        </article>
    );
}

export default function AdminFoundingPack() {
    const [
        token,
        setToken,
    ] =
        useState(
            '',
        );

    const [
        tokenInput,
        setTokenInput,
    ] =
        useState(
            '',
        );

    const [
        data,
        setData,
    ] =
        useState<
            FoundingPackInsightsData |
            null
        >(
            null,
        );

    const [
        loading,
        setLoading,
    ] =
        useState(
            false,
        );

    const [
        refreshing,
        setRefreshing,
    ] =
        useState(
            false,
        );

    const [
        error,
        setError,
    ] =
        useState(
            '',
        );

    async function loadInsights(
        adminToken:
            string,

        quiet =
            false,
    ) {
        if (
            quiet
        ) {
            setRefreshing(
                true,
            );
        } else {
            setLoading(
                true,
            );
        }

        setError(
            '',
        );

        try {
            const response =
                await fetch(
                    '/api/admin/founding-pack',
                    {
                        headers: {
                            Authorization:
                                `Bearer ${adminToken}`,

                            Accept:
                                'application/json',
                        },

                        cache:
                            'no-store',
                    },
                );

            const payload =
                (
                    await response
                        .json()
                        .catch(
                            () =>
                                null,
                        )
                ) as
                | AdminFoundingPackInsightsResponse
                | null;

            if (
                !response.ok ||
                !payload ||
                payload.ok !==
                    true
            ) {
                throw new Error(
                    payload &&
                        payload.ok ===
                            false
                        ? payload.message
                        : 'Founding Pack insights could not be loaded.',
                );
            }

            setData({
                summary:
                    payload.summary,

                petTypes:
                    payload.petTypes,

                petPersonalities:
                    payload.petPersonalities,

                launchInterests:
                    payload.launchInterests,

                recentProfiles:
                    payload.recentProfiles,

                generatedAt:
                    payload.generatedAt,
            });

            setToken(
                adminToken,
            );

            window.sessionStorage.setItem(
                ADMIN_TOKEN_KEY,
                adminToken,
            );
        } catch (
            loadError
        ) {
            if (
                !quiet
            ) {
                setData(
                    null,
                );
            }

            setError(
                loadError instanceof
                    Error
                    ? loadError.message
                    : 'Founding Pack insights could not be loaded.',
            );

            throw loadError;
        } finally {
            if (
                quiet
            ) {
                setRefreshing(
                    false,
                );
            } else {
                setLoading(
                    false,
                );
            }
        }
    }

    function logout() {
        window.sessionStorage.removeItem(
            ADMIN_TOKEN_KEY,
        );

        setToken(
            '',
        );

        setTokenInput(
            '',
        );

        setData(
            null,
        );

        setError(
            '',
        );
    }

    useEffect(
        () => {
            const savedToken =
                window.sessionStorage.getItem(
                    ADMIN_TOKEN_KEY,
                );

            if (
                savedToken
            ) {
                setTokenInput(
                    savedToken,
                );

                void loadInsights(
                    savedToken,
                ).catch(
                    () =>
                        undefined,
                );
            }
        },
        [],
    );

    if (
        !token
    ) {
        return (
            <section className="mx-auto max-w-xl rounded-[2.5rem] border border-brand-200 bg-white-warm p-6 shadow-card sm:p-8">
                <p className="text-xs font-extrabold tracking-[0.08em] text-brand-700 uppercase">
                    Maxi Pawz Admin
                </p>

                <h1 className="mt-3 text-3xl font-black text-ink-900">
                    Founding Pack Insights
                </h1>

                <p className="mt-3 text-sm leading-6 text-ink-600">
                    Enter the private administrator token to inspect aggregated Founding Pack membership, pet profiles, and product-interest signals.
                </p>

                <form
                    className="mt-6 grid gap-4"
                    onSubmit={(
                        event,
                    ) => {
                        event.preventDefault();

                        void loadInsights(
                            tokenInput,
                        ).catch(
                            () =>
                                undefined,
                        );
                    }}
                >
                    <label className="grid gap-1.5">
                        <span className="form-label">
                            Administrator token
                        </span>

                        <input
                            className="form-control"
                            type="password"
                            autoComplete="off"
                            required
                            value={
                                tokenInput
                            }
                            onInput={(
                                event,
                            ) => {
                                setTokenInput(
                                    event.currentTarget.value,
                                );
                            }}
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={
                            loading
                        }
                        className="min-h-12 rounded-full bg-brand-500 px-5 font-extrabold text-white shadow-blue disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {
                            loading
                                ? 'Loading…'
                                : 'Open Founding Pack Insights'
                        }
                    </button>
                </form>

                {error && (
                    <p className="mt-4 rounded-2xl border border-danger-100 bg-danger-50 p-3 text-sm font-bold text-danger-700">
                        {
                            error
                        }
                    </p>
                )}
            </section>
        );
    }

    if (
        !data
    ) {
        return (
            <section className="rounded-4xl border border-sand bg-white-warm p-6 shadow-card">
                <p className="font-bold text-ink-700">
                    Founding Pack insights are unavailable.
                </p>

                {error && (
                    <p className="mt-3 text-sm font-bold text-danger-700">
                        {
                            error
                        }
                    </p>
                )}

                <button
                    type="button"
                    className="mt-4 rounded-full bg-brand-500 px-5 py-3 font-extrabold text-white"
                    onClick={() => {
                        void loadInsights(
                            token,
                        ).catch(
                            () =>
                                undefined,
                        );
                    }}
                >
                    Try Again
                </button>
            </section>
        );
    }

    return (
        <section className="grid gap-6">
            <header className="rounded-[2.5rem] border border-brand-200 bg-white-warm p-5 shadow-card sm:p-6 lg:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                        <p className="text-xs font-extrabold tracking-[0.08em] text-brand-700 uppercase">
                            Maxi Pawz Admin
                        </p>

                        <h1 className="mt-3 text-3xl font-black text-ink-900 sm:text-4xl">
                            Founding Pack Insights
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-ink-600 sm:text-base">
                            A privacy-conscious view of who is joining Maxi Pawz, what kinds of pets they have, and what the community wants us to launch first.
                        </p>

                        <p className="mt-3 text-xs font-bold text-ink-500">
                            Generated{' '}
                            {
                                formatDate(
                                    data.generatedAt,
                                )
                            }
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            disabled={
                                refreshing
                            }
                            className="rounded-full bg-brand-500 px-5 py-3 text-sm font-extrabold text-white shadow-blue disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => {
                                void loadInsights(
                                    token,
                                    true,
                                ).catch(
                                    () =>
                                        undefined,
                                );
                            }}
                        >
                            {
                                refreshing
                                    ? 'Refreshing…'
                                    : 'Refresh'
                            }
                        </button>

                        <button
                            type="button"
                            className="rounded-full border border-brand-200 bg-brand-50 px-5 py-3 text-sm font-extrabold text-brand-800 transition hover:bg-brand-100"
                            onClick={
                                logout
                            }
                        >
                            Log Out
                        </button>
                    </div>
                </div>

                {error && (
                    <p className="mt-5 rounded-2xl border border-danger-100 bg-danger-50 p-3 text-sm font-bold text-danger-700">
                        {
                            error
                        }
                    </p>
                )}
            </header>

            <section
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                aria-label="Founding Pack summary"
            >
                <MetricCard
                    eyebrow="Members"
                    value={
                        data.summary.members.toLocaleString(
                            'en-US',
                        )
                    }
                    description="Unique people currently represented in the Maxi Pawz newsletter member base."
                    emphasis={
                        true
                    }
                />

                <MetricCard
                    eyebrow="Pet Profiles"
                    value={`${data.summary.profilesCompleted.toLocaleString(
                        'en-US',
                    )} / ${data.summary.members.toLocaleString(
                        'en-US',
                    )}`}
                    description={`${formatPercentage(
                        data.summary.profileCompletionRate,
                    )} of members have completed an optional pet profile.`}
                />

                <MetricCard
                    eyebrow="Marketing Opt-In"
                    value={
                        formatPercentage(
                            data.summary.marketingOptInRate,
                        )
                    }
                    description={`${data.summary.marketingOptedIn.toLocaleString(
                        'en-US',
                    )} opted in · ${data.summary.marketingOptedOut.toLocaleString(
                        'en-US',
                    )} opted out.`}
                />

                <MetricCard
                    eyebrow="Launch Signals"
                    value={
                        data.summary.launchInterestResponses.toLocaleString(
                            'en-US',
                        )
                    }
                    description={`${formatPercentage(
                        data.summary.launchInterestResponseRate,
                    )} of completed profiles shared what Maxi Pawz should launch first.`}
                />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
                <DistributionSection
                    eyebrow="Community Mix"
                    title="Pet Types"
                    description="The current mix of pet types among members who completed a Founding Pack profile."
                    items={
                        data.petTypes
                    }
                    labels={
                        PET_TYPE_LABELS
                    }
                />

                <DistributionSection
                    eyebrow="Pet Personality"
                    title="How Our Founding Pets Play"
                    description={`${data.summary.personalityResponses.toLocaleString(
                        'en-US',
                    )} members answered this optional question — ${formatPercentage(
                        data.summary.personalityResponseRate,
                    )} of completed pet profiles.`}
                    items={
                        data.petPersonalities
                    }
                    labels={
                        PET_PERSONALITY_LABELS
                    }
                />
            </section>

            <DistributionSection
                eyebrow="Product Direction"
                title="What Should Maxi Pawz Launch First?"
                description="This is one of the strongest direct product-development signals in the Founding Pack profile. Percentages are based only on members who answered this optional question."
                items={
                    data.launchInterests
                }
                labels={
                    LAUNCH_INTEREST_LABELS
                }
            />

            <section className="rounded-[2.5rem] border border-sand bg-white-warm p-5 shadow-card sm:p-6 lg:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-extrabold tracking-[0.08em] text-brand-700 uppercase">
                            Community
                        </p>

                        <h2 className="mt-2 text-2xl font-black text-ink-900 sm:text-3xl">
                            Recent Founding Pets
                        </h2>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">
                            Recently updated pet profiles, intentionally shown without customer emails or email hashes.
                        </p>
                    </div>

                    <p className="text-sm font-extrabold text-ink-500">
                        Showing up to{' '}
                        {
                            data.recentProfiles.length
                        }{' '}
                        recent profiles
                    </p>
                </div>

                {data.recentProfiles.length >
                    0 ? (
                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        {
                            data.recentProfiles.map(
                                (
                                    profile,
                                ) => (
                                    <RecentProfileCard
                                        key={`${profile.petName}-${profile.lastSubmittedAt}`}
                                        profile={
                                            profile
                                        }
                                    />
                                ),
                            )
                        }
                    </div>
                ) : (
                    <div className="mt-6 rounded-3xl border border-dashed border-sand bg-cream-soft p-6">
                        <p className="font-extrabold text-ink-700">
                            No pet profiles yet
                        </p>

                        <p className="mt-1 text-sm leading-6 text-ink-600">
                            As members complete the optional pet profile, their non-email pet information will appear here.
                        </p>
                    </div>
                )}
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                <article className="rounded-3xl border border-sand bg-cream-soft p-5">
                    <p className="text-xs font-extrabold tracking-[0.07em] text-ink-500 uppercase">
                        Missing Profiles
                    </p>

                    <p className="mt-2 text-3xl font-black text-ink-900">
                        {
                            data.summary.profilesMissing.toLocaleString(
                                'en-US',
                            )
                        }
                    </p>

                    <p className="mt-2 text-sm leading-6 text-ink-600">
                        Members who joined but have not completed the optional pet profile.
                    </p>
                </article>

                <article className="rounded-3xl border border-sand bg-cream-soft p-5">
                    <p className="text-xs font-extrabold tracking-[0.07em] text-ink-500 uppercase">
                        Personality Answers
                    </p>

                    <p className="mt-2 text-3xl font-black text-ink-900">
                        {
                            data.summary.personalityResponses.toLocaleString(
                                'en-US',
                            )
                        }
                    </p>

                    <p className="mt-2 text-sm leading-6 text-ink-600">
                        Optional personality responses available for product and content planning.
                    </p>
                </article>

                <article className="rounded-3xl border border-sand bg-cream-soft p-5">
                    <p className="text-xs font-extrabold tracking-[0.07em] text-ink-500 uppercase">
                        Profile Completion
                    </p>

                    <p className="mt-2 text-3xl font-black text-brand-700">
                        {
                            formatPercentage(
                                data.summary.profileCompletionRate,
                            )
                        }
                    </p>

                    <p className="mt-2 text-sm leading-6 text-ink-600">
                        Useful signal for deciding whether the optional profile experience is easy enough to complete.
                    </p>
                </article>
            </section>
        </section>
    );
}