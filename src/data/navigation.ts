export interface NavigationItem {
  label: string;
  href: string;
}

export interface FooterNavigationGroup {
  title: string;
  links: NavigationItem[];
}

export const primaryNavigation: NavigationItem[] = [
  {
    label: 'Home',
    href: '/',
  },
  {
    label: 'Shop',
    href: '/shop',
  },
  {
    label: 'Dog Toys',
    href: '/shop/dog-toys',
  },
  {
    label: 'Cat Toys',
    href: '/shop/cat-toys',
  },
  {
    label: 'About',
    href: '/about',
  },
];

export const footerNavigation: FooterNavigationGroup[] = [
  {
    title: 'Shop',
    links: [
      {
        label: 'Shop All',
        href: '/shop',
      },
      {
        label: 'Dog Toys',
        href: '/shop/dog-toys',
      },
      {
        label: 'Cat Toys',
        href: '/shop/cat-toys',
      },
      {
        label: 'New Arrivals',
        href: '/shop/new-arrivals',
      },
    ],
  },
  {
    title: 'MaxiPawz',
    links: [
      {
        label: 'About Us',
        href: '/about',
      },
      {
        label: 'Pet Toy Safety',
        href: '/pet-toy-safety',
      },
      {
        label: 'Custom Orders',
        href: '/custom-orders',
      },
      {
        label: 'Contact',
        href: '/contact',
      },
    ],
  },
  {
    title: 'Customer Care',
    links: [
      {
        label: 'Frequently Asked Questions',
        href: '/faq',
      },
      {
        label: 'Shipping Policy',
        href: '/shipping-policy',
      },
      {
        label: 'Returns and Refunds',
        href: '/returns',
      },
      {
        label: 'Order Support',
        href: '/order-support',
      },
    ],
  },
];
