import type {
    Locale,
} from './languages';

import {
    getLocalizedVariantLabel,
} from './commerce';

import type {
    Product,
    ProductImage,
} from '../types/product';

interface ProductTranslation {
    name:
    string;

    shortDescription:
    string;

    description:
    string[];

    tags:
    string[];

    searchKeywords:
    string[];

    materials?:
    string[];

    careInstructions?:
    string[];

    safetyNotes?:
    string[];

    imageAlts?:
    string[];

    seoTitle?:
    string;

    seoDescription?:
    string;
}

const spanishProductTranslations:
    Record<
        string,
        ProductTranslation
    > = {
    'tug-and-fetch-rope-ball': {
        name:
            'Pelota de cuerda Tug & Fetch',

        shortDescription:
            'Un juguete ficticio de cuerda y pelota creado para probar tarjetas de productos, precios promocionales y filtros de juguetes para perros.',

        description: [
            'Este producto ficticio de demostración representa un juguete versátil pensado para juegos supervisados de buscar y tirar.',

            'Se incluye únicamente para mostrar cómo aparecerán las descripciones, materiales, instrucciones de cuidado, precios e información de seguridad en el catálogo de Maxi Pawz.',
        ],

        tags: [
            'Buscar',
            'Juego interactivo',
            'Uso supervisado',
        ],

        searchKeywords: [
            'pelota',
            'cuerda',
            'tirar',
            'juguete para buscar',
            'juego para perros',
        ],

        materials: [
            'Cuerda de algodón de demostración',
            'Pelota de goma de demostración',
        ],

        careInstructions: [
            'Limpia las áreas necesarias con jabón suave y agua.',
            'Deja que el producto se seque completamente antes de guardarlo.',
            'Revisa la cuerda y la pelota antes y después de cada sesión de juego.',
        ],

        safetyNotes: [
            'Producto ficticio de prueba; actualmente no está disponible para compra.',
            'Pensado para juegos interactivos bajo supervisión.',
            'Retira el producto si se daña o desarrolla piezas sueltas.',
        ],

        imageAlts: [
            'Perro jugando con una pelota azul y blanca, utilizada como imagen de producto de demostración',
        ],
    },

    'whisker-feather-wand': {
        name:
            'Varita de plumas Whisker',

        shortDescription:
            'Una varita de plumas ficticia para probar búsquedas de productos para gatos y filtros de catálogo para diferentes mascotas.',

        description: [
            'Esta varita de demostración representa un juguete interactivo para gatos diseñado para actividades supervisadas de persecución y salto.',

            'El producto es ficticio y existe para demostrar filtros específicos para gatos y diseños de páginas de detalles de productos.',
        ],

        tags: [
            'Persecución',
            'Enriquecimiento para gatos',
            'Interactivo',
        ],

        searchKeywords: [
            'varita para gatos',
            'plumas',
            'juguete para gatitos',
            'juguete de persecución',
            'juego para gatos',
        ],

        materials: [
            'Varita flexible de demostración',
            'Accesorio de plumas de demostración',
            'Cordón tejido de demostración',
        ],

        careInstructions: [
            'Limpia la varita con un paño seco o ligeramente húmedo.',
            'Guarda la varita fuera del alcance de la mascota entre sesiones de juego.',
        ],

        safetyNotes: [
            'Producto ficticio de prueba; actualmente no está disponible para compra.',
            'Utiliza el producto únicamente bajo supervisión activa.',
            'No permitas que la mascota mastique o ingiera el accesorio o el cordón.',
        ],

        imageAlts: [
            'Gato jugando con una varita de plumas, utilizada como imagen de producto de demostración',
        ],
    },

    'adventure-fit-harness': {
        name:
            'Arnés Adventure Fit',

        shortDescription:
            'Un arnés ajustable ficticio utilizado para probar variantes, tallas, productos destacados y filtros para paseos.',

        description: [
            'Este producto de demostración representa un arnés ajustable para paseos diseñado para salidas cotidianas.',

            'Sus tallas, especificaciones, precios y materiales son datos ficticios utilizados para probar la tienda.',
        ],

        tags: [
            'Paseos',
            'Ajustable',
            'Salidas cotidianas',
        ],

        searchKeywords: [
            'arnés',
            'paseo de perros',
            'equipo de viaje',
            'arnés ajustable',
        ],

        materials: [
            'Poliéster tejido de demostración',
            'Malla transpirable de demostración',
            'Anillo metálico de sujeción de demostración',
        ],

        careInstructions: [
            'Lava a mano con jabón suave y agua fría.',
            'Deja secar completamente al aire antes del siguiente uso.',
            'Revisa regularmente los puntos de ajuste y los herrajes de sujeción.',
        ],

        safetyNotes: [
            'Producto ficticio de prueba; actualmente no está disponible para compra.',
            'Confirma el ajuste utilizando las medidas específicas del producto.',
            'Revisa el arnés y sus herrajes antes de cada paseo.',
        ],

        imageAlts: [
            'Perro al aire libre, utilizado como imagen principal del arnés ficticio Adventure Fit',
            'Perro usando el arnés Adventure Fit durante un paseo al aire libre',
            'Vista de cerca de la construcción y los herrajes del arnés Adventure Fit',
            'Vista lateral que muestra la forma y cobertura del arnés Adventure Fit',
            'Arnés Adventure Fit colocado en un perro para mostrar su ajuste general',
        ],
    },

    'trail-loop-leash': {
        name:
            'Correa Trail Loop',

        shortDescription:
            'Una correa ficticia para uso diario creada para probar estados de próximamente y búsquedas de productos para paseos.',

        description: [
            'Esta correa de demostración representa un accesorio ligero para paseos con un asa acolchada.',

            'El producto es ficticio y su información existe únicamente para probar la tienda.',
        ],

        tags: [
            'Correa',
            'Viajes',
            'Paseos',
        ],

        searchKeywords: [
            'correa para perros',
            'correa',
            'accesorio para paseos',
            'viajes',
        ],

        materials: [
            'Nailon tejido de demostración',
            'Mosquetón de aleación de zinc de demostración',
            'Asa acolchada de demostración',
        ],

        careInstructions: [
            'Limpia la correa después de usarla al aire libre.',
            'Deja que una correa mojada se seque completamente antes de guardarla.',
        ],

        safetyNotes: [
            'Producto ficticio de prueba; actualmente no está disponible para compra.',
            'Revisa la correa, el mosquetón, el asa y las costuras antes de cada paseo.',
        ],

        imageAlts: [
            'Cachorro marrón al aire libre, utilizado como imagen de estilo de vida para una correa ficticia',
        ],
    },

    'duo-ceramic-bowl-set': {
        name:
            'Set Duo de tazones de cerámica',

        shortDescription:
            'Un set ficticio de dos tazones utilizado para probar filtros compartidos para perros y gatos y precios promocionales.',

        description: [
            'Este set ficticio de demostración representa dos tazones de cerámica para comida y agua.',

            'Se incluye para demostrar especificaciones de productos, filtros para diferentes tipos de mascotas y precios promocionales.',
        ],

        tags: [
            'Alimentación',
            'Hidratación',
            'Cerámica',
        ],

        searchKeywords: [
            'tazón para mascotas',
            'tazón de agua',
            'plato de comida',
            'set de alimentación',
        ],

        materials: [
            'Cerámica esmaltada de demostración',
            'Base de silicona de demostración',
        ],

        careInstructions: [
            'Lava y seca los tazones de comida después de usarlos.',
            'Lava regularmente los tazones de agua.',
            'Deja de utilizar el producto si la cerámica se agrieta o se astilla.',
        ],

        safetyNotes: [
            'Producto ficticio de prueba; actualmente no está disponible para compra.',
            'Coloca los tazones sobre una superficie estable y nivelada.',
        ],

        imageAlts: [
            'Tazón azul para mascotas, utilizado como imagen de producto de demostración',
        ],
    },

    'slow-moment-feeding-bowl': {
        name:
            'Tazón Slow-Moment para alimentación',

        shortDescription:
            'Un tazón de alimentación ficticio utilizado para probar productos agotados y filtros de precios.',

        description: [
            'Este producto de demostración representa un tazón de alimentación con textura pensado para hacer que la hora de comer sea más interactiva.',

            'No se realizan afirmaciones nutricionales, de comportamiento ni de salud porque se trata de contenido ficticio utilizado para pruebas.',
        ],

        tags: [
            'Hora de comer',
            'Alimentación',
            'Rutina diaria',
        ],

        searchKeywords: [
            'comedero lento',
            'tazón para perros',
            'tazón de comida',
            'accesorio de alimentación',
        ],

        materials: [
            'Polímero apto para alimentos de demostración',
            'Base antideslizante de demostración',
        ],

        careInstructions: [
            'Lava y seca el producto después de cada comida.',
            'Revisa la superficie para detectar rayones profundos o grietas.',
        ],

        safetyNotes: [
            'Producto ficticio de prueba; actualmente no está disponible para compra.',
            'Selecciona un tamaño de tazón adecuado para cada mascota.',
        ],

        imageAlts: [
            'Perro comiendo de un tazón, utilizado como imagen de producto de demostración',
        ],
    },

    'cloud-nest-pet-bed': {
        name:
            'Cama para mascotas Cloud Nest',

        shortDescription:
            'Una cama acolchada ficticia utilizada para probar precios premium, variantes y filtros para perros y gatos.',

        description: [
            'Este producto ficticio de demostración representa una cama acolchada para descansar con una cubierta exterior removible.',

            'Se incluye para demostrar precios de productos grandes, opciones de variantes y páginas de la categoría de comodidad.',
        ],

        tags: [
            'Descanso',
            'Comodidad',
            'Hogar',
        ],

        searchKeywords: [
            'cama para mascotas',
            'cama para perros',
            'cama para gatos',
            'cojín',
            'dormir',
        ],

        materials: [
            'Cubierta de poliéster de demostración',
            'Relleno de fibra de demostración',
        ],

        careInstructions: [
            'Sigue las instrucciones de cuidado de la etiqueta de la cubierta removible.',
            'Deja que todos los componentes se sequen completamente.',
            'Aspira o retira regularmente el pelo suelto de la mascota.',
        ],

        safetyNotes: [
            'Producto ficticio de prueba; actualmente no está disponible para compra.',
            'Retira la cama si el relleno o algún material interno dañado queda expuesto.',
        ],

        imageAlts: [
            'Perro descansando en una cama para mascotas, utilizada como imagen de producto de demostración',
        ],
    },

    'cozy-basket-lounger': {
        name:
            'Cama tipo cesta Cozy',

        shortDescription:
            'Una cama compacta ficticia utilizada para probar filtros de mascotas pequeñas y estados de próximamente.',

        description: [
            'Este producto ficticio de demostración representa una pequeña cama acolchada para espacios tranquilos de descanso en interiores.',

            'El producto existe para probar tarjetas responsivas y filtros del catálogo para mascotas pequeñas.',
        ],

        tags: [
            'Acogedor',
            'Interior',
            'Compacto',
        ],

        searchKeywords: [
            'cama tipo cesta',
            'cama para gatos',
            'cama para mascotas pequeñas',
            'comodidad interior',
        ],

        materials: [
            'Exterior tejido de demostración',
            'Cojín removible de demostración',
        ],

        careInstructions: [
            'Limpia las áreas necesarias del exterior.',
            'Limpia el cojín removible siguiendo las instrucciones de su etiqueta.',
        ],

        safetyNotes: [
            'Producto ficticio de prueba; actualmente no está disponible para compra.',
            'Confirma que el espacio de descanso tenga un tamaño adecuado para la mascota.',
        ],

        imageAlts: [
            'Mascota descansando en una cama, utilizada como imagen de producto de demostración',
        ],
    },

    'everyday-slicker-brush': {
        name:
            'Cepillo slicker Everyday',

        shortDescription:
            'Un cepillo de aseo ficticio creado para probar búsquedas de productos de cuidado y filtros compartidos entre mascotas.',

        description: [
            'Este producto ficticio representa un cepillo manual para el cuidado rutinario del pelaje.',

            'No ofrece consejos veterinarios ni tratamientos para la piel o el pelaje y existe únicamente para probar la interfaz.',
        ],

        tags: [
            'Aseo',
            'Cuidado del pelaje',
            'Rutina',
        ],

        searchKeywords: [
            'cepillo',
            'herramienta de aseo',
            'cuidado del pelaje',
            'pelo de mascotas',
        ],

        materials: [
            'Mango de polímero de demostración',
            'Púas de acero inoxidable de demostración',
        ],

        careInstructions: [
            'Retira el pelo acumulado después de cada sesión de aseo.',
            'Limpia el cepillo y deja que se seque.',
        ],

        safetyNotes: [
            'Producto ficticio de prueba; actualmente no está disponible para compra.',
            'Utiliza una presión suave y detente si la mascota muestra dolor o molestias persistentes.',
        ],

        imageAlts: [
            'Perro descansando sobre un sofá, utilizado como imagen de estilo de vida para un cepillo de aseo ficticio',
        ],
    },

    'paw-rinse-cleaning-cup': {
        name:
            'Vaso limpiador Paw Rinse',

        shortDescription:
            'Un accesorio ficticio para limpiar patas utilizado para probar inventario no disponible y filtros de aseo.',

        description: [
            'Este producto de demostración representa un vaso portátil para enjuagar las patas después de actividades al aire libre.',

            'Las dimensiones, materiales y características de rendimiento son datos ficticios.',
        ],

        tags: [
            'Cuidado de patas',
            'Viajes',
            'Limpieza',
        ],

        searchKeywords: [
            'limpiador de patas',
            'vaso de enjuague',
            'barro',
            'aseo para perros',
            'cuidado al aire libre',
        ],

        materials: [
            'Inserto de silicona de demostración',
            'Vaso de polímero de demostración',
        ],

        careInstructions: [
            'Enjuaga el vaso después de usarlo.',
            'Retira y seca el inserto interior antes de guardarlo.',
        ],

        safetyNotes: [
            'Producto ficticio de prueba; actualmente no está disponible para compra.',
            'No lo utilices sobre patas lesionadas, doloridas o irritadas sin orientación profesional.',
        ],

        imageAlts: [
            'Cachorro marrón al aire libre, utilizado como imagen de estilo de vida para un limpiador de patas ficticio',
        ],
    },

    'classic-everyday-collar': {
        name:
            'Collar Classic Everyday',

        shortDescription:
            'Un collar ajustable ficticio utilizado para probar tallas de productos portables y filtros de accesorios.',

        description: [
            'Este producto ficticio de demostración representa un collar ajustable para perros de uso cotidiano.',

            'El producto existe para demostrar variantes de talla, recomendaciones de cuidado e información sobre productos portables.',
        ],

        tags: [
            'Collar',
            'Ajustable',
            'Estilo cotidiano',
        ],

        searchKeywords: [
            'collar para perros',
            'accesorio portable',
            'accesorio para paseos',
            'collar ajustable',
        ],

        materials: [
            'Nailon tejido de demostración',
            'Anillo metálico de demostración',
            'Hebilla de polímero de demostración',
        ],

        careInstructions: [
            'Lava a mano con jabón suave.',
            'Deja que se seque completamente antes de volver a colocarlo en la mascota.',
        ],

        safetyNotes: [
            'Producto ficticio de prueba; actualmente no está disponible para compra.',
            'Mide a la mascota y confirma regularmente que el ajuste sea adecuado.',
            'Revisa la hebilla, el anillo, los puntos de ajuste y las costuras.',
        ],

        imageAlts: [
            'Perro usando un accesorio al aire libre, utilizado como imagen de demostración de un collar',
        ],
    },

    'paw-charm-pet-collar': {
        name:
            'Collar para mascotas Paw Charm',

        shortDescription:
            'Un collar decorativo ficticio creado para probar búsquedas para gatos y accesorios con estado de próximamente.',

        description: [
            'Este producto ficticio de demostración representa un collar ligero para mascotas con un adorno decorativo en forma de pata.',

            'No se afirma que la imagen provisional muestre exactamente el producto ficticio.',
        ],

        tags: [
            'Collar',
            'Adorno de pata',
            'Estilo para mascotas',
        ],

        searchKeywords: [
            'collar para gatos',
            'adorno de pata',
            'accesorio portable',
            'collar para mascotas',
        ],

        materials: [
            'Tela tejida de demostración',
            'Adorno metálico de demostración',
            'Cierre de demostración',
        ],

        careInstructions: [
            'Limpia con un paño ligeramente húmedo.',
            'Deja secar completamente antes de volver a utilizarlo.',
        ],

        safetyNotes: [
            'Producto ficticio de prueba; actualmente no está disponible para compra.',
            'Confirma que el diseño y el ajuste del collar sean adecuados para cada mascota.',
        ],

        imageAlts: [
            'Retrato de un gato, utilizado como imagen de estilo de vida para un collar ficticio para mascotas',
        ],
    },
};

export function getLocalizedProduct(
    product:
        Product,

    locale:
        Locale = 'en',
): Product {
    if (
        locale ===
        'en'
    ) {
        return product;
    }

    const translation =
        spanishProductTranslations[
        product.slug
        ];

    if (
        !translation
    ) {
        return {
            ...product,

            variants:
                product.variants?.map(
                    (
                        variant,
                    ) => ({
                        ...variant,

                        label:
                            getLocalizedVariantLabel(
                                variant.label,
                                locale,
                            ),
                    }),
                ),
        };
    }

    const {
        imageAlts,
        ...presentation
    } =
        translation;

    const images:
        ProductImage[] =
        product.images.map(
            (
                image,
                index,
            ) => ({
                ...image,

                alt:
                    imageAlts?.[
                    index
                    ] ??
                    image.alt,
            }) as ProductImage,
        );

    return {
        ...product,

        ...presentation,

        images,

        variants:
            product.variants?.map(
                (
                    variant,
                ) => ({
                    ...variant,

                    label:
                        getLocalizedVariantLabel(
                            variant.label,
                            locale,
                        ),
                }),
            ),
    };
}