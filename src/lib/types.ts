// ── Modelo de datos ────────────────────────────────────────────────────────
// La idea central: hay UN brand kit global (la marca madre) y cada zona
// puede sobreescribir partes de él. Nada se duplica: una zona guarda solo
// los campos que cambia. `resolveBrand()` mezcla ambos.

export type Palette = {
  primary: string; // verde Six
  secondary: string; // rojo estrella
  accent: string;
  ink: string; // texto sobre claro
  surface: string; // fondo
};

export type Typography = {
  display: string; // titulares
  body: string; // texto
};

export type Voice = {
  persona: string;
  tone: string[];
  do: string[];
  dont: string[];
};

export type BrandKit = {
  name: string;
  logoDataUrl: string | null; // si null, se dibuja un wordmark con la tipografía
  positioning: string;
  colors: Palette;
  fonts: Typography;
  voice: Voice;
  claims: string[];
};

/** Lo que una zona puede sobreescribir del brand kit global. */
export type BrandOverrides = {
  positioning?: string;
  colors?: Partial<Palette>;
  fonts?: Partial<Typography>;
  voice?: Partial<Voice>;
  claims?: string[];
};

export type Zone = {
  id: string;
  name: string;
  country: string;
  language: string; // "es-ES", "pt-BR"...
  audience: string;
  insight: string; // el insight cultural local: lo que hace distinta la zona
  occasions: string[]; // ocasiones de consumo
  /** Ids de las redes en las que la marca está viva en esta zona. */
  networks: string[];
  /** El @ de la marca en cada red, por zona: @six_mx vs @six_es. */
  handles: Record<string, string>;
  regulatory: string[]; // restricciones legales de publicidad de alcohol
  overrides: BrandOverrides;
};

export type Product = {
  id: string;
  name: string;
  family: string;
  abv: string;
  color: string; // color identificativo del pack
  attributes: string[];
  occasions: string[];
  notes: string;
};

export type ProposalFormat = "post-1x1" | "story-9x16" | "banner-16x9";

export type Proposal = {
  id: string;
  createdAt: string;
  zoneId: string;
  productId: string;
  objective: string;
  networkId: string;
  format: ProposalFormat;
  concept: string; // el nombre de la idea
  rationale: string; // por qué funciona en esa zona
  headline: string;
  subhead: string;
  body: string;
  cta: string;
  hashtags: string[];
  /** Copy tal y como se pega en el pie de publicación de esa red. */
  caption: string;
  /** Qué hace la marca cuando la gente responde. */
  communityReply: string;
  imagePrompt: string; // brief para el modelo de imagen
  imageUrl: string | null;
  kpis: string[];
  status: "draft" | "approved";
  engine: "claude" | "demo";
};

export type StudioState = {
  brand: BrandKit;
  zones: Zone[];
  products: Product[];
  proposals: Proposal[];
};

/** Brand kit ya resuelto para una zona concreta (global + overrides). */
export type ResolvedBrand = BrandKit & {
  zoneId: string | null;
  overridden: {
    positioning: boolean;
    colors: (keyof Palette)[];
    fonts: (keyof Typography)[];
    voice: (keyof Voice)[];
    claims: boolean;
  };
};
