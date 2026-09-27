import type { FaqGroup, FaqItem, FaqLink } from '../data/faq';
import { localizeHref, localizedLinkLabel } from './routes';

function link(label: string, href: string): FaqLink {
    return {
        label: localizedLinkLabel(label, href, 'es'),
        href: localizeHref(href, 'es'),
    };
}

const prelaunchItems: FaqItem[] = [
    {
        question: '¿Qué es Maxi Pawz?',
        answer: [
            'Maxi Pawz es una tienda para mascotas inspirada en Maxi, nuestro perro y compañero diario. Estamos creando un espacio cercano con productos para jugar, artículos prácticos y orientación útil para quienes cuidan de una mascota.',
            'La tienda se organiza alrededor de rutinas reales: juego, paseos, viajes, alimentación, hidratación, descanso, higiene y cuidado diario.',
        ],
        link: link('Conocer nuestra historia', '/about'),
    },
    {
        question: '¿Cuándo abrirá la tienda?',
        answer: [
            'Todavía no hemos anunciado una fecha de apertura. Estamos preparando la colección, la información de los productos, la experiencia de compra y el proceso de pago antes de abrir.',
            'Unirte a la comunidad de Maxi Pawz es la mejor forma de recibir novedades del lanzamiento.',
        ],
        link: link('Unirme a la comunidad', '/#join-the-pack'),
    },
    {
        question: '¿Qué productos ofrecerá Maxi Pawz?',
        answer: [
            'La colección prevista incluye Juego y enriquecimiento, Paseos y viajes, Alimentación e hidratación, Descanso y hogar, Higiene y cuidado, y Collares y accesorios.',
            'Publicaremos los productos específicos, precios, disponibilidad y detalles cuando estén listos.',
        ],
        link: link('Explorar la futura colección', '/shop#shop-categories'),
    },
    {
        question: '¿Maxi Pawz es solo para perros?',
        answer: [
            'Maxi Pawz nace de nuestra experiencia criando a Maxi, por lo que gran parte de la orientación actual se centra en perros.',
            'Las futuras páginas de productos indicarán el animal, tamaño, actividad y uso previstos cuando corresponda.',
        ],
    },
    {
        question: '¿Cómo puedo recibir novedades del lanzamiento?',
        answer: [
            'Utiliza el formulario para unirte a la comunidad en la página de inicio y recibir noticias del lanzamiento, futuros productos y nuevas guías para mascotas.',
            'Podrás cancelar la suscripción cuando ya no quieras recibir novedades.',
        ],
        link: link('Recibir novedades', '/#join-the-pack'),
    },
    {
        question: '¿Puedo sugerir un producto o una categoría?',
        answer: [
            'Sí. Agradecemos las sugerencias sobre productos útiles, rutinas, categorías y funciones.',
            'Una sugerencia no garantiza que incorporemos el producto, pero nos ayuda a conocer lo que buscan las personas que cuidan de mascotas.',
        ],
        link: link('Enviar una sugerencia', '/contact#contact-form'),
    },
];

const liveItems: FaqItem[] = [
    {
        question: '¿Qué es Maxi Pawz?',
        answer: [
            'Maxi Pawz es una tienda para mascotas inspirada en Maxi, nuestro perro y compañero diario.',
            'Organizamos los productos alrededor de actividades cotidianas: juego, paseos, viajes, alimentación, hidratación, descanso, higiene, cuidado y estilo.',
        ],
        link: link('Conocer nuestra historia', '/about'),
    },
    {
        question: '¿Cómo está organizada la tienda?',
        answer: [
            'La tienda tiene seis categorías: Juego y enriquecimiento, Paseos y viajes, Alimentación e hidratación, Descanso y hogar, Higiene y cuidado, y Collares y accesorios.',
            'Esta organización permite comenzar por la actividad o rutina que quieres acompañar.',
        ],
        link: link('Explorar la tienda', '/shop'),
    },
    {
        question: '¿Maxi Pawz es solo para perros?',
        answer: [
            'Maxi Pawz se inspira en nuestra experiencia con Maxi, por lo que muchos productos y guías pueden centrarse en perros.',
            'Antes de comprar, revisa la descripción, el tamaño, el animal al que se dirige el producto, las instrucciones y las advertencias.',
        ],
    },
    {
        question: '¿Puedo sugerir un producto o una categoría?',
        answer: [
            'Sí. Puedes enviar sugerencias de productos y comentarios sobre la colección mediante nuestro formulario de contacto.',
            'Las sugerencias nos ayudan a entender las necesidades y los intereses de la comunidad de Maxi Pawz.',
        ],
        link: link('Enviar una sugerencia', '/contact#contact-form'),
    },
];

