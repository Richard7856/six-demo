"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useStudio } from "@/lib/store";
import { PageHeader } from "@/components/ui";
import { Alert, Check, Download, Globe2, Package, Sparkles, Swatch, Upload } from "@/components/icons";
import { toLegalRules, type Extraction } from "@/lib/import/schema";
import type { StudioState, Zone } from "@/lib/types";

type Mode = "ia" | "archivo" | "formulario";

/** «1 zonas» delante de un cliente es una errata barata de evitar. */
function plural(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

export default function ImportPage() {
  const [mode, setMode] = useState<Mode>("ia");

  return (
    <>
      <PageHeader
        title="Importar marca"
        subtitle="Cargar el brand kit, las zonas y los productos de una marca. Tres caminos al mismo sitio — elige el que se ajuste a lo que tengas a mano."
      />

      <div className="mb-5 flex gap-1 rounded-lg bg-[#eceee9] p-0.5">
        {(
          [
            ["ia", "Hablando con la IA"],
            ["archivo", "Desde un archivo"],
            ["formulario", "A mano, con el formulario"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`flex-1 rounded-[7px] px-3 py-1.5 text-[13.5px] font-medium transition-colors ${
              mode === id
                ? "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                : "text-[var(--muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "ia" ? <AiImport /> : null}
      {mode === "archivo" ? <FileImport /> : null}
      {mode === "formulario" ? <FormRoute /> : null}
    </>
  );
}

/* ── Camino 1: hablando con la IA ─────────────────────────────────────── */

function AiImport() {
  const { state, importState } = useStudio();
  const [material, setMaterial] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extraction | null>(null);
  const [applied, setApplied] = useState<string[]>([]);

  // Qué partes se aplican. Todo empieza marcado, pero se puede desmarcar:
  // importar es sustituir, y sustituir sin mirar es cómo se pierde una tarde.
  const [take, setTake] = useState({ brand: true, zones: true, products: true, legal: true });

  const read = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    setApplied([]);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ material }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `El servidor respondió ${res.status}`);
      setResult(json.extraction as Extraction);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setBusy(false);
    }
  };

  const apply = () => {
    if (!result) return;
    const patch: Partial<StudioState> = {};
    const done: string[] = [];

    if (take.brand && result.brand) {
      patch.brand = {
        ...state.brand,
        name: result.brand.name,
        positioning: result.brand.positioning,
        colors: { ...state.brand.colors, ...result.brand.colors },
        voice: result.brand.voice,
        claims: result.brand.claims,
        // El logo de la marca anterior NO se hereda. Un texto pegado no trae
        // logo, y dejar el viejo pondría la marca de otro cliente encima de
        // estas piezas. Sin logo, el creativo dibuja el wordmark con el nombre
        // y los colores nuevos; se sube el real desde Brand kit.
        logoDataUrl: null,
      };
      done.push("brand kit");
    }

    if (take.zones && result.zones.length) {
      patch.zones = result.zones.map<Zone>((z) => ({
        ...z,
        // Lo que el material no puede saber lo dejamos vacío en vez de
        // rellenarlo: una red inventada saldría en el generador como buena.
        networks: [],
        handles: {},
        regulatory: toLegalRules(z.regulatory ?? [], `imp-${z.id}`),
        overrides: {},
      }));
      done.push(plural(result.zones.length, "zona", "zonas"));
    }

    if (take.products && result.products.length) {
      patch.products = result.products;
      done.push(plural(result.products.length, "producto", "productos"));
    }

    if (take.legal && result.legal.length) {
      patch.legal = toLegalRules(result.legal, "imp-global");
      done.push(plural(result.legal.length, "regla legal", "reglas legales"));
    }

    importState(patch);
    setApplied(done);
  };

  return (
    <div className="space-y-4">
      <section className="panel p-5">
        <h2 className="text-[15px] font-bold tracking-tight">
          Pega el material o cuéntalo con tus palabras
        </h2>
        <p className="mt-1 max-w-[70ch] text-[13.5px] leading-relaxed text-[var(--muted)]">
          Vale un extracto del manual de marca, un correo del cliente, notas sueltas o
          una descripción del negocio. Se lee lo que hay: lo que no esté, se declara
          como hueco en vez de rellenarse a ojo.
        </p>

        {/* `!min-h`: el CSS global fija 74px a los textarea con .field y gana
            por especificidad; aquí hace falta sitio para pegar un manual. */}
        <textarea
          className="field mt-3 !min-h-[210px] font-[inherit] text-[13.5px] leading-relaxed"
          placeholder={PLACEHOLDER}
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            className="btn btn-primary"
            onClick={read}
            disabled={busy || material.trim().length < 40}
          >
            <Sparkles className="h-4 w-4" />
            {busy ? "Leyendo…" : "Leer el material"}
          </button>
          <span className="text-[12.5px] text-[var(--muted)]">
            {material.trim().length.toLocaleString("es")} caracteres · una llamada al
            modelo, unos 2 MXN
          </span>
        </div>

        {error ? (
          <p
            className="mt-3 rounded-lg border px-3 py-2 text-[13px] leading-snug"
            style={{ borderColor: "#F0C9C7", background: "#FDF0EF", color: "#B3120F" }}
          >
            {error}
          </p>
        ) : null}
      </section>

      {result ? (
        <section className="panel p-5">
          <h2 className="text-[15px] font-bold tracking-tight">Esto es lo que ha sacado</h2>
          <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--muted)]">
            {result.notes}
          </p>

          {result.gaps?.length ? (
            <div
              className="mt-3 rounded-lg border px-3 py-2.5"
              style={{ borderColor: "#EBDCB8", background: "#FDF6E8" }}
            >
              <div className="flex items-center gap-1.5">
                <Alert className="h-3.5 w-3.5" />
                <span
                  className="text-[12px] font-bold uppercase tracking-wider"
                  style={{ color: "#8A5A00" }}
                >
                  Lo que no venía en el material
                </span>
              </div>
              <ul className="mt-1.5 space-y-1">
                {result.gaps.map((g, i) => (
                  <li key={i} className="text-[13px] leading-snug" style={{ color: "#8A5A00" }}>
                    · {g}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-4 space-y-2">
            <Row
              on={take.brand}
              disabled={!result.brand}
              onToggle={() => setTake((t) => ({ ...t, brand: !t.brand }))}
              icon={<Swatch className="h-4 w-4" />}
              title="Brand kit"
              detail={
                result.brand
                  ? `${result.brand.name} · ${result.brand.voice.tone.join(", ")} · el logo se vacía, súbelo en Brand kit`
                  : "No ha encontrado marca en el material"
              }
              swatches={
                result.brand
                  ? [
                      result.brand.colors.primary,
                      result.brand.colors.secondary,
                      result.brand.colors.accent,
                    ]
                  : undefined
              }
            />
            <Row
              on={take.zones}
              disabled={!result.zones.length}
              onToggle={() => setTake((t) => ({ ...t, zones: !t.zones }))}
              icon={<Globe2 className="h-4 w-4" />}
              title={`Zonas (${result.zones.length})`}
              detail={
                result.zones.length
                  ? result.zones.map((z) => z.name).join(" · ")
                  : "No menciona regiones"
              }
            />
            <Row
              on={take.products}
              disabled={!result.products.length}
              onToggle={() => setTake((t) => ({ ...t, products: !t.products }))}
              icon={<Package className="h-4 w-4" />}
              title={`Productos (${result.products.length})`}
              detail={
                result.products.length
                  ? result.products.map((p) => p.name).join(" · ")
                  : "No detalla productos"
              }
            />
            <Row
              on={take.legal}
              disabled={!result.legal.length}
              onToggle={() => setTake((t) => ({ ...t, legal: !t.legal }))}
              icon={<Alert className="h-4 w-4" />}
              title={`Reglas legales (${result.legal.length})`}
              detail={
                result.legal.length
                  ? "Entran sin validar — hay que pasarlas por legal"
                  : "No menciona restricciones legales"
              }
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-4">
            <button className="btn btn-primary" onClick={apply}>
              <Check className="h-4 w-4" />
              Aplicar lo marcado
            </button>
            <span className="text-[12.5px] leading-snug text-[var(--muted)]">
              Sustituye lo marcado. Las propuestas ya guardadas no se tocan.
            </span>
          </div>

          {applied.length ? (
            <p
              className="mt-3 rounded-lg border px-3 py-2 text-[13px]"
              style={{ borderColor: "#CDE3D2", background: "#F1F7F1", color: "#2E6B3A" }}
            >
              Aplicado: {applied.join(", ")}. Revísalo en{" "}
              <Link href="/marca" className="underline">
                Brand kit
              </Link>
              ,{" "}
              <Link href="/zonas" className="underline">
                Zonas
              </Link>{" "}
              y{" "}
              <Link href="/legal" className="underline">
                Legal
              </Link>
              .
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function Row({
  on,
  disabled,
  onToggle,
  icon,
  title,
  detail,
  swatches,
}: {
  on: boolean;
  disabled?: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  title: string;
  detail: string;
  swatches?: string[];
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-lg border p-3 ${
        disabled ? "opacity-55" : "cursor-pointer hover:border-[var(--brand)]"
      }`}
      style={{ borderColor: "var(--line)" }}
    >
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
        checked={on && !disabled}
        disabled={disabled}
        onChange={onToggle}
      />
      <span className="mt-0.5 text-[var(--muted)]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold">{title}</span>
        <span className="block text-[13px] leading-snug text-[var(--muted)]">{detail}</span>
      </span>
      {swatches ? (
        <span className="flex shrink-0 gap-1">
          {swatches.map((c, i) => (
            <span
              key={`${c}-${i}`}
              className="h-6 w-6 rounded-md border border-black/10"
              style={{ background: c }}
              title={c}
            />
          ))}
        </span>
      ) : null}
    </label>
  );
}

/* ── Camino 2: archivo ────────────────────────────────────────────────── */

function FileImport() {
  const { state, importState } = useStudio();
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportJson = () => {
    const { brand, legal, zones, products } = state;
    const blob = new Blob([JSON.stringify({ brand, legal, zones, products }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${brand.name.toLowerCase().replace(/\W+/g, "-")}-marca.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = async (file: File) => {
    setNotice(null);
    setError(null);
    try {
      const parsed = JSON.parse(await file.text()) as Partial<StudioState>;
      const patch: Partial<StudioState> = {};
      const done: string[] = [];

      if (parsed.brand?.name) {
        patch.brand = {
          ...state.brand,
          ...parsed.brand,
          // Igual que en la importación con IA: si el archivo no trae logo, no
          // se hereda el de la marca anterior.
          logoDataUrl: parsed.brand.logoDataUrl ?? null,
        };
        done.push("brand kit");
      }
      if (Array.isArray(parsed.zones) && parsed.zones.length) {
        patch.zones = parsed.zones;
        done.push(plural(parsed.zones.length, "zona", "zonas"));
      }
      if (Array.isArray(parsed.products) && parsed.products.length) {
        patch.products = parsed.products;
        done.push(plural(parsed.products.length, "producto", "productos"));
      }
      if (Array.isArray(parsed.legal)) {
        patch.legal = parsed.legal;
        done.push(plural(parsed.legal.length, "regla legal", "reglas legales"));
      }

      if (!done.length) {
        throw new Error(
          "El archivo no trae ni marca, ni zonas, ni productos que se puedan leer.",
        );
      }

      importState(patch);
      setNotice(`Importado: ${done.join(", ")}.`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo leer el archivo: ¿es un JSON válido?",
      );
    }
  };

  return (
    <div className="space-y-4">
      <section className="panel p-5">
        <h2 className="text-[15px] font-bold tracking-tight">Cargar un archivo</h2>
        <p className="mt-1 max-w-[70ch] text-[13.5px] leading-relaxed text-[var(--muted)]">
          Un JSON con las mismas claves que exporta el botón de abajo:{" "}
          <code className="font-mono text-[12.5px]">brand</code>,{" "}
          <code className="font-mono text-[12.5px]">legal</code>,{" "}
          <code className="font-mono text-[12.5px]">zones</code> y{" "}
          <code className="font-mono text-[12.5px]">products</code>. Entra solo lo que
          traiga; el resto se queda como está.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importJson(f);
            e.target.value = "";
          }}
        />
        <button className="btn btn-primary mt-3" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4" />
          Elegir archivo JSON
        </button>

        {notice ? (
          <p
            className="mt-3 rounded-lg border px-3 py-2 text-[13px]"
            style={{ borderColor: "#CDE3D2", background: "#F1F7F1", color: "#2E6B3A" }}
          >
            {notice}
          </p>
        ) : null}
        {error ? (
          <p
            className="mt-3 rounded-lg border px-3 py-2 text-[13px]"
            style={{ borderColor: "#F0C9C7", background: "#FDF0EF", color: "#B3120F" }}
          >
            {error}
          </p>
        ) : null}
      </section>

      <section className="panel p-5">
        <h2 className="text-[15px] font-bold tracking-tight">Guardar lo que hay ahora</h2>
        <p className="mt-1 max-w-[70ch] text-[13.5px] leading-relaxed text-[var(--muted)]">
          Todo lo que editas vive solo en este navegador: si alguien limpia los datos del
          sitio, se pierde. Descarga el archivo y tendrás copia — y de paso, la forma de
          pasarle esta configuración a otra persona.
        </p>
        <button className="btn mt-3" onClick={exportJson}>
          <Download className="h-4 w-4" />
          Descargar {state.brand.name} en JSON
        </button>
      </section>
    </div>
  );
}

/* ── Camino 3: el formulario de siempre ───────────────────────────────── */

function FormRoute() {
  const { state } = useStudio();
  const items = [
    {
      href: "/marca",
      icon: <Swatch className="h-4 w-4" />,
      title: "Brand kit",
      detail: `${state.brand.name} · paleta, tipografías, tono, claims`,
    },
    {
      href: "/zonas",
      icon: <Globe2 className="h-4 w-4" />,
      title: "Zonas",
      detail: `${state.zones.length} cargadas · cada una hereda del kit global y sobreescribe lo suyo`,
    },
    {
      href: "/productos",
      icon: <Package className="h-4 w-4" />,
      title: "Productos",
      detail: `${state.products.length} cargados · familia, atributos y ocasiones`,
    },
    {
      href: "/legal",
      icon: <Alert className="h-4 w-4" />,
      title: "Marco legal",
      detail: `${state.legal.length} reglas globales · más las propias de cada zona`,
    },
  ];

  return (
    <section className="panel p-5">
      <h2 className="text-[15px] font-bold tracking-tight">Editarlo a mano</h2>
      <p className="mt-1 max-w-[70ch] text-[13.5px] leading-relaxed text-[var(--muted)]">
        Los formularios de siempre, sin cambios. Es el camino lento pero el único donde
        controlas cada campo — y al final, venga de donde venga la importación, todo
        acaba siendo editable aquí.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className="flex items-start gap-3 rounded-lg border border-[var(--line)] p-3 transition-colors hover:border-[var(--brand)]"
          >
            <span className="mt-0.5 text-[var(--muted)]">{i.icon}</span>
            <span className="min-w-0">
              <span className="block text-[13.5px] font-semibold">{i.title}</span>
              <span className="block text-[13px] leading-snug text-[var(--muted)]">
                {i.detail}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

const PLACEHOLDER = `Por ejemplo:

Somos una cadena de cafeterías de barrio en Bogotá y Medellín. Nos llamamos
Tinto. El rojo de la marca es #C0392B y el fondo crema #F6F1E7. Hablamos
de tú, con humor bogotano, sin sonar a cadena gringa.

Vendemos café de origen, pan de bono y almuerzo corrido. En Medellín la
gente pide más para llevar; en Bogotá se quedan a trabajar.`;
