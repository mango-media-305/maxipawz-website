import { businessConfig } from '../config/business';

import {
    contactChannels,
    contactPrinciples,
    getAvailableContactTopics,
    type ContactChannel,
    type ContactPrinciple,
    type ContactTopic,
    type ContactTopicIcon,
    type ContactTopicValue,
} from '../data/contact';

import type { Locale } from './languages';

const spanishTopicCopy:
    Record<
        ContactTopicValue,
        Pick<
            ContactTopic,
            'label' | 'title' | 'description'
        >
    > = {
    'general-question': {
        label: 'Pregunta general',
        title: 'Preguntas generales',
        description:
            `Pregunta sobre ${businessConfig.shortName}, nuestra historia, la futura tienda, las guías para mascotas o cualquier otro tema relacionado con la marca.`,
    },

    'product-question': {
        label: 'Pregunta sobre un producto',
        title: 'Preguntas sobre productos',
        description:
            'Cuéntanos qué tipo de producto, rutina de tu mascota, tamaño, característica o categoría te gustaría conocer mejor.',
    },

    partnership: {
        label: 'Alianza o colaboración',
        title: 'Alianzas',
        description:
            'Comparte una propuesta de alianza, colaboración, venta al por mayor, creación de contenido o iniciativa comunitaria.',
    },

    'website-feedback': {
        label: 'Comentarios sobre el sitio web',
        title: 'Comentarios sobre el sitio',
        description:
            'Cuéntanos sobre algún problema de accesibilidad, enlace roto, sección confusa o sugerencia para mejorar el sitio web.',
    },

    'order-support': {
        label: 'Ayuda con un pedido',
        title: 'Ayuda con pedidos',
        description:
            `Contáctanos sobre un pedido existente de ${businessConfig.shortName} e incluye el número de pedido cuando esté disponible.`,
    },

    'return-request': {
        label: 'Solicitud de devolución',
        title: 'Devoluciones',
        description:
            `Inicia una consulta relacionada con la devolución de una compra elegible de ${businessConfig.shortName}.`,
    },
};

const spanishChannelCopy:
    Partial<
        Record<
            ContactTopicIcon,
            Pick<
                ContactChannel,
                'title' | 'description'
            >
        >
    > = {
    general: {
        title: 'Preguntas generales',
        description:
            'Preguntas generales, productos, alianzas, colaboraciones, guías para mascotas y comentarios sobre el sitio web.',
    },

    order: {
        title: 'Ayuda con pedidos',
        description:
            'Preguntas sobre un pedido existente, confirmación de pago, actualizaciones de envío o información del pedido.',
    },

    return: {
        title: 'Devoluciones y problemas con productos',
        description:
            'Solicitudes de devolución y reportes de productos dañados, defectuosos, incorrectos, faltantes o incompletos.',
    },
};

const spanishPrinciples:
    ContactPrinciple[] = [
        {
            title: 'Incluye detalles útiles',

            description:
                'Los nombres, categorías de productos, números de pedido, enlaces y descripciones claras nos ayudan a entender mejor tu mensaje.',
        },

        {
            title: 'Protege la información sensible',

            description:
                'No envíes números de tarjeta, contraseñas, datos completos de pago u otra información altamente sensible a través de este formulario.',
        },

        {
            title: 'Elige el tema más adecuado',

            description:
                'Seleccionar el tema más relevante nos ayuda a organizar preguntas, comentarios, alianzas y solicitudes de ayuda.',
        },
    ];

export function getLocalizedContactTopics(
    locale: Locale,
    isStoreLive: boolean,
): ContactTopic[] {
    const topics =
        getAvailableContactTopics(
            isStoreLive,
        );

    if (locale === 'en') {
        return topics;
    }

    return topics.map(
        (topic) => ({
            ...topic,
            ...spanishTopicCopy[
            topic.value
            ],
        }),
    );
}

export function getLocalizedContactChannels(
    locale: Locale,
): ContactChannel[] {
    if (locale === 'en') {
        return contactChannels;
    }

    return contactChannels.map(
        (channel) => ({
            ...channel,
            ...(spanishChannelCopy[
                channel.icon
            ] ?? {}),
        }),
    );
}

export function getLocalizedContactPrinciples(
    locale: Locale,
): ContactPrinciple[] {
    return locale === 'es'
        ? spanishPrinciples
        : contactPrinciples;
}

export function getContactSupportResponse(
    locale: Locale,
): string {
    return locale === 'es'
        ? 'Normalmente respondemos en un plazo de 1 a 2 días hábiles.'
        : businessConfig.supportResponseTime;
}