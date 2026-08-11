import type {
  BrandKit,
  Palette,
  ResolvedBrand,
  Typography,
  Voice,
  Zone,
} from "./types";

/**
 * Mezcla el brand kit global con los overrides de una zona y deja registrado
 * qué campos vienen heredados y cuáles están sobreescritos, para que la UI
 * pueda marcarlo visualmente.
 */
export function resolveBrand(brand: BrandKit, zone?: Zone | null): ResolvedBrand {
  if (!zone) {
    return {
      ...brand,
      zoneId: null,
      overridden: {
        positioning: false,
        colors: [],
        fonts: [],
        voice: [],
        claims: false,
      },
    };
  }

  const o = zone.overrides ?? {};

  const colorKeys = (Object.keys(o.colors ?? {}) as (keyof Palette)[]).filter(
    (k) => o.colors?.[k] && o.colors[k] !== brand.colors[k],
  );
  const fontKeys = (Object.keys(o.fonts ?? {}) as (keyof Typography)[]).filter(
    (k) => o.fonts?.[k] && o.fonts[k] !== brand.fonts[k],
  );
  const voiceKeys = (Object.keys(o.voice ?? {}) as (keyof Voice)[]).filter(
    (k) => o.voice?.[k] !== undefined,
  );

  return {
    ...brand,
    positioning: o.positioning ?? brand.positioning,
    colors: { ...brand.colors, ...(o.colors ?? {}) },
    fonts: { ...brand.fonts, ...(o.fonts ?? {}) },
    voice: { ...brand.voice, ...(o.voice ?? {}) },
    claims: o.claims?.length ? o.claims : brand.claims,
    zoneId: zone.id,
    overridden: {
      positioning: o.positioning !== undefined && o.positioning !== brand.positioning,
      colors: colorKeys,
      fonts: fontKeys,
      voice: voiceKeys,
      claims: Boolean(o.claims?.length),
    },
  };
}

/** Cuenta cuántos campos ha tocado una zona — para el badge de la lista. */
export function countOverrides(brand: BrandKit, zone: Zone): number {
  const r = resolveBrand(brand, zone);
  return (
    (r.overridden.positioning ? 1 : 0) +
    r.overridden.colors.length +
    r.overridden.fonts.length +
    r.overridden.voice.length +
    (r.overridden.claims ? 1 : 0)
  );
}
