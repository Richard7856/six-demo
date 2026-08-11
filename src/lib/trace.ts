import type { RawProposal } from "./ai/schema";

/**
 * Eventos que el generador va emitiendo mientras trabaja.
 *
 * Casi todo esto es real, no atrezzo: los pasos son los que de verdad ocurren
 * (resolver la herencia de marca, cargar el manual de la red, montar el brief,
 * llamar al modelo) y el razonamiento sale del propio Claude. Lo único que se
 * añade es un poco de ritmo para que se pueda leer.
 */
export type TraceEvent =
  /** Un paso del pipeline. `ms` lo rellena el servidor al cerrarlo. */
  | { t: "step"; id: string; label: string; detail?: string; ms?: number }
  /** Razonamiento del modelo, en trozos según va llegando. */
  | { t: "thinking"; text: string }
  /** Llamada a un modelo o herramienta externa. */
  | { t: "call"; label: string; detail?: string }
  /** Consumo de tokens de la llamada. */
  | { t: "usage"; input: number; output: number }
  /** Aviso no fatal (cayó al motor demo, etc.). */
  | { t: "notice"; text: string }
  /** Fin: las propuestas listas. */
  | { t: "done"; engine: "claude" | "demo"; proposals: RawProposal[] };

/** Serializa un evento como una línea NDJSON. */
export function encodeEvent(event: TraceEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

/** Lee un stream NDJSON y entrega los eventos uno a uno. */
export async function* readTrace(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<TraceEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Un evento por línea; la última puede venir partida.
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        yield JSON.parse(line) as TraceEvent;
      } catch {
        // Línea incompleta o corrupta: la saltamos en vez de tumbar el stream.
      }
    }
  }

  if (buffer.trim()) {
    try {
      yield JSON.parse(buffer) as TraceEvent;
    } catch {
      /* ignorar */
    }
  }
}
