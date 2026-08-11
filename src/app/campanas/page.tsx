"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStudio } from "@/lib/store";
import { resolveBrand } from "@/lib/resolve";
import { ProposalCard } from "@/components/ProposalCard";
import { PageHeader } from "@/components/ui";

export default function LibraryPage() {
  const { state, updateProposal, removeProposal } = useStudio();
  const { brand, zones, products, proposals } = state;

  const [zoneFilter, setZoneFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(
    () =>
      proposals.filter(
        (p) =>
          (zoneFilter === "all" || p.zoneId === zoneFilter) &&
          (productFilter === "all" || p.productId === productFilter) &&
          (statusFilter === "all" || p.status === statusFilter),
      ),
    [proposals, zoneFilter, productFilter, statusFilter],
  );

  return (
    <>
      <PageHeader
        title="Biblioteca"
        subtitle="Todo lo guardado, filtrable por zona y producto. Sigue siendo editable: cambiar el brand kit de una zona reencuadra sus creativos al instante."
      />

      {proposals.length === 0 ? (
        <div className="panel p-10 text-center">
          <p className="text-[15px] font-medium">La biblioteca está vacía</p>
          <p className="mt-1.5 text-[13.5px] text-[var(--muted)]">
            Genera propuestas y guárdalas para verlas aquí.
          </p>
          <Link href="/generar" className="btn btn-primary mt-4 inline-flex">
            Ir a generar
          </Link>
        </div>
      ) : (
        <>
          <div className="panel mb-5 flex flex-wrap gap-3 p-4">
            <select
              className="field !w-auto"
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
            >
              <option value="all">Todas las zonas</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
            <select
              className="field !w-auto"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
            >
              <option value="all">Todos los productos</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              className="field !w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Cualquier estado</option>
              <option value="draft">Borradores</option>
              <option value="approved">Aprobadas</option>
            </select>
            <span className="ml-auto self-center text-[13px] text-[var(--muted)]">
              {filtered.length} de {proposals.length}
            </span>
          </div>

          <div className="space-y-4">
            {filtered.map((p) => {
              const zone = zones.find((z) => z.id === p.zoneId);
              const product = products.find((x) => x.id === p.productId);
              return (
                <ProposalCard
                  key={p.id}
                  proposal={p}
                  brand={resolveBrand(brand, zone)}
                  productName={product?.name ?? ""}
                  handle={
                    zone?.handles?.[p.networkId] ?? `@${brand.name.toLowerCase()}`
                  }
                  onChange={(patch) => updateProposal(p.id, patch)}
                  onRemove={() => removeProposal(p.id)}
                />
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="panel p-8 text-center text-[14px] text-[var(--muted)]">
              Ninguna propuesta coincide con esos filtros.
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
