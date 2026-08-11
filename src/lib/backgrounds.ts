import type { ProposalFormat } from "./types";

/**
 * Biblioteca de fondos.
 *
 * Generar imágenes con IA sale caro y, para una marca, es además la parte más
 * débil: no hay control de derechos ni consistencia de producto. Lo que se usa
 * de verdad es el banco de fotografía aprobada del cliente.
 *
 * Así que aquí no se genera nada: se elige de esta lista. Para añadir fondos,
 * deja el archivo en `public/backgrounds/` y añade una entrada abajo con sus
 * etiquetas. Cuantas más etiquetas, mejor casa con el brief.
 */
export type Background = {
  id: string;
  /** Ruta bajo /public. Una por formato; si falta, se usa `square`. */
  src: Partial<Record<ProposalFormat, string>>;
  /** Palabras del brief de imagen que hacen que este fondo encaje. */
  tags: string[];
  /** Descripción para el selector de la interfaz. */
  label: string;
};

export const BACKGROUNDS: Background[] = [
  {
    id: "tienda-pasillo",
    label: "Tienda Six: pasillo de botanas y neveras",
    src: {
      "post-1x1": "/backgrounds/tienda-pasillo.jpg",
      "story-9x16": "/backgrounds/tienda-pasillo-9x16.jpg",
      "banner-16x9": "/backgrounds/tienda-pasillo-16x9.jpg",
    },
    tags: [
      "store",
      "shop",
      "convenience",
      "aisle",
      "shelf",
      "shelves",
      "snacks",
      "fridge",
      "cooler",
      "checkout",
      "shopping",
      "customers",
      "tienda",
      "neighbourhood",
      "corner shop",
      "products",
      "browsing",
      "friends",
      "indoor",
    ],
  },
  {
    id: "mesa-larga-noche",
    label: "Mesa larga de noche, luces cálidas",
    src: {
      "post-1x1": "/backgrounds/mesa-larga-noche.jpg",
      "story-9x16": "/backgrounds/mesa-larga-noche-9x16.jpg",
      "banner-16x9": "/backgrounds/mesa-larga-noche-16x9.jpg",
    },
    tags: [
      "table",
      "long",
      "crowded",
      "night",
      "evening",
      "warm",
      "friends",
      "group",
      "dinner",
      "carne",
      "asada",
      "backyard",
      "string lights",
      "sobremesa",
      "gathering",
      "celebration",
    ],
  },
];

/**
 * Elige el fondo que mejor casa con el brief. Empata por número de etiquetas
 * encontradas en el texto; si no hay ninguna, reparte de forma determinista
 * para que dos propuestas distintas no salgan siempre con la misma imagen.
 */
export function pickBackground(
  prompt: string,
  format: ProposalFormat,
): string | null {
  if (BACKGROUNDS.length === 0) return null;

  const text = prompt.toLowerCase();
  let best: Background | null = null;
  let bestScore = -1;

  for (const bg of BACKGROUNDS) {
    const score = bg.tags.reduce((n, t) => (text.includes(t) ? n + 1 : n), 0);
    if (score > bestScore) {
      best = bg;
      bestScore = score;
    }
  }

  if (bestScore <= 0) {
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) hash = (hash * 31 + prompt.charCodeAt(i)) >>> 0;
    best = BACKGROUNDS[hash % BACKGROUNDS.length];
  }

  if (!best) return null;
  return best.src[format] ?? best.src["post-1x1"] ?? null;
}
