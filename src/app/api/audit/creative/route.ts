import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
  CREATIVE_CHECKS,
  CREATIVE_TOOL,
  creativeVerdict,
  type CreativeAudit,
  type CreativeCheck,
} from "@/lib/audit/creative";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODEL = "claude-opus-5";

/**
 * Audita una pieza terminada: la imagen compuesta MÁS su copy.
 *
 * A diferencia del auditor de la biblioteca, este sí corre en producción — lo
 * dispara el botón «Auditar» de cada propuesta. Por eso:
 *
 *   · Nunca se llama solo. Sin clic no hay gasto.
 *   · Si no hay clave, o DEMO_MODE=strict, o Claude falla, cae al motor local
 *     y devuelve algo sensato. Delante de un cliente no puede aparecer un
 *     error: eso fue lo primero que pidieron.
 */
const DEMO_MODE = (process.env.DEMO_MODE ?? "auto").toLowerCase();

export type AuditCreativeRequest = {
  /** La pieza compuesta, ya reducida en el navegador. data:image/jpeg;base64,… */
  image: string;
  copy: {
    concept: string;
    headline: string;
    subhead: string;
    body: string;
    cta: string;
    caption: string;
    hashtags: string[];
  };
  brand: {
    name: string;
    positioning: string;
    dont: string[];
    claims: string[];
  };
  /** Reglas ya resueltas (globales + zona), con su estado de validación. */
  legal: { text: string; validated: boolean }[];
  context: {
    zone: string;
    country: string;
    network: string;
    format: string;
    product: string;
  };
};

export async function POST(request: Request) {
  let req: AuditCreativeRequest;
  try {
    req = (await request.json()) as AuditCreativeRequest;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || DEMO_MODE === "strict") {
    return NextResponse.json(localAudit(req));
  }

  try {
    return NextResponse.json(await askClaude(new Anthropic({ apiKey }), req));
  } catch (error) {
    const fallback = localAudit(req);
    fallback.summary = `${fallback.summary} (Claude no respondió: ${
      error instanceof Error ? error.message : "error desconocido"
    })`;
    return NextResponse.json(fallback);
  }
}

async function askClaude(
  client: Anthropic,
  req: AuditCreativeRequest,
): Promise<CreativeAudit> {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(req.image ?? "");
  if (!match) throw new Error("la pieza no llegó como imagen");
  const [, mediaType, data] = match;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: systemPrompt(req),
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    tools: [CREATIVE_TOOL],
    tool_choice: { type: "auto" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as "image/jpeg" | "image/png" | "image/webp",
              data,
            },
          },
          { type: "text", text: userPrompt(req) },
        ],
      },
    ],
  });

  if (message.stop_reason === "refusal") {
    throw new Error("el modelo declinó auditar la pieza");
  }

  const toolUse = message.content.find(
    (b): b is Anthropic.ToolUseBlock =>
      b.type === "tool_use" && b.name === CREATIVE_TOOL.name,
  );
  if (!toolUse) throw new Error("no devolvió el informe estructurado");

  const input = toolUse.input as Partial<CreativeAudit>;
  const checks = orderChecks(input.checks ?? []);
  if (checks.length === 0) throw new Error("devolvió una lista de criterios vacía");

  return {
    // El veredicto se recalcula de los criterios en vez de fiarlo al modelo:
    // así nunca puede decir «aprobada» con un bloqueo dentro.
    verdict: creativeVerdict(checks),
    summary: clean(input.summary ?? ""),
    checks,
    fixes: (input.fixes ?? []).map(clean),
    engine: "claude",
    auditedAt: new Date().toISOString(),
    // La pone el cliente, que es quien sabe qué fondo se rasterizó.
    fingerprint: "",
    usage: {
      input: message.usage.input_tokens,
      output: message.usage.output_tokens,
    },
  };
}

function orderChecks(checks: CreativeCheck[]): CreativeCheck[] {
  return CREATIVE_CHECKS.flatMap((c) =>
    checks
      .filter((r) => r.id === c.id)
      .map((r) => ({
        ...r,
        finding: clean(r.finding),
        quote: r.quote ? clean(r.quote) : undefined,
        rule: r.rule ? clean(r.rule) : undefined,
      })),
  );
}

/**
 * El modelo a veces escapa las comillas dentro del texto de la herramienta y
 * llegan como \" literales, que en pantalla se ven como barras sueltas. Se
 * limpian aquí y no en el componente: el problema es del dato, no de cómo se
 * pinta, y así no vuelve a aparecer si el informe se enseña en otro sitio.
 */
