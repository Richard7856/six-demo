import Anthropic from "@anthropic-ai/sdk";
import { generateDemoProposals } from "@/lib/ai/demo";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/ai/prompt";
import { PROPOSAL_TOOL, type GenerateRequest, type RawProposal } from "@/lib/ai/schema";
import { encodeEvent, type TraceEvent } from "@/lib/trace";
import { FIXTURES } from "@/lib/demo/fixtures";
import { fixtureKey } from "@/lib/demo/key";
import { BACKGROUNDS, pickBackground } from "@/lib/backgrounds";

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = "claude-opus-5";

/**
 * Cómo se resuelve una petición:
 *   auto (por defecto) → si la combinación está en el guion grabado la
 *                        reproduce; si no, genera en vivo con Claude.
 *   strict             → solo guion. Nunca llama a nadie ni gasta. Para una
 *                        demo cerrada donde no puede haber sorpresas.
 *   live               → siempre en vivo, ignorando el guion.
 */
const DEMO_MODE = (process.env.DEMO_MODE ?? "auto").toLowerCase();
const USE_FIXTURES = DEMO_MODE !== "live";
const ONLY_FIXTURES = DEMO_MODE === "strict";

/**
 * Devuelve un stream NDJSON con la traza de trabajo y, al final, las
 * propuestas. Se emite mientras se trabaja para que la interfaz pueda enseñar
 * lo que está pasando en vez de una ruleta.
 */
export async function POST(request: Request) {
  let req: GenerateRequest;
  try {
    req = (await request.json()) as GenerateRequest;
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), { status: 400 });
  }

  req.count = Math.min(Math.max(Number(req.count) || 3, 1), 6);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Si el cliente se desconecta (o el servidor recompila en desarrollo) el
      // controlador queda cerrado y cualquier enqueue lanza. Sin esta guarda,
      // esa excepción mataba el stream a mitad y la traza se quedaba colgada
      // sin decir por qué.
      let closed = false;
      let finished = false;

      const emit = (e: TraceEvent) => {
        if (closed) return;
        if (e.t === "done") finished = true;
        try {
          controller.enqueue(encodeEvent(e));
        } catch {
          closed = true;
        }
      };

      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* ya estaba cerrado */
        }
      };

      // Envuelve un paso midiendo lo que tarda de verdad.
      const step = async <T,>(
        id: string,
        label: string,
        fn: () => T | Promise<T>,
        detail?: (r: T) => string,
      ): Promise<T> => {
        const started = Date.now();
        const result = await fn();
        emit({
          t: "step",
          id,
          label,
          detail: detail?.(result),
          ms: Date.now() - started,
        });
        return result;
      };

      try {
        await step(
          "brand",
          `Resolviendo el brand kit para ${req.zone.name}`,
          () => req.claims.length,
          (n) => `${n} claim${n === 1 ? "" : "s"} · tono: ${req.voice.tone.join(", ")}`,
        );

        await step(
          "network",
          `Cargando el manual de ${req.network.name}`,
          () => req.network,
          (n) => `publica como ${n.handle} · ${n.hashtagPolicy.toLowerCase()}`,
        );

        await step(
          "legal",
          "Aplicando restricciones del mercado",
          () => req.zone.regulatory.length,
          (n) => (n ? `${n} reglas duras` : "sin restricciones cargadas"),
        );

        const prompt = await step(
          "brief",
          "Redactando el brief",
          () => buildUserPrompt(req),
          (p) => `${p.length.toLocaleString("es")} caracteres`,
        );

        // ── Guion grabado ────────────────────────────────────────────
        const key = req.ids
          ? fixtureKey({ ...req.ids, objective: req.objective })
          : null;
        const fixture = key ? FIXTURES[key] : null;

        if (USE_FIXTURES && fixture) {
          emit({
            t: "call",
            label: `Llamando a ${MODEL}`,
            detail: `herramienta ${PROPOSAL_TOOL.name} · ${req.count} propuesta${
              req.count === 1 ? "" : "s"
            } · razonamiento visible`,
          });

          await replayThinking(fixture.thinking, emit);
          emit({ t: "usage", input: fixture.usage.input, output: fixture.usage.output });
          emit({
            t: "done",
            engine: "claude",
            proposals: await attachBackgrounds(
              fixture.proposals.slice(0, req.count).map((p) => ({ ...p })),
              req,
              emit,
            ),
          });
          close();
          return;
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (ONLY_FIXTURES) {
          // En modo estricto no se llama a nadie: en una demo cerrada una
          // llamada en vivo inesperada es justo lo que no se quiere.
          emit({
            t: "notice",
            text: "Esta combinación no está en el guion grabado; usando el motor local.",
          });
          emit({
            t: "done",
            engine: "demo",
            proposals: await attachBackgrounds(generateDemoProposals(req), req, emit),
          });
          close();
          return;
        }

        if (!apiKey) {
          emit({
            t: "notice",
            text: "Sin ANTHROPIC_API_KEY: usando el motor de plantillas local.",
          });
          emit({
            t: "done",
            engine: "demo",
            proposals: await attachBackgrounds(generateDemoProposals(req), req, emit),
          });
          close();
          return;
        }

        emit({
          t: "call",
          label: `Llamando a ${MODEL}`,
          detail: `herramienta ${PROPOSAL_TOOL.name} · ${req.count} propuesta${
            req.count === 1 ? "" : "s"
          } · razonamiento visible`,
        });

        const proposals = await askClaude(new Anthropic({ apiKey }), req, prompt, emit);
        emit({
          t: "done",
          engine: "claude",
          proposals: await attachBackgrounds(proposals, req, emit),
        });
      } catch (error) {
        // No dejamos al usuario sin nada: motor demo y aviso de qué pasó.
        const message = error instanceof Error ? error.message : "Error desconocido";
        emit({ t: "notice", text: `La llamada a Claude falló (${message}).` });
        emit({
          t: "done",
          engine: "demo",
          proposals: attachBackgroundsQuietly(generateDemoProposals(req), req),
        });
      } finally {
        // Pase lo que pase, el cliente recibe un `done`: sin él la interfaz se
        // queda con la traza a medias y sin saber que algo falló.
        if (!finished) {
          emit({ t: "notice", text: "La generación se interrumpió antes de terminar." });
          emit({
            t: "done",
            engine: "demo",
            proposals: attachBackgroundsQuietly(generateDemoProposals(req), req),
          });
        }
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      // Evita que un proxy intermedio acumule el stream y lo suelte de golpe.
      "x-accel-buffering": "no",
    },
  });
}

