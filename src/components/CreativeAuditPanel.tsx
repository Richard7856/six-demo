"use client";

import { useState } from "react";
import { Alert, Ban, Check } from "./icons";
import { CREATIVE_CHECKS, type CreativeAudit } from "@/lib/audit/creative";

const VERDICT = {
  aprobada: {
    label: "Aprobada",
    hint: "Puede publicarse tal cual.",
    ink: "#2E6B3A",
    bg: "#F1F7F1",
    line: "#CDE3D2",
    Icon: Check,
  },
  "con-reparos": {
    label: "Con reparos",
    hint: "Puede salir si se atienden los avisos.",
    ink: "#8A5A00",
    bg: "#FDF6E8",
    line: "#EBDCB8",
    Icon: Alert,
  },
  "no-publicable": {
    label: "No publicable",
    hint: "Hay al menos un bloqueo.",
    ink: "#B3120F",
    bg: "#FDF0EF",
    line: "#F0C9C7",
    Icon: Ban,
  },
};

const ROW = {
  ok: { ink: "#2E6B3A", bg: "#F1F7F1", line: "#CDE3D2", Icon: Check },
  aviso: { ink: "#8A5A00", bg: "#FDF6E8", line: "#EBDCB8", Icon: Alert },
  bloqueo: { ink: "#B3120F", bg: "#FDF0EF", line: "#F0C9C7", Icon: Ban },
};

export function CreativeAuditPanel({ audit }: { audit: CreativeAudit }) {
  const [open, setOpen] = useState(true);
  const v = VERDICT[audit.verdict];

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: v.line, background: v.bg }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-2 px-3 py-2.5 text-left"
      >
        <v.Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1">
          <span
            className="block text-[13px] font-bold uppercase tracking-wider"
            style={{ color: v.ink }}
          >
            {v.label}
          </span>
          <span className="mt-0.5 block text-[12.5px] leading-snug text-[var(--ink)]">
            {audit.summary || v.hint}
          </span>
        </span>
        <span className="mt-0.5 shrink-0 text-[11px] text-[var(--muted)]">
          {open ? "ocultar" : "ver"}
        </span>
      </button>

      {open ? (
        <div className="border-t bg-white/70 px-3 py-2.5" style={{ borderColor: v.line }}>
          <ul className="space-y-2">
            {audit.checks.map((c) => {
              const label =
                CREATIVE_CHECKS.find((x) => x.id === c.id)?.label ?? c.id;
              const r = ROW[c.verdict];
              return (
                <li key={c.id} className="flex gap-2">
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
                    style={{ borderColor: r.line, background: r.bg, color: r.ink }}
                  >
                    <r.Icon className="h-2.5 w-2.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold">{label}</p>
                    <p className="text-[12.5px] leading-snug text-[var(--muted)]">
                      {c.finding}
                    </p>
                    {c.quote ? (
                      <p
                        className="mt-1 border-l-2 pl-2 text-[12px] italic leading-snug"
                        style={{ borderColor: r.line, color: r.ink }}
                      >
                        «{c.quote}»
                      </p>
                    ) : null}
                    {c.rule ? (
                      <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--muted)] opacity-80">
                        Regla: {c.rule}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>

          {audit.fixes.length ? (
            <div className="mt-3 border-t border-[var(--line)] pt-2.5">
              <span className="label">Cómo se arregla</span>
              <ul className="mt-1.5 space-y-1.5">
                {audit.fixes.map((f, i) => (
                  <li key={i} className="flex gap-1.5 text-[12.5px] leading-snug">
                    <span className="text-[var(--muted)]">→</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="mt-2.5 text-[11px] leading-snug text-[var(--muted)]">
            {audit.engine === "local"
              ? "Revisión local sin modelo: no se ha mirado la imagen."
              : "Revisado por Claude sobre la pieza compuesta y su copy."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
