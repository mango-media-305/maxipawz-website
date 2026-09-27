import {
    businessConfig,
    businessDisplayName,
} from '../config/business';

import type {
    LegalDocument,
} from '../data/legal';

export const spanishShippingPolicy = {
    slug: 'shipping-policy',

    title:
        'Política de envíos',

    shortTitle:
        'Envíos',

    eyebrow:
        'Preparación de pedidos antes del lanzamiento',

    description:
        `Consulta el estado actual de pre-lanzamiento de ${businessConfig.shortName} en relación con los procedimientos de envío, preparación de pedidos, seguimiento y entrega.`,

    introduction:
        `${businessDisplayName} aún no acepta pedidos comerciales a través del sitio web. La configuración de envíos utilizada actualmente para desarrollo y pruebas en Stripe Sandbox no constituye una oferta pública de envío, una promesa de tarifa, un compromiso de entrega ni un acuerdo comercial de preparación y envío de pedidos.`,

    icon: 'shipping',

    tone: 'brand',

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
                '1. Estado actual de los envíos',

            paragraphs: [
                'El proceso de pago comercial está deshabilitado y actualmente no se puede realizar ningún pedido real a través del sitio web.',

                'Los productos de demostración, precios de prueba, tablas de envío, pesos de paquetes, sesiones de Stripe Sandbox y herramientas internas de preparación de pedidos se utilizan únicamente para desarrollo y pruebas.',

                'Estas configuraciones de prueba no constituyen una promesa de que un destino, precio de envío, mínimo para envío gratuito, tiempo de procesamiento, transportista, servicio o plazo de entrega específico estará disponible durante el lanzamiento comercial.',
            ],

            notice:
                'Se revisará una Política de envíos comercial completa antes de habilitar el proceso de pago para compras reales.',
        },

        {
            id:
                'planned-destinations',

            title:
                '2. Destinos de envío previstos',

            paragraphs: [
                'La configuración técnica actual del proceso de pago está diseñada para direcciones de envío dentro de Estados Unidos.',

                'La lista exacta de destinos comerciales, incluyendo cualquier tratamiento especial para Alaska, Hawái, territorios de Estados Unidos, direcciones militares, apartados postales u otros destinos especiales, continúa sujeta a aprobación operativa final.',

                'Actualmente no se contempla el envío internacional para el lanzamiento inicial.',
            ],
        },

        {
            id:
                'rates-and-free-shipping',

            title:
                '3. Cargos de envío y condiciones para envío gratuito',

            paragraphs: [
                'El entorno de desarrollo contiene actualmente cálculos provisionales de envío utilizados para probar el comportamiento del proceso de pago.',

                'Estos cálculos no son cotizaciones en tiempo real de los transportistas ni tarifas comerciales aprobadas.',

                'La política final indicará los cargos de envío aprobados, cualquier importe mínimo de mercancía requerido para obtener envío estándar gratuito, los destinos elegibles para esa oferta y cómo los descuentos, impuestos u otros cargos afectan la elegibilidad.',
            ],
        },

        {
            id:
                'processing',

            title:
                '4. Procesamiento de pedidos',

            paragraphs: [
                'Los pedidos requerirán procesamiento y preparación antes de ser entregados a un transportista.',

                'Actualmente no se promete ningún plazo comercial específico de procesamiento.',

                'La política final describirá por separado el tiempo de procesamiento de Maxi Pawz y el tiempo de tránsito del transportista.',
            ],

            notice:
                'La creación de una etiqueta de envío no significa por sí sola que el transportista ya haya recibido el paquete.',
        },

        {
            id:
                'carriers',

            title:
                '5. Selección del transportista y servicio',

            paragraphs: [
                `${businessConfig.shortName} podrá seleccionar un transportista y servicio disponible que resulte apropiado al preparar un futuro pedido con envío estándar.`,

                'La selección del transportista podrá depender del tamaño y peso del paquete, el destino, la disponibilidad del servicio, las expectativas de entrega y el costo.',

                'El proceso inicial de preparación de pedidos podrá incluir la compra manual de etiquetas y el registro manual de la información de seguimiento.',
            ],
        },

        {
            id:
                'addresses',

            title:
                '6. Direcciones de envío y correcciones',

            paragraphs: [
                'Los futuros clientes serán responsables de revisar el nombre del destinatario, la dirección, información de apartamento o unidad, ciudad, estado y código postal antes de completar el proceso de pago.',

                `Después del lanzamiento, las preguntas relacionadas con direcciones o pedidos deberán enviarse lo antes posible a ${businessConfig.ordersEmail}.`,

                'No se garantizará una corrección de dirección después de que un pedido haya entrado en procesamiento, preparación o haya sido entregado al transportista.',
            ],
        },

        {
            id:
                'tracking',

            title:
                '7. Seguimiento',

            paragraphs: [
                'La información de seguimiento será proporcionada cuando esté disponible para el servicio utilizado para realizar el envío.',

                'La información de seguimiento puede necesitar tiempo para actualizarse después de crear una etiqueta de envío.',

                'Los escaneos del transportista, fechas estimadas de entrega, avisos de entrega, rutas y eventos finales de entrega son controlados por el transportista.',
            ],
        },

        {
            id:
                'shipping-problems',

            title:
                '8. Envíos retrasados, dañados, incompletos o faltantes',

            paragraphs: [
                `Las futuras preguntas sobre el estado de un pedido deberán enviarse a ${businessConfig.ordersEmail}.`,

                `Los reportes relacionados con envíos dañados, defectuosos, incorrectos, incompletos, faltantes o que presenten cualquier otro problema deberán enviarse a ${businessConfig.supportEmail}.`,

                'Es posible que se solicite a los clientes conservar el producto, accesorios, embalaje, contenedor de envío, etiqueta de envío, fotografías, información de seguimiento y documentación del pedido mientras se revisa el problema.',

                `${businessConfig.shortName} podrá necesitar revisar información del transportista, registros de entrega, fotografías, registros de inventario y otra documentación relevante antes de determinar una respuesta apropiada.`,
            ],
        },

        {
            id:
                'final-policy',

            title:
                '9. Información que incluirá la política final',

            paragraphs: [
                'Antes del lanzamiento comercial, esta página será actualizada con las reglas aprobadas de envío y preparación de pedidos.',
            ],

            bullets: [
                'Estados, regiones y tipos de direcciones elegibles.',
                'Expectativas de procesamiento y preparación de pedidos.',
                'Métodos de entrega disponibles o prácticas para seleccionar transportistas.',
                'Plazos estimados de tránsito del transportista.',
                'Cargos de envío y condiciones para envío gratuito.',
                'Peso máximo admitido para paquetes o pedidos.',
                'Disponibilidad de información de seguimiento.',
                'Procedimientos para correcciones de dirección y cancelaciones.',
                'Procedimientos para retrasos, paquetes perdidos, excepciones de entrega y envíos dañados.',
                'Cualquier restricción relacionada con productos o destinos.',
            ],
        },

        {
            id:
                'updates',

            title:
                '10. Actualizaciones de la política y contacto',

            paragraphs: [
                'Esta Política de envíos podrá actualizarse cuando cambien los destinos, tarifas, expectativas de procesamiento, transportistas, procedimientos de preparación de pedidos o requisitos aplicables.',

                `Las preguntas generales pueden enviarse mediante el formulario de contacto de ${businessConfig.shortName} o a ${businessConfig.generalEmail}.`,

                'Normalmente respondemos en un plazo de 1 a 2 días hábiles.',
            ],
        },
    ],

    relatedLinks: [
        {
            label:
                'Política de devoluciones y reembolsos',

            href:
                '/return-policy',

            description:
                'Consulta el estado actual de las devoluciones, reembolsos y cancelaciones.',
        },

        {
            label:
                'Correo de ayuda con pedidos',

            href:
                `mailto:${businessConfig.ordersEmail}`,

            description:
                `Envía una futura pregunta sobre pedidos o envíos a ${businessConfig.ordersEmail}.`,
        },

        {
            label:
                'Ayuda con problemas de productos',

            href:
                `mailto:${businessConfig.supportEmail}`,

            description:
                `Reporta un futuro producto dañado, incorrecto, incompleto o faltante a ${businessConfig.supportEmail}.`,
        },
    ],
} satisfies LegalDocument;