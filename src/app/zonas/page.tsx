"use client";

import Link from "next/link";
import { useStudio } from "@/lib/store";
import { countOverrides, resolveBrand } from "@/lib/resolve";
import { PageHeader } from "@/components/ui";
import { Plus } from "@/components/icons";

export default function ZonesPage() {
  const { state, addZone } = useStudio();
  const { brand, zones } = state;

  const create = () => {
    const name = prompt("Nombre de la zona (ej. Andina, DACH, Sudeste Asiático)");
    if (!name?.trim()) return;
    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now()
      .toString(36)
      .slice(-4)}`;
    addZone({
      id,
      name: name.trim(),
      country: "",
      language: "es-ES",
      audience: "",
      insight: "",
      occasions: [],
      networks: ["instagram-feed"],
      handles: {},
      regulatory: [],
      overrides: {},
    });
  };

  return (
    <>
      <PageHeader
        title="Zonas"
        subtitle="Cada zona hereda el brand kit global. Solo guarda los campos que cambia, así el resto se actualiza solo cuando cambies la marca madre."
        action={
          <button className="btn btn-primary" onClick={create}>
            <Plus className="h-4 w-4" />
            Nueva zona
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {zones.map((zone) => {
          const r = resolveBrand(brand, zone);
          const n = countOverrides(brand, zone);
          return (
            <Link
              key={zone.id}
              href={`/zonas/${zone.id}`}
              className="panel block overflow-hidden transition-colors hover:border-[var(--brand)]"
            >
              <div className="h-1.5 w-full" style={{ background: r.colors.primary }} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[15.5px] font-bold tracking-tight">{zone.name}</div>
                    <div className="text-[12.5px] text-[var(--muted)]">
                      {zone.country || "Sin país definido"}
                    </div>
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

                <p className="mt-2.5 line-clamp-3 min-h-[3.2em] text-[13px] leading-snug text-[var(--muted)]">
                  {zone.insight || "Sin insight local todavía — es el campo que más cambia el resultado."}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="chip">{zone.language}</span>
                  <span
                    className="chip"
                    style={
                      n
                        ? { borderColor: "#F2A900", color: "#8a5b00", background: "#FFF8E8" }
                        : undefined
                    }
                  >
                    {n ? `${n} propio${n > 1 ? "s" : ""}` : "Hereda todo"}
                  </span>
                  {(zone.networks ?? []).length ? (
                    <span className="chip">
                      {(zone.networks ?? []).length} red
                      {(zone.networks ?? []).length > 1 ? "es" : ""}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