const productItems: FaqItem[] = [
    {
        question: '¿Cómo elijo un producto para mi mascota?',
        answer: [
            'Comienza por su tamaño, edad, nivel de actividad, hábitos, comodidad y el propósito que debe cumplir el producto.',
            'Considera dónde se utilizará, cómo suele interactuar tu mascota con artículos similares y si necesitará supervisión.',
        ],
        link: link('Leer la guía para elegir productos', '/pet-guides/choosing-the-right-product'),
    },
    {
        question: '¿Qué son las guías para mascotas de Maxi Pawz?',
        answer: [
            'Son recursos educativos para ayudar a quienes cuidan de mascotas a valorar productos y rutinas cotidianas.',
            'Incluyen temas como juego, viajes, alimentación, hidratación, descanso, higiene, cuidados, tamaños y accesorios.',
        ],
        link: link('Explorar las guías', '/pet-guides'),
    },
    {
        question: '¿Las guías sustituyen el consejo veterinario?',
        answer: [
            'No. Las guías de Maxi Pawz ofrecen únicamente información educativa general.',
            'No sustituyen el diagnóstico, tratamiento, orientación nutricional, atención del comportamiento, servicios de emergencia ni asesoramiento profesional individualizado.',
        ],
    },
    {
        question: '¿Debo suponer que un juguete es indestructible?',
        answer: [
            'No debe considerarse automáticamente indestructible ningún juguete ni accesorio para mascotas.',
            'Revisa los productos con regularidad y retira los que tengan piezas sueltas, grietas, bordes afilados, componentes expuestos, desgaste importante, un tamaño inadecuado o cualquier condición que impida seguir utilizándolos.',
        ],
    },
    {
        question: '¿Con qué frecuencia debo revisar los productos?',
        answer: [
            'La frecuencia depende del producto y de su uso. Los artículos de uso frecuente y los que se utilizan durante juegos activos pueden necesitar mayor atención.',
            'Revisa las costuras, bordes, clips, hebillas, anillas, cierres, uniones, relleno y ajuste cuando corresponda.',
        ],
    },
    {
        question: '¿Dónde puedo hacer una pregunta sobre un producto?',
        answer: [
            'Utiliza el formulario de contacto y selecciona el tema de consultas sobre productos, identificado como «Product question» en el formulario en inglés.',
            'Incluye la categoría, el uso previsto, las medidas pertinentes, la característica o la rutina relacionada con tu pregunta.',
        ],
        link: link('Preguntar sobre un producto', '/contact#contact-form'),
    },
];

const orderItems: FaqItem[] = [
    {
        question: '¿Qué métodos de pago se aceptan?',
        answer: [
            'Los métodos disponibles para tu compra aparecerán durante el proceso de pago seguro.',
            'Las opciones pueden depender de la configuración del pago, el dispositivo, el navegador o la ubicación del cliente.',
        ],
    },
    {
        question: '¿Cómo puedo seguir mi pedido?',
        answer: [
            'Revisa los mensajes de confirmación y de envío relacionados con tu compra.',
            'La información de seguimiento aparecerá allí cuando esté disponible para el pedido.',
        ],
        link: link('Contactar con soporte de pedidos', '/contact#contact-form'),
    },
    {
        question: '¿Cómo se calculan los gastos de envío?',
        answer: [
            'Los gastos de envío aplicables deben aparecer antes de completar la compra.',
            'El importe puede depender del pedido, el destino y el método de entrega disponible. Revisa el resumen completo antes de aprobar el pago.',
        ],
    },
    {
        question: '¿Cómo funcionan las devoluciones?',
        answer: [
            'La posibilidad de devolver un artículo depende de las condiciones aplicables, el producto, su estado y las circunstancias de la solicitud.',
            'Utiliza el formulario de contacto e incluye el número de pedido y una descripción clara. No envíes el artículo de vuelta hasta recibir instrucciones.',
        ],
        link: link('Solicitar una devolución', '/contact#contact-form'),
    },
    {
        question: '¿Qué hago si un artículo llega dañado?',
        answer: [
            'Deja de utilizar el producto si el daño puede hacerlo inadecuado o inseguro.',
            'Conserva el producto, el embalaje y los datos del pedido mientras se revisa el caso. Contacta con Maxi Pawz e incluye el número de pedido y una descripción del daño.',
        ],
        link: link('Informar de un problema con un pedido', '/contact#contact-form'),
    },
    {
        question: '¿Puedo modificar o cancelar un pedido?',
        answer: [
            'Envía tu solicitud lo antes posible e incluye el número de pedido.',
            'No podemos garantizar cambios ni cancelaciones una vez iniciado el procesamiento o la preparación del pedido.',
        ],
        link: link('Contactar con soporte de pedidos', '/contact#contact-form'),
    },
];

