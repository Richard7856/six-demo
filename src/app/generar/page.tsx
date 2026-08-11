"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStudio } from "@/lib/store";
import { resolveBrand } from "@/lib/resolve";
import { legalText, resolveLegal } from "@/lib/legal";
import { FORMAT_SPEC } from "@/lib/formats";
import { NETWORKS, getNetwork, type SocialNetwork } from "@/lib/networks";
import { ProposalCard } from "@/components/ProposalCard";
import { Field, PageHeader } from "@/components/ui";
import { Sparkles } from "@/components/icons";
import { AgentTrace, appendTrace, type TraceLine } from "@/components/AgentTrace";
import { readTrace } from "@/lib/trace";
import { FIXTURE_KEYS } from "@/lib/demo/fixtures";
import { fixtureKey } from "@/lib/demo/key";
import type { GenerateRequest } from "@/lib/ai/schema";
import type { Proposal } from "@/lib/types";

const OBJECTIVES = [
  "Tráfico a tienda",
  "Subir el ticket promedio",
  "Activación de ocasión de compra",
  "Apertura de tienda nueva",
  "Dar a conocer un servicio",
  "Promoción de temporada",
  "Notoriedad de marca",
];

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="panel p-8 text-center text-[var(--muted)]">Cargando…</div>}>
      <Generator />
    </Suspense>
  );
}

