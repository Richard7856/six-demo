import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { SEED } from "@/lib/seed";
import { getNetwork } from "@/lib/networks";
import { resolveBrand } from "@/lib/resolve";
import { legalText, resolveLegal } from "@/lib/legal";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/ai/prompt";
import { PROPOSAL_TOOL, type GenerateRequest, type RawProposal } from "@/lib/ai/schema";
import { fixtureKey } from "@/lib/demo/key";
import type { Fixture } from "@/lib/demo/fixtures";

export const runtime = "nodejs";
export const maxDuration = 800;

/**
 * GRABADOR DEL GUION DE DEMO — solo en desarrollo.
 *
 * Llama a Claude de verdad para las combinaciones que le pidas y escribe el
 * resultado (razonamiento, tokens y propuestas) en src/lib/demo/fixtures.ts.
 * A partir de ahí la demo reproduce eso sin volver a llamar a nadie.
 *
 * Cuesta una llamada por combinación — unos 6.000 tokens, céntimos. Se paga
 * una vez y todos los pases posteriores salen gratis e idénticos.
 */
type Combo = {
  zoneId: string;
  productId: string;
  objective: string;
  networkId: string;
  count?: number;
};

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "El grabador solo está disponible en desarrollo." },
      { status: 403 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Falta ANTHROPIC_API_KEY" }, { status: 400 });
  }

  const { combos } = (await request.json()) as { combos: Combo[] };
  if (!Array.isArray(combos) || combos.length === 0) {
    return NextResponse.json({ error: "Sin combinaciones que grabar" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const existing = await loadExisting();
  const done: string[] = [];
  const failed: string[] = [];
  let inputTokens = 0;
  let outputTokens = 0;

  for (const combo of combos) {
    const key = fixtureKey(combo);
    try {
      const fixture = await record(client, combo);
      existing[key] = fixture;
      inputTokens += fixture.usage.input;
      outputTokens += fixture.usage.output;
      done.push(key);
    } catch (error) {
      failed.push(`${key}: ${error instanceof Error ? error.message : "error"}`);
    }
  }

  await writeFixtures(existing);

  return NextResponse.json({
    grabadas: done.length,
    total: Object.keys(existing).length,
    tokens: { entrada: inputTokens, salida: outputTokens },
    // Precio de referencia de Claude Opus 5: 5 $/MTok entrada, 25 $/MTok salida.
    costeAproxUsd: Number(
      ((inputTokens / 1e6) * 5 + (outputTokens / 1e6) * 25).toFixed(4),
    ),
    claves: done,
    fallos: failed,
  });
}

async function record(client: Anthropic, combo: Combo): Promise<Fixture> {
  const zone = SEED.zones.find((z) => z.id === combo.zoneId);
  const product = SEED.products.find((p) => p.id === combo.productId);
  if (!zone) throw new Error(`zona desconocida: ${combo.zoneId}`);
  if (!product) throw new Error(`producto desconocido: ${combo.productId}`);

  const net = getNetwork(combo.networkId);
  const brand = resolveBrand(SEED.brand, zone);
  const count = Math.min(Math.max(combo.count ?? 2, 1), 6);

  const req: GenerateRequest = {
    brandName: brand.name,
    positioning: brand.positioning,
    voice: brand.voice,
    claims: brand.claims,
    palette: {
      primary: brand.colors.primary,
      secondary: brand.colors.secondary,
      accent: brand.colors.accent,
    },
    zone: {
      name: zone.name,
      country: zone.country,
      language: zone.language,
      audience: zone.audience,
      insight: zone.insight,
      occasions: zone.occasions,
      regulatory: legalText(resolveLegal(SEED, zone).all),
    },
    product: {
      name: product.name,
      family: product.family,
      abv: product.abv,
      attributes: product.attributes,
      notes: product.notes,
    },
    objective: combo.objective,
    network: {
      name: net.name,
      toneShift: net.toneShift,
      copyGuide: net.copyGuide,
      hashtagPolicy: net.hashtagPolicy,
      ctaStyle: net.ctaStyle,
      avoid: net.avoid,
      handle: zone.handles?.[net.id] ?? `@${brand.name.toLowerCase()}`,
    },
    format: net.formats[0],
    count,
  };

  const stream = client.messages.stream({
    model: "claude-opus-5",
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    thinking: { type: "adaptive", display: "summarized" },
    tools: [PROPOSAL_TOOL],
    tool_choice: { type: "auto" },
    messages: [{ role: "user", content: buildUserPrompt(req) }],
  });

  let thinking = "";
  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "thinking_delta" &&
      event.delta.thinking
    ) {
      thinking += event.delta.thinking;
    }
  }

  const message = await stream.finalMessage();
  const toolUse = message.content.find(
    (b): b is Anthropic.ToolUseBlock =>
      b.type === "tool_use" && b.name === PROPOSAL_TOOL.name,
  );
  if (!toolUse) throw new Error("no devolvió propuestas estructuradas");

  const proposals = (toolUse.input as { proposals?: RawProposal[] }).proposals ?? [];
  if (proposals.length === 0) throw new Error("lista de propuestas vacía");

  return {
    thinking: thinking.trim(),
    usage: {
      input: message.usage.input_tokens,
      output: message.usage.output_tokens,
    },
    proposals,
    recordedAt: new Date().toISOString(),
  };
}

const FIXTURES_PATH = path.join(process.cwd(), "src", "lib", "demo", "fixtures.ts");
const DATA_PATH = path.join(process.cwd(), "src", "lib", "demo", "fixtures.json");

/** Los datos viven en JSON; el .ts solo los importa y los tipa. */
async function loadExisting(): Promise<Record<string, Fixture>> {
  try {
    return JSON.parse(await readFile(DATA_PATH, "utf8")) as Record<string, Fixture>;
  } catch {
    return {};
  }
}

async function writeFixtures(all: Record<string, Fixture>) {
  await mkdir(path.dirname(DATA_PATH), { recursive: true });
  await writeFile(DATA_PATH, `${JSON.stringify(all, null, 2)}\n`, "utf8");

  const header = `import type { RawProposal } from "@/lib/ai/schema";
import data from "./fixtures.json";

/**
 * GUION DE DEMO — los datos están en fixtures.json, grabados con
 * POST /api/dev/record. No los edites a mano.
 *
 * Cada entrada es una generación real de Claude que se reproduce igual en cada
 * pase: sin llamadas en vivo, sin coste y sin sorpresas delante del cliente.
 */
export type Fixture = {
  /** El razonamiento tal y como lo escribió el modelo. */
  thinking: string;
  usage: { input: number; output: number };
  proposals: RawProposal[];
  recordedAt: string;
};

export const FIXTURES = data as unknown as Record<string, Fixture>;

/** Claves disponibles, para que la interfaz marque lo que está preparado. */
export const FIXTURE_KEYS = new Set(Object.keys(FIXTURES));
`;
  await writeFile(FIXTURES_PATH, header, "utf8");
}
