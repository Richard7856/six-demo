"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CreativePreview } from "./CreativePreview";
import { FeedPreview } from "./FeedPreview";
import { CreativeAuditPanel } from "./CreativeAuditPanel";
import { FORMAT_SPEC } from "@/lib/formats";
import { compressDataUrl } from "@/lib/image";
import { getNetwork } from "@/lib/networks";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { useStudio } from "@/lib/store";
import { resolveLegal } from "@/lib/legal";
import { fingerprintOf, type CreativeAudit } from "@/lib/audit/creative";
import { Check, Download, Refresh, Shield, Sparkles, Trash } from "./icons";
import type { Proposal, ResolvedBrand } from "@/lib/types";

/** El punto de color de la pestaña Auditoría: se ve el veredicto sin entrar. */
const VERDICT_DOT: Record<CreativeAudit["verdict"], string> = {
  aprobada: "#2E6B3A",
  "con-reparos": "#D9A400",
  "no-publicable": "#B3120F",
};

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
  const [busy, setBusy] = useState<"image" | "export" | "audit" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showBrief, setShowBrief] = useState(false);
  const [view, setView] = useState<"feed" | "pieza">("feed");
  // Igual que el selector de la izquierda, pero para la columna de trabajo:
  // el copy, las reglas que le aplican y el veredicto son tres cosas
  // distintas y apiladas no cabían.
  const [panel, setPanel] = useState<"contenido" | "legal" | "auditoria">(
    "contenido",
  );
  // La copia de exportación solo se monta al exportar: mantenerla siempre
  // viva duplicaba el coste de render de cada imagen generada.
  const [exporting, setExporting] = useState(false);

  // El veredicto vive en la propuesta, no en el componente: si viviera aquí,
  // bastaría cambiar de pestaña o recargar para perderlo y volver a pagarlo.
  const audit = proposal.audit ?? null;
  const currentFingerprint = fingerprintOf(proposal);
  const auditStale = Boolean(audit && audit.fingerprint !== currentFingerprint);

  const { state } = useStudio();
  const net = getNetwork(proposal.networkId);
  const zone = state.zones.find((z) => z.id === proposal.zoneId) ?? null;
  // Las reglas que le aplican a ESTA pieza: globales + las propias de su zona.
  const legal = resolveLegal(state, zone).all;

  /**
   * Rasteriza la pieza tal y como se va a publicar y la manda a auditar junto
   * con su copy. Solo se dispara con el clic: el enlace de la demo es público
   * y una auditoría automática por propuesta multiplicaría el gasto sin que
   * nadie lo haya pedido.
   */
  const auditPiece = async () => {
    setBusy("audit");
    setNotice(null);
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      if (!canvasRef.current) throw new Error("No se pudo preparar el lienzo");

      const raw = await toPng(canvasRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      // Al modelo le sobra con 1024 px, y así el cuerpo de la petición no se
      // dispara. Reusa el mismo recompresor que el guardado en localStorage.
      const image = await compressDataUrl(raw, 1024, 0.85);

      const res = await fetch("/api/audit/creative", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          image,
          copy: {
            concept: proposal.concept,
            headline: proposal.headline,
            subhead: proposal.subhead,
            body: proposal.body,
            cta: proposal.cta,
            caption: proposal.caption,
            hashtags: proposal.hashtags,
          },
          brand: {
            name: brand.name,
            positioning: brand.positioning,
            dont: brand.voice.dont,
            claims: brand.claims,
          },
          legal: legal.map((r) => ({ text: r.text, validated: r.validated })),
          context: {
            zone: zone?.name ?? "—",
            country: zone?.country ?? "—",
            network: net.name,
            format: proposal.format,
            product: productName,
          },
        }),
      });

      if (!res.ok) throw new Error(`el servidor respondió ${res.status}`);
      const result = (await res.json()) as CreativeAudit;
      onChange({ audit: { ...result, fingerprint: fingerprintOf(proposal) } });
    } catch (error) {
      setNotice(
        `No se pudo auditar la pieza (${
          error instanceof Error ? error.message : "error desconocido"
        }).`,
      );
    } finally {
      setExporting(false);
      setBusy(null);
    }
  };

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
  const firstSentence = (caption.match(/^[^.!?…]+[.!?…]?/) ?? [
    caption,
  ])[0].trim();
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
                  view === v
                    ? "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                    : "text-[var(--muted)]"
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
            <div
              className="pointer-events-none absolute -left-[9999px] top-0"
              aria-hidden
            >
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
            <button
              className="btn"
              onClick={generateImage}
              disabled={busy !== null}
            >
              {proposal.imageUrl ? (
                <Refresh className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {busy === "image" ? "Cambiando…" : "Otro fondo"}
            </button>
            <button
              className="btn"
              onClick={exportPng}
              disabled={busy !== null}
            >
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
            <h3 className="text-[17px] font-bold tracking-tight">
              {proposal.concept}
            </h3>
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
              <span
                className="chip"
                style={{ borderColor: "#F2A900", color: "#8a5b00" }}
              >
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

          <div className="mt-3.5 flex gap-1 rounded-lg bg-[#eceee9] p-0.5">
            {(
              [
                ["contenido", "Contenido", null],
                ["legal", "Legal", legal.length ? String(legal.length) : null],
                [
                  "auditoria",
                  "Auditoría",
                  // Gris si la pieza cambió: el veredicto sigue ahí pero ya no
                  // corresponde, y un punto verde diría lo contrario.
                  audit
                    ? auditStale
                      ? "#B0AAA2"
                      : VERDICT_DOT[audit.verdict]
                    : null,
                ],
              ] as const
            ).map(([id, label, badge]) => (
              <button
                key={id}
                onClick={() => setPanel(id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-[7px] px-2 py-1 text-[12.5px] font-medium transition-colors ${
                  panel === id
                    ? "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                    : "text-[var(--muted)]"
                }`}
              >
                {label}
                {badge ? (
                  badge.startsWith("#") ? (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: badge }}
                    />
                  ) : (
                    <span className="text-[11px] text-[var(--muted)]">
                      {badge}
                    </span>
                  )
                ) : null}
              </button>
            ))}
          </div>

          {panel === "contenido" ? (
            <>
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
                    onChange={(e) =>
                      onChange({ communityReply: e.target.value })
                    }
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
                  {showBrief ? "Ocultar" : "Ver"} brief de imagen, copy largo y
                  KPIs
                </button>
                {showBrief ? (
                  <div className="mt-2 space-y-3">
                    <label className="block">
                      <span className="label">
                        Copy largo (blog, newsletter, prensa)
                      </span>
                      <textarea
                        className="field mt-1"
                        rows={3}
                        value={proposal.body}
                        onChange={(e) => onChange({ body: e.target.value })}
                      />
                    </label>
                    <label className="block">
                      <span className="label">
                        Brief de imagen (va al modelo)
                      </span>
                      <textarea
                        className="field mt-1 font-mono text-[12px]"
                        rows={3}
                        value={proposal.imagePrompt}
                        onChange={(e) =>
                          onChange({ imagePrompt: e.target.value })
                        }
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
            </>
          ) : null}

          {panel === "legal" ? (
            <div className="mt-4">
              <p className="text-[13px] leading-relaxed text-[var(--muted)]">
                Lo que tiene que cumplir esta pieza por publicarse en{" "}
                <strong className="text-[var(--ink)]">
                  {zone?.name ?? "—"}
                </strong>
                : las reglas globales más las propias de la zona. El auditor
                solo bloquea por las validadas.
              </p>

              {legal.length ? (
                <ul className="mt-3 space-y-2">
                  {legal.map((r) => (
                    <li key={r.id} className="flex items-start gap-2">
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                        style={{
                          background: r.validated ? "#2E6B3A" : "#D9A400",
                        }}
                      />
                      <div className="min-w-0">
                        <p className="text-[13.5px] leading-snug">{r.text}</p>
                        <p className="text-[11.5px] text-[var(--muted)]">
                          {r.validated ? "Validada por legal" : "Sin validar"}
                          {r.source ? ` · ${r.source}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[13px] text-[var(--muted)]">
                  No hay ninguna regla cargada. El auditor no tendrá contra qué
                  medir.
                </p>
              )}

              <Link
                href="/legal"
                className="mt-3 inline-block text-[13px] text-[var(--muted)] underline hover:text-[var(--ink)]"
              >
                Editar el marco legal
              </Link>
            </div>
          ) : null}

          {panel === "auditoria" ? (
            <div className="mt-4">
              {audit && auditStale ? (
                <p
                  className="mb-2.5 rounded-lg border px-3 py-2 text-[12.5px] leading-snug"
                  style={{
                    borderColor: "#EBDCB8",
                    background: "#FDF6E8",
                    color: "#8A5A00",
                  }}
                >
                  La pieza ha cambiado desde esta auditoría. El veredicto de abajo se
                  dio sobre otra versión — vuelve a auditar antes de aprobarla.
                </p>
              ) : null}

              {audit ? (
                <CreativeAuditPanel audit={audit} />
              ) : (
                <p className="text-[13px] leading-relaxed text-[var(--muted)]">
                  Sin auditar. Se revisa la pieza compuesta —imagen y copy
                  juntos— contra el marco legal y el brand kit. Cuesta una
                  llamada al modelo, así que solo corre cuando lo pides.
                </p>
              )}

              <button
                className="btn mt-3"
                onClick={auditPiece}
                disabled={busy !== null}
              >
                <Shield className="h-4 w-4" />
                {busy === "audit"
                  ? "Auditando…"
                  : audit
                    ? "Volver a auditar"
                    : "Auditar esta pieza"}
              </button>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
            {onSave ? (
              <button
                className="btn btn-primary"
                onClick={onSave}
                disabled={saved}
              >
                <Check className="h-4 w-4" />
                {saved ? "Guardada" : "Guardar en biblioteca"}
              </button>
            ) : null}
            <button
              className="btn"
              onClick={() =>
                onChange({
                  status: proposal.status === "approved" ? "draft" : "approved",
                })
              }
            >
              {proposal.status === "approved"
                ? "Marcar como borrador"
                : "Aprobar"}
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
