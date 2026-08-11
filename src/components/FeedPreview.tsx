"use client";

import { CreativePreview } from "./CreativePreview";
import { getNetwork } from "@/lib/networks";
import type { Proposal, ResolvedBrand } from "@/lib/types";

type Props = {
  proposal: Proposal;
  brand: ResolvedBrand;
  productName: string;
  handle: string;
  width?: number;
};

/**
 * Enseña el creativo dentro del chrome de la red, no aislado sobre fondo
 * blanco. Es la única forma de ver si el copy aguanta el corte del "más",
 * si el titular compite con la interfaz o si el pie es demasiado largo.
 */
export function FeedPreview({
  proposal,
  brand,
  productName,
  handle,
  width = 300,
}: Props) {
  const net = getNetwork(proposal.networkId);
  const isStories = net.id === "instagram-stories";
  const isTikTok = net.id === "tiktok";
  const fullScreen = isStories || isTikTok;

  const creative = (
    <CreativePreview
      brand={brand}
      format={proposal.format}
      headline={proposal.headline}
      subhead={proposal.subhead}
      cta={proposal.cta}
      productName={productName}
      imageUrl={proposal.imageUrl}
      width={width}
      // Deja hueco para la interfaz de la red: pestañas arriba, pie abajo
      // y, en TikTok, la columna de acciones a la derecha.
      insetTop={fullScreen ? width * 0.075 : 0}
      insetBottom={isTikTok ? width * 0.3 : isStories ? width * 0.16 : 0}
      insetRight={isTikTok ? width * 0.14 : 0}
    />
  );

  if (fullScreen) {
    return (
      <FullScreenChrome
        net={net.id}
        brand={brand}
        handle={handle}
        caption={proposal.caption || proposal.body}
        hashtags={proposal.hashtags}
        width={width}
      >
        {creative}
      </FullScreenChrome>
    );
  }

  if (net.id === "facebook") {
    return (
      <FacebookChrome
        brand={brand}
        handle={handle}
        caption={proposal.caption || proposal.body}
        hashtags={proposal.hashtags}
        width={width}
      >
        {creative}
      </FacebookChrome>
    );
  }

  return (
    <FeedChrome
      brand={brand}
      handle={handle}
      caption={proposal.caption || proposal.body}
      hashtags={proposal.hashtags}
      accent={net.brandColor}
      width={width}
    >
      {creative}
    </FeedChrome>
  );
}

