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

const configuredMode = import.meta.env.PUBLIC_STOREFRONT_MODE;

export const storefrontMode: StorefrontMode =
    configuredMode === 'live' ? 'live' : 'prelaunch';

const storefrontStates: Record<StorefrontMode, StorefrontState> = {
    prelaunch: {
        announcement: {
            message: 'Join the MaxiPawz pack—new pet favorites are coming.',
            href: '/#join-the-pack',
            ariaLabel: 'Join the MaxiPawz launch list',
        },

        headerAction: {
            label: 'Join the Pack',
            href: '/#join-the-pack',
        },

        mobileNote:
            'Be first to hear about our launch, new products, useful pet tips, and special offers.',
    },

    live: {
        announcement: {
            message:
                'Toys, accessories, and everyday essentials for happier pet moments.',
            href: '/shop',
            ariaLabel: 'Shop MaxiPawz pet products',
        },

        headerAction: null,

        mobileNote:
            'Shop toys, accessories, supplies, and everyday pet essentials with secure checkout.',
    },
};

export const storefrontState = storefrontStates[storefrontMode];

export const isStoreLive = storefrontMode === 'live';
export const isStorePrelaunch = storefrontMode === 'prelaunch';