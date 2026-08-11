import type { ProposalFormat } from "./types";

// Vive aquí, fuera de cualquier módulo "use client": las rutas de API también
// lo necesitan, y Next sustituye los exports de un módulo cliente por
// referencias vacías cuando se importan desde el servidor.
export const FORMAT_SPEC: Record<
  ProposalFormat,
  { label: string; ratio: string; px: [number, number] }
> = {
  "post-1x1": { label: "Post 1:1", ratio: "1 / 1", px: [1080, 1080] },
  "story-9x16": { label: "Story 9:16", ratio: "9 / 16", px: [1080, 1920] },
  "banner-16x9": { label: "Banner 16:9", ratio: "16 / 9", px: [1600, 900] },
};
