# Demo Six

Herramienta interna para llevar una marca de retail por **zona**, por **línea de producto**
y por **red social**: defines el brand kit una vez, cada región sobreescribe solo lo que
necesita, y un bot genera propuestas de campaña listas para revisar.

Los datos de ejemplo están montados sobre **Six**, la cadena mexicana de tiendas de
conveniencia (Cuauhtémoc Moctezuma / Heineken México): logo real en `public/brand/`,
paleta muestreada de él (rojo `#E1211D`, carbón `#2B2A25`), zonas por región de México
y "productos" entendidos como líneas que se comunican (cerveza fría, hielo, botana,
servicios, abarrote de emergencia).

Nada está hardcodeado: la marca, el logo, las zonas y las líneas se editan desde la
propia app. Las notas regulatorias del seed son placeholders orientativos y hay que
validarlas con legal antes de publicar nada.

---

## Arrancar

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>. **Funciona sin ninguna clave de API** en modo demo.

Para el modo real, copia `.env.example` a `.env.local` y rellena lo que tengas.

---

## La idea en cuatro piezas

### 1. Herencia, no duplicación

Hay **un** brand kit global. Cada zona guarda únicamente los campos que cambia
(`Zone.overrides`), y `resolveBrand()` mezcla ambos en el momento de usarlos.

Esto significa que si mañana cambias el rojo corporativo en el brand kit global, cambia
en las cinco zonas menos en la que decidió tener el suyo propio. En la UI los campos
sobreescritos llevan una barra amarilla y un botón de «volver a heredar».

### 2. El logo nunca lo genera la IA

Es la decisión de diseño que sostiene todo lo demás. El modelo de imagen genera **solo
la escena de fondo**; el logo, la tipografía, los colores, el CTA y la coletilla legal se
componen encima en el navegador (`CreativePreview`).

Tres consecuencias prácticas:

- El logo sale siempre correcto. La IA no lo deforma ni se lo inventa.
- Editar un titular, un color o el CTA es instantáneo y **gratis** — no cuesta una
  generación nueva.
- El export a PNG sale a tamaño real (1080×1080, 1080×1920, 1600×900) porque se
  rasteriza el DOM, no se reescala una imagen.

### 3. Cada red tiene su manual, y se nota

En `lib/networks.ts` cada red guarda cómo cambia la voz de la marca ahí, cuánto copy
aguanta y dónde se corta, qué política de hashtags sigue y qué tipo de CTA funciona.
Ese bloque viaja íntegro al prompt.

No es decorativo. Del mismo brief, misma zona y mismo producto salieron estas dos:

| | Instagram · Feed | Facebook |
|---|---|---|
| Longitud del pie | 288 caracteres | 518 caracteres |
| Estructura | Gancho primero, corte a los 125 | Relato con contexto |
| Hashtags | 5 | 0 |
| CTA | «Etiqueta al que se queda» | «Encuentra dónde comprarla» |

En **Generar** eliges varias redes a la vez y cada una se pide en paralelo con su propio
brief. Los resultados llegan agrupados por red conforme van estando, sin esperar a la
más lenta.

La vista previa monta el creativo **dentro del chrome de la red** — con el `@` que esa
zona usa ahí. Así ves si el gancho cabe antes del «… más» de Instagram, o que en Facebook
el texto va encima de la imagen y por tanto tiene que sostenerse solo.

### 4. Se ve trabajar

`/api/proposals` no devuelve un JSON al final: devuelve un **stream NDJSON** que va
contando lo que hace. La interfaz lo pinta en una consola por red.

Casi nada de eso es atrezzo:

- Los pasos son los reales del pipeline (resolver la herencia de marca, cargar el manual
  de la red, aplicar las restricciones del mercado, montar el brief) con **su tiempo
  medido**, no inventado.
- El razonamiento sale de Claude: `thinking: {type: "adaptive", display: "summarized"}`,
  y los deltas se reenvían al navegador según llegan.
- Los tokens de entrada y salida son los que reporta la API.

Se ve al modelo descartar ángulos, elegir uno y redactar el titular — y ese titular
aparece después en el creativo de abajo. Es lo que mejor explica la herramienta a alguien
que no la ha usado.

**Un detalle que costó descubrir:** con `tool_choice: {type: "tool"}` el modelo **no
razona**. Salta directo a la llamada y la respuesta vuelve con un único bloque `tool_use`.
Por eso la ruta usa `tool_choice: {type: "auto"}` y, solo si no llamara a la herramienta,
reintenta forzándola. En la práctica siempre la llama a la primera.

El razonamiento se pide en español desde el system prompt: por defecto piensa en inglés,
lo que canta mucho en una demo en castellano.

Mostrar el razonamiento **cuesta tokens**: en las pruebas pasó de ~800 a ~2.900 tokens de
salida por propuesta. Siguen siendo céntimos, pero es un x3.

### 5. El brief que se manda al modelo

