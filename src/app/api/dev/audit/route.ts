import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { SEED } from "@/lib/seed";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { legalText } from "@/lib/legal";
import {
  AUDIT_TOOL,
  CHECKS,
  type AuditReport,
  type ImageAudit,
  type SafeArea,
  type Verdict,
} from "@/lib/audit/checks";

export const runtime = "nodejs";
export const maxDuration = 800;

const MODEL = "claude-opus-5";

/**
 * AUDITOR DE LA BIBLIOTECA — solo en desarrollo.
 *
 * Le enseña cada foto de `public/backgrounds/` a Claude junto con el brand kit
 * y guarda el veredicto en src/lib/audit/report.json. La pantalla /auditoria
 * lee ese archivo y no vuelve a llamar a nadie.
 *
 * Cuesta unos céntimos por imagen (mirar una foto son ~1.600 tokens de
 * entrada). Se paga al añadir fotos nuevas, no en cada pase de la demo.
 *
 *   curl -X POST localhost:3000/api/dev/audit
 *   curl -X POST localhost:3000/api/dev/audit -d '{"force":true}'
 *
 * Por defecto salta las imágenes que ya están en el informe. Con `force` las
 * vuelve a auditar todas — útil si has cambiado la paleta o las reglas.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "El auditor solo está disponible en desarrollo." },
      { status: 403 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Falta ANTHROPIC_API_KEY" }, { status: 400 });
  }

  const { force = false } = await readBody(request);

  const client = new Anthropic({ apiKey });
  const against = buildAgainst();
  const previous = await loadReport();
  const seen = new Map(previous.images.map((i) => [i.src, i]));

  const audited: ImageAudit[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];
  let inputTokens = 0;
  let outputTokens = 0;

  for (const target of collectTargets()) {
    const cached = seen.get(target.src);
    if (cached && !force) {
      audited.push({ ...cached, formats: target.formats, label: target.label });
      skipped.push(target.src);
      continue;
    }

    try {
      const result = await auditImage(client, target, against);
      inputTokens += result.usage.input;
      outputTokens += result.usage.output;
      audited.push(result);
    } catch (error) {
      failed.push(`${target.src}: ${error instanceof Error ? error.message : "error"}`);
      // Si falla una, conservamos lo que hubiera para no perder informe previo.
      if (cached) audited.push(cached);
    }
  }

  await writeReport({ against, images: audited });

  return NextResponse.json({
    auditadas: audited.length - skipped.length,
    reutilizadas: skipped.length,
    total: audited.length,
    tokens: { entrada: inputTokens, salida: outputTokens },
    // Precio de referencia de Claude Opus 5: 5 $/MTok entrada, 25 $/MTok salida.
    costeAproxUsd: Number(
      ((inputTokens / 1e6) * 5 + (outputTokens / 1e6) * 25).toFixed(4),
    ),
    fallos: failed,
  });
}

async function readBody(request: Request): Promise<{ force?: boolean }> {
  try {
    return (await request.json()) as { force?: boolean };
  } catch {
    return {};
  }
}

type Target = {
  src: string;
  backgroundId: string;
  label: string;
  formats: string[];
};

/**
 * Un archivo, una auditoría. Si dos formatos comparten archivo se audita una
 * vez; si cada recorte es su propio archivo se auditan por separado, que es lo
 * correcto: dónde cabe el logo cambia con el encuadre.
 */
function collectTargets(): Target[] {
  const bySrc = new Map<string, Target>();

  for (const bg of BACKGROUNDS) {
    for (const [format, src] of Object.entries(bg.src)) {
      if (!src) continue;
      const existing = bySrc.get(src);
      if (existing) {
        existing.formats.push(format);
      } else {
        bySrc.set(src, {
          src,
          backgroundId: bg.id,
          label: bg.label,
          formats: [format],
        });
      }
    }
  }

  return [...bySrc.values()];
}

/**
 * Contra qué se audita. Sale del brand kit y de las zonas, no de una lista
 * escrita aquí: si Six cambia la paleta o legal añade una restricción, la
 * siguiente auditoría la aplica sola.
 */
function buildAgainst(): AuditReport["against"] {
  const regulatory = legalText([
    ...SEED.legal,
    ...SEED.zones.flatMap((z) => z.regulatory),
  ]);
  return {
    brandName: SEED.brand.name,
    palette: [
      SEED.brand.colors.primary,
      SEED.brand.colors.secondary,
      SEED.brand.colors.accent,
    ],
    dont: SEED.brand.voice.dont,
    regulatory,
  };
}

