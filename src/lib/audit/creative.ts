import type Anthropic from "@anthropic-ai/sdk";

/**
 * AUDITORÍA DE LA PIEZA TERMINADA
 *
 * A diferencia de la auditoría de la biblioteca (que mira fotos sueltas), esta
 * mira el anuncio tal y como se va a publicar: la imagen compuesta con logo y
 * titular, MÁS el copy que la acompaña.
 *
 * Las dos cosas juntas, no por separado. En publicidad de alcohol el riesgo
 * casi nunca está en los píxeles: está en las palabras. Una foto impecable con
 * un «sigue la fiesta donde quieras» debajo es un problema, y mirando solo la
 * imagen no se ve.
 */
export type CreativeVerdict = "aprobada" | "con-reparos" | "no-publicable";

export type CreativeCheckId =
  | "legal"
  | "marca-ajena"
  | "copy"
  | "legibilidad"
  | "identidad";

export type CreativeCheck = {
  id: CreativeCheckId;
  verdict: "ok" | "aviso" | "bloqueo";
  finding: string;
  /** Texto exacto de la pieza al que se refiere, si aplica. */
  quote?: string;
  /** Regla del marco legal en la que se apoya, si aplica. */
  rule?: string;
};

export type CreativeAudit = {
  verdict: CreativeVerdict;
  summary: string;
  checks: CreativeCheck[];
  /** Arreglos concretos, redactados listos para pegar. */
  fixes: string[];
  engine: "claude" | "local";
  auditedAt: string;
  /** Huella del copy y el fondo en el momento de auditar. Ver `isStale`. */
  fingerprint: string;
  usage?: { input: number; output: number };
};

/**
 * Un veredicto guardado deja de valer en cuanto alguien toca la pieza: cambias
 * el titular y el «aprobada» de antes sigue ahí, verde, mintiendo. Guardamos
 * una huella de lo auditado para poder avisar en vez de callar.
 */
export function fingerprintOf(parts: {
  headline: string;
  subhead: string;
  body: string;
  cta: string;
  caption: string;
  hashtags: string[];
  imageUrl: string | null;
}): string {
  const raw = [
    parts.headline,
    parts.subhead,
    parts.body,
    parts.cta,
    parts.caption,
    parts.hashtags.join(","),
    parts.imageUrl ?? "",
  ].join(" ");

  let hash = 0;
  for (let i = 0; i < raw.length; i++) hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  return `${raw.length}-${hash.toString(36)}`;
}

export const CREATIVE_CHECKS: { id: CreativeCheckId; label: string }[] = [
  { id: "legal", label: "Marco legal" },
  { id: "marca-ajena", label: "Marca ajena" },
  { id: "copy", label: "Copy y promesa" },
  { id: "legibilidad", label: "Legibilidad" },
  { id: "identidad", label: "Identidad de marca" },
];

export const CREATIVE_TOOL: Anthropic.Tool = {
  name: "reportar_pieza",
  description:
    "Reporta el resultado de auditar una pieza publicitaria terminada (imagen compuesta + copy) contra el marco legal y el brand kit.",
  input_schema: {
    type: "object",
    properties: {
      verdict: {
        type: "string",
        enum: ["aprobada", "con-reparos", "no-publicable"],
        description:
          "aprobada = puede salir tal cual. con-reparos = puede salir si se atienden los avisos. no-publicable = hay al menos un bloqueo.",
      },
      summary: {
        type: "string",
        description:
          "Una o dos frases para quien tiene que aprobar la pieza. Directo: qué pasa y qué hay que hacer.",
      },
      checks: {
        type: "array",
        description: "Un resultado por cada criterio listado.",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              enum: ["legal", "marca-ajena", "copy", "legibilidad", "identidad"],
            },
            verdict: { type: "string", enum: ["ok", "aviso", "bloqueo"] },
            finding: {
              type: "string",
              description:
                "Qué has visto, concreto y verificable. Si es ok, di qué te lo confirma.",
            },
            quote: {
              type: "string",
              description:
                "El fragmento LITERAL del copy al que te refieres, si el problema está en el texto. Omítelo si el problema es visual.",
            },
            rule: {
              type: "string",
              description:
                "SOLO si tu veredicto se apoya de verdad en una regla concreta del marco legal: cópiala literal de la lista que te di. Si el hallazgo no viene de ninguna regla — problemas de copy, de legibilidad, de identidad, o producto de terceros — OMITE este campo. Poner una regla que no es la que estás aplicando hace el informe inservible para rastrear.",
            },
          },
          required: ["id", "verdict", "finding"],
        },
      },
      fixes: {
        type: "array",
        description:
          "Arreglos concretos y accionables. Si propones cambiar un texto, escribe el texto nuevo listo para pegar, no describas el cambio. Lista vacía si no hace falta nada.",
        items: { type: "string" },
      },
    },
    required: ["verdict", "summary", "checks", "fixes"],
  },
};

export function creativeVerdict(checks: CreativeCheck[]): CreativeVerdict {
  if (checks.some((c) => c.verdict === "bloqueo")) return "no-publicable";
  if (checks.some((c) => c.verdict === "aviso")) return "con-reparos";
  return "aprobada";
}
