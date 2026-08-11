import type Anthropic from "@anthropic-ai/sdk";

/**
 * AUDITORÍA DE MARCA POR IMAGEN
 *
 * Qué se revisa de cada foto de la biblioteca antes de dejar que la herramienta
 * la use como fondo de una pieza.
 *
 * Lo importante: los criterios de abajo dicen QUÉ mirar, pero contra qué se
 * juzga sale del brand kit vivo (`SEED.brand`) y de las notas regulatorias de
 * las zonas. Si el equipo de Six cambia la paleta o añade una restricción, la
 * siguiente auditoría cambia sola. No hay una lista de reglas escondida aquí.
 */
export type Verdict = "ok" | "aviso" | "bloqueo";

export type Check = {
  id: string;
  label: string;
  /** Qué se le pide mirar al modelo. Va literal dentro del prompt. */
  question: string;
  /** Por qué le importa a esta marca. Se enseña en la interfaz. */
  why: string;
};

export const CHECKS: Check[] = [
  {
    id: "marca-ajena",
    label: "Sin marca ajena",
    question:
      "¿Aparece algún logo, envase, letrero, uniforme o elemento gráfico de una marca que NO sea Six? Mira con lupa el interior de neveras, estanterías, latas, botellas, cajas y rótulos del fondo. Presta atención especial a la estrella roja de Cuauhtémoc Moctezuma y a cualquier marca de cerveza o refresco. Si un envase es reconocible aunque esté desenfocado, cuenta.",
    why: "El cliente pidió quitar cualquier rastro de la marca original. Un envase reconocible al fondo de una nevera basta para tumbar una pieza.",
  },
  {
    id: "conducta",
    label: "Código de conducta",
    question:
      "Contrasta la escena con los «qué no hacer» de la marca y con las notas regulatorias listadas arriba. ¿Se ve a alguien que aparente menos de 25 años, consumo excesivo de alcohol, o alcohol cerca de un coche, unas llaves o un volante?",
    why: "Sale de los «qué no hacer» del brand kit y de las notas regulatorias de cada zona. La publicidad de alcohol en México no admite menores ni asociación con conducir.",
  },
  {
    id: "zona-limpia",
    label: "Zona limpia para el logo",
    question:
      "¿Hay una zona con fondo lo bastante uniforme y de contraste suficiente para colocar encima el logo Six y un titular sin que se pierdan? Di en qué parte del encuadre está.",
    why: "La herramienta compone logo y titular sobre la foto. Sin zona limpia, la pieza sale ilegible por muy bueno que sea el copy.",
  },
  {
    id: "paleta",
    label: "Convive con la paleta",
    question:
      "¿Los colores dominantes de la foto dejan respirar el rojo de marca, o compiten con él? Un fondo con mucho rojo saturado propio hace que el logo desaparezca.",
    why: "El rojo #E1211D es el activo más reconocible de Six. Sobre un fondo igual de rojo, deja de serlo.",
  },
  {
    id: "calidad",
    label: "Calidad de imagen",
    question:
      "¿Está enfocada, bien expuesta y sin artefactos, manos o caras deformadas, ni texto ilegible o inventado?",
    why: "Descarta material que no aguanta una ampliación a valla o a pantalla completa.",
  },
];

export const CHECK_IDS = CHECKS.map((c) => c.id);

export const SAFE_AREAS = [
  "superior-izquierda",
  "superior-centro",
  "superior-derecha",
  "centro",
  "inferior-izquierda",
  "inferior-centro",
  "inferior-derecha",
  "ninguna",
] as const;

export type SafeArea = (typeof SAFE_AREAS)[number];

export type ImageAudit = {
  /** Ruta bajo /public, tal cual aparece en la biblioteca de fondos. */
  src: string;
  backgroundId: string;
  label: string;
  /** Formatos que usan este archivo. El recorte cambia dónde cabe el logo. */
  formats: string[];
  checks: { id: string; verdict: Verdict; finding: string }[];
  dominantColors: string[];
  safeArea: SafeArea;
  summary: string;
  auditedAt: string;
  usage: { input: number; output: number };
};

export type AuditReport = {
  /** Instantánea de contra qué se auditó, para que un informe viejo no mienta. */
  against: {
    brandName: string;
    palette: string[];
    dont: string[];
    regulatory: string[];
  };
  images: ImageAudit[];
};

export const AUDIT_TOOL: Anthropic.Tool = {
  name: "reportar_auditoria",
  description:
    "Reporta el resultado de auditar una imagen contra el brand kit. Devuelve un veredicto por cada criterio recibido.",
  input_schema: {
    type: "object",
    properties: {
      checks: {
        type: "array",
        description: "Un resultado por cada criterio, en el mismo orden en que se listaron.",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              enum: CHECK_IDS,
              description: "El id del criterio que estás resolviendo.",
            },
            verdict: {
              type: "string",
              enum: ["ok", "aviso", "bloqueo"],
              description:
                "ok = la imagen cumple. aviso = usable pero con una salvedad que alguien debe conocer. bloqueo = no debe publicarse así.",
            },
            finding: {
              type: "string",
              description:
                "Una o dos frases en español de México diciendo QUÉ has visto y DÓNDE, no si cumple. Concreto y verificable: «una lata azul sin marca legible en el segundo estante» sirve; «hay productos» no. Si el veredicto es ok, di qué te lo confirma.",
            },
          },
          required: ["id", "verdict", "finding"],
        },
      },
      dominantColors: {
        type: "array",
        description: "Los tres colores que más ocupan la imagen, en hex.",
        items: { type: "string" },
      },
      safeArea: {
        type: "string",
        enum: SAFE_AREAS,
        description: "Dónde cabe el logo con el fondo más limpio. «ninguna» si no hay sitio.",
      },
      summary: {
        type: "string",
        description:
          "Una frase para el equipo de marca: si esta foto se puede usar y con qué cuidado.",
      },
    },
    required: ["checks", "dominantColors", "safeArea", "summary"],
  },
};

/** El peor veredicto de la lista manda: un bloqueo tiñe toda la imagen. */
export function worstVerdict(checks: { verdict: Verdict }[]): Verdict {
  if (checks.some((c) => c.verdict === "bloqueo")) return "bloqueo";
  if (checks.some((c) => c.verdict === "aviso")) return "aviso";
  return "ok";
}
