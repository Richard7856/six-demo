"use client";

import { useEffect, useRef } from "react";
import type { TraceEvent } from "@/lib/trace";

export type TraceLine =
  | { kind: "step"; label: string; detail?: string; ms?: number }
  | { kind: "call"; label: string; detail?: string }
  | { kind: "thinking"; text: string }
  | { kind: "usage"; input: number; output: number }
  | { kind: "notice"; text: string }
  | { kind: "error"; text: string }
  | { kind: "result"; label: string };

/** Convierte un evento del stream en línea de traza, agrupando el pensamiento. */
export function appendTrace(lines: TraceLine[], e: TraceEvent): TraceLine[] {
  if (e.t === "thinking") {
    const last = lines[lines.length - 1];
    if (last?.kind === "thinking") {
      // Los deltas llegan troceados: se acumulan en la misma línea.
      return [...lines.slice(0, -1), { ...last, text: last.text + e.text }];
    }
    return [...lines, { kind: "thinking", text: e.text }];
  }
  if (e.t === "step") {
    return [...lines, { kind: "step", label: e.label, detail: e.detail, ms: e.ms }];
  }
  if (e.t === "call") return [...lines, { kind: "call", label: e.label, detail: e.detail }];
  if (e.t === "usage") {
    return [...lines, { kind: "usage", input: e.input, output: e.output }];
  }
  if (e.t === "notice") return [...lines, { kind: "notice", text: e.text }];
  if (e.t === "done") {
    return [
      ...lines,
      {
        kind: "result",
        label: `${e.proposals.length} propuesta${
          e.proposals.length === 1 ? "" : "s"
        } lista${e.proposals.length === 1 ? "" : "s"}${
          e.engine === "demo" ? " (motor local)" : ""
        }`,
      },
    ];
  }
  return lines;
}

/**
 * La consola de trabajo. Enseña lo que el sistema está haciendo de verdad:
 * los pasos del pipeline con su tiempo real, la llamada al modelo, su
 * razonamiento resumido y el consumo de tokens.
 */
export function AgentTrace({
  lines,
  running,
  title,
  accent = "#03843D",
}: {
  lines: TraceLine[];
  running: boolean;
  title: string;
  accent?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);

  // Autoscroll mientras trabaja; al terminar se queda quieto para poder leerlo.
  useEffect(() => {
    if (running && boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [lines, running]);

  if (lines.length === 0 && !running) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-[#1d2b24] bg-[#0c1512]">
      <div className="flex items-center gap-2 border-b border-[#1d2b24] px-3.5 py-2">
        <span className="flex gap-1.5">
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
          ))}
        </span>
        <span className="text-[12px] font-medium text-white/70">{title}</span>
        {running ? (
          <span className="pulsing ml-auto text-[11px] font-medium" style={{ color: accent }}>
            trabajando…
          </span>
        ) : (
          <span className="ml-auto text-[11px] text-white/35">terminado</span>
        )}
      </div>

      <div
        ref={boxRef}
        className="max-h-[300px] space-y-1.5 overflow-y-auto px-3.5 py-3 font-mono text-[11.5px] leading-relaxed"
      >
        {lines.map((l, i) => (
          <Line key={i} line={l} accent={accent} />
        ))}
        {running ? (
          <div className="flex items-center gap-2 text-white/40">
            <span className="pulsing">▍</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Line({ line, accent }: { line: TraceLine; accent: string }) {
  if (line.kind === "thinking") {
    return (
      <div className="flex gap-2.5">
        <span className="shrink-0 select-none text-white/25">✻</span>
        <p className="whitespace-pre-wrap italic text-white/55">{line.text}</p>
      </div>
    );
  }

  if (line.kind === "call") {
    return (
      <div className="flex gap-2.5">
        <span className="shrink-0 select-none" style={{ color: accent }}>
          ⟳
        </span>
        <p className="text-white/85">
          {line.label}
          {line.detail ? <span className="text-white/40"> — {line.detail}</span> : null}
        </p>
      </div>
    );
  }

  if (line.kind === "usage") {
    return (
      <div className="flex gap-2.5">
        <span className="shrink-0 select-none text-white/25">∑</span>
        <p className="text-white/45">
          {line.input.toLocaleString("es")} tokens de entrada ·{" "}
          {line.output.toLocaleString("es")} de salida
        </p>
      </div>
    );
  }

  if (line.kind === "error") {
    return (
      <div className="flex gap-2.5">
        <span className="shrink-0 select-none text-[#ff5f57]">✕</span>
        <p className="font-semibold text-[#ff8a84]">{line.text}</p>
      </div>
    );
  }

  if (line.kind === "notice") {
    return (
      <div className="flex gap-2.5">
        <span className="shrink-0 select-none text-[#febc2e]">!</span>
        <p className="text-[#f0c674]">{line.text}</p>
      </div>
    );
  }

  if (line.kind === "result") {
    return (
      <div className="flex gap-2.5">
        <span className="shrink-0 select-none" style={{ color: accent }}>
          ✓
        </span>
        <p className="font-semibold text-white/90">{line.label}</p>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      <span className="shrink-0 select-none" style={{ color: accent }}>
        ✓
      </span>
      <p className="text-white/80">
        {line.label}
        {line.detail ? <span className="text-white/40"> — {line.detail}</span> : null}
        {typeof line.ms === "number" ? (
          <span className="text-white/25"> {line.ms} ms</span>
        ) : null}
      </p>
    </div>
  );
}
