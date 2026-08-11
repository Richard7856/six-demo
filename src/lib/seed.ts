import type { StudioState } from "./types";

// Datos de arranque para la demo. Todo es editable desde la propia app.
//
// Six es una cadena de tiendas de conveniencia mexicana (Cuauhtémoc Moctezuma /
// Heineken México): la segunda del país por número de sucursales, con modelo de
// operador-socio y posicionamiento de "el vecino favorito".
//
// De ahí que las zonas sean regiones de México y no países: una cadena de
// proximidad se adapta por barrio y por horario, no por continente.
//
// Las notas regulatorias son PLACEHOLDERS orientativos: hay que validarlas con
// el equipo legal antes de usarlas en producción.

export const SEED: StudioState = {
  brand: {
    name: "Six",
    // Muestreado del logo real: rojo #E1211D sobre carbón #2B2A25.
    logoDataUrl: "/brand/six-logo.png",
    positioning:
      "La tienda de la esquina que siempre está abierta y siempre tiene lo que se te olvidó. No compite por surtido ni por precio: compite por estar a dos cuadras y resolverte en tres minutos.",
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
        "El de la tienda de tu cuadra: te conoce, te tutea, no te vende de más y siempre tiene una broma. Habla como el barrio, no como una corporación.",
      tone: ["De barrio", "Rápido", "Con humor", "Servicial", "Sin pretensiones"],
      do: [
        "Hablar de resolver: lo que se acabó, lo que se olvidó, lo que urge",
        "Presumir cercanía y horario antes que surtido o precio",
        "Usar humor de situación cotidiana, reconocible en la colonia",
        "Reconocer al operador de la tienda como parte de la marca",
      ],
      dont: [
        "Sonar a supermercado grande o a corporativo",
        "Prometer el precio más bajo: no es el terreno donde compite",
        "Mostrar consumo excesivo de alcohol o a menores de edad",
        "Vincular el consumo de alcohol con conducir",
      ],
    },
    claims: ["Di que SIX", "Aquí sí hay", "Tu vecino favorito"],
  },

  zones: [
    {
      id: "mx-norte",
      name: "Norte",
      country: "Nuevo León, Coahuila, Tamaulipas",
      language: "es-MX",
      audience: "25-45, casa propia y coche, compra para la casa y para la reunión",
      insight:
        "Aquí la tienda es la extensión del refri de la casa. El viernes se compra para la carne asada y lo que falta se repone en viajes cortos toda la tarde: nadie hace una sola compra grande.",
      occasions: [
        "Reposición de carne asada",
        "Hielo de última hora",
        "Camino de regreso del trabajo",
      ],
      networks: ["instagram-feed", "facebook", "instagram-stories", "tiktok"],
      handles: {
        "instagram-feed": "@tiendassix",
        "instagram-stories": "@tiendassix",
        tiktok: "@tiendassixoficial",
        facebook: "Tiendas SIX",
      },
      regulatory: [
        "Publicidad de alcohol: prohibido dirigirse a menores de 18 años",
        "No asociar consumo con conducción",
        "Precios y promociones con vigencia y condiciones visibles",
      ],
      overrides: {},
    },
    {
      id: "mx-valle",
      name: "Valle de México",
      country: "CDMX y Estado de México",
      language: "es-MX",
      audience: "22-40, sin coche, trayectos largos en transporte, departamento chico",
      insight:
        "Aquí no se hace despensa: no hay dónde guardarla ni cómo cargarla. Se compra a pie, casi diario, lo que cabe en una mano de camino a casa. La tienda compite contra el peso de la bolsa.",
      occasions: [
        "Salida del metro",
        "Antojo de las once de la noche",
        "Se acabó a media receta",
      ],
      networks: ["instagram-feed", "facebook", "instagram-stories", "tiktok"],
      handles: {
        "instagram-feed": "@tiendassix",
        "instagram-stories": "@tiendassix",
        tiktok: "@tiendassixoficial",
        facebook: "Tiendas SIX",
      },
      regulatory: [
        "Publicidad de alcohol: prohibido dirigirse a menores de 18 años",
        "Respetar ley seca en jornadas electorales",
        "Precios y promociones con vigencia y condiciones visibles",
      ],
      overrides: {
        voice: {
          tone: ["De barrio", "Rápido", "Con humor", "Urbano", "Sin pretensiones"],
        },
      },
    },
    {
      id: "mx-occidente",
      name: "Occidente",
      country: "Jalisco, Michoacán, Colima",
      language: "es-MX",
      audience: "20-38, vida de calle y plaza, mucha salida entre semana",
      insight:
        "La previa se arma en la banqueta, no en la casa. La tienda es el punto de encuentro antes del plan: llega uno, van cayendo los demás, y de ahí se decide a dónde ir.",
      occasions: [
        "La previa antes de salir",
        "Partido en casa de alguien",
        "Rodada o parque",
      ],
      networks: ["instagram-feed", "facebook", "tiktok", "instagram-stories"],
      handles: {
        "instagram-feed": "@tiendassix",
        "instagram-stories": "@tiendassix",
        tiktok: "@tiendassixoficial",
        facebook: "Tiendas SIX",
      },
      regulatory: [
        "Publicidad de alcohol: prohibido dirigirse a menores de 18 años",
        "No mostrar consumo en vía pública",
        "Precios y promociones con vigencia y condiciones visibles",
      ],
      overrides: {
        colors: { accent: "#FF6B00" },
      },
    },
    {
      id: "mx-bajio",
      name: "Bajío",
      country: "Guanajuato, Querétaro, Aguascalientes",
      language: "es-MX",
      audience: "24-45, turnos de planta, horarios partidos, mucho traslado",
      insight:
        "Aquí manda el turno, no el día. La tienda le vende a las seis de la mañana y a las once de la noche a la misma persona en semanas distintas: lo que cambia no es el cliente, es su horario.",
      occasions: ["Entrada de turno", "Salida de turno", "Lonche de media jornada"],
      networks: ["facebook", "instagram-feed", "tiktok"],
      handles: {
        "instagram-feed": "@tiendassix",
        tiktok: "@tiendassixoficial",
        facebook: "Tiendas SIX",
      },
      regulatory: [
        "Publicidad de alcohol: prohibido dirigirse a menores de 18 años",
        "No asociar consumo con maquinaria ni jornada laboral",
        "Precios y promociones con vigencia y condiciones visibles",
      ],
      overrides: {
        positioning:
          "La que ya está abierta cuando no lo está nada más. Se gana el turno de las seis de la mañana y el de las once de la noche.",
      },
    },
    {
      id: "mx-sureste",
      name: "Sureste",
      country: "Yucatán, Quintana Roo, Campeche",
      language: "es-MX",
      audience: "23-45, calor todo el año, mezcla de local y visitante",
      insight:
        "Con este calor lo frío no es una preferencia, es el producto. Aquí la pregunta no es qué tienes: es qué tienes frío y a cuántas cuadras está el hielo.",
      occasions: [
        "Salida a la playa",
        "Tarde de calor en casa",
        "Reunión familiar de domingo",
      ],
      networks: ["instagram-feed", "facebook", "instagram-stories"],
      handles: {
        "instagram-feed": "@tiendassix",
        "instagram-stories": "@tiendassix",
        facebook: "Tiendas SIX",
      },
      regulatory: [
        "Publicidad de alcohol: prohibido dirigirse a menores de 18 años",
        "No asociar consumo con actividades acuáticas ni conducción",
        "Precios y promociones con vigencia y condiciones visibles",
      ],
      overrides: {
        colors: { accent: "#00A8C2" },
        claims: ["Di que SIX", "Aquí sí está fría"],
      },
    },
  ],

  // En una cadena de conveniencia el "producto" no es un SKU: es la línea que
  // se comunica. Cada una tiene su ocasión y compite contra algo distinto.
  products: [
    {
      id: "cerveza-fria",
      name: "Cerveza fría",
      family: "Bebida con alcohol",
      abv: "Varía",
      color: "#E1211D",
      attributes: ["Siempre fría", "Portafolio completo", "A dos cuadras"],
      occasions: ["Reunión en casa", "La previa", "Fin de jornada"],
      notes:
        "El motor de tráfico y la razón por la que muchos entran. Toda la comunicación de esta línea carga con las restricciones de alcohol.",
    },
    {
      id: "hielo",
      name: "Hielo",
      family: "Complemento",
      abv: "—",
      color: "#5BA4CF",
      attributes: ["Bolsa lista", "Compra de urgencia", "Margen alto"],
      occasions: ["Carne asada", "Fiesta improvisada", "Día de calor"],
      notes:
        "Nunca se planea y nunca se sustituye: si no hay hielo, se van a otra tienda. Es el producto más defensivo del surtido.",
    },
    {
      id: "botana-dulce",
      name: "Botana y dulce",
      family: "Snack",
      abv: "—",
      color: "#F5B301",
      attributes: ["Compra por impulso", "Sube el ticket", "Anaquel de caja"],
      occasions: ["Antojo de la tarde", "Camino a casa", "Película en casa"],
      notes:
        "Casi nunca es el motivo de entrada, casi siempre acompaña. Todo lo que suba el ticket promedio se juega aquí.",
    },
    {
      id: "servicios",
      name: "Servicios",
      family: "Recargas y pagos",
      abv: "—",
      color: "#2B2A25",
      attributes: ["Recargas", "Pago de servicios", "Sin sorpresas en la comisión"],
      occasions: ["Se acabaron los datos", "Vence el recibo", "Mandado del domingo"],
      notes:
        "Trae a quien no vendría por antojo y crea rutina mensual. Es lo que convierte la tienda en parada fija.",
    },
    {
      id: "emergencia",
      name: "Abarrote de emergencia",
      family: "Básicos",
      abv: "—",
      color: "#7A8B7F",
      attributes: ["Presentación chica", "Lo que se acabó", "Abierto cuando nada más"],
      occasions: ["Se acabó a media receta", "Domingo por la noche", "Antes de que abran"],
      notes:
        "No compite con el súper en precio ni en surtido: compite en que está abierto y está cerca.",
    },
  ],

  proposals: [],
};
