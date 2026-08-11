"use client";

import { forwardRef } from "react";
import { FORMAT_SPEC } from "@/lib/formats";
import type { ProposalFormat, ResolvedBrand } from "@/lib/types";

type Props = {
  brand: ResolvedBrand;
  format: ProposalFormat;
  headline: string;
  subhead?: string;
  cta?: string;
  productName?: string;
  imageUrl?: string | null;
  loading?: boolean;
  /** Ancho de render en px. La tipografía escala con él. */
  width?: number;
  /** Márgenes extra para no chocar con la interfaz de la red. */
  insetTop?: number;
  insetBottom?: number;
  insetRight?: number;
};

/**
 * El fondo lo pone la IA; el logo, la tipografía y los colores los pone el
 * brand kit y se componen aquí. Así la marca nunca queda a merced del modelo
 * de imagen y editar una zona no cuesta una generación nueva.
 */
export const CreativePreview = forwardRef<HTMLDivElement, Props>(
  function CreativePreview(
    {
      brand,
      format,
      headline,
      subhead,
      cta,
      productName,
      imageUrl,
      loading,
      width = 420,
      insetTop = 0,
      insetBottom = 0,
      insetRight = 0,
    },
    ref,
  ) {
    const spec = FORMAT_SPEC[format];
    const u = width / 100; // unidad base: todo escala con el ancho
    const isTall = format === "story-9x16";

    return (
      <div
        ref={ref}
        style={{
          width,
          aspectRatio: spec.ratio,
          position: "relative",
          overflow: "hidden",
          borderRadius: 12 * (width / 420),
          background: brand.colors.primary,
          color: "#fff",
          fontFamily: brand.fonts.body,
          isolation: "isolate",
        }}
      >
        {/* Fondo generado */}
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            crossOrigin="anonymous"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            className={loading ? "pulsing" : undefined}
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(150deg, ${brand.colors.primary} 0%, ${brand.colors.ink} 65%, ${brand.colors.accent} 160%)`,
            }}
          />
        )}

        {/* Scrim: garantiza contraste del texto sobre cualquier imagen.
            El de arriba es más suave y solo protege el logo y el chip. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to top, rgba(4,16,10,0.86) 0%, rgba(4,16,10,0.42) ${
              isTall ? "46%" : "56%"
            }, rgba(4,16,10,0.06) 100%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            insetInline: 0,
            top: 0,
            height: "22%",
            background:
              "linear-gradient(to bottom, rgba(4,16,10,0.55) 0%, rgba(4,16,10,0) 100%)",
          }}
        />

        {/* Contenido */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: u * 7,
            paddingTop: u * 7 + insetTop,
            paddingBottom: u * 7 + insetBottom,
            paddingRight: u * 7 + insetRight,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <Wordmark brand={brand} u={u} />
            {productName ? (
              <span
                style={{
                  fontSize: u * 2.6,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  background: "rgba(255,255,255,0.16)",
                  border: "1px solid rgba(255,255,255,0.28)",
                  borderRadius: 999,
                  padding: `${u * 1}px ${u * 2.4}px`,
                  backdropFilter: "blur(4px)",
                }}
              >
                {productName}
              </span>
            ) : null}
          </div>

          <div>
            <h2
              style={{
                fontFamily: brand.fonts.display,
                fontSize: u * (isTall ? 8.2 : 7.4),
                lineHeight: 1.02,
                fontWeight: 800,
                letterSpacing: "-0.025em",
                margin: 0,
                textWrap: "balance",
              }}
            >
              {headline}
            </h2>

            {subhead ? (
              <p
                style={{
                  margin: `${u * 2.2}px 0 0`,
                  fontSize: u * 3.3,
                  lineHeight: 1.32,
                  color: "rgba(255,255,255,0.86)",
                  maxWidth: isTall ? "100%" : "78%",
                }}
              >
                {subhead}
              </p>
            ) : null}

            <div
              style={{
                marginTop: u * 3.4,
                display: "flex",
                alignItems: "center",
                gap: u * 2.4,
                flexWrap: "wrap",
              }}
            >
              {cta ? (
                <span
                  style={{
                    background: brand.colors.accent,
                    color: brand.colors.ink,
                    fontWeight: 800,
                    fontSize: u * 2.9,
                    letterSpacing: "0.02em",
                    borderRadius: 999,
                    padding: `${u * 1.6}px ${u * 3.6}px`,
                  }}
                >
                  {cta}
                </span>
              ) : null}
              <span
                style={{
                  fontSize: u * 2.1,
                  color: "rgba(255,255,255,0.62)",
                  letterSpacing: "0.03em",
                }}
              >
                Disfruta de un consumo responsable · +18
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

function Wordmark({ brand, u }: { brand: ResolvedBrand; u: number }) {
  if (brand.logoDataUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={brand.logoDataUrl}
        alt={brand.name}
        style={{ height: u * 7, width: "auto", objectFit: "contain" }}
      />
    );
  }

  // Sin logo cargado: wordmark tipográfico con la estrella como acento.
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: u * 1.2,
        fontFamily: brand.fonts.display,
        fontSize: u * 4.2,
        fontWeight: 800,
        letterSpacing: "-0.02em",
        textTransform: "uppercase",
      }}
    >
      <svg width={u * 4} height={u * 4} viewBox="0 0 24 24" aria-hidden>
        <path
          d="M12 2.5 20.4 7.25v9.5L12 21.5 3.6 16.75v-9.5L12 2.5Z"
          fill={brand.colors.secondary}
        />
      </svg>
      {brand.name}
    </span>
  );
}
