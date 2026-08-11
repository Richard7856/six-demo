import type { GenerateRequest, RawProposal } from "./schema";

/**
 * Motor de respaldo cuando no hay ANTHROPIC_API_KEY.
 * No es IA: son plantillas que recombinan el insight, las ocasiones y los
 * atributos del producto para que la demo sea navegable de principio a fin.
 * El copy sale siempre en castellano — el modelo real escribe en el idioma
 * de la zona.
 */

type Angle = {
  key: string;
  concept: (r: GenerateRequest) => string;
  headline: (r: GenerateRequest, occasion: string) => string;
  subhead: (r: GenerateRequest, occasion: string) => string;
  cta: string;
  scene: (r: GenerateRequest, occasion: string) => string;
  kpis: string[];
};

const ANGLES: Angle[] = [
  {
    key: "ocasion",
    concept: (r) => `La hora de ${r.product.name.split(" ").pop()}`,
    headline: (_r, o) => `${cap(o)} sabe mejor acompañado`,
    subhead: (r, o) => `${cap(o)} es de las cosas que no se hacen solo. ${r.product.name} tampoco.`,
    cta: "Encuentra tu sitio",
    scene: (r, o) =>
      `Documentary-style wide shot of a small group of adults in their thirties enjoying ${o.toLowerCase()} in ${r.zone.country}, warm late-afternoon light, candid unposed expressions, shallow depth of field, natural colour grade, no text`,
    kpis: ["Alcance sobre audiencia 25-40", "Coste por interacción", "Sentiment en comentarios"],
  },
  {
    key: "insight",
    concept: () => "El pretexto perfecto",
    headline: () => "Nadie queda por la cerveza",
    subhead: (r) => firstSentence(r.zone.insight),
    cta: "Queda con alguien",
    scene: (r) =>
      `Editorial photograph of two adults meeting at a table in ${r.zone.country}, mid-conversation, hands gesturing, blurred street life behind, golden hour, 50mm, film grain, no text`,
    kpis: ["Recuerdo de marca asistido", "Tasa de guardado", "Comentarios con mención de ocasión"],
  },
  {
    key: "producto",
    concept: (r) => `${r.product.family} sin rodeos`,
    headline: (r) => `${topAttribute(r)}. Punto.`,
    subhead: (r) =>
      `${r.product.name}, ${r.product.abv}. ${r.product.attributes.slice(0, 2).join(" y ")}.`,
    cta: "Descúbrela",
    scene: (r) =>
      `Close-up product-adjacent still life on a bar counter in ${r.zone.country}, condensation on cold glass, dramatic side light, dark moody background, macro detail, no text`,
    kpis: ["Intención de compra declarada", "Clics a localizador de puntos de venta", "CTR"],
  },
  {
    key: "comunidad",
    concept: () => "Mesa abierta",
    headline: (_r, o) => `Siempre cabe uno más en ${lowerOccasionNoun(o)}`,
    subhead: (r) => `Lo bueno de ${r.zone.name} es que nadie se queda fuera.`,
    cta: "Trae a alguien",
    scene: (r, o) =>
      `Overhead shot of a long crowded table during ${o.toLowerCase()} in ${r.zone.country}, many hands reaching in, shared food, warm ambient light, authentic documentary feel, no text`,
    kpis: ["Alcance orgánico", "Compartidos", "Crecimiento de comunidad"],
  },
  {
    key: "ritual",
    concept: () => "El gesto de siempre",
    headline: () => "Lo de siempre, pero contigo",
    subhead: (r, o) => `${cap(o)} no cambia. Cambia con quién.`,
    cta: "Repite el plan",
    scene: (r, o) =>
      `Cinematic still of a familiar neighbourhood spot in ${r.zone.country} during ${o.toLowerCase()}, regulars greeting each other, soft evening light through windows, muted palette, no text`,
    kpis: ["Frecuencia de compra", "Recuerdo espontáneo", "Engagement rate"],
  },
];

export function generateDemoProposals(req: GenerateRequest): RawProposal[] {
  const out: RawProposal[] = [];
  const occasions = req.zone.occasions.length ? req.zone.occasions : ["un buen momento"];

  for (let i = 0; i < req.count; i++) {
    const angle = ANGLES[i % ANGLES.length];
    const occasion = occasions[i % occasions.length];

    out.push({
      concept: angle.concept(req),
      rationale: `Ángulo "${angle.key}" aplicado a ${req.zone.name}: parte del insight local (${firstSentence(
        req.zone.insight,
      )}) y lo aterriza en la ocasión "${occasion}", que es donde ${req.product.name} tiene permiso para estar.`,
      headline: angle.headline(req, occasion),
      subhead: angle.subhead(req, occasion),
      body: `${angle.subhead(req, occasion)} ${req.product.name} para ${occasion.toLowerCase()}, en ${
        req.zone.country
      }. ${req.claims[0] ?? ""}`.trim(),
      cta: angle.cta,
      caption: `${angle.headline(req, occasion)} ${angle.subhead(req, occasion)}`.slice(0, 125),
      communityReply:
        "¡Gracias por pasarte! Cuéntanos con quién te tomarías esta y lo vemos. 🍺 Recuerda disfrutar con moderación.",
      hashtags: [
        slug(req.brandName),
        slug(req.zone.name),
        slug(angle.concept(req)),
      ].filter(Boolean),
      imagePrompt: angle.scene(req, occasion),
      kpis: angle.kpis,
    });
  }

  return out;
}

// ── helpers ──────────────────────────────────────────────────────────────
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const firstSentence = (s: string) => {
  const m = s.match(/^[^.!?]+[.!?]?/);
  return (m ? m[0] : s).trim();
};

const topAttribute = (r: GenerateRequest) =>
  r.product.attributes[0] ?? r.product.family;

const lowerOccasionNoun = (o: string) => {
  const t = o.toLowerCase();
  return t.startsWith("el ") || t.startsWith("la ") ? t : `la ${t}`;
};

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .map((w, i) => (i === 0 ? w.toLowerCase() : cap(w.toLowerCase())))
    .join("");
