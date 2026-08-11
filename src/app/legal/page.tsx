"use client";

import Link from "next/link";
import { useStudio } from "@/lib/store";
import { PageHeader, Section } from "@/components/ui";
import { LegalRules } from "@/components/LegalRules";
import { Alert, Check } from "@/components/icons";
import { countPending, resolveLegal } from "@/lib/legal";

export default function LegalPage() {
  const { state, setLegal, updateZone } = useStudio();
  const globals = state.legal ?? [];

  const todas = [...globals, ...state.zones.flatMap((z) => z.regulatory)];
  const pendientes = countPending(todas);

  return (
    <>
      <PageHeader
        title="Marco legal"
        subtitle="Las restricciones que el auditor aplica a cada pieza antes de aprobarla. Funcionan como el brand kit: hay reglas que valen en todo México y cada zona añade las suyas."
      />

      {pendientes > 0 ? (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3"
          style={{ borderColor: "#EBDCB8", background: "#FDF6E8" }}
        >
          <Alert className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="text-[13.5px] leading-relaxed" style={{ color: "#8A5A00" }}>
            <strong>
              {pendientes} de {todas.length} reglas están sin validar.
            </strong>{" "}
            Las de arranque las redacté yo a partir de cómo se regula la publicidad
            de alcohol en México — no vienen del equipo legal de Six. Suenan plausibles
            y son concretas, que es justo lo que las hace peligrosas. Mientras sigan
            así, el auditor las usa para avisar pero no para bloquear una pieza.
          </div>
        </div>
      ) : (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3"
          style={{ borderColor: "#CDE3D2", background: "#F1F7F1" }}
        >
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-[13.5px] leading-relaxed" style={{ color: "#2E6B3A" }}>
            Las {todas.length} reglas están validadas. El auditor puede bloquear
            piezas apoyándose en ellas.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <Section
          title={`Reglas globales (${globals.length})`}
          description="Aplican en todas las zonas. Editar una aquí la cambia en las cinco a la vez."
        >
          <LegalRules
            rules={globals}
            onChange={setLegal}
            placeholder="La publicidad no puede sugerir que el alcohol mejora el desempeño"
            emptyHint="No hay reglas globales. El auditor solo mirará las de cada zona."
          />
        </Section>

        <Section
          title="Por zona"
          description="Solo lo que cambia en ese mercado. Cada zona hereda además todas las globales de arriba."
        >
          <div className="space-y-4">
            {state.zones.map((zone) => {
              const total = resolveLegal(state, zone).all.length;
              return (
                <div key={zone.id} className="rounded-xl border border-[var(--line)] p-4">
                  <div className="mb-3 flex flex-wrap items-baseline gap-2">
                    <Link
                      href={`/zonas/${zone.id}`}
                      className="text-[14.5px] font-bold tracking-tight hover:text-[var(--brand)]"
                    >
                      {zone.name}
                    </Link>
                    <span className="text-[12.5px] text-[var(--muted)]">
                      {zone.country}
                    </span>
                    <span className="chip ml-auto">
                      {total} en total · {zone.regulatory.length} propia
                      {zone.regulatory.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <LegalRules
                    rules={zone.regulatory}
                    onChange={(regulatory) => updateZone(zone.id, { regulatory })}
                    placeholder="Restricción que solo aplica en esta zona…"
                    emptyHint="Sin reglas propias: se rige solo por las globales."
                  />
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      <p className="mt-6 max-w-[70ch] text-[12.5px] leading-relaxed text-[var(--muted)]">
        Estas reglas viajan a dos sitios: al prompt de generación, para que el copy
        nazca ya dentro de lo permitido, y al auditor, que revisa la pieza terminada
        contra ellas. Cambiar una aquí afecta a las dos cosas.
      </p>
    </>
  );
}
