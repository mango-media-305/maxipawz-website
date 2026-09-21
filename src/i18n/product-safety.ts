import {
    beforeUseChecklist,
    productSafetyHeroPoints,
    productSafetySections,
    productSpecificChecklists,
    professionalGuidancePoints,
    type ProductSafetyChecklist,
    type SafetySection,
} from '../data/product-safety';

import type { Locale } from './languages';

interface ProductSafetyContent {
    heroPoints: readonly string[];
    beforeUseChecklist: readonly string[];
    sections: SafetySection[];
    productSpecificChecklists: ProductSafetyChecklist[];
    professionalGuidancePoints: readonly string[];
}

const spanishHeroPoints = [
    'Elige productos adecuados para cada mascota.',
    'Sigue el uso previsto y las instrucciones del producto.',
    'Inspecciona los productos antes y después de usarlos.',
] as const;

const spanishBeforeUseChecklist = [
    'Confirma que el producto siga ajustando correctamente.',
    'Busca piezas sueltas, agrietadas, afiladas, expuestas o dañadas.',
    'Revisa broches, costuras, anillas, cierres y accesorios.',
    'Retira embalajes, etiquetas y sujetadores temporales.',
    'Decide si la actividad requiere supervisión directa.',
] as const;

const spanishSections: SafetySection[] = [
    {
        id: 'choose-the-right-product',

        eyebrow: 'Paso uno',

        title: 'Elige pensando en cada mascota.',

        description:
            'El producto debe ser adecuado para el tamaño, la edad, el nivel de actividad, los hábitos, la comodidad física y la forma habitual en que la mascota interactúa con artículos similares.',

        icon: 'fit',
        tone: 'brand',

        points: [
            'Usa medidas reales cuando el producto incluya información de tallas.',
            'Revisa para qué animal, actividad, edad y tipo de uso está diseñado.',
            'Ten en cuenta la fuerza al morder, el estilo de juego y el nivel de actividad.',
            'Evita artículos demasiado pequeños o difíciles de usar con comodidad.',
            'Vuelve a revisar el ajuste después del crecimiento, cambios de peso, grooming o cambios importantes en el grosor del pelaje.',
        ],

        note:
            'Las tallas no son universales. Compara las medidas de tu mascota con la información específica de cada producto.',
    },

    {
        id: 'follow-the-instructions',

        eyebrow: 'Antes de usar',

        title: 'Lee las instrucciones y el uso previsto.',

        description:
            'Las descripciones, etiquetas, instrucciones de montaje, advertencias e indicaciones de cuidado contienen información importante sobre cómo debe utilizarse cada producto.',

        icon: 'instructions',
        tone: 'accent',

        points: [
            'Utiliza el producto solamente para el propósito indicado.',
            'Completa cualquier montaje necesario antes de entregárselo a la mascota.',
            'Confirma que las piezas ajustables, cierres y conexiones estén bien asegurados.',
            'Conserva las instrucciones y la información útil del producto para consultarlas más adelante.',
            'No modifiques un producto de una manera que pueda debilitar su estructura o cambiar su uso previsto.',
        ],
    },

    {
        id: 'introduce-gradually',

        eyebrow: 'Primera experiencia',

        title: 'Introduce los productos nuevos gradualmente.',

        description:
            'Un producto nuevo puede resultar desconocido para una mascota aunque parezca sencillo para nosotros. Una introducción tranquila permite observar cómo responde.',

        icon: 'introduction',
        tone: 'sand',

        points: [
            'Permite que la mascota observe e investigue el producto.',
            'Mantén la primera interacción breve y bien supervisada.',
            'Evita forzar una interacción inmediata con un objeto desconocido.',
            'Haz una pausa si la mascota muestra malestar continuo, miedo o rechazo.',
            'Aumenta el acceso gradualmente cuando la mascota utilice el producto de forma apropiada.',
        ],
    },

    {
        id: 'supervise-use',

        eyebrow: 'Durante el uso',

        title: 'Ofrece el nivel de supervisión que el producto requiere.',

        description:
            'El nivel adecuado de supervisión depende del producto, la actividad, el entorno y la manera en que cada mascota interactúa con él.',

        icon: 'supervision',
        tone: 'brand',

        points: [
            'Observa de cerca el primer uso.',
            'Supervisa juguetes con relleno, squeakers, cuerdas, accesorios o piezas desmontables.',
            'Guarda fuera de alcance los productos que requieren supervisión cuando termine la actividad.',
            'No asumas que el uso de un producto conocido siempre permanecerá igual.',
            'Separa a las mascotas cuando la competencia por un producto pueda generar conflictos.',
        ],

        note:
            'Algunos productos pueden ser apropiados solamente cuando una persona participa activamente o está observando.',
    },

    {
        id: 'inspect-and-replace',

        eyebrow: 'Cuidado continuo',

        title: 'Inspecciona regularmente y reemplaza cuando sea necesario.',

        description:
            'El desgaste puede cambiar un producto con el tiempo. Las inspecciones frecuentes ayudan a detectar daños, problemas de ajuste o estructuras debilitadas antes del siguiente uso.',

        icon: 'inspection',
        tone: 'accent',

        points: [
            'Revisa costuras, bordes, broches, hebillas, anillas, asas y accesorios.',
            'Busca grietas, perforaciones profundas, relleno expuesto, zonas deshilachadas o piezas faltantes.',
            'Deja de usar productos con cierres dañados o herrajes debilitados.',
            'Retira artículos que hayan quedado demasiado pequeños, incómodos o inadecuados.',
            'Reemplaza productos que ya no puedan limpiarse, asegurarse o utilizarse de la manera prevista.',
        ],

        note:
            'Ningún producto para mascotas debe considerarse automáticamente indestructible.',
    },

    {
        id: 'clean-dry-and-store',

        eyebrow: 'Después del uso',

        title: 'Limpia, seca y guarda los productos adecuadamente.',

        description:
            'La limpieza y el almacenamiento deben adaptarse al material, las instrucciones del producto, el entorno y la manera en que se utiliza.',

        icon: 'storage',
        tone: 'sand',

        points: [
            'Sigue las instrucciones de lavado y cuidado del producto.',
            'Deja secar completamente los productos mojados antes de guardarlos.',
            'Lava y seca los recipientes de comida y utensilios de alimentación después de usarlos.',
            'Lava los recipientes de agua regularmente y mantén limpios los productos utilizados para beber.',
            'Guarda productos, treats, alimentos, embalajes y piezas pequeñas sueltas en lugares seguros.',
        ],
    },
];

