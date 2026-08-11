"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStudio } from "@/lib/store";
import { resolveBrand } from "@/lib/resolve";
import { CreativePreview } from "@/components/CreativePreview";
import { ColorField, Field, ListField, PageHeader, Section } from "@/components/ui";
import { LegalRules } from "@/components/LegalRules";
import { resolveLegal } from "@/lib/legal";
import { ArrowLeft, Sparkles, Trash } from "@/components/icons";
import { NETWORKS } from "@/lib/networks";
import type { BrandOverrides, Palette, Voice } from "@/lib/types";

export default function ZoneEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state, updateZone, removeZone } = useStudio();
  const { brand } = state;
  const zone = state.zones.find((z) => z.id === id);

  if (!zone) {
    return (
      <div className="panel p-8 text-center">
        <p className="text-[15px]">Esa zona no existe.</p>
        <Link href="/zonas" className="btn mt-4 inline-flex">
          <ArrowLeft className="h-4 w-4" />
          Volver a zonas
        </Link>
      </div>
    );
  }

  const resolved = resolveBrand(brand, zone);
  const ov: BrandOverrides = zone.overrides ?? {};

  const setOverrides = (patch: BrandOverrides) =>
    updateZone(zone.id, { overrides: { ...ov, ...patch } });

  const setColor = (key: keyof Palette, value: string) =>
    setOverrides({ colors: { ...(ov.colors ?? {}), [key]: value } });

  const clearColor = (key: keyof Palette) => {
    const next = { ...(ov.colors ?? {}) };
    delete next[key];
    setOverrides({ colors: Object.keys(next).length ? next : undefined });
  };

  const setVoice = <K extends keyof Voice>(key: K, value: Voice[K]) =>
    setOverrides({ voice: { ...(ov.voice ?? {}), [key]: value } });

  const clearVoice = (key: keyof Voice) => {
    const next = { ...(ov.voice ?? {}) };
    delete next[key];
    setOverrides({ voice: Object.keys(next).length ? next : undefined });
  };

  return (
    <>
      <Link
        href="/zonas"
        className="mb-3 inline-flex items-center gap-1.5 text-[13.5px] text-[var(--muted)] hover:text-[var(--ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Zonas
      </Link>

      <PageHeader
        title={zone.name}
        subtitle="Los campos con la barra amarilla están sobreescritos en esta zona. El resto hereda del brand kit global y se actualiza solo."
        action={
          <div className="flex gap-2">
            <Link href={`/generar?zona=${zone.id}`} className="btn btn-primary">
              <Sparkles className="h-4 w-4" />
              Generar aquí
            </Link>
            <button
              className="btn"
              onClick={() => {
                if (confirm(`¿Eliminar la zona "${zone.name}" y sus propuestas guardadas?`)) {
                  removeZone(zone.id);
                  router.push("/zonas");
                }
              }}
            >
              <Trash className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Section
            title="Contexto local"
            description="Esto es propio de la zona, no se hereda. El insight es lo que más cambia el resultado del generador."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nombre">
                <input
                  className="field"
                  value={zone.name}
                  onChange={(e) => updateZone(zone.id, { name: e.target.value })}
                />
              </Field>
              <Field label="País / mercado">
                <input
                  className="field"
                  value={zone.country}
                  onChange={(e) => updateZone(zone.id, { country: e.target.value })}
                />
              </Field>
              <Field label="Idioma del copy" hint="Código BCP-47: es-ES, pt-BR, nl-NL…">
                <input
                  className="field"
                  value={zone.language}
                  onChange={(e) => updateZone(zone.id, { language: e.target.value })}
                />
              </Field>
              <Field label="Audiencia">
                <input
                  className="field"
                  value={zone.audience}
                  onChange={(e) => updateZone(zone.id, { audience: e.target.value })}
                />
              </Field>
            </div>

            <Field
              label="Insight local"
              hint="Qué hace distinta a esta zona. Si la idea funcionaría igual en cualquier país, es que este campo está vacío o es genérico."
            >
              <textarea
                className="field"
                rows={3}
                value={zone.insight}
                onChange={(e) => updateZone(zone.id, { insight: e.target.value })}
              />
            </Field>

            <ListField
              label="Ocasiones de consumo"
              values={zone.occasions}
              onChange={(occasions) => updateZone(zone.id, { occasions })}
              placeholder="Terraza after-work"
            />
            <Field
              label="Redes donde vive la marca aquí"
              hint="Marca solo las que el equipo local trabaja de verdad. El generador solo ofrece estas."
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {NETWORKS.map((n) => {
                  const on = (zone.networks ?? []).includes(n.id);
                  return (
                    <label
                      key={n.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-colors ${
                        on ? "bg-white" : "bg-[#fafbf9]"
                      }`}
                      style={{ borderColor: on ? n.brandColor : "var(--line)" }}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() =>
                          updateZone(zone.id, {
                            networks: on
                              ? (zone.networks ?? []).filter((x) => x !== n.id)
                              : [...(zone.networks ?? []), n.id],
                          })
                        }
                      />
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: n.brandColor }}
                      />
                      <span className="text-[13px] font-medium">{n.name}</span>
                      {on ? (
                        <input
                          className="field ml-auto !w-[124px] !px-2 !py-1 text-[12px]"
                          placeholder="@usuario"
                          value={zone.handles?.[n.id] ?? ""}
                          onClick={(e) => e.preventDefault()}
                          onChange={(e) =>
                            updateZone(zone.id, {
                              handles: { ...(zone.handles ?? {}), [n.id]: e.target.value },
                            })
                          }
                        />
                      ) : null}
                    </label>
                  );
                })}
              </div>
            </Field>
            <Field
              label="Restricciones propias de la zona"
              hint="Solo lo que es distinto aquí. Lo que aplica en todo México se edita una vez en Legal y esta zona lo hereda."
            >
              <LegalRules
                rules={zone.regulatory}
                onChange={(regulatory) => updateZone(zone.id, { regulatory })}
                placeholder="Respetar la ley seca en jornadas electorales"
                emptyHint="Esta zona no añade nada: se rige solo por las reglas globales."
                readOnlyRules={{
                  rules: state.legal ?? [],
                  label: `Heredadas de Legal (${(state.legal ?? []).length})`,
                }}
              />
            </Field>
          </Section>

          <Section
            title="Posicionamiento"
            description="Por defecto hereda el global. Sobreescríbelo solo si esta zona cuenta otra historia."
          >
            <Field label="Posicionamiento" overridden={resolved.overridden.positioning}>
              <textarea
                className="field"
                rows={3}
                value={resolved.positioning}
                onChange={(e) => setOverrides({ positioning: e.target.value })}
              />
            </Field>
            {resolved.overridden.positioning ? (
              <button
                className="btn btn-ghost !px-2 text-[13px]"
                onClick={() => setOverrides({ positioning: undefined })}
              >
                ↩ Volver a heredar
              </button>
            ) : null}
          </Section>

          <Section
            title="Paleta de la zona"
            description="Útil cuando un mercado usa un color de acento distinto por campaña o por normativa de packaging."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(brand.colors) as (keyof Palette)[]).map((key) => {
                const isOv = resolved.overridden.colors.includes(key);
                return (
                  <div key={key}>
                    <ColorField
                      label={key}
                      value={resolved.colors[key]}
                      onChange={(v) => setColor(key, v)}
                      overridden={isOv}
                    />
                    {isOv ? (
                      <button
                        className="btn btn-ghost mt-1 !px-2 !py-1 text-[12.5px]"
                        onClick={() => clearColor(key)}
                      >
                        ↩ Heredar {brand.colors[key]}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Section>

          <Section
            title="Voz en esta zona"
            description="Lo habitual es cambiar solo el tono. La persona y las prohibiciones suelen ser globales."
          >
            <Field label="Persona" overridden={resolved.overridden.voice.includes("persona")}>
              <textarea
                className="field"
                rows={2}
                value={resolved.voice.persona}
                onChange={(e) => setVoice("persona", e.target.value)}
              />
            </Field>
            {resolved.overridden.voice.includes("persona") ? (
              <button
                className="btn btn-ghost !px-2 text-[13px]"
                onClick={() => clearVoice("persona")}
              >
                ↩ Volver a heredar
              </button>
            ) : null}

            <ListField
              label="Tono"
              values={resolved.voice.tone}
              onChange={(tone) => setVoice("tone", tone)}
              overridden={resolved.overridden.voice.includes("tone")}
            />
            {resolved.overridden.voice.includes("tone") ? (
              <button className="btn btn-ghost !px-2 text-[13px]" onClick={() => clearVoice("tone")}>
                ↩ Volver a heredar ({brand.voice.tone.join(", ")})
              </button>
            ) : null}

            <ListField
              label="No hacemos (en esta zona)"
              hint="Se suma a lo global si lo sobreescribes: úsalo para restricciones extra del mercado."
              values={resolved.voice.dont}
              onChange={(v) => setVoice("dont", v)}
              overridden={resolved.overridden.voice.includes("dont")}
            />
            {resolved.overridden.voice.includes("dont") ? (
              <button className="btn btn-ghost !px-2 text-[13px]" onClick={() => clearVoice("dont")}>
                ↩ Volver a heredar
              </button>
            ) : null}
          </Section>

          <Section title="Claims" description="Los claims traducidos o adaptados de este mercado.">
            <ListField
              label="Claims"
              values={resolved.claims}
              onChange={(claims) => setOverrides({ claims })}
              overridden={resolved.overridden.claims}
            />
            {resolved.overridden.claims ? (
              <button
                className="btn btn-ghost !px-2 text-[13px]"
                onClick={() => setOverrides({ claims: undefined })}
              >
                ↩ Volver a heredar ({brand.claims.join(" · ")})
              </button>
            ) : null}
          </Section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="panel p-4">
            <span className="label">{zone.name} — vista previa</span>
            <div className="mt-3 flex justify-center">
              <CreativePreview
                brand={resolved}
                format="post-1x1"
                headline={resolved.claims[0] ?? brand.name}
                subhead={zone.occasions[0] ?? resolved.voice.tone.slice(0, 3).join(" · ")}
                cta="Descúbrelo"
                width={320}
              />
            </div>
            <dl className="mt-4 space-y-1.5 text-[12.5px]">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--muted)]">Campos propios</dt>
                <dd className="font-medium">
                  {resolved.overridden.colors.length +
                    resolved.overridden.voice.length +
                    (resolved.overridden.positioning ? 1 : 0) +
                    (resolved.overridden.claims ? 1 : 0)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--muted)]">Idioma</dt>
                <dd className="font-medium">{zone.language}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--muted)]">Restricciones</dt>
                <dd className="font-medium">
                  {resolveLegal(state, zone).all.length}
                  <span className="font-normal text-[var(--muted)]">
                    {" "}
                    ({zone.regulatory.length} propia
                    {zone.regulatory.length === 1 ? "" : "s"})
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </>
  );
}
