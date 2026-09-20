import { businessConfig } from '../config/business';
import { isStoreLive, storefrontState } from '../config/storefront';
import {
    footerNavigation,
    mobileNavigation,
    primaryNavigation,
    type NavigationItem,
} from '../data/navigation';
import type { Locale } from './languages';
import { localizeHref, localizedLinkLabel } from './routes';

const englishCopy = {
    skip: 'Skip to main content',
    home: `${businessConfig.publicName} home`,
    primaryNavigation: 'Primary navigation',
    mainNavigation: 'Main navigation',
    mobileNavigation: 'Mobile navigation',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
    announcement: 'Store announcement',
    search: `Search ${businessConfig.shortName} products`,
    viewCart: 'View cart',
    questions: 'Questions?',
    supportResponse: businessConfig.supportResponseTime,
    footerDescription:
        'Thoughtfully selected toys, accessories, and everyday essentials that support play, travel, comfort, care, and joyful moments between pets and their people.',
    socialOn: 'on',
    rights: 'All rights reserved.',
    privacy: 'Privacy',
    terms: 'Terms',
    accessibility: 'Accessibility',
    defaultImageAlt: `${businessConfig.publicName} — Happy Pets, Happy Life.`,
};

type SharedCopy = { [Key in keyof typeof englishCopy]: string };

export const sharedCopy: Record<Locale, SharedCopy> = {
    en: englishCopy,
    es: {
        skip: 'Saltar al contenido principal',
        home: `Inicio de ${businessConfig.publicName}`,
        primaryNavigation: 'Navegación principal',
        mainNavigation: 'Navegación principal',
        mobileNavigation: 'Navegación móvil',
        openMenu: 'Abrir menú de navegación',
        closeMenu: 'Cerrar menú de navegación',
        announcement: 'Aviso de la tienda',
        search: `Buscar productos de ${businessConfig.shortName}`,
        viewCart: 'Ver carrito',
        questions: '¿Tienes preguntas?',
        supportResponse: 'Normalmente respondemos en un plazo de 1 a 2 días hábiles.',
        footerDescription:
            'Juguetes, accesorios y artículos esenciales seleccionados con cuidado para acompañar el juego, los paseos, el descanso y los momentos felices entre las mascotas y sus familias.',
        socialOn: 'en',
        rights: 'Todos los derechos reservados.',
        privacy: 'Privacidad',
        terms: 'Términos',
        accessibility: 'Accesibilidad',
        defaultImageAlt: `${businessConfig.publicName} — Mascotas felices, vida feliz.`,
    },
};

const spanishNavigationLabels: Record<string, string> = {
    '/': 'Inicio',
    '/shop': 'Tienda',
    '/pet-guides': 'Guías para mascotas',
    '/about': 'Nuestra historia',
    '/contact': 'Contacto',
    '/product-safety': 'Seguridad de los productos para mascotas',
    '/pet-guides/choosing-the-right-product': 'Cómo elegir el producto adecuado',
    '/pet-guides/walk-and-travel': 'Esenciales para paseos y viajes',
    '/faq': 'Preguntas frecuentes',
    '/shipping-policy': 'Política de envíos',
    '/return-policy': 'Política de devoluciones y reembolsos',
    '/#maxi-pawz-updates': 'Novedades de Maxi Pawz',
};

function translateNavigationItem(item: NavigationItem, locale: Locale): NavigationItem {
    const label = locale === 'es'
        ? spanishNavigationLabels[item.href] ?? item.label
        : item.label;

    return {
        label: localizedLinkLabel(label, item.href, locale),
        href: localizeHref(item.href, locale),
    };
}

export function getPrimaryNavigation(locale: Locale): NavigationItem[] {
    return primaryNavigation.map((item) => translateNavigationItem(item, locale));
}

export function getMobileNavigation(locale: Locale): NavigationItem[] {
    return mobileNavigation.map((item) => translateNavigationItem(item, locale));
}

export function getFooterNavigation(locale: Locale) {
    const spanishGroupTitles: Record<string, string> = {
        Explore: 'Explora',
        'Helpful Resources': 'Recursos útiles',
        'Help & Policies': 'Ayuda y políticas',
    };

    return footerNavigation.map((group) => ({
        title: locale === 'es' ? spanishGroupTitles[group.title] ?? group.title : group.title,
        links: group.links.map((item) => translateNavigationItem(item, locale)),
    }));
}

export function getStorefrontCopy(locale: Locale) {
    const announcement = locale === 'en'
        ? storefrontState.announcement
        : {
            message: isStoreLive
                ? 'Juguetes, accesorios y esenciales para disfrutar cada día con tu mascota.'
                : `Descubre guías prácticas y recibe acceso anticipado a la colección de ${businessConfig.shortName}.`,
            href: storefrontState.announcement.href,
            ariaLabel: isStoreLive
                ? `Comprar productos para mascotas de ${businessConfig.shortName}`
                : `Recibir novedades y acceso anticipado de ${businessConfig.shortName}`,
        };
    const action = storefrontState.headerAction;
    const actionLabel = locale === 'es' ? 'Recibir novedades' : action?.label ?? '';

    return {
        announcement: {
            ...announcement,
            href: localizeHref(announcement.href, locale),
            ariaLabel: localizedLinkLabel(announcement.ariaLabel, announcement.href, locale),
        },
        headerAction: action
            ? {
                label: localizedLinkLabel(actionLabel, action.href, locale),
                href: localizeHref(action.href, locale),
            }
            : null,
        mobileNote: locale === 'en'
            ? storefrontState.mobileNote
            : isStoreLive
                ? 'Compra juguetes, accesorios y esenciales para tu mascota con un proceso de pago seguro.'
                : 'Encuentra consejos útiles y recibe novedades de Maxi Pawz sobre el lanzamiento, nuevos productos y ofertas ocasionales.',
    };
}