Cada generación envía: brand kit **ya resuelto para esa zona** + insight local +
ocasiones de consumo + restricciones legales del mercado + ficha de producto + manual
de la red + objetivo. El campo que más cambia el resultado, con diferencia, es el
**insight local**: si está vacío o es genérico, las propuestas salen intercambiables
entre países.

---

## Estructura

```
src/
  lib/
    types.ts       Modelo de datos
    seed.ts        Datos de ejemplo (editables desde la app)
    resolve.ts     Mezcla brand kit global + overrides de zona
    store.tsx      Estado + persistencia en localStorage
    formats.ts     Formatos y tamaños de salida
    networks.ts    El manual de cada red social
    image.ts       Recompresión antes de guardar en localStorage
    ai/
      schema.ts    Contrato de la generación + definición de la herramienta
      prompt.ts    System prompt y construcción del brief
      demo.ts      Motor de respaldo sin API
  app/
    api/proposals/ Claude → propuestas estructuradas
    api/image/     Gemini / OpenAI → fondo, con respaldo local
    marca/         Editor del brand kit global
    zonas/         Lista y editor por zona (con herencia)
    productos/     Catálogo
    redes/         La marca en cada red: el manual completo
    generar/       El bot, con selección múltiple de redes
    campanas/      Biblioteca de lo guardado
  components/
    CreativePreview.tsx  Composición del creativo
    FeedPreview.tsx      El creativo dentro del chrome de cada red
    ProposalCard.tsx     Ficha editable + generación de fondo + export PNG
```

---

## Modelos usados y por qué

**El copy sí usa IA. Las imágenes no.**

| Para | Cómo | Coste |
|---|---|---|
| Copy y estrategia | **Claude Opus 5** | Céntimos por tanda. Es donde está el valor. |
| Fondos | **Biblioteca local** (`public/backgrounds/`) | Cero. |

La salida de Claude se fuerza con **tool use** (`tool_choice` obligado sobre
`entregar_propuestas`), así la respuesta llega siempre estructurada y no hay que parsear
prosa. Si el proveedor rechaza el `tool_choice` forzado, la ruta reintenta en modo
automático antes de rendirse. Si falta la clave o la llamada falla, devuelve el motor
demo con un aviso visible: la demo nunca se queda en blanco delante de un cliente.

### Por qué los fondos no se generan

Generar imágenes con IA cuesta dinero real **por imagen**, y en una sesión de trabajo se
piden decenas. Pero el motivo de fondo no es el coste: para una marca es la parte más
débil de todo esto. No hay control de derechos, ni consistencia de producto entre piezas,
ni garantía de que lo generado pase por legal. Lo que se acaba usando en campaña es el
banco de fotografía aprobada del cliente.

Así que `/api/image` **no llama a ningún proveedor de pago**. Elige de la biblioteca
según las etiquetas del brief y simula la espera de una generación (~1-2 s) para que el
flujo de la demo se sienta igual.

**Para añadir fondos** — que es lo que hay que hacer con el banco de Six:

1. Deja el archivo en `public/backgrounds/`. Idealmente uno por formato (1:1, 9:16, 16:9).
2. Añade una entrada en `lib/backgrounds.ts` con sus etiquetas (`table`, `night`,
   `festival`, `beach`…). El selector casa esas etiquetas con el brief de imagen que
   escribe Claude, así que cuantas más pongas, mejor acierta.

En cada propuesta hay además un desplegable para elegir el fondo a mano.

### Si alguna vez quieres generar de verdad

```bash
IMAGE_PROVIDER=gemini    # o openai
```

Sin esa variable no se llama a nadie. Y si la pones, `gemini-3.1-flash-image` cuesta una
fracción de `gemini-3-pro-image`: para un fondo que va detrás de un degradado oscuro y un
titular, la diferencia apenas se aprecia.

---

## Lo que falta antes de producción

- **Persistencia real.** Ahora todo vive en `localStorage` del navegador: no es
  multiusuario y se pierde al limpiar el navegador. El modelo de datos ya está definido,
  así que la migración es mecánica.
- **La biblioteca de fondos tiene una sola imagen.** Es la que sobrevivió de las pruebas
  con Gemini, recortada a los tres formatos. Hay que llenarla con fotografía aprobada de
  la marca antes de enseñar esto a nadie.
- **Los manuales de red son un punto de partida.** Los de `lib/networks.ts` los escribí
  yo a partir de práctica común. Hay que sustituirlos por los del equipo de social de la
  marca: son lo que gobierna el tono de todo lo que salga.
- **Validación legal.** Las restricciones regulatorias de cada zona en `seed.ts` son
  **placeholders orientativos**. Hay que sustituirlas por las reales de cada mercado
  antes de generar nada que se vaya a publicar.
- **Derechos de marca.** Si esto se enseña fuera del equipo, el logo y los assets reales
  necesitan la aprobación del cliente. La app funciona igual con un wordmark tipográfico
  mientras tanto.
- **Aprobaciones.** El estado `draft`/`approved` existe pero no hay flujo de revisión ni
  roles.
