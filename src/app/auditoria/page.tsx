"use client";

import { useStudio } from "@/lib/store";
import { PageHeader } from "@/components/ui";
import { Alert, Ban, Check, Shield } from "@/components/icons";
import { REPORT, HAS_REPORT } from "@/lib/audit/report";
import { CHECKS, worstVerdict, type SafeArea, type Verdict } from "@/lib/audit/checks";

type VerdictStyle = {
  label: string;
  /** El plural no siempre es label + "s": «cumples» no es español. */
  tally: [singular: string, plural: string];
  ink: string;
  bg: string;
  line: string;
  Icon: (p: { className?: string }) => React.ReactElement;
};

const VERDICT: Record<Verdict, VerdictStyle> = {
  ok: {
    label: "Cumple",
    tally: ["sin salvedades", "sin salvedades"],
    ink: "#2E6B3A",
    bg: "#F1F7F1",
    line: "#CDE3D2",
    Icon: Check,
  },
  aviso: {
    label: "Aviso",
    tally: ["aviso", "avisos"],
    ink: "#8A5A00",
    bg: "#FDF6E8",
    line: "#EBDCB8",
    Icon: Alert,
  },
  bloqueo: {
    label: "Bloqueo",
    tally: ["bloqueo", "bloqueos"],
    ink: "#B3120F",
    bg: "#FDF0EF",
    line: "#F0C9C7",
    Icon: Ban,
  },
};

const RATIO: Record<string, string> = {
  "post-1x1": "1 / 1",
  "story-9x16": "9 / 16",
  "banner-16x9": "16 / 9",
};

/** Dónde cae la zona limpia en una rejilla de 3×3 sobre la foto. */
const SAFE_CELL: Record<SafeArea, { row: number; col: number } | null> = {
  "superior-izquierda": { row: 1, col: 1 },
  "superior-centro": { row: 1, col: 2 },
  "superior-derecha": { row: 1, col: 3 },
  centro: { row: 2, col: 2 },
  "inferior-izquierda": { row: 3, col: 1 },
  "inferior-centro": { row: 3, col: 2 },
  "inferior-derecha": { row: 3, col: 3 },
  ninguna: null,
};

export default function AuditPage() {
  const { state } = useStudio();

  // El informe guarda contra qué se auditó. Si desde entonces alguien ha
  // tocado la paleta o las reglas en la app, lo que se ve en pantalla ya no
  // corresponde: mejor decirlo que dejar que lo lean como vigente.
  const live = [
    state.brand.colors.primary,
    state.brand.colors.secondary,
    state.brand.colors.accent,
  ];
  const stale =
    HAS_REPORT &&
    (live.join() !== REPORT.against.palette.join() ||
      state.brand.voice.dont.join("|") !== REPORT.against.dont.join("|"));

  const verdicts = REPORT.images.map((img) => worstVerdict(img.checks));
  const tally = {
    ok: verdicts.filter((v) => v === "ok").length,
    aviso: verdicts.filter((v) => v === "aviso").length,
    bloqueo: verdicts.filter((v) => v === "bloqueo").length,
  };

  return (
    <>
      <PageHeader
        title="Auditoría de marca"
        subtitle="Cada imagen de la biblioteca, revisada contra el brand kit antes de que la herramienta la use de fondo. Los criterios salen de la paleta, de los «qué no hacer» y de las notas regulatorias que hay cargadas: cambia el brand kit y la siguiente auditoría cambia con él."
      />

      {!HAS_REPORT ? <EmptyState /> : null}

      {HAS_REPORT ? (
        <>
          {stale ? (
            <div
              className="mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3"
              style={{ borderColor: VERDICT.aviso.line, background: VERDICT.aviso.bg }}
            >
              <Alert className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-[13.5px] leading-relaxed" style={{ color: VERDICT.aviso.ink }}>
                El brand kit ha cambiado desde que se corrió esta auditoría. Lo que ves
                abajo se juzgó contra la paleta y las reglas anteriores — vuelve a
                auditar antes de darlo por bueno.
              </p>
            </div>
          ) : null}

          <div className="mb-5 flex flex-wrap items-center gap-2.5 rounded-xl border border-[var(--line)] bg-white px-4 py-3">
            <Shield className="h-4 w-4 text-[var(--muted)]" />
            <span className="text-[13.5px] font-semibold">
              {REPORT.images.length}{" "}
              {REPORT.images.length === 1 ? "imagen" : "imágenes"} en la biblioteca
            </span>
            <span className="text-[var(--line)]">·</span>
            {(["bloqueo", "aviso", "ok"] as Verdict[]).map((v) =>
              tally[v] ? (
                <Tally key={v} verdict={v} count={tally[v]} />
              ) : null,
            )}
            <span className="ml-auto text-[12.5px] text-[var(--muted)]">
              {tally.bloqueo === 0 && tally.aviso === 0
                ? "Toda la biblioteca está limpia."
                : "Revisa lo marcado antes de aprobar piezas con estos fondos."}
            </span>
          </div>

          <div className="space-y-4">
            {REPORT.images.map((img) => (
              <ImageCard key={img.src} img={img} />
            ))}
          </div>

          <p className="mt-6 text-[12.5px] leading-relaxed text-[var(--muted)]">
            Este informe está grabado: la pantalla no llama al modelo, así que abrirla no
            cuesta nada y enseña siempre lo mismo. Se vuelve a correr desde desarrollo
            cuando entran fotos nuevas.
          </p>
        </>
      ) : null}
    </>
  );
}

