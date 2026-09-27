import { businessConfig } from '../config/business';

import type {
    LegalDocument,
} from '../data/legal';

export const spanishAccessibilityStatement = {
    slug: 'accessibility',

    title: 'Declaración de accesibilidad',

    shortTitle: 'Accesibilidad',

    eyebrow: 'Uso inclusivo del sitio web',

    description:
        `Conoce el compromiso de ${businessConfig.shortName} con la creación de un sitio web acogedor y accesible para más personas.`,

    introduction:
        `${businessConfig.publicName} está comprometido con mejorar la accesibilidad y facilidad de uso de su sitio web. Consideramos la accesibilidad como una responsabilidad continua de diseño, desarrollo, pruebas y contenido, y no como una afirmación de conformidad completa o permanente.`,

    icon: 'accessibility',

    tone: 'sand',

    statusLabel:
        'Política de pre-lanzamiento',

    effectiveDate:
        '27 de julio de 2026',

    lastUpdated:
        '4 de agosto de 2026',

    sections: [
        {
            id: 'commitment',

            title:
                '1. Nuestro compromiso con la accesibilidad',

            paragraphs: [
                'Queremos que los visitantes puedan comprender el contenido, navegar por el sitio web, utilizar los formularios y acceder a información importante de la tienda desde diferentes dispositivos y tecnologías de asistencia.',

                'El sitio web continuará siendo revisado y mejorado a medida que se incorporen nuevas páginas, productos, herramientas de pago y funciones de atención al cliente.',
            ],
        },

        {
            id: 'current-practices',

            title:
                '2. Prácticas actuales de diseño y desarrollo',

            paragraphs: [
                'El sitio web se desarrolla teniendo en cuenta prácticas reconocidas de accesibilidad.',
            ],

            bullets: [
                'Encabezados semánticos y regiones estructurales de las páginas.',
                'Enlaces, botones, formularios y elementos desplegables accesibles mediante teclado.',
                'Indicadores visibles de enfoque al utilizar el teclado.',
                'Etiquetas e instrucciones para los formularios.',
                'Texto alternativo o tratamiento adecuado de imágenes decorativas.',
                'Diseños responsivos para diferentes tamaños de pantalla.',
                'Contraste de color legible y texto escalable.',
                'Menor dependencia del color como único medio para comunicar información.',
                'Navegación clara y etiquetas descriptivas en los enlaces.',
            ],
        },

        {
            id: 'ongoing-work',

            title:
                '3. Trabajo continuo',

            paragraphs: [
                'El trabajo de accesibilidad puede incluir revisiones automatizadas, pruebas mediante teclado, evaluaciones con lectores de pantalla, comprobaciones de contraste, revisión de contenido y corrección de problemas encontrados después de una publicación.',

                'Las herramientas de terceros relacionadas con comercio electrónico, pagos, analítica, formularios o contenido integrado serán evaluadas a medida que se incorporen.',
            ],
        },

        {
            id: 'limitations',

            title:
                '4. Limitaciones conocidas y contenido de terceros',

            paragraphs: [
                'A pesar de nuestros esfuerzos continuos, es posible que algún contenido o funcionalidad no funcione perfectamente para todas las personas, dispositivos, navegadores o tecnologías de asistencia.',

                'Algunos servicios de terceros, herramientas integradas, interfaces de pago o sitios web enlazados son administrados por sus respectivos proveedores y pueden tener sus propias funciones y limitaciones de accesibilidad.',
            ],
        },

        {
            id: 'feedback',

            title:
                '5. Comentarios sobre accesibilidad',

            paragraphs: [
                'Agradecemos que nos informes sobre barreras, interacciones difíciles, contenido poco claro, etiquetas faltantes, problemas con el teclado, dificultades de contraste u otros problemas de accesibilidad.',

                `Utiliza el formulario de contacto de ${businessConfig.shortName}, selecciona “Comentarios sobre el sitio web” o escribe a ${businessConfig.generalEmail}.`,

                'Incluye la dirección de la página, el problema encontrado, el dispositivo o tecnología de asistencia utilizada cuando sea relevante y el formato o tipo de ayuda que sería útil.',
            ],
        },

        {
            id: 'response',

            title:
                '6. Cómo abordamos los problemas reportados',

            paragraphs: [
                'Los comentarios relacionados con accesibilidad serán revisados para comprender el problema y considerar las medidas necesarias para corregirlo.',

                `Cuando exista una alternativa razonable para acceder a la información, ${businessConfig.shortName} podrá ofrecerla mientras se investiga un problema del sitio web.`,

                'Normalmente respondemos en un plazo de 1 a 2 días hábiles.',
            ],
        },

        {
            id: 'changes',

            title:
                '7. Actualizaciones de esta declaración',

            paragraphs: [
                'Esta declaración podrá actualizarse a medida que cambien nuestro trabajo de accesibilidad, las funciones del sitio web y los servicios de terceros.',

                'La fecha mostrada en esta página identifica la versión publicada más reciente.',
            ],
        },
    ],

    relatedLinks: [
        {
            label:
                `Contactar a ${businessConfig.shortName}`,

            href:
                '/contact#contact-form',

            description:
                'Informa sobre un problema del sitio web o una dificultad de accesibilidad.',
        },

        {
            label:
                'Correo electrónico de accesibilidad',

            href:
                `mailto:${businessConfig.generalEmail}`,

            description:
                `Envía una consulta sobre accesibilidad a ${businessConfig.generalEmail}.`,
        },

        {
            label:
                'Política de privacidad',

            href:
                '/privacy-policy',

            description:
                'Conoce cómo se maneja la información enviada mediante el formulario de contacto.',
        },
    ],
} satisfies LegalDocument;