/* ── Publicación de Facebook ────────────────────────────────────────────── */
function FacebookChrome({
  brand,
  handle,
  caption,
  hashtags,
  width,
  children,
}: {
  brand: ResolvedBrand;
  handle: string;
  caption: string;
  hashtags: string[];
  width: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
      style={{ width }}
    >
      <div className="flex items-center gap-2 px-3 pt-3">
        <span
          className="grid h-8 w-8 place-items-center rounded-full text-[12px] font-bold text-white"
          style={{ background: brand.colors.primary }}
        >
          {brand.name.slice(0, 1)}
        </span>
        <div className="leading-tight">
          <div className="text-[12.5px] font-semibold">{handle.replace(/^@/, "")}</div>
          <div className="text-[10.5px] text-[var(--muted)]">Publicidad · 🌐</div>
        </div>
        <span className="ml-auto text-[15px] leading-none text-[var(--muted)]">···</span>
      </div>

      {/* En Facebook el texto va ENCIMA de la imagen: el copy tiene que
          funcionar sin apoyarse en el creativo. */}
      <div className="px-3 pb-2.5 pt-2">
        <p className="text-[12.5px] leading-snug">{caption}</p>
        {hashtags.length ? (
          <p className="mt-1 text-[12.5px]" style={{ color: "#1877F2" }}>
            {hashtags.map((h) => `#${h}`).join(" ")}
          </p>
        ) : null}
      </div>

      {children}

      <div className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-[var(--muted)]">
        <span className="grid h-4 w-4 place-items-center rounded-full bg-[#1877F2] text-[9px] text-white">
          👍
        </span>
        <span>842</span>
        <span className="ml-auto">96 comentarios · 41 veces compartido</span>
      </div>

      <div className="grid grid-cols-3 border-t border-[var(--line)] text-[12px] font-semibold text-[var(--muted)]">
        {["Me gusta", "Comentar", "Compartir"].map((t) => (
          <span key={t} className="py-2 text-center">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Publicación de feed (Instagram, Facebook, YouTube, Spotify) ─────────── */
function FeedChrome({
  brand,
  handle,
  caption,
  hashtags,
  accent,
  width,
  children,
}: {
  brand: ResolvedBrand;
  handle: string;
  caption: string;
  hashtags: string[];
  accent: string;
  width: number;
  children: React.ReactNode;
}) {
  // El corte real del "… más" en Instagram ronda los 125 caracteres.
  const truncated = caption.length > 125;
  const visible = truncated ? `${caption.slice(0, 125)}…` : caption;

  return (
    <div
      className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
      style={{ width }}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span
          className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${accent}, ${brand.colors.primary})` }}
        >
          {brand.name.slice(0, 1)}
        </span>
        <span className="text-[12.5px] font-semibold">{handle}</span>
        <span className="ml-auto text-[15px] leading-none text-[var(--muted)]">···</span>
      </div>

      {children}

      <div className="flex items-center gap-3.5 px-3 py-2.5 text-[var(--ink)]">
        <Heart /> <Comment /> <Send />
        <span className="ml-auto">
          <Bookmark />
        </span>
      </div>

      <div className="px-3 pb-3.5">
        <p className="text-[12px] font-semibold">1.248 Me gusta</p>
        <p className="mt-1 text-[12.5px] leading-snug">
          <span className="font-semibold">{handle}</span> {visible}
          {truncated ? <span className="text-[var(--muted)]"> más</span> : null}
        </p>
        {hashtags.length ? (
          <p className="mt-1 text-[12.5px] leading-snug" style={{ color: "#2b5fa8" }}>
            {hashtags.map((h) => `#${h}`).join(" ")}
          </p>
        ) : null}
        <p className="mt-1.5 text-[10.5px] uppercase tracking-wide text-[var(--muted)]">
          Hace 2 horas
        </p>
      </div>
    </div>
  );
}

/* ── Pantalla completa (TikTok, Stories) ────────────────────────────────── */
function FullScreenChrome({
  net,
  brand,
  handle,
  caption,
  hashtags,
  width,
  children,
}: {
  net: string;
  brand: ResolvedBrand;
  handle: string;
  caption: string;
  hashtags: string[];
  width: number;
  children: React.ReactNode;
}) {
  const isStories = net === "instagram-stories";

  return (
    <div
      className="relative overflow-hidden rounded-[22px] bg-black shadow-[0_2px_14px_rgba(0,0,0,0.18)]"
      style={{ width }}
    >
      {children}

      {/* Barra de progreso de Stories */}
      {isStories ? (
        <div className="absolute inset-x-2.5 top-2.5 flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-[2.5px] flex-1 rounded-full"
              style={{ background: i === 0 ? "#fff" : "rgba(255,255,255,0.35)" }}
            />
          ))}
        </div>
      ) : null}

      {/* En Stories el @ va arriba; en TikTok arriba solo están las pestañas
          y el @ vive abajo, junto al pie. */}
      {isStories ? (
        <div className="absolute inset-x-3 top-6 flex items-center gap-2">
          <span
            className="grid h-6 w-6 place-items-center rounded-full border border-white/60 text-[10px] font-bold text-white"
            style={{ background: brand.colors.primary }}
          >
            {brand.name.slice(0, 1)}
          </span>
          <span className="text-[11.5px] font-semibold text-white drop-shadow">
            {handle}
          </span>
        </div>
      ) : (
        <div className="absolute inset-x-0 top-3 flex justify-center gap-4 text-[11.5px] font-semibold">
          <span className="text-white/55 drop-shadow">Siguiendo</span>
          <span className="text-white drop-shadow">Para ti</span>
        </div>
      )}

      {/* Columna de acciones de TikTok */}
      {!isStories ? (
        <div className="absolute bottom-24 right-2.5 flex flex-col items-center gap-3.5 text-white">
          {[
            { icon: <Heart white />, n: "12,4K" },
            { icon: <Comment white />, n: "318" },
            { icon: <Bookmark white />, n: "2.1K" },
            { icon: <Send white />, n: "907" },
          ].map((a, i) => (
            <span key={i} className="flex flex-col items-center gap-0.5">
              {a.icon}
              <span className="text-[9px] font-semibold drop-shadow">{a.n}</span>
            </span>
          ))}
        </div>
      ) : null}

      {/* Pie */}
      <div className="absolute inset-x-3 bottom-3 pr-10">
        {!isStories ? (
          <div className="mb-1 flex items-center gap-1.5">
            <span
              className="grid h-5 w-5 place-items-center rounded-full border border-white/60 text-[9px] font-bold text-white"
              style={{ background: brand.colors.primary }}
            >
              {brand.name.slice(0, 1)}
            </span>
            <span className="text-[11.5px] font-semibold text-white drop-shadow">
              {handle}
            </span>
            <span className="rounded border border-white/70 px-1.5 py-px text-[9px] font-semibold text-white">
              Seguir
            </span>
          </div>
        ) : null}
        <p className="text-[11.5px] leading-snug text-white drop-shadow">
          {caption.length > 90 ? `${caption.slice(0, 90)}…` : caption}
        </p>
        {hashtags.length ? (
          <p className="mt-0.5 text-[11.5px] font-medium text-white/85 drop-shadow">
            {hashtags.map((h) => `#${h}`).join(" ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ── Iconos de interfaz ─────────────────────────────────────────────────── */
const ico = (white?: boolean) => ({
  width: white ? 22 : 19,
  height: white ? 22 : 19,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: white ? "#fff" : "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  style: white ? { filter: "drop-shadow(0 1px 2px rgba(0,0,0,.4))" } : undefined,
});

const Heart = ({ white }: { white?: boolean }) => (
  <svg {...ico(white)}>
    <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z" />
  </svg>
);
const Comment = ({ white }: { white?: boolean }) => (
  <svg {...ico(white)}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
  </svg>
);
const Send = ({ white }: { white?: boolean }) => (
  <svg {...ico(white)}>
    <path d="M21 4 3 11l7 2.6L13 21l8-17Z" />
  </svg>
);
const Bookmark = ({ white }: { white?: boolean }) => (
  <svg {...ico(white)}>
    <path d="M6 3h12v18l-6-4.5L6 21V3Z" />
  </svg>
);
