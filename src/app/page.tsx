"use client";

import Link from "next/link";
import { useStudio } from "@/lib/store";
import { countOverrides, resolveBrand } from "@/lib/resolve";
import { PageHeader } from "@/components/ui";
import { CreativePreview } from "@/components/CreativePreview";
import { Sparkles } from "@/components/icons";

export default function Dashboard() {
  const { state } = useStudio();
  const { brand, zones, products, proposals } = state;

  return (
    <>
      <PageHeader
        title="Panel"
        subtitle="Un brand kit global, adaptado por zona, que alimenta un generador de propuestas por producto y canal."
        action={
          <Link href="/generar" className="btn btn-primary">
            <Sparkles className="h-4 w-4" />
            Generar propuestas
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-[1.15fr_1fr]">
        {/* Brand kit global */}
        <Link href="/marca" className="panel group block overflow-hidden p-5 transition-colors hover:border-[var(--brand)]">
          <div className="flex items-center justify-between">
            <span className="label">Brand kit global</span>
            <span className="text-[12.5px] text-[var(--muted)] group-hover:text-[var(--brand)]">
              Editar →
            </span>
          </div>
          <h2 className="mt-2 text-[22px] font-bold tracking-tight">{brand.name}</h2>
          <p className="mt-1.5 line-clamp-3 text-[14px] leading-relaxed text-[var(--muted)]">
            {brand.positioning}
          </p>
          <div className="mt-4 flex gap-1.5">
            {Object.entries(brand.colors).map(([k, v]) => (
              <div key={k} className="flex-1">
                <div
                  className="h-11 rounded-lg border border-black/5"
                  style={{ background: v }}
                />
                <div className="mt-1 truncate text-[10.5px] text-[var(--muted)]">{k}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {brand.voice.tone.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
        </Link>

        {/* Vista previa del formato base con la marca madre */}
        <div className="panel flex flex-col items-center justify-center gap-3 p-5">
          <span className="label self-start">Así se ve la marca madre</span>
          <CreativePreview
            brand={resolveBrand(brand, null)}
            format="post-1x1"
            headline={brand.claims[0] ?? brand.name}
            subhead={brand.voice.tone.slice(0, 3).join(" · ")}
            cta="Descúbrelo"
            width={300}
          />
        </div>
      </div>

      {/* Zonas */}
      <div className="mt-8 flex items-end justify-between">
        <h2 className="text-[17px] font-bold tracking-tight">
          Zonas <span className="text-[var(--muted)]">({zones.length})</span>
        </h2>
        <Link href="/zonas" className="text-[13.5px] text-[var(--muted)] hover:text-[var(--ink)]">
          Ver todas →
        </Link>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {zones.map((zone) => {
          const r = resolveBrand(brand, zone);
          const n = countOverrides(brand, zone);
          return (
            <Link
              key={zone.id}
              href={`/zonas/${zone.id}`}
              className="panel block p-4 transition-colors hover:border-[var(--brand)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[15px] font-bold tracking-tight">{zone.name}</div>
                  <div className="text-[12.5px] text-[var(--muted)]">{zone.country}</div>
                </div>
                <div className="flex gap-1">
                  {[r.colors.primary, r.colors.secondary, r.colors.accent].map((c, i) => (
                    <span
                      key={i}
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-[var(--muted)]">
                {zone.insight}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="chip">{zone.language}</span>
                <span
                  className="chip"
                  style={
                    n
                      ? { borderColor: "#F2A900", color: "#8a5b00", background: "#FFF8E8" }
                      : undefined
                  }
                >
                  {n ? `${n} campo${n > 1 ? "s" : ""} propio${n > 1 ? "s" : ""}` : "Hereda todo"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Productos + campañas */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="panel p-5">
          <div className="flex items-end justify-between">
            <h2 className="text-[15px] font-bold tracking-tight">
              Productos <span className="text-[var(--muted)]">({products.length})</span>
            </h2>
            <Link href="/productos" className="text-[13px] text-[var(--muted)] hover:text-[var(--ink)]">
              Editar →
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {products.map((p) => (
              <li key={p.id} className="flex items-center gap-2.5">
                <span
                  className="h-6 w-6 shrink-0 rounded-md border border-black/10"
                  style={{ background: p.color }}
                />
                <span className="text-[14px] font-medium">{p.name}</span>
                <span className="text-[12.5px] text-[var(--muted)]">
                  {p.family} · {p.abv}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel p-5">
          <div className="flex items-end justify-between">
            <h2 className="text-[15px] font-bold tracking-tight">
              Propuestas guardadas{" "}
              <span className="text-[var(--muted)]">({proposals.length})</span>
            </h2>
            <Link href="/campanas" className="text-[13px] text-[var(--muted)] hover:text-[var(--ink)]">
              Biblioteca →
            </Link>
          </div>
          {proposals.length === 0 ? (
            <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--muted)]">
              Todavía no hay nada guardado. Ve a{" "}
              <Link href="/generar" className="font-medium text-[var(--brand)] underline">
                Generar
              </Link>{" "}
              y elige zona, producto y objetivo.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {proposals.slice(0, 5).map((p) => {
                const zone = zones.find((z) => z.id === p.zoneId);
                const product = products.find((x) => x.id === p.productId);
                return (
                  <li key={p.id} className="text-[13.5px]">
                    <span className="font-medium">{p.concept}</span>{" "}
                    <span className="text-[var(--muted)]">
                      — {zone?.name ?? "?"} · {product?.name ?? "?"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
