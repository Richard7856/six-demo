import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { IMPORT_TOOL, type Extraction } from "@/lib/import/schema";

export const runtime = "nodejs";
export const maxDuration = 180;

const MODEL = "claude-opus-5";

/**
 * Lee el material que le pasen —un manual de marca pegado, un correo, o
 * simplemente a alguien describiendo su negocio— y propone brand kit, zonas y
 * productos.
 *
 * Corre en producción, pero solo con un clic explícito: cuesta una llamada.
 * Sin clave o en DEMO_MODE=strict no inventa nada — devuelve un error claro,
 * porque aquí un motor local de plantillas sería peor que no tener nada: te
 * daría una marca falsa con pinta de extraída.
 */
const DEMO_MODE = (process.env.DEMO_MODE ?? "auto").toLowerCase();

/** Tope de material por petición. Un manual entero no cabe ni hace falta. */
const MAX_CHARS = 60_000;

export async function POST(request: Request) {
  let body: { material?: string };
  try {
    body = (await request.json()) as { material?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const material = (body.material ?? "").trim();
  if (material.length < 40) {
    return NextResponse.json(
      { error: "Escribe o pega algo más: con menos de 40 caracteres no hay nada que leer." },
      { status: 400 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || DEMO_MODE === "strict") {
    return NextResponse.json(
      {
        error:
          "La importación con IA está desactivada en esta demo. Usa el archivo JSON o el formulario.",
      },
      { status: 503 },
    );
  }

  try {
    const message = await new Anthropic({ apiKey }).messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      tools: [IMPORT_TOOL],
      tool_choice: { type: "auto" },
      messages: [
        {
          role: "user",
          content: `Extrae lo que puedas de este material.\n\n═══ MATERIAL ═══\n${material.slice(0, MAX_CHARS)}`,
        },
      ],
    });

    if (message.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "El modelo declinó procesar este material." },
        { status: 422 },
      );
    }

    const toolUse = message.content.find(
      (b): b is Anthropic.ToolUseBlock =>
        b.type === "tool_use" && b.name === IMPORT_TOOL.name,
    );
    if (!toolUse) {
      return NextResponse.json(
        { error: "El modelo no devolvió una ficha estructurada. Prueba a dar más detalle." },
        { status: 502 },
      );
    }

    const extraction = toolUse.input as Extraction;

    return NextResponse.json({
      extraction,
      usage: {
        input: message.usage.input_tokens,
        output: message.usage.output_tokens,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `No se pudo procesar el material (${
          error instanceof Error ? error.message : "error desconocido"
        }).`,
      },
      { status: 502 },
    );
  }
}

const SYSTEM = [
  "Conviertes material de marca en la ficha estructurada que usa una herramienta de generación de campañas.",
  "",
  "El material puede ser cualquier cosa: un extracto de un manual de marca, un correo, notas sueltas, o alguien describiendo su negocio en lenguaje llano. Tu trabajo es sacar lo que ESTÁ, no completar lo que falta.",
  "",
  "**La regla que manda: no inventes.** Si el material no dice en qué regiones opera, devuelve `zones` vacío y anótalo en `gaps`. Si no da colores, no elijas unos bonitos: dilo. Un hueco declarado se rellena en dos minutos; un dato inventado que suena plausible se queda dentro y nadie lo revisa nunca.",
  "",
  "Dos excepciones donde SÍ debes deducir, porque es interpretación y no invención:",
  "- `positioning` y `voice`: si el material describe el negocio, resume su posicionamiento y su tono aunque no vengan con esa etiqueta.",
  "- `id`: los identificadores los generas tú a partir del nombre.",
  "",
  "Si el material menciona colores por nombre («rojo corporativo») y no da el hexadecimal, apúntalo en `gaps` en vez de aproximar un hex a ojo.",
  "",
  "Escribe en el idioma del material. Si es español, español de México. Responde llamando a la herramienta proponer_marca.",
].join("\n");
