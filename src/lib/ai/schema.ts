import type { ProposalFormat } from "@/lib/types";

/** Lo que el cliente manda a /api/proposals. */
export type GenerateRequest = {
  brandName: string;
  positioning: string;
  voice: { persona: string; tone: string[]; do: string[]; dont: string[] };
  claims: string[];
  palette: { primary: string; secondary: string; accent: string };
  zone: {
    name: string;
    country: string;
    language: string;
    audience: string;
    insight: string;
    occasions: string[];
    regulatory: string[];
  };
  product: {
    name: string;
    family: string;
    abv: string;
    attributes: string[];
    notes: string;
  };
  objective: string;
  network: {
    name: string;
    toneShift: string;
    copyGuide: string;
    hashtagPolicy: string;
    ctaStyle: string;
    avoid: string;
    handle: string;
  };
  format: ProposalFormat;
  count: number;
  /** Identificadores para localizar la entrada del guion de demo. */
  ids?: { zoneId: string; productId: string; networkId: string };
};

/** Una propuesta tal y como la devuelve el modelo (sin id ni imagen todavía). */
export type RawProposal = {
  concept: string;
  rationale: string;
  headline: string;
  subhead: string;
  body: string;
  cta: string;
  hashtags: string[];
  caption: string;
  communityReply: string;
  imagePrompt: string;
  kpis: string[];
  /** Fondo elegido de la biblioteca. Lo pone el servidor, no el modelo. */
  imageUrl?: string | null;
};

const proposalProperties = {
  concept: {
    type: "string",
    description: "Nombre corto y memorable de la idea. Máximo 5 palabras.",
  },
  rationale: {
    type: "string",
    description:
      "Por qué esta idea funciona en esta zona concreta. Debe referirse explícitamente al insight local, no ser genérica. 1-2 frases.",
  },
  headline: {
    type: "string",
    description:
      "Titular del creativo, en el idioma de la zona. Máximo 8 palabras. Sin comillas.",
  },
  subhead: {
    type: "string",
    description: "Línea de apoyo, máximo 14 palabras, en el idioma de la zona.",
  },
  body: {
    type: "string",
    description:
      "Copy del post/anuncio, 2-3 frases, en el idioma de la zona, listo para publicar.",
  },
  cta: {
    type: "string",
    description: "Llamada a la acción de 2-4 palabras, en el idioma de la zona.",
  },
  hashtags: {
    type: "array",
    items: { type: "string" },
    description:
      "Hashtags sin el símbolo #, siguiendo la política de hashtags de esta red concreta.",
  },
  caption: {
    type: "string",
    description:
      "El pie de la publicación tal y como se pega en esa red, en el idioma de la zona. Respeta el límite de copy de la red: si la red corta a los 125 caracteres, el gancho completo tiene que caber antes del corte.",
  },
  communityReply: {
    type: "string",
    description:
      "Una respuesta tipo, en la voz de la marca y en el idioma de la zona, para cuando la gente comente esta publicación. Sirve al equipo de community management como referencia de tono.",
  },
  imagePrompt: {
    type: "string",
    description:
      "Brief EN INGLÉS para un modelo de imagen que describa SOLO la escena de fondo: lugar, luz, personas, cámara, ambiente. No describas logos, texto ni packaging: eso se compone después.",
  },
  kpis: {
    type: "array",
    items: { type: "string" },
    description: "2-3 métricas concretas para medir esta pieza.",
  },
} as const;

/** Definición de la herramienta que fuerza la salida estructurada. */
export const PROPOSAL_TOOL = {
  name: "entregar_propuestas",
  description:
    "Entrega el set completo de propuestas de campaña ya redactadas y listas para revisión.",
  input_schema: {
    type: "object" as const,
    properties: {
      proposals: {
        type: "array",
        description: "Las propuestas, ordenadas de más a menos recomendada.",
        items: {
          type: "object",
          properties: proposalProperties,
          required: [
            "concept",
            "rationale",
            "headline",
            "subhead",
            "body",
            "cta",
            "hashtags",
            "caption",
            "communityReply",
            "imagePrompt",
            "kpis",
          ],
          additionalProperties: false,
        },
      },
    },
    required: ["proposals"],
    additionalProperties: false,
  },
};
