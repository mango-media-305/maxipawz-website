import { businessConfig } from '../config/business';

import type {
    LegalDocument,
} from '../data/legal';

export const spanishTermsPolicy = {
    slug: 'terms',

    title:
        'Términos de uso del sitio web',

    shortTitle:
        'Términos',

    eyebrow:
        'Uso del sitio web',

    description:
        `Consulta los términos aplicables al acceder y utilizar el sitio web de pre-lanzamiento de ${businessConfig.shortName}.`,

    introduction:
        `Estos Términos de uso del sitio web regulan el acceso al sitio web de ${businessConfig.publicName}. El sitio web actual es informativo y se encuentra en etapa de pre-lanzamiento. Los términos comerciales serán añadidos o actualizados antes de que se ofrezcan productos para la venta.`,

    icon: 'terms',

    tone: 'accent',

    statusLabel:
        'Política de pre-lanzamiento',

    effectiveDate:
        '27 de julio de 2026',

    lastUpdated:
        '4 de agosto de 2026',

    sections: [
        {
            id:
                'acceptance',

            title:
                '1. Aceptación de estos términos',

            paragraphs: [
                'Al acceder o utilizar este sitio web, aceptas estos Términos de uso del sitio web y la Política de privacidad.',

                'No utilices el sitio web si no estás de acuerdo con estos términos.',
            ],
        },

        {
            id:
                'prelaunch-status',

            title:
                '2. Estado del sitio web antes del lanzamiento',

            paragraphs: [
                `${businessConfig.shortName} se encuentra preparando actualmente su colección de productos y su experiencia de comercio electrónico.`,

                'El sitio web no acepta actualmente pedidos comerciales de productos.',

                'Las categorías de productos, servicios previstos, información de lanzamiento, ilustraciones, conceptos, productos de demostración, precios de Sandbox y vistas previas no representan una oferta actual de venta ni garantizan que un producto específico vaya a estar disponible.',
            ],

            notice:
                'El sitio web actual de pre-lanzamiento no crea ningún acuerdo de compra.',
        },

        {
            id:
                'business-identity',

            title:
                '3. Identidad comercial',

            paragraphs: [
                `El sitio web opera actualmente de manera pública bajo el nombre ${businessConfig.publicName}.`,

                'El uso de ese nombre público en este sitio web de pre-lanzamiento no afirma ni garantiza que se haya completado el registro de una corporación, sociedad de responsabilidad limitada, nombre comercial ficticio, marca u otro registro específico.',

                'La información sobre la identidad comercial podrá actualizarse después de completar los registros aplicables y los preparativos para el lanzamiento.',
            ],
        },

        {
            id:
                'eligibility',

            title:
                '4. Elegibilidad y autoridad',

            paragraphs: [
                'El sitio web está dirigido a personas que pueden aceptar legalmente estos términos.',

                'Si utilizas el sitio web en nombre de una empresa u organización, declaras que tienes autoridad para actuar en representación de dicha organización.',
            ],
        },

        {
            id:
                'acceptable-use',

            title:
                '5. Uso aceptable',

            paragraphs: [
                'Puedes utilizar el sitio web únicamente para fines legales y de una manera que no interfiera con su funcionamiento ni con los derechos de otras personas.',
            ],

            bullets: [
                'No intentes obtener acceso no autorizado al sitio web, sistemas de alojamiento, formularios, herramientas administrativas o servicios conectados.',
                'No introduzcas código malicioso, ataques automatizados, tráfico excesivo u otra tecnología perjudicial.',
                'No utilices los formularios del sitio web para acoso, fraude, solicitudes ilegales, suplantación de identidad o spam.',
                'No intentes interferir con la seguridad, la analítica, las pruebas del proceso de pago o el procesamiento de formularios.',
                'No extraigas, copies o vuelvas a publicar una parte sustancial del contenido del sitio web de una manera que infrinja derechos aplicables.',
                `No declares falsamente tener una afiliación con ${businessConfig.shortName}.`,
            ],
        },

        {
            id:
                'intellectual-property',

            title:
                '6. Contenido del sitio web y de la marca',

            paragraphs: [
                `El diseño del sitio web, la marca ${businessConfig.shortName}, la mascota de la marca, los logotipos, textos originales, gráficos, guías, fotografías, diseños de página y otros materiales originales pueden estar protegidos por las leyes de propiedad intelectual aplicables.`,

                'La visualización limitada y personal del contenido público del sitio web no transfiere propiedad ni concede permiso para reproducir, distribuir, vender, modificar o crear obras comerciales derivadas.',
            ],
        },

        {
            id:
                'submissions',

            title:
                '7. Mensajes, sugerencias y contenido enviado',

            paragraphs: [
                'Sigues siendo responsable de la información que envíes a través del sitio web o por correo electrónico.',

                `Al enviar comentarios, sugerencias o ideas, permites que ${businessConfig.shortName} revise y utilice dicho contenido para evaluar o mejorar el sitio web, la marca, los productos o los servicios, sin que esto cree una obligación de adoptar la idea o proporcionar una compensación por ella.`,
            ],

            notice:
                'No envíes información comercial confidencial, diseños de productos de propiedad exclusiva ni contenido que no tengas autorización para compartir.',
        },

        {
            id:
                'pet-information',

            title:
                '8. Información sobre mascotas y contenido educativo',

            paragraphs: [
                'Las Guías para mascotas, la información sobre seguridad de productos, las preguntas frecuentes y otros contenidos similares se ofrecen con fines educativos generales.',

                'Estos contenidos no sustituyen un diagnóstico veterinario, tratamiento, servicios de emergencia, asesoramiento nutricional, entrenamiento profesional ni orientación médica o de comportamiento individualizada.',

                'Los dueños de mascotas siguen siendo responsables de seleccionar productos adecuados para sus animales y de supervisar su uso cuando corresponda.',
            ],
        },

        {
            id:
                'third-party-services',

            title:
                '9. Servicios y enlaces de terceros',

            paragraphs: [
                'El sitio web puede utilizar o incluir enlaces a servicios de terceros. Estos servicios funcionan bajo sus propios términos, políticas, disponibilidad y prácticas de seguridad.',

                'Un enlace o integración técnica no representa necesariamente una aprobación de todas las declaraciones, productos o prácticas de ese tercero.',
            ],
        },

        {
            id:
                'availability',

            title:
                '10. Disponibilidad y cambios del sitio web',

            paragraphs: [
                'El sitio web podrá modificarse, suspenderse, restringirse o dejar de estar disponible en cualquier momento.',

                'No garantizamos que todas las páginas, funciones, formularios, enlaces, demostraciones o elementos de información permanezcan disponibles continuamente o libres de errores.',
            ],
        },

        {
            id:
                'disclaimers',

            title:
                '11. Descargos de responsabilidad',

            paragraphs: [
                'El sitio web de pre-lanzamiento y su contenido se proporcionan según disponibilidad, en la medida permitida por la legislación aplicable.',

                `${businessConfig.shortName} no garantiza que el sitio web satisfaga todos los fines particulares, permanezca disponible sin interrupciones o esté libre de todos los errores o riesgos de seguridad.`,
            ],
        },

        {
            id:
                'limitation',

            title:
                '12. Limitación de responsabilidad',

            paragraphs: [
                `En la máxima medida permitida por la legislación aplicable, ${businessConfig.shortName} no será responsable por pérdidas indirectas, incidentales, especiales, consecuentes o similares que surjan exclusivamente del uso o de la imposibilidad de utilizar el sitio web informativo de pre-lanzamiento.`,

                'Nada de lo establecido en estos términos excluye responsabilidades que legalmente no puedan ser excluidas o limitadas.',
            ],
        },

        {
            id:
                'commercial-terms',

            title:
                '13. Términos comerciales futuros',

            paragraphs: [
                'Los términos comerciales relacionados con productos, precios, proceso de pago, pagos, impuestos, envíos, devoluciones, cancelaciones, reembolsos, promociones y asistencia con pedidos no están activos a través de este sitio web de pre-lanzamiento.',

                'Las políticas correspondientes serán revisadas y publicadas antes de habilitar las compras reales.',
            ],
        },

        {
            id:
                'changes',

            title:
                '14. Cambios a estos términos',

            paragraphs: [
                'Estos términos podrán ser revisados a medida que evolucionen el sitio web, la tienda, las políticas y los servicios.',

                'La fecha de actualización mostrada en esta página identifica la versión publicada más reciente.',
            ],
        },

        {
            id:
                'contact',

            title:
                '15. Contacto',

            paragraphs: [
                `Las preguntas relacionadas con estos términos pueden enviarse a ${businessConfig.generalEmail} o mediante el formulario de contacto de ${businessConfig.shortName}.`,

                'Normalmente respondemos en un plazo de 1 a 2 días hábiles.',
            ],
        },
    ],

    relatedLinks: [
        {
            label:
                'Política de privacidad',

            href:
                '/privacy-policy',

            description:
                'Conoce cómo se maneja la información enviada a través del sitio web.',
        },

        {
            label:
                'Declaración de accesibilidad',

            href:
                '/accessibility',

            description:
                'Consulta nuestro enfoque para facilitar el uso accesible del sitio web.',
        },

        {
            label:
                `Contactar a ${businessConfig.shortName}`,

            href:
                businessConfig.contactHref,

            description:
                'Envía una pregunta sobre políticas, accesibilidad o el sitio web.',
        },
    ],
} satisfies LegalDocument;