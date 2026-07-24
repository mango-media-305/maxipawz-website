export interface NavigationItem {
  label: string;
  href: string;
}

export interface FooterNavigationGroup {
  title: string;
  links: NavigationItem[];
}

/*
 * Desktop navigation.
 *
 * Home is intentionally omitted because the MaxiPawz logo already links
 * to the homepage.
 */
export const primaryNavigation: NavigationItem[] = [
  {
    label: 'Shop',
    href: '/shop',
  },
  {
    label: 'Play Guides',
    href: '/play-guides',
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
 * Mobile navigation includes an explicit Home link because the drawer
 * works as a complete site-navigation experience.
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
        label: 'Play Guides',
        href: '/play-guides',
      },
      {
        label: 'Our Story',
        href: '/about',
      },
    ],
  },
  {
    title: 'Play Better',
    links: [
      {
        label: 'Pet Toy Safety',
        href: '/toy-safety',
      },
      {
        label: 'Choosing the Right Toy',
        href: '/play-guides/choosing-the-right-toy',
      },
      {
        label: 'Enrichment Basics',
        href: '/play-guides/enrichment-basics',
      },
    ],
  },
  {
    title: 'Help & Updates',
    links: [
      {
        label: 'Frequently Asked Questions',
        href: '/faq',
      },
      {
        label: 'Contact Us',
        href: '/contact',
      },
      {
        label: 'Join the Pack',
        href: '/#join-the-pack',
      },
    ],
  },
];