import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `next build` y `next dev` comparten .next por defecto y se pisan: si
  // compruebas el build con el servidor de desarrollo abierto, el dev se queda
  // apuntando a chunks que ya no existen ("Cannot find module './331.js'").
  // Con BUILD_DIR el build de comprobación escribe en su propia carpeta.
  distDir: process.env.BUILD_DIR || ".next",
  // Las imágenes generadas llegan como data: URI o desde el proveedor de IA,
  // así que usamos <img> normal y no el optimizador de Next.
  images: { unoptimized: true },
};

export default nextConfig;
