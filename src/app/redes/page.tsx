"use client";

import Link from "next/link";
import { useStudio } from "@/lib/store";
import { NETWORKS } from "@/lib/networks";
import { PageHeader } from "@/components/ui";

export default function NetworksPage() {
  const { state } = useStudio();
  const { zones, proposals, brand } = state;

  return (
    <>
      <PageHeader
        title="La marca en cada red"
        subtitle="El manual que hace que una propuesta de TikTok no se parezca a una de Facebook. Cada bloque viaja íntegro al prompt cuando generas para esa red."
      />

      <div className="space-y-4">
        {NETWORKS.map((net) => {
          // Zonas que trabajan esta red, con su @ local.
          const activeZones = zones.filter((z) => (z.networks ?? []).includes(net.id));
          const count = proposals.filter((p) => p.networkId === net.id).length;

          return (
            <section
              key={net.id}
              className="panel overflow-hidden"
              style={net.status === "soon" ? { opacity: 0.72 } : undefined}
            >
              <div className="h-1 w-full" style={{ background: net.brandColor }} />
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: net.brandColor }}
                  />
                  <h2 className="text-[17px] font-bold tracking-tight">{net.name}</h2>
                  <span className="chip">
                    {net.formats.length} formato{net.formats.length > 1 ? "s" : ""}
                  </span>
                  <span className="chip">
                    {count} propuesta{count === 1 ? "" : "s"}
                  </span>
                  {net.status === "soon" ? (
                    <span
                      className="chip"
                      style={{ borderColor: "#c9cfc9", background: "#f2f4f1" }}
                    >
                      próximamente
                    </span>
                  ) : null}
                </div>

                {net.status === "soon" ? (
                  <p className="mt-2.5 rounded-lg border border-[var(--line)] bg-[#fafbf9] px-3 py-2 text-[13px] leading-relaxed text-[var(--muted)]">
                    El manual ya está escrito y el copy se genera bien, pero la vista
                    previa todavía usa el marco genérico en vez del de esta plataforma.
                    Se activa en cuanto tenga el suyo.
                  </p>
                ) : null}

                <div className="mt-4 grid gap-x-6 gap-y-3.5 md:grid-cols-2">
                  {[
                    ["Cómo cambia la voz aquí", net.toneShift],
                    ["Longitud y corte del copy", net.copyGuide],
                    ["Hashtags", net.hashtagPolicy],
                    ["Tipo de CTA", net.ctaStyle],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="label">{k}</div>
                      <p className="mt-1 text-[13.5px] leading-relaxed">{v}</p>
                    </div>
                  ))}
                  <div className="md:col-span-2">
                    <div className="label">Lo que no funciona aquí</div>
                    <p
                      className="mt-1 rounded-lg border px-3 py-2 text-[13.5px] leading-relaxed"
                      style={{ borderColor: "#F2A90055", background: "#FFFAF0" }}
                    >
                      {net.avoid}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-[var(--line)] pt-3.5">
                  <div className="label">Dónde está viva</div>
                  {activeZones.length === 0 ? (
                    <p className="mt-1.5 text-[13px] text-[var(--muted)]">
                      Ninguna zona trabaja esta red todavía. Actívala desde el editor de
                      una zona.
                    </p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activeZones.map((z) => (
                        <Link
                          key={z.id}
                          href={`/zonas/${z.id}`}
                          className="chip !text-[var(--ink)] transition-colors hover:border-[var(--brand)]"
                        >
                          <span className="font-medium">{z.name}</span>
                          <span className="text-[var(--muted)]">
                            {z.handles?.[net.id] ?? `@${brand.name.toLowerCase()}`}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <span className="label">Objetivos que rinden aquí</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {net.bestFor.map((b) => (
                      <span key={b} className="chip">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