const helpItems: FaqItem[] = [
    {
        question: '¿Cómo puedo contactar con Maxi Pawz?',
        answer: [
            'Utiliza el formulario de contacto y selecciona el tema que mejor corresponda a tu mensaje.',
            'Incluye detalles útiles como la categoría de producto, página, función, número de pedido o rutina de tu mascota.',
        ],
        link: link('Abrir el formulario de contacto', '/contact#contact-form'),
    },
    {
        question: '¿Puedo informar de un problema del sitio o de accesibilidad?',
        answer: [
            'Sí. Selecciona «Website feedback» en el formulario en inglés y describe la página, función, dispositivo o dificultad de accesibilidad.',
            'Incluye la dirección de la página y explica qué ocurrió para ayudarnos a entender el problema.',
        ],
        link: link('Enviar comentarios sobre el sitio', '/contact#contact-form'),
    },
    {
        question: '¿Cómo puedo proponer una colaboración?',
        answer: [
            'Elige «Partnership or collaboration» en el formulario en inglés y explica brevemente la organización, creador, proyecto, audiencia u oportunidad.',
            'No envíes información confidencial en el formulario de contacto inicial.',
        ],
        link: link('Proponer una colaboración', '/contact#contact-form'),
    },
    {
        question: '¿Puede Maxi Pawz ayudar en una emergencia con mi mascota?',
        answer: [
            'No. El sitio, el formulario, la tienda y las guías no son servicios de emergencia.',
            'Ante una urgencia médica, intoxicación, lesión o problema de comportamiento o seguridad, contacta con un veterinario, clínica de urgencias, servicio de toxicología o proveedor local de emergencias adecuado.',
        ],
    },
];

export function getSpanishFaqGroups(isStoreLive: boolean): FaqGroup[] {
    const groups: FaqGroup[] = [
        {
            id: 'about-maxipawz',
            eyebrow: isStoreLive ? 'La tienda' : 'Próximamente',
            title: isStoreLive
                ? 'Sobre Maxi Pawz y la tienda'
                : 'Sobre Maxi Pawz y la futura tienda',
            description: isStoreLive
                ? 'Conoce la marca, la colección y la experiencia de compra.'
                : 'Descubre qué estamos preparando y cómo recibir novedades del lanzamiento.',
            icon: 'storefront',
            tone: 'brand',
            items: isStoreLive ? liveItems : prelaunchItems,
        },
        {
            id: 'products-and-guides',
            eyebrow: 'Orientación útil',
            title: 'Productos y guías para mascotas',
            description:
                'Respuestas sobre cómo elegir, utilizar y revisar productos para mascotas.',
            icon: 'products',
            tone: 'accent',
            items: productItems,
        },
    ];

    if (isStoreLive) {
        groups.push({
            id: 'orders-and-returns',
            eyebrow: 'Atención al cliente',
            title: 'Pedidos, envíos y devoluciones',
            description: 'Información general sobre compras y ayuda con pedidos.',
            icon: 'orders',
            tone: 'sand',
            items: orderItems,
        });
    }

    groups.push({
        id: 'contact-and-help',
        eyebrow: 'Hablemos',
        title: 'Contacto y ayuda adicional',
        description:
            'Encuentra dónde enviar preguntas, comentarios, propuestas y problemas del sitio.',
        icon: 'help',
        tone: 'brand',
        items: helpItems,
    });

    return groups;
}