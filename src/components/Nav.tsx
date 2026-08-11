"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2, Layers, Package, Scale, Share2, Shield, Sparkles, Swatch } from "@/components/icons";

const LINKS = [
  { href: "/", label: "Panel", icon: Layers },
  { href: "/marca", label: "Brand kit", icon: Swatch },
  { href: "/zonas", label: "Zonas", icon: Globe2 },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/redes", label: "Redes", icon: Share2 },
  { href: "/legal", label: "Legal", icon: Scale },
  // Audita las fotos de la biblioteca de fondos. La auditoría de la pieza
  // terminada vive dentro de cada propuesta, no aquí.
  { href: "/auditoria", label: "Fondos", icon: Shield },
  { href: "/generar", label: "Generar", icon: Sparkles },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[rgba(244,245,242,0.88)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1180px] items-center gap-6 px-5 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/six-logo-sm.png"
            alt="Six"
            className="h-6 w-auto"
          />
          <span className="whitespace-nowrap text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Demo
          </span>
        </Link>

        {/* Se desplaza dentro de sí misma. Sin esto, en una ventana estrecha la
            barra empuja la página y «Generar» —el botón que da sentido a la
            demo— se queda fuera de pantalla sin que nadie lo sepa. */}
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13.5px] font-medium transition-colors ${
                  active
                    ? "bg-white text-[var(--ink)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                    : "text-[var(--muted)] hover:bg-[#eceee9]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <Link href="/campanas" className="shrink-0 text-[13.5px] text-[var(--muted)] hover:text-[var(--ink)]">
          Biblioteca
        </Link>
      </div>
    </header>
  );
}
