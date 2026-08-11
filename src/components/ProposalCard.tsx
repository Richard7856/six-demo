"use client";

import { useRef, useState } from "react";
import { CreativePreview } from "./CreativePreview";
import { FeedPreview } from "./FeedPreview";
import { FORMAT_SPEC } from "@/lib/formats";
import { compressDataUrl } from "@/lib/image";
import { getNetwork } from "@/lib/networks";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { Check, Download, Refresh, Sparkles, Trash } from "./icons";
import type { Proposal, ResolvedBrand } from "@/lib/types";

type Props = {
  proposal: Proposal;
  brand: ResolvedBrand;
  productName: string;
  /** El @ de la marca en esa red y esa zona. */
  handle: string;
  onChange: (patch: Partial<Proposal>) => void;
  onRemove?: () => void;
  onSave?: () => void;
  saved?: boolean;
};

export function ProposalCard({
  proposal,
  brand,
  productName,
  handle,
  onChange,
  onRemove,
  onSave,
  saved,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"image" | "export" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showBrief, setShowBrief] = useState(false);
  const [view, setView] = useState<"feed" | "pieza">("feed");
  // La copia de exportación solo se monta al exportar: mantenerla siempre
  // viva duplicaba el coste de render de cada imagen generada.
  const [exporting, setExporting] = useState(false);

  const net = getNetwork(proposal.networkId);

  const generateImage = async () => {
    setBusy("image");
    setNotice(null);
    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: proposal.imagePrompt,
          format: proposal.format,
          palette: brand.colors,
        }),
      });
      const json = await res.json();
      if (json.imageUrl) {
        // Recomprimir antes de guardar: si no, cuatro propuestas con imagen
        // agotan la cuota de localStorage.
        onChange({ imageUrl: await compressDataUrl(json.imageUrl) });
      }
      if (json.notice) setNotice(json.notice);
    } catch {
      setNotice("No se pudo contactar con el generador de imágenes.");
    } finally {
      setBusy(null);
    }
  };

  const exportPng = async () => {
    setBusy("export");
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      // Un frame para que la copia oculta llegue al DOM antes de rasterizar.
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      if (!canvasRef.current) throw new Error("No se pudo preparar el lienzo");
      const [targetW] = FORMAT_SPEC[proposal.format].px;
      const dataUrl = await toPng(canvasRef.current, {
        pixelRatio: targetW / canvasRef.current.offsetWidth,
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${slug(proposal.concept)}-${proposal.format}.png`;
      a.click();
    } catch {
      setNotice("La exportación falló. Genera primero la imagen de fondo.");
    } finally {
      setExporting(false);
      setBusy(null);
    }
  };

  // En Instagram el caption puede ser largo; lo que no puede es que el
  // gancho se parta por la mitad en el corte de los 125 caracteres.
  const caption = proposal.caption || "";
  const firstSentence = (caption.match(/^[^.!?…]+[.!?…]?/) ?? [caption])[0].trim();
  const hookFits = firstSentence.length <= 125;

  return (
    <article className="panel relative overflow-hidden">
      <div className="grid gap-5 p-5 md:grid-cols-[300px_1fr]">
        {/* Vista previa */}
        <div>
          <div className="mb-2.5 flex justify-center gap-1 rounded-lg bg-[#eceee9] p-0.5">
            {(["feed", "pieza"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 rounded-[7px] px-2 py-1 text-[12.5px] font-medium transition-colors ${
                  view === v ? "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : "text-[var(--muted)]"
                }`}
              >
                {v === "feed" ? "En el feed" : "Solo la pieza"}
              </button>
            ))}
          </div>

          <div className="flex justify-center">
            {view === "feed" ? (
              <FeedPreview
                proposal={proposal}
                brand={brand}
                productName={productName}
                handle={handle}
                width={280}
              />
            ) : (
              <CreativePreview
                brand={brand}
                format={proposal.format}
                headline={proposal.headline}
                subhead={proposal.subhead}
                cta={proposal.cta}
                productName={productName}
                imageUrl={proposal.imageUrl}
                loading={busy === "image"}
                width={280}
              />
            )}
          </div>

          {/* Copia a tamaño fijo que se rasteriza al exportar, así el PNG sale
              limpio sea cual sea la vista activa. Solo existe mientras dura
              la exportación. */}
          {exporting ? (
            <div className="pointer-events-none absolute -left-[9999px] top-0" aria-hidden>
              <CreativePreview
                ref={canvasRef}
                brand={brand}
                format={proposal.format}
                headline={proposal.headline}
                subhead={proposal.subhead}
                cta={proposal.cta}
                productName={productName}
                imageUrl={proposal.imageUrl}
                width={540}
              />
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button className="btn" onClick={generateImage} disabled={busy !== null}>
              {proposal.imageUrl ? (
                <Refresh className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {busy === "image" ? "Cambiando…" : "Otro fondo"}
            </button>
            <button className="btn" onClick={exportPng} disabled={busy !== null}>
              <Download className="h-4 w-4" />
              PNG
            </button>
          </div>

          {BACKGROUNDS.length > 1 ? (
            <select
              className="field mt-2 !py-1 text-[12px]"
              value={proposal.imageUrl ?? ""}
              onChange={(e) => onChange({ imageUrl: e.target.value || null })}
            >
              <option value="">— elegir fondo de la biblioteca —</option>
              {BACKGROUNDS.map((bg) => {
                const src = bg.src[proposal.format] ?? bg.src["post-1x1"];
                return src ? (
                  <option key={bg.id} value={src}>
                    {bg.label}
                  </option>
                ) : null;
              })}
            </select>
          ) : null}

          {notice ? (
            <p className="mt-2 text-center text-[12px] leading-snug text-[var(--muted)]">
              {notice}
            </p>
          ) : null}
        </div>

        {/* Contenido editable */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[17px] font-bold tracking-tight">{proposal.concept}</h3>
            <span
              className="chip !text-[var(--ink)]"
              style={{ borderColor: net.brandColor }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: net.brandColor }}
              />
              {net.name}
            </span>
            <span className="chip">{FORMAT_SPEC[proposal.format].label}</span>
            {proposal.engine === "demo" ? (
              <span className="chip" style={{ borderColor: "#F2A900", color: "#8a5b00" }}>
                demo
              </span>
            ) : null}
            {proposal.status === "approved" ? (
              <span
                className="chip"
                style={{ borderColor: "var(--brand)", color: "var(--brand)" }}
              >
                aprobada
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--muted)]">
            {proposal.rationale}
          </p>

          <div className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
              <label className="block">
                <span className="label">Titular (sobre la imagen)</span>
                <input
                  className="field mt-1 text-[15px] font-semibold"
                  value={proposal.headline}
                  onChange={(e) => onChange({ headline: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="label">CTA</span>
                <input
                  className="field mt-1"
                  value={proposal.cta}
                  onChange={(e) => onChange({ cta: e.target.value })}
                />
              </label>
            </div>

            <label className="block">
              <span className="label">Subtítulo</span>
              <input
                className="field mt-1"
                value={proposal.subhead}
                onChange={(e) => onChange({ subhead: e.target.value })}
              />
            </label>

            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="label">Pie de publicación</span>
                <span
                  className="text-[11px] tabular-nums"
                  style={{ color: hookFits ? "var(--muted)" : "#B37700" }}
                  title="Instagram corta el pie a los 125 caracteres. Lo importante es que el gancho entero quepa antes del corte."
                >
                  {hookFits
                    ? `gancho ${firstSentence.length}/125 · cabe · pie ${caption.length}`
                    : `el gancho ocupa ${firstSentence.length} y se parte en el corte`}
                </span>
              </div>
              <textarea
                className="field mt-1"
                rows={3}
                value={caption}
                onChange={(e) => onChange({ caption: e.target.value })}
              />
            </label>

            <label className="block">
              <span className="label">Respuesta tipo de community</span>
              <textarea
                className="field mt-1"
                rows={2}
                value={proposal.communityReply || ""}
                onChange={(e) => onChange({ communityReply: e.target.value })}
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {proposal.hashtags.map((h) => (
              <span key={h} className="chip">
                #{h}
              </span>
            ))}
          </div>

          <div className="mt-3">
            <button
              className="text-[12.5px] font-medium text-[var(--muted)] underline decoration-dotted hover:text-[var(--ink)]"
              onClick={() => setShowBrief((s) => !s)}
            >
              {showBrief ? "Ocultar" : "Ver"} brief de imagen, copy largo y KPIs
            </button>
            {showBrief ? (
              <div className="mt-2 space-y-3">
                <label className="block">
                  <span className="label">Copy largo (blog, newsletter, prensa)</span>
                  <textarea
                    className="field mt-1"
                    rows={3}
                    value={proposal.body}
                    onChange={(e) => onChange({ body: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="label">Brief de imagen (va al modelo)</span>
                  <textarea
                    className="field mt-1 font-mono text-[12px]"
                    rows={3}
                    value={proposal.imagePrompt}
                    onChange={(e) => onChange({ imagePrompt: e.target.value })}
                  />
                </label>
                <div>
                  <span className="label">KPIs</span>
                  <ul className="mt-1 list-inside list-disc text-[13px] text-[var(--muted)]">
                    {proposal.kpis.map((k) => (
                      <li key={k}>{k}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
            {onSave ? (
              <button className="btn btn-primary" onClick={onSave} disabled={saved}>
                <Check className="h-4 w-4" />
                {saved ? "Guardada" : "Guardar en biblioteca"}
              </button>
            ) : null}
            <button
              className="btn"
              onClick={() =>
                onChange({ status: proposal.status === "approved" ? "draft" : "approved" })
              }
            >
              {proposal.status === "approved" ? "Marcar como borrador" : "Aprobar"}
            </button>
            {onRemove ? (
              <button className="btn btn-ghost ml-auto" onClick={onRemove}>
                <Trash className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "creativo";
