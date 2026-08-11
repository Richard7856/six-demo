"use client";

import { useState } from "react";
import { Plus, Trash } from "./icons";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-1 max-w-[62ch] text-[14.5px] leading-relaxed text-[var(--muted)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Field({
  label,
  hint,
  overridden,
  children,
}: {
  label: string;
  hint?: string;
  overridden?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={overridden ? "overridden" : undefined}>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="label">{label}</span>
        {overridden ? (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B37700]">
            sobreescrito
          </span>
        ) : null}
      </div>
      {children}
      {hint ? (
        <p className="mt-1.5 text-[12.5px] leading-snug text-[var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
  overridden,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  overridden?: boolean;
}) {
  return (
    <Field label={label} overridden={overridden}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 cursor-pointer rounded-lg border border-[var(--line)] bg-white p-1"
          aria-label={`Selector de color para ${label}`}
        />
        <input
          className="field font-mono text-[13px] uppercase"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </Field>
  );
}

/** Editor de listas de strings: tags, claims, do/dont, ocasiones… */
export function ListField({
  label,
  hint,
  values,
  onChange,
  placeholder = "Añadir…",
  overridden,
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  overridden?: boolean;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...values, v]);
    setDraft("");
  };

  return (
    <Field label={label} hint={hint} overridden={overridden}>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <span key={`${v}-${i}`} className="chip !text-[var(--ink)]">
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="ml-0.5 text-[var(--muted)] transition-colors hover:text-[#c00]"
              aria-label={`Quitar ${v}`}
            >
              <Trash className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
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
    </Field>
  );
}

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-5">
      <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-[64ch] text-[13px] leading-relaxed text-[var(--muted)]">
          {description}
        </p>
      ) : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
