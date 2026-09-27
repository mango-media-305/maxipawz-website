import { businessConfig } from '../config/business';

import type {
    LegalDocument,
} from '../data/legal';

export const spanishReturnPolicy = {
    slug: 'return-policy',

    title:
        'Política de devoluciones y reembolsos',

    shortTitle:
        'Devoluciones',

    eyebrow:
        'Devoluciones antes del lanzamiento',

    description:
        `Consulta el estado actual de pre-lanzamiento de ${businessConfig.shortName} en relación con devoluciones, cancelaciones, cambios y reembolsos.`,

    introduction:
        `La tienda online de ${businessConfig.publicName} aún no acepta compras comerciales. Actualmente no existe un plazo activo de devoluciones, programa de cambios, plazo de reembolso, garantía de cancelación ni procedimiento de envío para devoluciones aplicable a compras realizadas en el sitio web.`,

    icon: 'returns',

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
                'current-status',

            title:
                '1. Estado actual de las devoluciones',

            paragraphs: [
                'Debido a que el proceso de pago comercial está deshabilitado, actualmente no existen compras reales realizadas en el sitio web que sean elegibles para devolución, cancelación, cambio o reembolso.',

                'El contenido de esta página no crea un derecho de devolución o reembolso para una compra realizada a través de otro vendedor o negocio.',
            ],

            notice:
                'Los términos finales de devoluciones y reembolsos deben ser revisados antes de habilitar el proceso de pago comercial.',
        },

        {
            id:
                'manual-process',

            title:
                '2. Proceso manual previsto para solicitudes',

            paragraphs: [
                `Después del lanzamiento, las solicitudes de devolución y los reportes relacionados con productos dañados, defectuosos, incorrectos, faltantes o incompletos se gestionarán manualmente a través de ${businessConfig.supportEmail}.`,

                'La tienda inicial no ofrecerá un portal automático de autoservicio para devoluciones.',

                'El cliente no debe enviar por correo ni entregar un producto hasta recibir instrucciones de devolución para esa solicitud específica.',
            ],
        },

        {
            id:
                'future-policy',

            title:
                '3. Información que incluirá la política final',

            paragraphs: [
                'La política completa explicará claramente las condiciones y el proceso para solicitar una devolución, cancelación o reembolso.',
            ],

            bullets: [
                'La cantidad de días disponibles para solicitar una devolución.',
                'La condición en la que debe encontrarse un artículo para ser devuelto.',
                'Si se requiere el embalaje original, etiquetas, accesorios o componentes.',
                'Los productos considerados venta final o excluidos por otros motivos.',
                'Las reglas aplicables a productos abiertos, usados, consumibles, personalizados o sensibles por razones de higiene.',
                'Los procedimientos para artículos dañados, defectuosos, incorrectos, faltantes o incompletos.',
                'Quién será responsable de los gastos de envío de una devolución.',
                'Si se ofrecerán cambios directos.',
                'Cómo se iniciarán los reembolsos aprobados.',
                'El tiempo interno previsto para procesar un reembolso.',
                'En qué momento un pedido ya no podrá ser modificado o cancelado.',
            ],
        },

        {
            id:
                'request-information',

            title:
                '4. Información que podría requerir una futura solicitud',

            paragraphs: [
                'Una solicitud de devolución o relacionada con un problema de producto podrá requerir la referencia del pedido, el correo electrónico del comprador, el nombre del artículo, el motivo de la solicitud y fotografías de respaldo cuando sean relevantes.',

                'Es posible que se solicite a los clientes conservar el producto, los accesorios, el embalaje, la caja o contenedor de envío, la etiqueta de envío y la documentación del pedido mientras se revisa la solicitud.',
            ],
        },

        {
            id:
                'refund-method',

            title:
                '5. Reembolsos futuros',

            paragraphs: [
                'Actualmente no se promete un plazo específico para procesar reembolsos.',

                'La política final explicará cuándo se inicia un reembolso aprobado, cómo se devuelve al método de pago original y por qué la institución financiera del cliente puede necesitar tiempo adicional para reflejar el crédito.',

                'Stripe gestionará los recibos de pagos y reembolsos cuando se habilite el proceso de pago comercial.',
            ],
        },

        {
            id:
                'changes-and-cancellations',

            title:
                '6. Cambios y cancelaciones de pedidos futuros',

            paragraphs: [
                `Después del lanzamiento, los clientes deberán contactar a ${businessConfig.ordersEmail} lo antes posible cuando soliciten una corrección o cancelación de un pedido.`,

                'No se garantizará una cancelación, cambio de dirección de envío o modificación del pedido una vez que este haya entrado en procesamiento o preparación.',
            ],
        },

        {
            id:
                'updates',

            title:
                '7. Actualizaciones de la política y contacto',

            paragraphs: [
                'Esta política de pre-lanzamiento será reemplazada o ampliada antes de que la tienda comience a aceptar compras comerciales.',

                `Las preguntas sobre el proceso de devolución previsto pueden enviarse a ${businessConfig.supportEmail}.`,

                'Normalmente respondemos en un plazo de 1 a 2 días hábiles.',
            ],
        },
    ],

    relatedLinks: [
        {
            label:
                'Política de envíos',

            href:
                '/shipping-policy',

            description:
                'Consulta el estado actual de los procesos de envío y preparación de pedidos.',
        },

        {
            label:
                'Seguridad de productos para mascotas',

            href:
                '/product-safety',

            description:
                'Consulta recomendaciones para inspeccionar y utilizar productos para mascotas.',
        },

        {
            label:
                'Devoluciones y problemas con productos',

            href:
                `mailto:${businessConfig.supportEmail}`,

            description:
                `Envía una futura solicitud de devolución o un reporte sobre un producto a ${businessConfig.supportEmail}.`,
        },
    ],
} satisfies LegalDocument;