function Tally({ verdict, count }: { verdict: Verdict; count: number }) {
  const v = VERDICT[verdict];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] font-semibold"
      style={{ borderColor: v.line, background: v.bg, color: v.ink }}
    >
      <v.Icon className="h-3.5 w-3.5" />
      {count} {count === 1 ? v.tally[0] : v.tally[1]}
    </span>
  );
}

function ImageCard({ img }: { img: (typeof REPORT.images)[number] }) {
  const overall = worstVerdict(img.checks);
  const v = VERDICT[overall];
  const ratio = RATIO[img.formats[0]] ?? "1 / 1";
  const cell = SAFE_CELL[img.safeArea];

  return (
    <section className="panel overflow-hidden">
      <div className="h-1 w-full" style={{ background: v.ink }} />

      <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,240px)_1fr]">
        <div>
          <div
            className="relative overflow-hidden rounded-xl border border-[var(--line)] bg-[#eceee9]"
            style={{ aspectRatio: ratio }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt={img.label} className="h-full w-full object-cover" />

            {/* La zona limpia, dibujada encima: se entiende de un vistazo mejor
                que leyendo «superior-derecha». */}
            {cell ? (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-1.5">
                <div
                  className="flex items-center justify-center rounded-md border-2 border-dashed"
                  style={{
                    gridRow: cell.row,
                    gridColumn: cell.col,
                    borderColor: "rgba(255,255,255,0.9)",
                    background: "rgba(0,0,0,0.18)",
                  }}
                >
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white">
                    logo
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {img.formats.map((f) => (
              <span key={f} className="chip font-mono !text-[11px]">
                {f}
              </span>
            ))}
          </div>

          {img.dominantColors.length ? (
            <div className="mt-2.5">
              <span className="label">Colores dominantes</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {img.dominantColors.map((c, i) => (
                  <span
                    key={`${c}-${i}`}
                    className="flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white py-0.5 pl-0.5 pr-2 font-mono text-[11px] text-[var(--muted)]"
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-[var(--line)]"
                      style={{ background: c }}
                    />
                    {c.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-[16px] font-bold tracking-tight">{img.label}</h2>
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-wider"
              style={{ borderColor: v.line, background: v.bg, color: v.ink }}
            >
              <v.Icon className="h-3.5 w-3.5" />
              {v.label}
            </span>
          </div>

          <p className="mt-0.5 font-mono text-[11.5px] text-[var(--muted)]">{img.src}</p>

          {img.summary ? (
            <p className="mt-2.5 text-[14px] leading-relaxed">{img.summary}</p>
          ) : null}

          <ul className="mt-4 space-y-2.5">
            {img.checks.map((result) => {
              const check = CHECKS.find((c) => c.id === result.id);
              const rv = VERDICT[result.verdict];
              return (
                <li key={result.id} className="flex gap-2.5">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                    style={{ borderColor: rv.line, background: rv.bg, color: rv.ink }}
                    title={rv.label}
                  >
                    <rv.Icon className="h-3 w-3" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold">
                      {check?.label ?? result.id}
                    </p>
                    <p className="text-[13.5px] leading-relaxed text-[var(--muted)]">
                      {result.finding}
                    </p>
                    {check && result.verdict !== "ok" ? (
                      <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--muted)] opacity-80">
                        Por qué se mira: {check.why}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="panel p-6">
      <h2 className="text-[15px] font-bold tracking-tight">Todavía no hay informe</h2>
      <p className="mt-1.5 max-w-[64ch] text-[13.5px] leading-relaxed text-[var(--muted)]">
        La auditoría se corre una vez desde desarrollo y se guarda en el repositorio.
        Mirar una foto con el modelo cuesta unos céntimos; leer el informe, nada. Por eso
        no hay un botón de «auditar» aquí: la demo nunca gasta sola.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <span className="label">Con el servidor de desarrollo levantado</span>
          <pre className="mt-1.5 overflow-x-auto rounded-lg border border-[var(--line)] bg-[#fafbf9] px-3 py-2.5 font-mono text-[12.5px]">
            curl -X POST localhost:3000/api/dev/audit
          </pre>
        </div>
        <p className="text-[13px] leading-relaxed text-[var(--muted)]">
          Audita solo las imágenes que aún no estén en el informe. Añade{" "}
          <code className="rounded bg-[#f0f1ee] px-1 py-0.5 font-mono text-[12px]">
            {`-d '{"force":true}'`}
          </code>{" "}
          para rehacerlas todas — necesario si has cambiado la paleta o las reglas de la
          marca. Requiere <code className="font-mono text-[12px]">ANTHROPIC_API_KEY</code>{" "}
          en <code className="font-mono text-[12px]">.env.local</code>.
        </p>
      </div>
    </section>
  );
}
