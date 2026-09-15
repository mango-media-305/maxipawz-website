import { isStoreLive } from '../config/storefront';
import { getStorefrontCatalogProducts } from './storefront-catalog';

interface CartAction {
    href: string;
    label: string;
}

interface CartPresentation {
    emptyDescription: string;
    primaryAction: CartAction;
    secondaryAction?: CartAction;
    continueAction: CartAction;
}

export function getCartPresentation(): CartPresentation {
    const catalogProducts = getStorefrontCatalogProducts();
    const hasProducts = catalogProducts.length > 0;
    const isDemoCatalog =
        hasProducts && catalogProducts.every((product) => product.isDemo);

    const isPreviewCatalog = !isStoreLive || isDemoCatalog;

    const primaryAction: CartAction = hasProducts
        ? {
            href: '/shop#products',
            label: isPreviewCatalog ? 'Preview Products' : 'Browse Products',
        }
        : {
            href: '/#maxi-pawz-updates',
            label: isStoreLive ? 'Get Product Updates' : 'Get Launch Updates',
        };

    const secondaryAction: CartAction | undefined = !isStoreLive
        ? hasProducts
            ? {
                href: '/#maxi-pawz-updates',
                label: 'Get Launch Updates',
            }
            : {
                href: '/shop#shop-categories',
                label: 'Explore What’s Coming',
            }
        : !hasProducts
            ? {
                href: '/pet-guides',
                label: 'Read Pet Guides',
            }
            : undefined;

    const emptyDescription = !hasProducts
        ? isStoreLive
            ? 'There are no products to browse right now. Get product updates or explore our pet guides.'
            : 'Our first collection is on its way. Get launch updates and explore what is coming.'
        : isDemoCatalog
            ? 'Preview the collection and explore the details of our demo products.'
            : isStoreLive
                ? 'Discover products for the everyday moments you share with your pet.'
                : 'Explore the upcoming collection and sign up for launch updates.';

    const continueAction: CartAction = hasProducts
        ? {
            href: '/shop#products',
            label: isPreviewCatalog ? 'Continue Exploring' : 'Continue Shopping',
        }
        : primaryAction;

    return {
        emptyDescription,
        primaryAction,
        secondaryAction,
        continueAction,
    };
}