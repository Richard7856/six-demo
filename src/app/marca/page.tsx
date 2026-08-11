"use client";

import { useRef } from "react";
import { useStudio } from "@/lib/store";
import { resolveBrand } from "@/lib/resolve";
import { CreativePreview } from "@/components/CreativePreview";
import { ColorField, Field, ListField, PageHeader, Section } from "@/components/ui";
import { Refresh, Trash } from "@/components/icons";

export default function BrandPage() {
  const { state, setBrand, reset } = useStudio();
  const brand = state.brand;
  const fileRef = useRef<HTMLInputElement>(null);

  const onLogo = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setBrand({ logoDataUrl: String(reader.result) });
    reader.readAsDataURL(file);
  };

  return (
    <>
      <PageHeader
        title="Brand kit global"
        subtitle="La marca madre. Cada zona hereda todo esto y solo sobreescribe lo que necesita cambiar."
        action={
          <button
            className="btn"
            onClick={() => {
              if (confirm("Esto descarta todos tus cambios y vuelve a los datos de ejemplo. ¿Seguro?")) {
                reset();
              }
            }}
          >
            <Refresh className="h-4 w-4" />
            Restaurar ejemplo
          </button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Section title="Identidad">
            <Field label="Nombre de marca">
              <input
                className="field"
                value={brand.name}
                onChange={(e) => setBrand({ name: e.target.value })}
              />
            </Field>

            <Field
              label="Posicionamiento"
              hint="Qué es la marca y para quién. Es lo primero que lee el generador de propuestas."
            >
              <textarea
                className="field"
                rows={3}
                value={brand.positioning}
                onChange={(e) => setBrand({ positioning: e.target.value })}
              />
            </Field>

            <Field
              label="Logo"
              hint="PNG o SVG con fondo transparente. Se compone encima del creativo, nunca lo genera la IA."
            >
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-28 place-items-center rounded-lg border border-[var(--line)] bg-[#0B1F14] p-2">
                  {brand.logoDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={brand.logoDataUrl}
                      alt="Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[11px] text-white/50">sin logo</span>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onLogo(f);
                  }}
                />
                <button className="btn" onClick={() => fileRef.current?.click()}>
                  Subir logo
                </button>
                {brand.logoDataUrl ? (
                  <button className="btn btn-ghost" onClick={() => setBrand({ logoDataUrl: null })}>
                    <Trash className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </Field>
          </Section>

          <Section
            title="Paleta"
            description="Estos colores se aplican al creativo en tiempo real. Cambiarlos no cuesta una generación nueva."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(brand.colors) as (keyof typeof brand.colors)[]).map((k) => (
                <ColorField
                  key={k}
                  label={k}
                  value={brand.colors[k]}
                  onChange={(v) => setBrand({ colors: { ...brand.colors, [k]: v } })}
                />
              ))}
            </div>
          </Section>

          <Section title="Tipografía" description="Font stacks CSS. Se usan en el render del creativo.">
            <Field label="Titulares">
              <input
                className="field font-mono text-[13px]"
                value={brand.fonts.display}
                onChange={(e) => setBrand({ fonts: { ...brand.fonts, display: e.target.value } })}
              />
            </Field>
            <Field label="Texto">
              <input
                className="field font-mono text-[13px]"
                value={brand.fonts.body}
                onChange={(e) => setBrand({ fonts: { ...brand.fonts, body: e.target.value } })}
              />
            </Field>
          </Section>

          <Section
            title="Voz de marca"
            description="Esto viaja íntegro al prompt. Cuanto más concreto, menos genérico sale el copy."
          >
            <Field label="Persona">
              <textarea
                className="field"
                rows={2}
                value={brand.voice.persona}
                onChange={(e) => setBrand({ voice: { ...brand.voice, persona: e.target.value } })}
              />
            </Field>
            <ListField
              label="Tono"
              values={brand.voice.tone}
              onChange={(tone) => setBrand({ voice: { ...brand.voice, tone } })}
            />
            <ListField
              label="Sí hacemos"
              values={brand.voice.do}
              onChange={(v) => setBrand({ voice: { ...brand.voice, do: v } })}
            />
            <ListField
              label="No hacemos"
              hint="Las restricciones de categoría (alcohol) van aquí y se respetan en cada generación."
              values={brand.voice.dont}
              onChange={(v) => setBrand({ voice: { ...brand.voice, dont: v } })}
            />
          </Section>

          <Section title="Claims">
            <ListField
              label="Claims disponibles"
              values={brand.claims}
              onChange={(claims) => setBrand({ claims })}
              placeholder="Open Your World"
            />
          </Section>
        </div>

        {/* Vista previa pegajosa */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="panel p-4">
            <span className="label">Vista previa en vivo</span>
            <div className="mt-3 flex justify-center">
              <CreativePreview
                brand={resolveBrand(brand, null)}
                format="post-1x1"
                headline={brand.claims[0] ?? brand.name}
                subhead={brand.voice.tone.slice(0, 3).join(" · ")}
                cta="Descúbrelo"
                width={320}
              />
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--muted)]">
              El fondo lo genera la IA; el logo, la tipografía y los colores se componen
              aquí encima. Por eso el logo nunca sale deformado.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
