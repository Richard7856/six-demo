import type { ProposalFormat } from "./types";

/**
 * El manual de cada red: qué formatos admite, cómo cambia la voz de la marca
 * ahí, cuánto copy aguanta y qué tipo de CTA funciona.
 *
 * Esto es lo que hace que una propuesta de TikTok no se parezca a una de
 * LinkedIn. Sin este bloque el modelo escribe lo mismo para todas.
 */
export type SocialNetwork = {
  id: string;
  name: string;
  /** Color de la propia red, para la UI y el mockup del feed. */
  brandColor: string;
  formats: ProposalFormat[];
  /** Cómo se desvía la voz de marca en esta red. Va literal al prompt. */
  toneShift: string;
  /** Límite práctico del copy antes de que se corte o aburra. */
  copyGuide: string;
  hashtagPolicy: string;
  ctaStyle: string;
  /** Qué se le pide de verdad a esta red. */
  bestFor: string[];
  /** Lo que NO funciona aquí. */
  avoid: string;
  /**
   * `soon` = el copy ya se genera bien, pero la vista previa todavía cae en el
   * chrome genérico y enseñarla resta en vez de sumar. Se muestra en la
   * interfaz como próximamente y no se puede seleccionar.
   */
  status?: "live" | "soon";
};

export const NETWORKS: SocialNetwork[] = [
  {
    id: "instagram-feed",
    name: "Instagram · Feed",
    brandColor: "#C13584",
    formats: ["post-1x1", "story-9x16"],
    toneShift:
      "Cuidado y aspiracional sin ser frío. La imagen manda y el copy la remata; puede permitirse una frase con oficio.",
    copyGuide:
      "Los primeros 125 caracteres son lo único que se ve antes del 'más'. Mete ahí el gancho entero.",
    hashtagPolicy: "3-5 hashtags, al final del copy, mezcla de marca y ocasión.",
    ctaStyle: "Suave: invitar, no ordenar. 'Guarda esta idea', 'Etiqueta a quien toca'.",
    bestFor: ["Notoriedad de marca", "Territorio de marca", "Ocasión de consumo"],
    avoid: "Copys largos con la información importante enterrada al final.",
  },
  {
    id: "instagram-stories",
    name: "Instagram · Stories",
    brandColor: "#E1306C",
    formats: ["story-9x16"],
    toneShift:
      "Directo y de tú a tú, como un mensaje. Efímero: puede ser más informal y más imperfecto que el feed.",
    copyGuide:
      "Una frase corta. El texto compite con la imagen a pantalla completa y se lee en dos segundos.",
    hashtagPolicy: "Como mucho uno, y solo si es de marca.",
    ctaStyle: "Acción inmediata: 'Desliza', 'Toca aquí'. Aprovecha stickers y encuestas.",
    bestFor: ["Tráfico a punto de venta", "Activación de ocasión de consumo"],
    avoid: "Piezas que necesiten leerse dos veces. Aquí no hay segunda oportunidad.",
  },
  {
    id: "facebook",
    name: "Facebook",
    brandColor: "#1877F2",
    formats: ["post-1x1", "banner-16x9"],
    toneShift:
      "Más cálido y explicativo. Audiencia mayor, que sí lee y sí comparte con su gente.",
    copyGuide: "Puede ser más largo. Se admite contexto y una historia breve.",
    hashtagPolicy: "Uno o ninguno. Aquí aportan poco.",
    ctaStyle: "Claro y de utilidad: 'Encuentra tu bar', 'Mira dónde comprarla'.",
    bestFor: ["Tráfico a punto de venta", "Recuperar consumidor perdido"],
    avoid: "Jerga joven y referencias que solo se entienden en TikTok.",
  },
  {
    id: "tiktok",
    name: "TikTok",
    brandColor: "#00F2EA",
    formats: ["story-9x16"],
    toneShift:
      "Nativo, gamberro y autoconsciente. La marca participa de una conversación que ya existe, no la interrumpe. Si huele a anuncio, se pasa de largo.",
    copyGuide:
      "El gancho tiene que estar en el primer segundo. Copy de una línea, lenguaje hablado, nada de eslóganes.",
    hashtagPolicy: "2-4 hashtags que ya se usen en la plataforma, no inventados por la marca.",
    ctaStyle: "Participativo: 'Dime si me equivoco', 'Hazlo y me cuentas'.",
    bestFor: ["Captación de audiencia joven (+21)", "Notoriedad de marca"],
    avoid: "Tono institucional, claims corporativos y producción que se note cara.",
  },
  {
    id: "youtube",
    name: "YouTube",
    brandColor: "#FF0000",
    formats: ["banner-16x9", "story-9x16"],
    toneShift:
      "Narrativo. Hay tiempo para contar algo, así que la idea puede tener desarrollo y no solo remate.",
    copyGuide:
      "El título carga con el clic. El copy puede ser más largo, pero la primera línea decide.",
    hashtagPolicy: "2-3, en la descripción.",
    ctaStyle: "Explícito: 'Suscríbete', 'Míralo completo'.",
    bestFor: ["Lanzamiento de producto", "Notoriedad de marca"],
    avoid: "Piezas sin desarrollo: si es solo una imagen bonita, va a otra red.",
    // Pendiente: el reproductor de YouTube no se parece en nada a un feed.
    status: "soon",
  },
  {
    id: "spotify",
    name: "Spotify",
    brandColor: "#1DB954",
    formats: ["post-1x1", "banner-16x9"],
    toneShift:
      "Se escucha antes que se ve. El copy tiene que funcionar dicho en voz alta en 15 segundos.",
    copyGuide: "Escríbelo como se habla. Frases cortas, sin subordinadas.",
    hashtagPolicy: "Ninguno.",
    ctaStyle: "Memorable de oído: una marca y una acción, nada más.",
    bestFor: ["Notoriedad de marca", "Activación de ocasión de consumo"],
    avoid: "Cualquier cosa que dependa de leerse.",
    // Pendiente: Spotify es audio primero; la pieza visual no es el entregable.
    status: "soon",
  },
];

export const NETWORK_BY_ID = Object.fromEntries(
  NETWORKS.map((n) => [n.id, n]),
) as Record<string, SocialNetwork>;

export function getNetwork(id: string): SocialNetwork {
  return NETWORK_BY_ID[id] ?? NETWORKS[0];
}
