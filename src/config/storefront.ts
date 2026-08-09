import { businessConfig } from './business';

export type StorefrontMode = 'prelaunch' | 'live';

interface StorefrontAnnouncement {
    message: string;
    href: string;
    ariaLabel: string;
}

interface StorefrontAction {
    label: string;
    href: string;
}

interface StorefrontState {
    announcement: StorefrontAnnouncement;
    headerAction: StorefrontAction | null;
    mobileNote: string;
}

const configuredMode =
    import.meta.env.PUBLIC_STOREFRONT_MODE;

export const storefrontMode: StorefrontMode =
    configuredMode === 'live'
        ? 'live'
        : 'prelaunch';

const storefrontStates: Record<
    StorefrontMode,
    StorefrontState
> = {
    prelaunch: {
        announcement: {
            message:
                `Explore practical pet guides and get first access to the ${businessConfig.shortName} collection.`,

            href: '/#maxi-pawz-updates',

            ariaLabel:
                `Get ${businessConfig.shortName} updates and first access`,
        },

        headerAction: {
            label: 'Get Updates',
            href: '/#maxi-pawz-updates',
        },

        mobileNote:
            'Explore helpful pet guidance and get Maxi Pawz updates about launch news, new products, and occasional offers.',
    },

    live: {
        announcement: {
            message:
                'Toys, accessories, and everyday essentials for happier pet moments.',

            href: '/shop',

            ariaLabel:
                `Shop ${businessConfig.shortName} pet products`,
        },

        headerAction: null,

        mobileNote:
            'Shop toys, accessories, supplies, and everyday pet essentials with secure checkout.',
    },
};

export const storefrontState =
    storefrontStates[storefrontMode];

export const isStoreLive =
    storefrontMode === 'live';

export const isStorePrelaunch =
    storefrontMode === 'prelaunch';