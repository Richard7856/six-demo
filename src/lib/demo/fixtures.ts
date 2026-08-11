import type { RawProposal } from "@/lib/ai/schema";
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
