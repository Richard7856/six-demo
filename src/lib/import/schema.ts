import type Anthropic from "@anthropic-ai/sdk";
import type { LegalRule, Product, Zone } from "@/lib/types";

/**
 * IMPORTAR UNA MARCA
 *
 * Tres caminos al mismo sitio: hablando con la IA, cargando un archivo, o el
 * formulario de siempre. Este archivo cubre el primero.
 *
 * Regla que gobierna todo lo de aquí: **nada se aplica solo**. El modelo
 * propone, la persona revisa y elige qué entra. Una importación que pisa el
 * brand kit sin preguntar es una forma rápida de perder el trabajo de una
 * tarde, y en una demo compartida por enlace, de que alguien destroce lo que
 * otro estaba enseñando.
 */
export type ExtractedBrand = {
  name: string;
  positioning: string;
  colors: { primary: string; secondary: string; accent: string };
  voice: {
    persona: string;
    tone: string[];
    do: string[];
    dont: string[];
  };
  claims: string[];
};

export type ExtractedZone = Omit<Zone, "overrides" | "networks" | "handles" | "regulatory"> & {
  regulatory: string[];
};

export type ExtractedProduct = Product;

export type Extraction = {
  brand: ExtractedBrand | null;
  zones: ExtractedZone[];
  products: ExtractedProduct[];
  legal: string[];
  /** Qué NO pudo sacar del texto. Se enseña tal cual: es la parte honesta. */
  gaps: string[];
  notes: string;
};

const HEX = "Color en hexadecimal, con almohadilla. Ej: #E1211D";

export const IMPORT_TOOL: Anthropic.Tool = {
  name: "proponer_marca",
  description:
    "Devuelve el brand kit, las zonas y los productos que hayas podido deducir del material recibido. Lo que no esté en el material se deja vacío y se declara en `gaps`.",
  input_schema: {
    type: "object",
    properties: {
      brand: {
        type: ["object", "null"],
        description: "El brand kit global. null si el material no habla de la marca.",
        properties: {
          name: { type: "string" },
          positioning: {
            type: "string",
            description:
              "Qué es la marca y contra qué compite, en dos o tres frases. Concreto, no eslóganes.",
          },
          colors: {
            type: "object",
            properties: {
              primary: { type: "string", description: HEX },
              secondary: { type: "string", description: HEX },
              accent: { type: "string", description: HEX },
            },
            required: ["primary", "secondary", "accent"],
          },
          voice: {
            type: "object",
            properties: {
              persona: { type: "string", description: "Quién habla, como si fuera una persona." },
              tone: { type: "array", items: { type: "string" }, description: "3-6 adjetivos." },
              do: { type: "array", items: { type: "string" } },
              dont: { type: "array", items: { type: "string" } },
            },
            required: ["persona", "tone", "do", "dont"],
          },
          claims: {
            type: "array",
            items: { type: "string" },
            description: "Frases de marca que ya usa. Vacío si no aparecen en el material.",
          },
        },
        required: ["name", "positioning", "colors", "voice", "claims"],
      },
      zones: {
        type: "array",
        description:
          "Mercados o regiones donde opera. Vacío si el material no los menciona — no te los inventes.",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Identificador en minúsculas y con guiones. Ej: mx-norte",
            },
            name: { type: "string" },
            country: { type: "string", description: "País, o los estados que abarca." },
            language: { type: "string", description: "Código de idioma. Ej: es-MX" },
            audience: { type: "string", description: "A quién le habla ahí, concreto." },
            insight: {
              type: "string",
              description:
                "Qué hace distinta a esta zona: un comportamiento observable, no un tópico.",
            },
            occasions: { type: "array", items: { type: "string" } },
            regulatory: {
              type: "array",
              items: { type: "string" },
              description: "Restricciones legales de esa zona SI aparecen en el material.",
            },
          },
          required: ["id", "name", "country", "language", "audience", "insight", "occasions", "regulatory"],
        },
      },
      products: {
        type: "array",
        description: "Productos o líneas. Vacío si el material no los detalla.",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "Identificador en minúsculas y con guiones." },
            name: { type: "string" },
            family: { type: "string", description: "Categoría o familia." },
            abv: { type: "string", description: "Graduación si es bebida alcohólica; vacío si no aplica." },
            color: { type: "string", description: HEX },
            attributes: { type: "array", items: { type: "string" } },
            occasions: { type: "array", items: { type: "string" } },
            notes: { type: "string" },
          },
          required: ["id", "name", "family", "abv", "color", "attributes", "occasions", "notes"],
        },
      },
      legal: {
        type: "array",
        items: { type: "string" },
        description:
          "Restricciones legales de publicidad que apliquen a toda la marca, SI el material las menciona. No añadas las que te sepas de memoria: aquí solo va lo que está escrito en el material.",
      },
      gaps: {
        type: "array",
        items: { type: "string" },
        description:
          "Qué te ha faltado para completar la ficha. Una línea por hueco, en lenguaje llano: «no dice qué tipografía usa», «no menciona en qué regiones opera». Esto se le enseña a la persona tal cual.",
      },
      notes: {
        type: "string",
        description: "Una o dos frases sobre qué has entendido y qué has tenido que suponer.",
      },
    },
    required: ["brand", "zones", "products", "legal", "gaps", "notes"],
  },
};

/** Reglas legales importadas: nacen sin validar, como todo lo que no viene de legal. */
export function toLegalRules(texts: string[], prefix: string): LegalRule[] {
  return texts.map((text, i) => ({
    id: `${prefix}-${i}-${text.slice(0, 12).toLowerCase().replace(/\W+/g, "")}`,
    text,
    validated: false,
  }));
}
