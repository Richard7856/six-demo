/**
 * Los modelos devuelven PNG/JPEG grandes (Nano Banana Pro ronda 1,2 MB en
 * base64). Guardar eso tal cual en localStorage agota la cuota de ~5 MB con
 * cuatro o cinco propuestas, y el fallo aparece justo cuando estás enseñando
 * el proyecto.
 *
 * Recomprimimos en el navegador antes de guardar. Como el creativo se exporta
 * a 1080 px como mucho, 1280 px de origen sobra y no se nota la diferencia.
 */
export async function compressDataUrl(
  dataUrl: string,
  maxSize = 1280,
  quality = 0.82,
): Promise<string> {
  // Solo tiene sentido recomprimir data URIs de mapa de bits. Una ruta de la
  // biblioteca (/backgrounds/x.jpg) ya pesa 30 bytes: convertirla en data URI
  // sería justo el problema que este archivo existe para evitar.
  if (!dataUrl.startsWith("data:")) return dataUrl;
  if (dataUrl.startsWith("data:image/svg+xml")) return dataUrl;

  try {
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, w, h);

    const out = canvas.toDataURL("image/jpeg", quality);
    // Si por lo que sea sale más grande, nos quedamos con el original.
    return out.length < dataUrl.length ? out : dataUrl;
  } catch {
    return dataUrl;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
