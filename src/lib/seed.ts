import type { StudioState } from "./types";

// Datos de arranque para la demo. Todo es editable desde la propia app.
// Las notas regulatorias son PLACEHOLDERS orientativos: hay que validarlas
// con el equipo legal de cada mercado antes de usarlas en producción.

export const SEED: StudioState = {
  brand: {
    name: "Six",
    // Muestreado del logo real: rojo #E1211D sobre carbón #2B2A25.
    logoDataUrl: "/brand/six-logo.png",
    positioning:
      "La cerveza premium internacional que abre mundo. Une a gente distinta alrededor de una misma mesa, con humor, sin postureo y con calidad cervecera de 150 años.",
    colors: {
      primary: "#E1211D",
      secondary: "#2B2A25",
      accent: "#F5B301",
      ink: "#1A1917",
      surface: "#F5F5F3",
    },
    fonts: {
      display: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      body: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    },
    voice: {
      persona:
        "Un anfitrión con mundo: cercano, con chispa, nunca pretencioso. Habla de tú a tú y se ríe primero de sí mismo.",
      tone: ["Cercano", "Con humor", "Optimista", "Internacional", "Sin postureo"],
      do: [
        "Poner a las personas y el encuentro por delante del producto",
        "Usar humor observacional, situaciones reconocibles",
        "Hablar de calidad cervecera cuando aporta, no como alarde",
        "Rematar siempre con el mensaje de consumo responsable",
      ],
      dont: [
        "Asociar la cerveza al éxito social, sexual o profesional",
        "Mostrar consumo excesivo o a menores de edad",
        "Vincular la marca con conducción o deporte de riesgo",
        "Prometer beneficios de salud",
      ],
    },
    claims: ["Open Your World", "Refresca tu mundo", "Buena compañía, buena cerveza"],
  },

  zones: [
    {
      id: "es-iberia",
      name: "Iberia",
      country: "España / Portugal",
      language: "es-ES",
      audience: "25-40, urbano, sale entre semana, muy social",
      insight:
        "Aquí la cerveza no es la excusa, es el pretexto: se pide 'una caña' para ver a alguien. El momento importa más que el producto.",
      occasions: ["Terraza after-work", "Comida de finde", "Partido en el bar"],
      networks: ["instagram-feed", "facebook", "instagram-stories", "tiktok"],
      handles: {
        "instagram-feed": "@six_es",
        "instagram-stories": "@six_es",
        tiktok: "@six_es",
        facebook: "@SixEspana",
      },
      regulatory: [
        "Prohibido dirigirse a menores de 18 años; segmentación de edad obligatoria",
        "No asociar consumo con conducción",
        "Incluir mensaje de consumo responsable",
      ],
      overrides: {},
    },
    {
      id: "mx-mexico",
      name: "México",
      country: "México",
      language: "es-MX",
      audience: "21-35, ciudad, música en vivo y comida callejera",
      insight:
        "La convivencia es larga y ruidosa. La cerveza acompaña horas, no minutos, y compite con una cultura cervecera local muy fuerte.",
      occasions: ["Carnita asada", "Concierto", "Comida callejera de noche"],
      networks: ["instagram-feed", "facebook", "instagram-stories", "tiktok", "spotify"],
      handles: {
        tiktok: "@six_mx",
        facebook: "@SixMexico",
        "instagram-feed": "@sixmx",
        "instagram-stories": "@sixmx",
        spotify: "Six México",
      },
      regulatory: [
        "Prohibido dirigirse a menores de 18 años",
        "Leyenda de moderación obligatoria en piezas audiovisuales",
      ],
      overrides: {
        colors: { accent: "#FF6B00" },
        voice: {
          tone: ["Cercano", "Con humor", "Cálido", "Barrio", "Sin postureo"],
        },
        claims: ["Abre tu mundo", "La que junta a todos"],
      },
    },
    {
      id: "br-brasil",
      name: "Brasil",
      country: "Brasil",
      language: "pt-BR",
      audience: "22-38, gran ciudad, fútbol y música electrónica",
      insight:
        "Six juega la carta premium frente a las marcas de volumen: se pide cuando quieres subir un punto el momento, no cuando tienes sed.",
      occasions: ["Churrasco", "Festival", "Botequim con amigos"],
      networks: ["instagram-feed", "facebook", "youtube", "tiktok"],
      handles: {
        "instagram-feed": "@sixbr",
        facebook: "@SixBrasil",
        youtube: "Six Brasil",
        tiktok: "@sixbr",
      },
      regulatory: [
        "Autorregulación CONAR: sin menores, sin consumo excesivo",
        "Advertencia de moderación visible",
      ],
      overrides: {
        positioning:
          "El upgrade accesible: la cerveza que eliges cuando el momento merece algo mejor, sin dejar de ser una fiesta.",
        colors: { accent: "#00C2A8" },
      },
    },
    {
      id: "nl-benelux",
      name: "Benelux",
      country: "Países Bajos / Bélgica",
      language: "nl-NL",
      audience: "24-45, mercado de origen, exigente con la calidad",
      insight:
        "Es la casa. Aquí no hay que explicar la marca, hay que merecerla: se valora el oficio cervecero y la sobriedad en el tono.",
      occasions: ["Borrel de viernes", "Terraza de canal", "Cena en casa"],
      networks: ["instagram-feed", "facebook", "youtube"],
      handles: {
        "instagram-feed": "@six_nl",
        youtube: "Six Nederland",
        facebook: "@SixNL",
      },
      regulatory: [
        "Código NIX18: sin menores de 18 en comunicación",
        "Sin publicidad en horario infantil",
      ],
      overrides: {
        voice: {
          tone: ["Sobrio", "Con oficio", "Seco", "Confiado"],
        },
      },
    },
    {
      id: "vn-vietnam",
      name: "Vietnam",
      country: "Vietnam",
      language: "vi-VN",
      audience: "23-40, clase media urbana en crecimiento",
      insight:
        "El consumo es de mesa larga y brindis colectivo. La marca internacional funciona como señal de estatus compartido, no individual.",
      occasions: ["Cena de negocios", "Mesa larga familiar", "Año Nuevo Lunar"],
      networks: ["instagram-feed", "facebook", "tiktok"],
      handles: {
        facebook: "@SixVietnam",
        tiktok: "@six_vn",
        "instagram-feed": "@sixvietnam",
      },
      regulatory: [
        "Restricciones horarias en publicidad de alcohol en medios",
        "Mensaje de consumo responsable obligatorio",
      ],
      overrides: {
        colors: { accent: "#F2A900" },
        claims: ["Abre tu mundo", "Brindemos juntos"],
      },
    },
  ],

  products: [
    {
      id: "six-original",
      name: "Six Original",
      family: "Lager",
      abv: "5,0%",
      color: "#E1211D",
      attributes: ["Lager premium", "Levadura A", "Lata roja icónica"],
      occasions: ["Terraza", "Bar", "Cena"],
      notes: "El caballo de batalla. Todo lo demás se mide contra esto.",
    },
    {
      id: "six-00",
      name: "Six 0.0",
      family: "Sin alcohol",
      abv: "0,0%",
      color: "#0B4FA5",
      attributes: ["Sin alcohol", "Mismo sabor lager", "69 kcal/botella"],
      occasions: ["Comida de oficina", "Deporte", "Conducir"],
      notes:
        "Es el producto que abre ocasiones nuevas: permite hablar de momentos donde antes no había cerveza.",
    },
    {
      id: "six-silver",
      name: "Six Silver",
      family: "Lager suave",
      abv: "4,0%",
      color: "#B9C2C7",
      attributes: ["Extra refrescante", "Menos amargo", "Público joven"],
      occasions: ["Festival", "Noche", "Primera cerveza"],
      notes: "Puerta de entrada para 21-28. Tono más gamberro y visual.",
    },
    {
      id: "six-noche",
      name: "Six Noche",
      family: "Cerveza con tequila",
      abv: "5,9%",
      color: "#F2A900",
      attributes: ["Sabor tequila", "Noche", "Música"],
      occasions: ["Fiesta", "Festival", "Pre-copa"],
      notes: "Marca hermana con reglas propias: más energía, menos institucional.",
    },
    {
      id: "six-clasica",
      name: "Six Clásica",
      family: "Lager",
      abv: "4,1%",
      color: "#C8102E",
      attributes: ["Precio accesible", "Cotidiano", "Volumen"],
      occasions: ["Casa", "Supermercado", "Grupo grande"],
      notes: "Juega el terreno del día a día, no del premium.",
    },
  ],

  proposals: [],
};
