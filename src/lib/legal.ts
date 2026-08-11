import type { LegalRule, StudioState, Zone } from "./types";

/**
 * MARCO LEGAL
 *
 * Misma idea que el brand kit: hay reglas globales que aplican en todo México
 * y cada zona añade las suyas. Nada se duplica.
 *
 * La distinción que de verdad importa es `validated`. Las reglas de arranque
 * las redacté yo a partir de cómo se regula la publicidad de alcohol en
 * México y de búsqueda pública — suenan plausibles y son específicas, que es
 * justo lo que las hace peligrosas: nadie sospecha que son suposiciones.
 * Hasta que el equipo legal de Six las revise, el auditor las trata como
 * orientativas y no bloquea una pieza apoyándose solo en ellas.
 */
export type ResolvedLegal = {
  global: LegalRule[];
  zone: LegalRule[];
  /** Todas las que aplican a esta zona, globales primero. */
  all: LegalRule[];
};

export function resolveLegal(
  state: Pick<StudioState, "legal">,
  zone?: Zone | null,
): ResolvedLegal {
  const global = state.legal ?? [];
  const own = zone?.regulatory ?? [];
  return { global, zone: own, all: [...global, ...own] };
}

/** Las reglas como líneas de texto, para los prompts que esperan strings. */
export function legalText(rules: LegalRule[]): string[] {
  return rules.map((r) => (r.validated ? r.text : `${r.text} (sin validar)`));
}

/** Solo el texto, sin marcar. Para donde el matiz no cabe. */
export function plainText(rules: LegalRule[]): string[] {
  return rules.map((r) => r.text);
}

export function countPending(rules: LegalRule[]): number {
  return rules.filter((r) => !r.validated).length;
}

/** Id estable para una regla nueva creada desde la interfaz. */
export function newRuleId(): string {
  return `rule-${Math.random().toString(36).slice(2, 9)}`;
}
