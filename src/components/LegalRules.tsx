"use client";

import { useState } from "react";
import { Check, Plus, Trash } from "./icons";
import { newRuleId } from "@/lib/legal";
import type { LegalRule } from "@/lib/types";

/**
 * Editor de reglas legales.
 *
 * La única decisión de diseño que importa aquí: el interruptor de validada.
 * Una regla sin validar es una suposición nuestra, y en la demo hay bastantes.
 * Si se ven igual que las reales, alguien acabará tratando una invención como
 * derecho vigente — que es exactamente el riesgo que este apartado existe para
 * evitar.
 */
export function LegalRules({
  rules,
  onChange,
  placeholder = "Añadir restricción…",
  emptyHint,
  readOnlyRules,
}: {
  rules: LegalRule[];
  onChange: (rules: LegalRule[]) => void;
  placeholder?: string;
  emptyHint?: string;
  /** Reglas heredadas que se enseñan pero no se editan desde aquí. */
  readOnlyRules?: { rules: LegalRule[]; label: string };
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    // Nace sin validar: lo acaba de escribir alguien, no legal.
    onChange([...rules, { id: newRuleId(), text, validated: false }]);
    setDraft("");
  };

  const patch = (id: string, p: Partial<LegalRule>) =>
    onChange(rules.map((r) => (r.id === id ? { ...r, ...p } : r)));

  return (
    <div className="space-y-3">
      {readOnlyRules?.rules.length ? (
        <div className="rounded-lg border border-dashed border-[var(--line)] bg-[#fafbf9] p-3">
          <span className="label">{readOnlyRules.label}</span>
          <ul className="mt-2 space-y-1.5">
            {readOnlyRules.rules.map((r) => (
              <li key={r.id} className="flex items-start gap-2 text-[13px] leading-snug">
                <StatusDot validated={r.validated} />
                <span className="text-[var(--muted)]">{r.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {rules.length === 0 && emptyHint ? (
        <p className="text-[13px] leading-relaxed text-[var(--muted)]">{emptyHint}</p>
      ) : null}

      <ul className="space-y-2">
        {rules.map((r) => (
          <li
            key={r.id}
            className="rounded-lg border border-[var(--line)] bg-white p-2.5"
            style={r.validated ? undefined : { borderColor: "#EBDCB8", background: "#FEFCF7" }}
          >
            <div className="flex items-start gap-2">
              <StatusDot validated={r.validated} />
              {/* `!min-h-0`: el CSS global impone 74px de alto a los textarea
                  con .field y aquí sobra — la regla ocupa una o dos líneas. */}
              <textarea
                className="field !min-h-0 flex-1 resize-none border-0 !p-0 text-[13.5px] leading-snug focus:shadow-none"
                rows={Math.max(1, Math.ceil(r.text.length / 58))}
                value={r.text}
                onChange={(e) => patch(r.id, { text: e.target.value })}
              />
              <button
                type="button"
                onClick={() => onChange(rules.filter((x) => x.id !== r.id))}
                className="mt-0.5 shrink-0 text-[var(--muted)] transition-colors hover:text-[#c00]"
                aria-label={`Quitar regla: ${r.text.slice(0, 40)}`}
              >
                <Trash className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 pl-[18px]">
              <button
                type="button"
                onClick={() => patch(r.id, { validated: !r.validated })}
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors"
                style={
                  r.validated
                    ? { borderColor: "#CDE3D2", background: "#F1F7F1", color: "#2E6B3A" }
                    : { borderColor: "#EBDCB8", background: "#FDF6E8", color: "#8A5A00" }
                }
              >
                {r.validated ? <Check className="h-3 w-3" /> : null}
                {r.validated ? "Validada por legal" : "Sin validar"}
              </button>

              <input
                className="field h-7 flex-1 !py-0 text-[12px]"
                placeholder="De dónde sale (opcional): norma, circular, correo…"
                value={r.source ?? ""}
                onChange={(e) => patch(r.id, { source: e.target.value || undefined })}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          className="field"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="btn" onClick={add} disabled={!draft.trim()}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function StatusDot({ validated }: { validated: boolean }) {
  return (
    <span
      className="mt-1 h-2 w-2 shrink-0 rounded-full"
      style={{ background: validated ? "#2E6B3A" : "#D9A400" }}
      title={validated ? "Validada por legal" : "Sin validar por legal"}
    />
  );
}
