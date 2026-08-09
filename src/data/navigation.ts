export interface NavigationItem {
  label: string;
  href: string;
}

export interface FooterNavigationGroup {
  title: string;
  links: NavigationItem[];
}

/*
 * The logo provides the homepage link, so Home is intentionally
 * omitted from the desktop navigation.
 */
export const primaryNavigation: NavigationItem[] = [
  {
    label: 'Shop',
    href: '/shop',
  },

  {
    label: 'Pet Guides',
    href: '/pet-guides',
  },

  {
    label: 'Our Story',
    href: '/about',
  },

  {
    label: 'Contact',
    href: '/contact',
  },
];

/*
 * The mobile drawer provides a complete navigation experience,
 * so Home is included explicitly.
 */
export const mobileNavigation: NavigationItem[] = [
  {
    label: 'Home',
    href: '/',
  },

  ...primaryNavigation,
];

export const footerNavigation: FooterNavigationGroup[] = [
  {
    title: 'Explore',

    links: [
      {
        label: 'Shop',
        href: '/shop',
      },

      {
        label: 'Pet Guides',
        href: '/pet-guides',
      },

      {
        label: 'Our Story',
        href: '/about',
      },
    ],
  },

  {
    title: 'Helpful Resources',

    links: [
      {
        label: 'Pet Product Safety',
        href: '/product-safety',
      },

      {
        label: 'Choosing the Right Product',
        href: '/pet-guides/choosing-the-right-product',
      },

      {
        label: 'Walk & Travel Essentials',
        href: '/pet-guides/walk-and-travel',
      },

      {
        label: 'Frequently Asked Questions',
        href: '/faq',
      },
    ],
  },

  {
    title: 'Help & Policies',

    links: [
      {
        label: 'Contact Us',
        href: '/contact',
      },

      {
        label: 'Shipping Policy',
        href: '/shipping-policy',
      },

      {
        label: 'Return & Refund Policy',
        href: '/return-policy',
      },

      {
        label: 'Maxi Pawz Updates',
        href: '/#maxi-pawz-updates',
      },
    ],
  },
];