const MEDIA_TYPES: Record<string, "image/jpeg" | "image/png" | "image/webp"> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

async function auditImage(
  client: Anthropic,
  target: Target,
  against: AuditReport["against"],
): Promise<ImageAudit> {
  const ext = path.extname(target.src).toLowerCase();
  const mediaType = MEDIA_TYPES[ext];
  if (!mediaType) throw new Error(`formato de imagen no soportado: ${ext}`);

  const file = path.join(process.cwd(), "public", target.src.replace(/^\//, ""));
  const bytes = await readFile(file);

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: systemPrompt(against),
    // Mirar una foto con atención es justo donde el razonamiento paga: la
    // diferencia entre "hay latas" y "esa lata del segundo estante es de la
    // competencia". Con esfuerzo medio piensa lo justo sin dispararse el coste.
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    tools: [AUDIT_TOOL],
    tool_choice: { type: "auto" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: bytes.toString("base64") },
          },
          { type: "text", text: userPrompt(target) },
        ],
      },
    ],
  });

  if (message.stop_reason === "refusal") {
    throw new Error("el modelo declinó auditar esta imagen");
  }

  const toolUse = message.content.find(
    (b): b is Anthropic.ToolUseBlock =>
      b.type === "tool_use" && b.name === AUDIT_TOOL.name,
  );
  if (!toolUse) throw new Error("no devolvió el informe estructurado");

  const input = toolUse.input as {
    checks?: { id: string; verdict: Verdict; finding: string }[];
    dominantColors?: string[];
    safeArea?: SafeArea;
    summary?: string;
  };

  if (!Array.isArray(input.checks) || input.checks.length === 0) {
    throw new Error("devolvió una lista de criterios vacía");
  }

  return {
    src: target.src,
    backgroundId: target.backgroundId,
    label: target.label,
    formats: target.formats,
    // Ordenamos como CHECKS para que las fichas se lean igual en toda la
    // pantalla, venga el modelo en el orden que venga.
    checks: CHECKS.flatMap((c) => input.checks!.filter((r) => r.id === c.id)),
    dominantColors: input.dominantColors ?? [],
    safeArea: input.safeArea ?? "ninguna",
    summary: input.summary ?? "",
    auditedAt: new Date().toISOString(),
    usage: {
      input: message.usage.input_tokens,
      output: message.usage.output_tokens,
    },
  };
}

function systemPrompt(against: AuditReport["against"]): string {
  return [
    `Eres el responsable de control de marca de ${against.brandName}, una cadena mexicana de tiendas de conveniencia. Auditas fotografías de la biblioteca antes de que se usen como fondo de piezas publicitarias.`,
    "",
    "Tu trabajo NO es opinar si la foto es bonita. Es decir si se puede publicar y con qué cuidado.",
    "",
    `Paleta de marca: ${against.palette.join(", ")}.`,
    "",
    "Qué no hace esta marca:",
    ...against.dont.map((d) => `- ${d}`),
    "",
    "Restricciones regulatorias vigentes en los mercados donde publica:",
    ...against.regulatory.map((r) => `- ${r}`),
    "",
    "Reglas de veredicto:",
    "- bloqueo: hay algo que impide publicarla tal cual (marca ajena reconocible, incumplimiento legal).",
    "- aviso: se puede usar, pero alguien tiene que saberlo antes de aprobarla.",
    "- ok: cumple sin salvedades.",
    "",
    "Sé literal con lo que ves. Si dudas de si un envase es de otra marca, es aviso, no ok: el coste de revisar de más es una mirada; el de revisar de menos es una pieza retirada. No inventes marcas que no distingas — describe lo que ves y baja el veredicto.",
    "Escribe en español de México, directo y sin adornos. Responde llamando a la herramienta reportar_auditoria.",
  ].join("\n");
}

function userPrompt(target: Target): string {
  return [
    `Audita esta imagen de la biblioteca.`,
    `Archivo: ${target.src}`,
    `Descripción con la que está catalogada: ${target.label}`,
    `Se usa como fondo en formato: ${target.formats.join(", ")}`,
    "",
    "Resuelve estos criterios, uno por uno:",
    "",
    ...CHECKS.map((c) => `[${c.id}] ${c.label}\n${c.question}`),
  ].join("\n");
}

const REPORT_PATH = path.join(process.cwd(), "src", "lib", "audit", "report.json");

async function loadReport(): Promise<AuditReport> {
  try {
    return JSON.parse(await readFile(REPORT_PATH, "utf8")) as AuditReport;
  } catch {
    return { against: buildAgainst(), images: [] };
  }
}

async function writeReport(report: AuditReport) {
  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}