function Generator() {
  const params = useSearchParams();
  const { state, addProposals, updateProposal } = useStudio();
  const { brand, zones, products } = state;

  const [zoneId, setZoneId] = useState(params.get("zona") ?? zones[0]?.id ?? "");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [objective, setObjective] = useState(OBJECTIVES[0]);
  const [selected, setSelected] = useState<string[]>([]);
  const [count, setCount] = useState(2);

  const [results, setResults] = useState<Proposal[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState<string[]>([]);
  const [traces, setTraces] = useState<Record<string, TraceLine[]>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const zone = zones.find((z) => z.id === zoneId);
  const product = products.find((p) => p.id === productId);
  const resolved = useMemo(() => resolveBrand(brand, zone), [brand, zone]);

  // Las redes disponibles salen de la zona: la marca no está en todas partes.
  const zoneNetworks = useMemo(
    () => (zone?.networks ?? []).map(getNetwork),
    [zone],
  );

  // Al cambiar de zona, arrancamos con las dos primeras redes listas.
  useEffect(() => {
    setSelected(
      zoneNetworks
        .filter((n) => n.status !== "soon")
        .slice(0, 2)
        .map((n) => n.id),
    );
  }, [zoneNetworks]);

  const activeNetworks = zoneNetworks.filter(
    (n) => selected.includes(n.id) && n.status !== "soon",
  );
  const handleFor = (netId: string) =>
    zone?.handles?.[netId] ?? `@${brand.name.toLowerCase()}`;

  // Qué combinaciones están grabadas: el presentador ve de un vistazo por
  // dónde puede ir sin salirse del guion.
  const isScripted = (networkId: string) =>
    !!zone &&
    !!product &&
    FIXTURE_KEYS.has(
      fixtureKey({ zoneId: zone.id, productId: product.id, objective, networkId }),
    );

  const scriptedCount = activeNetworks.filter((n) => isScripted(n.id)).length;

  const toggle = (id: string) => {
    if (getNetwork(id).status === "soon") return;
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const run = async () => {
    if (!zone || !product || activeNetworks.length === 0) return;
    setError(null);
    setNotice(null);
    setResults([]);
    setSavedIds(new Set());
    setTraces({});
    setRunning(activeNetworks.map((n) => n.id));

    const base = {
      brandName: resolved.name,
      positioning: resolved.positioning,
      voice: resolved.voice,
      claims: resolved.claims,
      palette: {
        primary: resolved.colors.primary,
        secondary: resolved.colors.secondary,
        accent: resolved.colors.accent,
      },
      zone: {
        name: zone.name,
        country: zone.country,
        language: zone.language,
        audience: zone.audience,
        insight: zone.insight,
        occasions: zone.occasions,
        // Globales + propias de la zona. Las que aún no ha validado legal
        // viajan marcadas, para que el modelo no las trate como derecho firme.
        regulatory: legalText(resolveLegal(state, zone).all),
      },
      product: {
        name: product.name,
        family: product.family,
        abv: product.abv,
        attributes: product.attributes,
        notes: product.notes,
      },
      objective,
      count,
    };

    // Una llamada por red, en paralelo. Cada una lleva su propio manual, así
    // que el copy de Facebook no sale calcado del de Instagram.
    const notices: string[] = [];

    await Promise.all(
      activeNetworks.map(async (net) => {
        const format = net.formats[0];
        const payload: GenerateRequest = {
          ...base,
          network: {
            name: net.name,
            toneShift: net.toneShift,
            copyGuide: net.copyGuide,
            hashtagPolicy: net.hashtagPolicy,
            ctaStyle: net.ctaStyle,
            avoid: net.avoid,
            handle: handleFor(net.id),
          },
          format,
          ids: { zoneId: zone.id, productId: product.id, networkId: net.id },
        };

        try {
          const res = await fetch("/api/proposals", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`${net.name}: el servidor respondió ${res.status}`);
          if (!res.body) throw new Error(`${net.name}: respuesta sin cuerpo`);

          // El servidor va contando lo que hace; lo pintamos según llega.
          let completed = false;
          for await (const event of readTrace(res.body)) {
            setTraces((prev) => ({
              ...prev,
              [net.id]: appendTrace(prev[net.id] ?? [], event),
            }));

            if (event.t === "notice") notices.push(`${net.name} — ${event.text}`);

            if (event.t === "done") {
              completed = true;
              const now = new Date().toISOString();
              // Los resultados entran en cuanto llegan: no esperamos a la red
              // más lenta para empezar a enseñar algo.
              setResults((prev) => [
                ...prev,
                ...event.proposals.map((p, i) => ({
                  ...p,
                  id: `${net.id}-${Date.now().toString(36)}-${i}`,
                  createdAt: now,
                  zoneId: zone.id,
                  productId: product.id,
                  objective,
                  networkId: net.id,
                  format,
                  imageUrl: p.imageUrl ?? null,
                  status: "draft" as const,
                  engine: event.engine,
                })),
              ]);
            }
          }

          if (!completed) {
            // El stream se cortó: en desarrollo suele ser una recompilación;
            // en producción, la conexión. Antes esto se veía como un
            // "terminado" normal y sin resultados, que despista mucho.
            throw new Error(
              `${net.name}: la conexión se cortó antes de terminar. Vuelve a lanzarlo.`,
            );
          }
        } catch (e) {
          const text = e instanceof Error ? e.message : `${net.name}: error desconocido`;
          notices.push(text);
          setTraces((prev) => ({
            ...prev,
            [net.id]: [...(prev[net.id] ?? []), { kind: "error", text }],
          }));
        } finally {
          setRunning((r) => r.filter((x) => x !== net.id));
        }
      }),
    );

    if (notices.length) setNotice(notices.join(" · "));
  };

  const loading = running.length > 0;
  const total = count * activeNetworks.length;

  // Agrupamos por red para que se lean en bloque, no mezcladas.
  const byNetwork = activeNetworks
    .map((net) => ({
      net,
      items: results.filter((r) => r.networkId === net.id),
      trace: traces[net.id] ?? [],
    }))
    .filter((g) => g.items.length > 0 || g.trace.length > 0 || running.includes(g.net.id));

  return (
    <>
      <PageHeader
        title="Generar propuestas"
        subtitle="Elige zona, producto y las redes donde va a publicarse. Cada red recibe su propio brief, así que el copy no sale calcado de una a otra."
      />

      {/* Brief */}
      <div className="panel mb-6 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Zona">
            <select className="field" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} — {z.country}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Producto">
            <select
              className="field"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Objetivo">
            <select
              className="field"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            >
              {OBJECTIVES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Redes: selección múltiple. El formato lo decide cada red. */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="label">Redes</span>
            <span className="text-[12px] text-[var(--muted)]">
              cada una con su formato y su manual
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(zoneNetworks.length ? zoneNetworks : NETWORKS).map((n) => {
              const soon = n.status === "soon";
              const on = !soon && selected.includes(n.id);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => toggle(n.id)}
                  disabled={soon}
                  title={
                    soon
                      ? "El copy ya se genera, pero la vista previa de esta red está en camino."
                      : undefined
                  }
                  className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-colors ${
                    soon ? "cursor-not-allowed opacity-55" : ""
                  }`}
                  style={{
                    borderColor: on ? n.brandColor : "var(--line)",
                    background: on ? `${n.brandColor}0f` : soon ? "#fafbf9" : "#fff",
                  }}
                >
                  <span
                    className="grid h-4 w-4 shrink-0 place-items-center rounded border"
                    style={{
                      borderColor: on ? n.brandColor : "var(--line)",
                      background: on ? n.brandColor : "#fff",
                    }}
                  >
                    {on ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path
                          d="m5 12.5 4.5 4.5L19 7"
                          stroke="#fff"
                          strokeWidth="3.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-semibold">
                      {n.name}
                    </span>
                    <span className="block truncate text-[11.5px] text-[var(--muted)]">
                      {FORMAT_SPEC[n.formats[0]].label} · {handleFor(n.id)}
                    </span>
                    {soon ? (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted)]" />
                        próximamente
                      </span>
                    ) : isScripted(n.id) ? (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--brand)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
                        en el guion
                      </span>
                    ) : null}
                  </span>
                  {running.includes(n.id) ? (
                    <span className="pulsing ml-auto text-[11px] font-medium">…</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual de cada red seleccionada */}
        {activeNetworks.length ? (
          <div className="mt-4 grid gap-2">
            {activeNetworks.map((n) => (
              <NetworkBrief key={n.id} net={n} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-[13px] text-[var(--muted)]">
            Selecciona al menos una red. Si falta alguna, actívala en el editor de la zona.
          </p>
        )}

        {zone ? (
          <div className="mt-3 rounded-lg border border-[var(--line)] bg-[#fbfcfa] p-3.5">
            <span className="label">Insight que se envía</span>
            <p className="mt-1 text-[13.5px] leading-relaxed">
              {zone.insight || (
                <span className="text-[var(--muted)]">
                  Esta zona no tiene insight. El resultado va a salir genérico — rellénalo primero.
                </span>
              )}
            </p>
            {resolveLegal(state, zone).all.length ? (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {resolveLegal(state, zone).all.map((r) => (
                  <span
                    key={r.id}
                    className="chip"
                    title={r.validated ? "Validada por legal" : "Sin validar por legal"}
                  >
                    {r.validated ? null : (
                      <span className="text-[#B37700]" aria-label="sin validar">
                        ⚠
                      </span>
                    )}
                    {r.text}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[13px]">
            <span className="label !mb-0">Por red</span>
            <input
              type="number"
              min={1}
              max={6}
              className="field !w-[68px]"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </label>

          <button
            className="btn btn-primary"
            onClick={run}
            disabled={loading || !zone || !product || activeNetworks.length === 0}
          >
            <Sparkles className="h-4 w-4" />
            {loading
              ? `Generando… (${activeNetworks.length - running.length}/${activeNetworks.length} redes)`
              : `Generar ${total} propuesta${total === 1 ? "" : "s"} en ${
                  activeNetworks.length
                } red${activeNetworks.length === 1 ? "" : "es"}`}
          </button>

          {error ? <span className="text-[13px] text-[#c0392b]">{error}</span> : null}
        </div>

        {activeNetworks.length > scriptedCount ? (
          <p className="mt-2 text-[12.5px] leading-snug text-[#8a5b00]">
            {activeNetworks.length - scriptedCount} de {activeNetworks.length} redes no
            están en el guion grabado para esta combinación: esas saldrán del motor local.
          </p>
        ) : null}

        {notice ? (
          <p className="mt-2 text-[12.5px] leading-snug text-[var(--muted)]">{notice}</p>
        ) : null}
      </div>

      {/* Resultados agrupados por red */}
      <div className="space-y-8">
        {byNetwork.map(({ net, items, trace }) => (
          <section key={net.id}>
            <div className="mb-3 flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: net.brandColor }}
              />
              <h2 className="text-[16px] font-bold tracking-tight">{net.name}</h2>
              <span className="text-[13px] text-[var(--muted)]">{handleFor(net.id)}</span>
              {running.includes(net.id) ? (
                <span className="pulsing text-[13px] text-[var(--muted)]">escribiendo…</span>
              ) : null}
            </div>

            <div className="mb-4">
              <AgentTrace
                lines={trace}
                running={running.includes(net.id)}
                title={`generar · ${net.name.toLowerCase()}`}
                accent={net.brandColor}
              />
            </div>

            <div className="space-y-4">
              {items.map((p) => (
                <ProposalCard
                  key={p.id}
                  proposal={p}
                  brand={resolved}
                  productName={product?.name ?? ""}
                  handle={handleFor(p.networkId)}
                  saved={savedIds.has(p.id)}
                  onChange={(patch) => {
                    setResults((rs) => rs.map((r) => (r.id === p.id ? { ...r, ...patch } : r)));
                    if (savedIds.has(p.id)) updateProposal(p.id, patch);
                  }}
                  onSave={() => {
                    addProposals([{ ...p }]);
                    setSavedIds((s) => new Set(s).add(p.id));
                  }}
                  onRemove={() => setResults((rs) => rs.filter((r) => r.id !== p.id))}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {!loading && results.length === 0 ? (
        <div className="panel p-10 text-center">
          <p className="text-[15px] font-medium">Sin propuestas todavía</p>
          <p className="mx-auto mt-1.5 max-w-[46ch] text-[13.5px] leading-relaxed text-[var(--muted)]">
            Marca las redes de arriba y dale a generar. Cada una recibe su propio brief y
            devuelve piezas con su formato, su tono y su longitud de copy.
          </p>
        </div>
      ) : null}
    </>
  );
}

/** Resumen compacto del manual de una red dentro del brief. */
function NetworkBrief({ net }: { net: SocialNetwork }) {
  return (
    <details
      className="rounded-lg border px-3 py-2"
      style={{ borderColor: `${net.brandColor}55`, background: `${net.brandColor}0a` }}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px]">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: net.brandColor }} />
        <span className="font-semibold">{net.name}</span>
        <span className="truncate text-[var(--muted)]">{net.copyGuide}</span>
      </summary>
      <dl className="mt-2.5 grid gap-x-5 gap-y-2 text-[12.5px] leading-snug sm:grid-cols-2">
        {[
          ["Voz aquí", net.toneShift],
          ["Hashtags", net.hashtagPolicy],
          ["CTA", net.ctaStyle],
          ["No funciona", net.avoid],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="label">{k}</dt>
            <dd className="mt-0.5">{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
