import { NextResponse } from "next/server";
import { pickBackground } from "@/lib/backgrounds";
import type { ProposalFormat } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

type Body = {
  prompt: string;
  format: ProposalFormat;
  palette?: { primary: string; secondary: string; accent: string; ink: string };
};

/**
 * Por defecto NO se genera ninguna imagen: se elige de la biblioteca local
 * (`public/backgrounds/`) y se simula la espera. Generar con IA cuesta dinero
 * real por imagen y para una marca no es lo que se acaba usando — se usa el
 * banco de fotografía aprobada.
 *
 * Para volver a generar de verdad hay que pedirlo explícitamente:
 *   IMAGE_PROVIDER=gemini   (o openai)
 * Sin esa variable, esta ruta no llama a ningún proveedor de pago.
 */
const GEMINI_ASPECT: Record<ProposalFormat, string> = {
  "post-1x1": "1:1",
  "story-9x16": "9:16",
  "banner-16x9": "16:9",
};

const OPENAI_SIZE: Record<ProposalFormat, string> = {
  "post-1x1": "1024x1024",
  "story-9x16": "1024x1536",
  "banner-16x9": "1536x1024",
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const provider = process.env.IMAGE_PROVIDER?.trim().toLowerCase();

  // Camino de pago: solo si se pide a propósito.
  if (provider === "gemini" || provider === "openai") {
    try {
      const imageUrl =
        provider === "gemini"
          ? await generateWithGemini(body)
          : await generateWithOpenAI(body);
      return NextResponse.json({ provider, imageUrl });
    } catch (error) {
      return NextResponse.json({
        provider: "library" as const,
        imageUrl: await fromLibrary(body),
        notice: `${provider}: ${summarize(error)} — usando la biblioteca local.`,
      });
    }
  }

  return NextResponse.json({
    provider: "library" as const,
    imageUrl: await fromLibrary(body),
  });
}

/** Elige de la biblioteca y simula el tiempo de una generación real. */
async function fromLibrary(body: Body): Promise<string> {
  // Una espera creíble: ni instantánea (delataría la simulación en la demo)
  // ni tan larga como una generación real.
  const delay = 900 + Math.floor(hash(body.prompt) % 900);
  await new Promise((r) => setTimeout(r, delay));

  return pickBackground(body.prompt, body.format) ?? placeholderImage(body);
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function summarize(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const inner = raw.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const text = (inner ? inner[1] : raw).replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
}

function wrapPrompt(prompt: string): string {
  return `${prompt}.

Photographic advertising background plate. Absolutely no text, no letters, no words, no logos, no brand marks, no watermarks anywhere in the image. Leave the lower third visually calm so a headline can be composited over it. All people depicted must clearly look 25 or older.`;
}

async function generateWithGemini(body: Body): Promise<string> {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("Falta GOOGLE_API_KEY");
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: wrapPrompt(body.prompt) }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: GEMINI_ASPECT[body.format] },
        },
      }),
    },
  );

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);

  const json = (await res.json()) as {
    candidates?: {
      content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] };
    }[];
  };

  for (const part of json.candidates?.[0]?.content?.parts ?? []) {
    const data = part.inlineData?.data;
    if (data) return `data:${part.inlineData?.mimeType ?? "image/png"};base64,${data}`;
  }

  throw new Error("La respuesta de Gemini no contenía ninguna imagen");
}

async function generateWithOpenAI(body: Body): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Falta OPENAI_API_KEY");
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      prompt: wrapPrompt(body.prompt),
      size: OPENAI_SIZE[body.format],
      n: 1,
    }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);

  const json = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
  const item = json.data?.[0];
  if (item?.b64_json) return `data:image/png;base64,${item.b64_json}`;
  if (item?.url) return item.url;

  throw new Error("La respuesta de OpenAI no contenía ninguna imagen");
}

/** Último recurso si la biblioteca está vacía: degradado con la paleta. */
function placeholderImage(body: Body): string {
  const p = body.palette ?? {
    primary: "#E1211D",
    secondary: "#E4022D",
    accent: "#F5B301",
    ink: "#1A1917",
  };

  const h = hash(body.prompt);
  const at = (n: number, mod: number) => ((h >> (n * 4)) & 0xff) % mod;

  const [w, hgt] =
    body.format === "story-9x16"
      ? [900, 1600]
      : body.format === "banner-16x9"
        ? [1600, 900]
        : [1200, 1200];

  const blobs = [0, 1, 2, 3]
    .map((i) => {
      const cx = 8 + at(i, 84);
      const cy = 6 + at(i + 2, 78);
      const r = 20 + at(i + 4, 34);
      const fill = [p.accent, p.secondary, p.primary, "#ffffff"][i];
      const op = [0.5, 0.34, 0.6, 0.14][i];
      return `<circle cx="${cx}%" cy="${cy}%" r="${r}%" fill="${fill}" opacity="${op}"/>`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${hgt}" viewBox="0 0 ${w} ${hgt}">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${p.primary}"/><stop offset="1" stop-color="${p.ink}"/>
</linearGradient>
<filter id="b" x="-30%" y="-30%" width="160%" height="160%">
<feGaussianBlur stdDeviation="${Math.round(Math.min(w, hgt) / 9)}"/>
</filter>
</defs>
<rect width="${w}" height="${hgt}" fill="url(#g)"/>
<g filter="url(#b)">${blobs}</g>
<rect width="${w}" height="${hgt}" fill="${p.ink}" opacity="0.18"/>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}
