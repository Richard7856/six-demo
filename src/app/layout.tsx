import type { Metadata } from "next";
import "./globals.css";
import { StudioProvider } from "@/lib/store";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Demo Six — branding por zona y producto",
  description:
    "Define el brand kit, adáptalo por zona y genera propuestas de campaña por producto y canal.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <StudioProvider>
          <Nav />
          <main className="mx-auto w-full max-w-[1180px] px-5 pb-24 pt-7">
            {children}
          </main>
        </StudioProvider>
      </body>
    </html>
  );
}