const spanishProductSpecificChecklists: ProductSafetyChecklist[] = [
    {
        id: 'toys-and-enrichment',

        title: 'Juguetes y enriquecimiento',

        description:
            'Ten en cuenta el tamaño, la construcción, el estilo de juego y la manera en que la mascota normalmente transporta, muerde, tira o resuelve una actividad.',

        icon: 'play',
        tone: 'accent',

        items: [
            'Elige un tamaño adecuado para la boca y el cuerpo de la mascota.',
            'Supervisa juguetes con relleno, squeakers, cuerdas o piezas desmontables.',
            'Retira juguetes con roturas, perforaciones, piezas sueltas o material expuesto.',
            'Guarda los productos interactivos cuando termine la actividad supervisada.',
        ],
    },

    {
        id: 'walking-products',

        title: 'Collares, arneses y correas',

        description:
            'Los productos que se llevan puestos o se utilizan durante los paseos deben ajustarse de forma segura sin impedir el movimiento cómodo ni la respiración normal.',

        icon: 'walk',
        tone: 'brand',

        items: [
            'Mide a la mascota y sigue la guía de tallas específica del producto.',
            'Revisa hebillas, broches, anillas, costuras y puntos de ajuste.',
            'Vuelve a comprobar el ajuste después del crecimiento, grooming o cambios de peso.',
            'Reemplaza equipos con correas, herrajes o cierres debilitados.',
        ],
    },

    {
        id: 'feeding-products',

        title: 'Alimentación e hidratación',

        description:
            'Los productos de comida y agua deben tener un tamaño adecuado, ser estables, fáciles de limpiar y mantenerse según las características de sus materiales.',

        icon: 'feeding',
        tone: 'sand',

        items: [
            'Lava y seca los recipientes de comida y utensilios después de usarlos.',
            'Lava los recipientes de agua regularmente y renueva el agua potable.',
            'Desecha artículos agrietados, astillados, muy rayados o difíciles de limpiar.',
            'Prueba las botellas y recipientes portátiles para detectar fugas antes de viajar.',
        ],
    },

    {
        id: 'travel-comfort-and-care',

        title: 'Viajes, comodidad y cuidado',

        description:
            'Introduce transportadoras, camas, productos de viaje, herramientas de grooming y artículos de cuidado antes de depender de ellos durante una actividad prolongada.',

        icon: 'care',
        tone: 'brand',

        items: [
            'Confirma que los productos de viaje y descanso ofrezcan espacio y ventilación adecuados.',
            'Revisa cremalleras, correas, asas, cierres, costuras y puntos de unión.',
            'Mantén breves las sesiones de grooming mientras introduces herramientas nuevas.',
            'Detén el uso si un artículo provoca dolor, lesiones, malestar continuo o limita el movimiento.',
        ],
    },
];

const spanishProfessionalGuidancePoints = [
    'Deja de usar un producto si provoca dolor, lesiones, malestar continuo o limita el movimiento.',
    'Contacta a un veterinario si existe la posibilidad de que la mascota haya ingerido parte de un producto.',
    'Busca ayuda de emergencia adecuada en casos de atragantamiento, dificultad para respirar, envenenamiento o lesiones graves.',
    'Consulta a un profesional calificado sobre necesidades específicas de salud, movilidad, alimentación o comportamiento de la mascota.',
] as const;

export function getProductSafetyContent(
    locale: Locale,
): ProductSafetyContent {
    if (locale === 'es') {
        return {
            heroPoints: spanishHeroPoints,

            beforeUseChecklist:
                spanishBeforeUseChecklist,

            sections:
                spanishSections,

            productSpecificChecklists:
                spanishProductSpecificChecklists,

            professionalGuidancePoints:
                spanishProfessionalGuidancePoints,
        };
    }

    return {
        heroPoints:
            productSafetyHeroPoints,

        beforeUseChecklist,

        sections:
            productSafetySections,

        productSpecificChecklists,

        professionalGuidancePoints,
    };
}