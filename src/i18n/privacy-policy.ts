import {
    businessConfig,
    businessDisplayName,
} from '../config/business';

import type {
    LegalDocument,
} from '../data/legal';

export const spanishPrivacyPolicy = {
    slug: 'privacy-policy',

    title:
        'Política de privacidad',

    shortTitle:
        'Privacidad',

    eyebrow:
        'Tu información',

    description:
        `Conoce qué información recopila actualmente ${businessConfig.shortName} a través del sitio web de pre-lanzamiento, Founding Pack, perfiles opcionales de mascotas, comunicaciones y medición del sitio web.`,

    introduction:
        `Esta Política de privacidad explica cómo ${businessDisplayName} maneja la información enviada a través de este sitio web de pre-lanzamiento, incluyendo el registro en Founding Pack y la experiencia opcional de perfil de mascota, así como la información procesada mientras operamos, protegemos, medimos y mejoramos el sitio web.`,

    icon: 'privacy',

    tone: 'brand',

    statusLabel:
        'Política de pre-lanzamiento',

    effectiveDate:
        '27 de julio de 2026',

    lastUpdated:
        '24 de agosto de 2026',

    sections: [
        {
            id:
                'scope',

            title:
                '1. Alcance y etapa actual del sitio web',

            paragraphs: [
                `Esta política se aplica al sitio web de ${businessConfig.publicName}, su experiencia de Founding Pack y lista de lanzamiento, la función opcional de perfil de mascota, el formulario de contacto, las páginas informativas, las Guías para mascotas y otras interacciones relacionadas con el sitio web.`,

                'La tienda se encuentra actualmente en etapa de pre-lanzamiento. El proceso de pago comercial está deshabilitado, no se ofrecen cuentas de clientes y el sitio web todavía no acepta pedidos reales de productos.',
            ],

            notice:
                'Esta política será revisada nuevamente antes de habilitar el proceso de pago comercial o funciones de datos de clientes que sean sustancialmente diferentes.',
        },

        {
            id:
                'information-you-provide',

            title:
                '2. Información que proporcionas',

            paragraphs: [
                'Recopilamos la información que decides enviar mediante formularios del sitio web, funciones opcionales de perfil o correo electrónico.',
            ],

            bullets: [
                'Información de registro en Founding Pack, como una dirección de correo electrónico, nombre opcional y la preferencia seleccionada para recibir comunicaciones de marketing por correo electrónico.',

                'Información opcional del perfil de mascota de Founding Pack, incluyendo el nombre de la mascota, tipo de mascota, selección de personalidad de juego y la categoría de productos que más te gustaría que Maxi Pawz lanzara primero.',

                'Información de contacto, como tu nombre y dirección de correo electrónico.',

                'El tema seleccionado y el contenido de un mensaje enviado mediante el formulario de contacto.',

                'Sugerencias de productos, comentarios sobre el sitio web, consultas de colaboración, reportes de accesibilidad u otra información que proporciones voluntariamente.',

                'Información enviada directamente a una dirección de correo electrónico de Maxi Pawz.',

                'Más adelante podrá recopilarse información relacionada con pedidos después de que las compras comerciales estén disponibles.',
            ],

            notice:
                'No envíes contraseñas, números completos de tarjetas de pago, números de Seguro Social, expedientes médicos u otra información altamente sensible mediante los formularios del sitio web, campos del perfil de mascota o correo electrónico ordinario.',
        },

        {
            id:
                'forms-and-notifications',

            title:
                '3. Formularios y notificaciones del sitio web',

            paragraphs: [
                'El formulario de contacto puede procesarse mediante Netlify Forms y la infraestructura relacionada de Netlify.',

                'El registro en Founding Pack se procesa mediante una función sin servidor de Maxi Pawz. Los registros de inscripción se almacenan utilizando Netlify Blobs y las preferencias de correo electrónico pueden sincronizarse con Resend cuando se selecciona recibir comunicaciones de marketing por correo electrónico.',

                'El perfil opcional de mascota de Founding Pack se almacena por separado utilizando Netlify Blobs. El registro del perfil de mascota se asocia con la inscripción existente mediante un hash unidireccional derivado de la dirección de correo electrónico normalizada, en lugar de almacenar otra copia en texto sin cifrar de la dirección de correo electrónico dentro del registro del perfil de mascota.',

                'Es posible completar la inscripción en Founding Pack sin crear un perfil de mascota. El paso del perfil de mascota es opcional y puede omitirse sin cancelar la inscripción.',

                `Las notificaciones relacionadas con el formulario de contacto pueden enviarse a ${businessConfig.generalEmail} para que los mensajes enviados puedan ser revisados.`,

                'Unirse a Founding Pack no crea una cuenta de cliente, no completa una compra ni garantiza que un producto, categoría, promoción o servicio específico vaya a estar disponible.',
            ],
        },

        {
            id:
                'technical-information',

            title:
                '4. Información técnica y operativa',

            paragraphs: [
                'Los sistemas de alojamiento, seguridad, entrega y diagnóstico del sitio web pueden procesar automáticamente información técnica necesaria para proporcionar y proteger el sitio web.',

                'Esto puede incluir una dirección de Protocolo de Internet, información del navegador o dispositivo, tiempos de las solicitudes, páginas de referencia, direcciones de páginas, información sobre errores y registros similares del servidor o de seguridad.',
            ],
        },

        {
            id:
                'how-information-is-used',

            title:
                '5. Cómo se utiliza la información',

            paragraphs: [
                'La información puede utilizarse para el propósito descrito en el momento de su recopilación y para actividades razonables relacionadas con la operación y preparación del sitio web y de la futura tienda.',
            ],

            bullets: [
                'Responder preguntas, sugerencias, reportes de accesibilidad y solicitudes de asistencia.',

                'Mantener Founding Pack y la lista de interés previa al lanzamiento.',

                'Preparar comunicaciones de lanzamiento para los visitantes que seleccionaron recibir marketing por correo electrónico.',

                'Comprender de manera general el interés de la comunidad en tipos de mascotas, preferencias de juego y posibles categorías de productos cuando los visitantes completan voluntariamente el perfil de mascota.',

                'Revisar sugerencias de productos e intereses de los clientes.',

                'Evaluar comentarios sobre el sitio web y problemas de usabilidad.',

                'Proteger el sitio web contra spam, uso indebido, fraude o amenazas de seguridad.',

                'Mantener registros comerciales y operativos apropiados.',

                'Preparar y mejorar la futura experiencia de compra de Maxi Pawz.',
            ],
        },

        {
            id:
                'service-providers',

            title:
                '6. Proveedores de servicios e intercambio de información',

            paragraphs: [
                'Podemos utilizar proveedores de servicios para alojar el sitio web, almacenar información enviada a través del sitio, enviar comunicaciones, medir la actividad del sitio web, protegerlo y apoyar futuras operaciones de comercio electrónico.',

                'La infraestructura actual del sitio web puede incluir Netlify para alojamiento, funciones sin servidor, procesamiento de formularios y almacenamiento de datos; Resend para servicios relacionados con correo electrónico y comunicaciones; Google Analytics 4 para analítica del sitio web; y Microsoft Clarity para medir la experiencia en el sitio web cuando estos servicios de analítica estén habilitados.',

                'Estos proveedores pueden procesar información únicamente cuando sea necesario para proporcionar sus servicios, mantener sus sistemas, aplicar sus términos, protegerse contra usos indebidos o cumplir con obligaciones aplicables.',

                'La información también podrá divulgarse cuando sea razonablemente necesario para responder a solicitudes legales válidas, proteger derechos o la seguridad, investigar usos indebidos, prevenir fraude o completar una reorganización o transferencia comercial.',
            ],

            notice:
                `${businessConfig.shortName} actualmente no vende información personal enviada a través de sus formularios del sitio web ni de la función opcional de perfil de mascota.`,
        },

        {
            id:
                'email-communications',

            title:
                '7. Comunicaciones por correo electrónico y novedades de lanzamiento',

            paragraphs: [
                `Los visitantes que se unan a Founding Pack de ${businessConfig.shortName} y seleccionen recibir marketing por correo electrónico podrán recibir información de lanzamiento, novedades de productos, actualizaciones de las Guías para mascotas o comunicaciones ocasionales de la tienda.`,

                'Unirse a Founding Pack y crear un perfil opcional de mascota son acciones independientes de la preferencia de marketing por correo electrónico. Un visitante puede completar su inscripción y rechazar los correos electrónicos promocionales.',

                'Las preferencias de marketing y las solicitudes para cancelar la suscripción se mantienen separadas de la información opcional del perfil de mascota.',

                `Las preguntas relacionadas con Founding Pack o las preferencias de correo electrónico pueden enviarse a ${businessConfig.generalEmail}.`,
            ],

            notice:
                'Los mensajes transaccionales sobre pedidos y envíos se manejarán por separado de los correos electrónicos promocionales después de que se habilite el proceso de pago comercial.',
        },

        {
            id:
                'analytics',

            title:
                '8. Analítica y medición de la experiencia del sitio web',

            paragraphs: [
                'Google Analytics 4 y Microsoft Clarity pueden utilizarse cuando los servicios de analítica estén habilitados en el sitio web de producción.',

                'Estos servicios pueden procesar información como páginas visitadas, área geográfica aproximada, información del dispositivo y navegador, fuentes de referencia, clics, desplazamiento, patrones de interacción e información general sobre el uso del sitio web.',

                'Estos servicios pueden utilizar cookies, almacenamiento local, identificadores o tecnologías similares de acuerdo con sus respectivas políticas y configuraciones.',

                `${businessConfig.shortName} puede registrar eventos generales del flujo de Founding Pack, como iniciar la inscripción, completarla correctamente, visualizar el paso opcional del perfil de mascota, completar dicho paso u omitirlo.`,

                'Los eventos de analítica de Founding Pack están diseñados para medir finalización y abandono sin enviar intencionalmente como parámetros personalizados de analítica la dirección de correo electrónico enviada, el nombre, el nombre de la mascota, tipo de mascota, personalidad de la mascota, respuesta sobre interés de lanzamiento u otros valores introducidos en los campos de los formularios.',
            ],

            bullets: [
                'Vistas de páginas y patrones de navegación.',

                'Información general del dispositivo, navegador y datos técnicos.',

                'Sitios web de referencia y fuentes de marketing.',

                'Información geográfica aproximada.',

                'Clics, desplazamiento y patrones de interacción con el sitio web.',

                'Eventos generales de finalización de formularios y flujos sin incluir intencionalmente los valores enviados mediante los campos de los formularios como parámetros personalizados de analítica.',
            ],

            notice:
                `${businessConfig.shortName} no envía intencionalmente nombres, direcciones de correo electrónico, respuestas del perfil de mascota, contenido de mensajes, información de pago u otros valores directamente identificables introducidos en formularios a los servicios de analítica como parámetros personalizados de eventos.`,
        },

        {
            id:
                'future-checkout',

            title:
                '9. Futuro proceso de pago y procesamiento de pagos',

            paragraphs: [
                `${businessConfig.shortName} planea utilizar Stripe para procesar pagos cuando se abra la tienda comercial.`,

                'La información de las tarjetas de pago se enviaría mediante la interfaz de pago de Stripe y sería procesada bajo las propias prácticas de privacidad y seguridad de Stripe.',

                'Antes de habilitar el proceso de pago comercial, esta política será revisada para incluir información sobre pedidos, procesamiento de pagos, impuestos, prevención de fraude, preparación de pedidos, envíos, atención al cliente, reembolsos y registros relacionados.',
            ],
        },

        {
            id:
                'retention-and-security',

            title:
                '10. Conservación y seguridad',

            paragraphs: [
                'Buscamos conservar la información personal y los registros opcionales de perfiles de mascotas únicamente durante el tiempo razonablemente necesario para el propósito por el cual fueron recopilados, para registros operativos legítimos, seguridad, prevención de disputas u obligaciones aplicables.',

                'Podrán utilizarse medidas administrativas y técnicas razonables para proteger la información. Ningún método de transmisión o almacenamiento electrónico puede garantizarse como completamente seguro.',
            ],
        },

        {
            id:
                'children',

            title:
                '11. Privacidad de los menores',

            paragraphs: [
                'El sitio web está destinado a adultos que compran productos para mascotas o buscan información sobre ellos. No está diseñado como un servicio dirigido a menores de 13 años.',

                'No solicitamos intencionalmente información personal directamente a menores de 13 años mediante los formularios del sitio web.',

                `Un padre, madre o tutor que considere que un menor ha enviado información personal puede contactar a ${businessConfig.privacyEmail} para solicitar su revisión o eliminación.`,
            ],
        },

        {
            id:
                'choices-and-requests',

            title:
                '12. Tus opciones y solicitudes de privacidad',

            paragraphs: [
                'Dependiendo de la legislación aplicable y de las circunstancias, puedes disponer de opciones relacionadas con el acceso, corrección, eliminación o uso de información personal.',

                'Una solicitud de privacidad también puede incluir información asociada con un perfil opcional de mascota de Founding Pack.',

                `Las solicitudes de privacidad pueden enviarse a ${businessConfig.privacyEmail} o mediante el formulario de contacto de ${businessConfig.shortName}.`,

                'Es posible que necesitemos información suficiente para comprender y verificar razonablemente una solicitud antes de tomar medidas.',
            ],
        },

        {
            id:
                'changes-and-contact',

            title:
                '13. Cambios e información de contacto',

            paragraphs: [
                'Esta Política de privacidad puede actualizarse cuando cambien las funciones del sitio web, los proveedores de servicios, las operaciones comerciales o los requisitos aplicables.',

                `Las preguntas y solicitudes relacionadas con privacidad deben enviarse a ${businessConfig.privacyEmail}.`,

                'Normalmente respondemos en un plazo de 1 a 2 días hábiles.',
            ],
        },
    ],

    relatedLinks: [
        {
            label:
                'Términos de uso',

            href:
                '/terms',

            description:
                `Consulta las reglas aplicables al utilizar el sitio web de ${businessConfig.shortName}.`,
        },

        {
            label:
                'Declaración de accesibilidad',

            href:
                '/accessibility',

            description:
                'Conoce nuestro enfoque relacionado con la accesibilidad del sitio web.',
        },

        {
            label:
                'Correo electrónico de privacidad',

            href:
                `mailto:${businessConfig.privacyEmail}`,

            description:
                `Envía una solicitud relacionada con privacidad a ${businessConfig.privacyEmail}.`,
        },
    ],
} satisfies LegalDocument;