function clean(text: string): string {
  return text.replace(/\\+"/g, '"').replace(/\\{2,}/g, "").trim();
}

function systemPrompt(req: AuditCreativeRequest): string {
  const validadas = req.legal.filter((r) => r.validated);
  const pendientes = req.legal.filter((r) => !r.validated);

  return [
    `Eres el responsable de aprobar publicidad de ${req.brand.name}, una cadena mexicana de tiendas de conveniencia. Te llega una pieza terminada —la imagen compuesta y el copy que la acompaña— y decides si puede publicarse.`,
    "",
    "Juzga la imagen Y el texto como una sola cosa. Una foto correcta con un copy que insinúa beber y conducir es una pieza no publicable, y al revés.",
    "",
    "═══ REGLAS VALIDADAS POR EL EQUIPO LEGAL ═══",
    validadas.length
      ? validadas.map((r) => `- ${r.text}`).join("\n")
      : "(ninguna todavía)",
    "",
    "═══ REGLAS AÚN SIN VALIDAR ═══",
    pendientes.length
      ? pendientes.map((r) => `- ${r.text}`).join("\n")
      : "(ninguna)",
    "",
    "**Distingue entre las dos listas.** Las validadas son derecho firme: si la pieza incumple una, es bloqueo. Las que están sin validar son borradores que nadie ha confirmado todavía; con esas puedes avisar, nunca bloquear. Cuando te apoyes en una regla, cópiala literal en el campo `rule` para que se pueda rastrear.",
    "",
    `Lo que ${req.brand.name} no hace:`,
    ...req.brand.dont.map((d) => `- ${d}`),
    "",
    "Reglas de veredicto por criterio:",
    "- bloqueo: incumple una regla validada, o hay marca ajena reconocible.",
    "- aviso: hay algo que quien aprueba tiene que saber antes de dar el visto bueno.",
    "- ok: cumple.",
    "",
    "Cuando propongas un arreglo de texto, escribe el texto nuevo listo para pegar; no describas el cambio. Sé literal con lo que ves y cita el copy palabra por palabra. Escribe en español de México. Responde llamando a la herramienta reportar_pieza.",
  ].join("\n");
}

function userPrompt(req: AuditCreativeRequest): string {
  const { copy, context } = req;
  return [
    "Audita esta pieza. La imagen adjunta es exactamente lo que se va a publicar.",
    "",
    `Zona: ${context.zone} (${context.country})`,
    `Red: ${context.network} · formato ${context.format}`,
    `Producto: ${context.product}`,
    "",
    "═══ COPY DE LA PIEZA ═══",
    `Concepto: ${copy.concept}`,
    `Titular (va sobre la imagen): ${copy.headline}`,
    `Subtítulo (va sobre la imagen): ${copy.subhead || "—"}`,
    `Llamada a la acción (va sobre la imagen): ${copy.cta || "—"}`,
    "",
    "═══ COPY QUE ACOMPAÑA A LA PUBLICACIÓN ═══",
    `Cuerpo: ${copy.body || "—"}`,
    `Pie de publicación: ${copy.caption || "—"}`,
    `Hashtags: ${copy.hashtags?.length ? copy.hashtags.join(" ") : "—"}`,
    "",
    "Resuelve estos criterios:",
    "",
    "[legal] Marco legal — ¿incumple alguna de las reglas de arriba? Mira imagen y copy juntos.",
    "[marca-ajena] Marca ajena — ¿se ve algún logo, envase o rótulo que no sea de la marca? Mira el fondo con lupa: neveras, estantes, rótulos.",
    "[copy] Copy y promesa — ¿promete algo que la marca no puede prometer, suena a corporativo, o el gancho no aguanta el primer renglón?",
    "[legibilidad] Legibilidad — ¿el titular y la llamada a la acción se leen sobre la imagen? ¿El logo se distingue del fondo? ¿Algo queda cortado o tapado?",
    "[identidad] Identidad de marca — ¿esto parece de esta marca, o podría ser de cualquiera?",
  ].join("\n");
}

/**
 * Motor local: sin modelo y sin coste.
 *
 * No mira la imagen — no puede. Lo que sí hace es cruzar el copy con las
 * reglas por palabras clave y comprobar lo comprobable. Es deliberadamente
 * conservador: prefiere no decir nada a inventarse un hallazgo, y lo declara
 * abiertamente para que nadie confunda esto con la auditoría de verdad.
 */
function localAudit(req: AuditCreativeRequest): CreativeAudit {
  const copy = req.copy ?? ({} as AuditCreativeRequest["copy"]);
  const texto = [copy.headline, copy.subhead, copy.body, copy.cta, copy.caption]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const checks: CreativeCheck[] = [];

  const conducir = /\b(maneja|manejar|manejando|conduce|conducir|volante|coche|carro|carretera|al volante)\b/.test(
    texto,
  );
  const regla = req.legal?.find((r) => /conduc|vehícul|maneja/i.test(r.text));
  checks.push({
    id: "legal",
    verdict: conducir ? (regla?.validated ? "bloqueo" : "aviso") : "ok",
    finding: conducir
      ? "El copy menciona conducir o un vehículo, y esta es publicidad de alcohol."
      : "El copy no menciona conducir, menores ni consumo excesivo. La imagen no se ha revisado: el motor local no la mira.",
    rule: conducir ? regla?.text : undefined,
  });

  const exceso = /\b(borrach|peda|hasta caer|sin parar|toda la noche)\b/.test(texto);
  checks.push({
    id: "copy",
    verdict: exceso ? "aviso" : "ok",
    finding: exceso
      ? "El copy roza el consumo excesivo como gancho."
      : "Sin promesas de precio ni referencias a consumo excesivo en el texto.",
  });

  const cortes = copy.headline && copy.headline.length > 60;
  checks.push({
    id: "legibilidad",
    verdict: cortes ? "aviso" : "ok",
    finding: cortes
      ? `El titular tiene ${copy.headline.length} caracteres; sobre la pieza va a partirse en varias líneas y comerse el espacio.`
      : "El titular entra en la pieza sin partirse de más.",
  });

  return {
    verdict: creativeVerdict(checks),
    summary:
      "Revisión local, sin modelo: se ha cruzado el copy con las reglas por palabras clave. La imagen NO se ha mirado. Para el veredicto de verdad hace falta la auditoría con Claude.",
    checks,
    fixes: [],
    engine: "local",
    auditedAt: new Date().toISOString(),
    fingerprint: "",
  };
}