/**
 * Escupe el razonamiento grabado por trozos, con un ritmo parecido al real.
 * De golpe delataría la reproducción; demasiado lento aburre en directo.
 */
async function replayThinking(text: string, emit: (e: TraceEvent) => void) {
  const words = text.split(/(\s+)/);
  let chunk = "";
  let emitted = 0;
  const budgetMs = 5200;
  const perChunk = Math.max(28, Math.min(90, budgetMs / Math.ceil(words.length / 7)));

  for (const w of words) {
    chunk += w;
    emitted++;
    if (emitted >= 7) {
      emit({ t: "thinking", text: chunk });
      chunk = "";
      emitted = 0;
      await new Promise((r) => setTimeout(r, perChunk));
    }
  }
  if (chunk) emit({ t: "thinking", text: chunk });
}

/**
 * Asigna a cada propuesta el fondo de la biblioteca que mejor casa con su
 * brief de imagen. Se hace aquí para que la propuesta llegue ya montada y
 * nadie tenga que pulsar nada; el botón de la ficha sigue estando para
 * cambiarlo.
 */
/** Igual que attachBackgrounds pero sin contarlo, para las rutas de error. */
function attachBackgroundsQuietly(
  proposals: RawProposal[],
  req: GenerateRequest,
): RawProposal[] {
  for (const p of proposals) p.imageUrl = pickBackground(p.imagePrompt, req.format);
  return proposals;
}

async function attachBackgrounds(
  proposals: RawProposal[],
  req: GenerateRequest,
  emit: (e: TraceEvent) => void,
) {
  const started = Date.now();
  const labels: string[] = [];

  for (const p of proposals) {
    p.imageUrl = pickBackground(p.imagePrompt, req.format);
    const bg = BACKGROUNDS.find((b) =>
      Object.values(b.src).some((src) => src === p.imageUrl),
    );
    if (bg && !labels.includes(bg.label)) labels.push(bg.label);
  }

  // Un respiro para que el paso se lea en la consola en vez de parpadear.
  await new Promise((r) => setTimeout(r, 450));

  emit({
    t: "step",
    id: "background",
    label: `Eligiendo fondo de la biblioteca para ${proposals.length} pieza${
      proposals.length === 1 ? "" : "s"
    }`,
    detail: labels.length ? labels.join(" · ") : "sin coincidencia — degradado de marca",
    ms: Date.now() - started,
  });

  return proposals;
}

async function askClaude(
  client: Anthropic,
  req: GenerateRequest,
  prompt: string,
  emit: (e: TraceEvent) => void,
): Promise<RawProposal[]> {
  const params: Anthropic.MessageStreamParams = {
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    // Pedimos el razonamiento resumido: es lo que se enseña en la traza.
    thinking: { type: "adaptive", display: "summarized" },
    tools: [PROPOSAL_TOOL],
    // Elección automática, no forzada. Con `tool_choice: tool` el modelo salta
    // directo a la llamada y no razona nada — comprobado: la respuesta vuelve
    // con un único bloque `tool_use`. En automático sí piensa antes, que es lo
    // que queremos enseñar. Si aun así no llamara a la herramienta, más abajo
    // se reintenta forzándola.
    tool_choice: { type: "auto" },
    messages: [{ role: "user", content: prompt }],
  };

  const run = async (p: Anthropic.MessageStreamParams) => {
    const stream = client.messages.stream(p);
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "thinking_delta" &&
        event.delta.thinking
      ) {
        emit({ t: "thinking", text: event.delta.thinking });
      }
    }
    return stream.finalMessage();
  };

  const findTool = (m: Anthropic.Message) =>
    m.content.find(
      (block): block is Anthropic.ToolUseBlock =>
        block.type === "tool_use" && block.name === PROPOSAL_TOOL.name,
    );

  let response = await run(params);
  let toolUse = findTool(response);

  if (!toolUse) {
    // Red de seguridad: si contestó en prosa, repetimos forzando la herramienta.
    // Se pierde el razonamiento, pero la estructura está garantizada.
    emit({
      t: "notice",
      text: "No llamó a la herramienta; repitiendo con la salida estructurada forzada.",
    });
    response = await run({
      ...params,
      tool_choice: { type: "tool", name: PROPOSAL_TOOL.name },
    });
    toolUse = findTool(response);
  }

  emit({
    t: "usage",
    input: response.usage.input_tokens,
    output: response.usage.output_tokens,
  });

  if (response.stop_reason === "refusal") {
    throw new Error("El modelo declinó la petición. Revisa el brief.");
  }

  if (!toolUse) throw new Error("El modelo no devolvió propuestas estructuradas");

  const input = toolUse.input as { proposals?: RawProposal[] };
  if (!Array.isArray(input.proposals) || input.proposals.length === 0) {
    throw new Error("El modelo devolvió una lista de propuestas vacía");
  }

  return input.proposals.slice(0, req.count);
}
