"use client";

import { useStudio } from "@/lib/store";
import { ColorField, Field, ListField, PageHeader } from "@/components/ui";
import { Plus, Trash } from "@/components/icons";

export default function ProductsPage() {
  const { state, updateProduct, addProduct, removeProduct } = useStudio();

  const create = () => {
    const name = prompt("Nombre del producto");
    if (!name?.trim()) return;
    addProduct({
      id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36).slice(-4)}`,
      name: name.trim(),
      family: "",
      abv: "",
      color: "#E1211D",
      attributes: [],
      occasions: [],
      notes: "",
    });
  };

  return (
    <>
      <PageHeader
        title="Productos"
        subtitle="El eje que cruza con las zonas. Cada combinación zona × producto es un brief distinto para el generador."
        action={
          <button className="btn btn-primary" onClick={create}>
            <Plus className="h-4 w-4" />
            Nuevo producto
          </button>
        }
      />

      <div className="space-y-4">
        {state.products.map((p) => (
          <div key={p.id} className="panel overflow-hidden">
            <div className="flex items-center gap-3 border-b border-[var(--line)] p-4">
              <span
                className="h-9 w-9 shrink-0 rounded-lg border border-black/10"
                style={{ background: p.color }}
              />
              <input
                className="field !border-transparent !bg-transparent !px-0 text-[16px] font-bold tracking-tight"
                value={p.name}
                onChange={(e) => updateProduct(p.id, { name: e.target.value })}
              />
              <button
                className="btn btn-ghost ml-auto"
                onClick={() => {
                  if (confirm(`¿Eliminar "${p.name}"?`)) removeProduct(p.id);
                }}
                aria-label={`Eliminar ${p.name}`}
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 p-4 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Familia">
                    <input
                      className="field"
                      value={p.family}
                      onChange={(e) => updateProduct(p.id, { family: e.target.value })}
                      placeholder="Lager"
                    />
                  </Field>
                  <Field label="Graduación">
                    <input
                      className="field"
                      value={p.abv}
                      onChange={(e) => updateProduct(p.id, { abv: e.target.value })}
                      placeholder="5,0%"
                    />
                  </Field>
                </div>
                <ColorField
                  label="Color de pack"
                  value={p.color}
                  onChange={(color) => updateProduct(p.id, { color })}
                />
              </div>

              <div className="space-y-4">
                <ListField
                  label="Atributos"
                  values={p.attributes}
                  onChange={(attributes) => updateProduct(p.id, { attributes })}
                  placeholder="Extra refrescante"
                />
                <ListField
                  label="Ocasiones"
                  values={p.occasions}
                  onChange={(occasions) => updateProduct(p.id, { occasions })}
                  placeholder="Festival"
                />
                <Field
                  label="Nota interna"
                  hint="Contexto de negocio para el generador: a quién ataca, contra qué compite."
                >
                  <textarea
                    className="field"
                    rows={2}
                    value={p.notes}
                    onChange={(e) => updateProduct(p.id, { notes: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
