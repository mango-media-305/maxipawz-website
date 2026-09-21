import {
    isStoreLive,
} from '../config/storefront';

import {
    commerceText,
} from '../i18n/commerce';

import type {
    Locale,
} from '../i18n/languages';

import {
    getStorefrontCatalogProducts,
} from './storefront-catalog';

interface CartAction {
    href: string;

    label: string;
}

interface CartPresentation {
    emptyDescription:
        string;

    primaryAction:
        CartAction;

    secondaryAction?:
        CartAction;

    continueAction:
        CartAction;
}

export function getCartPresentation(
    locale:
        Locale = 'en',
): CartPresentation {
    const catalogProducts =
        getStorefrontCatalogProducts();

    const hasProducts =
        catalogProducts.length >
        0;

    const isDemoCatalog =
        hasProducts &&
        catalogProducts.every(
            (
                product,
            ) =>
                product.isDemo,
        );

    const isPreviewCatalog =
        !isStoreLive ||
        isDemoCatalog;

    const primaryAction:
        CartAction =
        hasProducts
            ? {
                href:
                    '/shop#products',

                label:
                    isPreviewCatalog
                        ? commerceText(
                            locale,
                            'Preview Products',
                            'Ver productos',
                        )
                        : commerceText(
                            locale,
                            'Browse Products',
                            'Explorar productos',
                        ),
            }
            : {
                href:
                    '/#maxi-pawz-updates',

                label:
                    isStoreLive
                        ? commerceText(
                            locale,
                            'Get Product Updates',
                            'Recibir novedades de productos',
                        )
                        : commerceText(
                            locale,
                            'Get Launch Updates',
                            'Recibir novedades del lanzamiento',
                        ),
            };

    const secondaryAction:
        CartAction |
        undefined =
        !isStoreLive
            ? hasProducts
                ? {
                    href:
                        '/#maxi-pawz-updates',

                    label:
                        commerceText(
                            locale,
                            'Get Launch Updates',
                            'Recibir novedades del lanzamiento',
                        ),
                }
                : {
                    href:
                        '/shop#shop-categories',

                    label:
                        commerceText(
                            locale,
                            'Explore What’s Coming',
                            'Explorar lo que viene',
                        ),
                }
            : !hasProducts
                ? {
                    href:
                        '/pet-guides',

                    label:
                        commerceText(
                            locale,
                            'Read Pet Guides',
                            'Leer guías para mascotas',
                        ),
                }
                : undefined;

    const emptyDescription =
        !hasProducts
            ? isStoreLive
                ? commerceText(
                    locale,
                    'There are no products to browse right now. Get product updates or explore our pet guides.',
                    'No hay productos disponibles para explorar en este momento. Recibe novedades de productos o visita nuestras guías para mascotas.',
                )
                : commerceText(
                    locale,
                    'Our first collection is on its way. Get launch updates and explore what is coming.',
                    'Nuestra primera colección está en camino. Recibe novedades del lanzamiento y descubre lo que estamos preparando.',
                )
            : isDemoCatalog
                ? commerceText(
                    locale,
                    'Preview the collection and explore the details of our demo products.',
                    'Explora la colección y conoce los detalles de nuestros productos de demostración.',
                )
                : isStoreLive
                    ? commerceText(
                        locale,
                        'Discover products for the everyday moments you share with your pet.',
                        'Descubre productos para los momentos cotidianos que compartes con tu mascota.',
                    )
                    : commerceText(
                        locale,
                        'Explore the upcoming collection and sign up for launch updates.',
                        'Explora la próxima colección y regístrate para recibir novedades del lanzamiento.',
                    );

    const continueAction:
        CartAction =
        hasProducts
            ? {
                href:
                    '/shop#products',

                label:
                    isPreviewCatalog
                        ? commerceText(
                            locale,
                            'Continue Exploring',
                            'Seguir explorando',
                        )
                        : commerceText(
                            locale,
                            'Continue Shopping',
                            'Seguir comprando',
                        ),
            }
            : primaryAction;

    return {
        emptyDescription,

        primaryAction,

        secondaryAction,

        continueAction,
    };
}