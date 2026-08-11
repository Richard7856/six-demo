# Estado y siguientes pasos

Última sesión: 12 de agosto de 2026. El **README** explica cómo funciona la
herramienta; este documento es solo **en qué punto está y qué falta decidir**.

---

## Dónde está

Funcionando de punta a punta y desplegable. `main` en
[github.com/Richard7856/six-demo](https://github.com/Richard7856/six-demo).

| Pieza | Estado |
|---|---|
| Brand kit con herencia por zona | Listo |
| 5 regiones de México con insight propio | Listo, **contenido sin validar** |
| 5 líneas de producto | Listo, **sin validar** |
| Generación de copy con Claude | Listo, en vivo |
| Traza de trabajo con razonamiento en pantalla | Listo |
| Vista previa dentro del feed | Instagram, Stories, TikTok y Facebook |
| YouTube y Spotify | `status: "soon"` — el copy funciona, falta su chrome |
| **Marco legal editable** (`/legal`) | Listo. Reglas globales + por zona, cada una marcada validada o placeholder |
| **Auditoría de la biblioteca** (`/auditoria`) | Listo, informe grabado. **Los 3 recortes de la foto de tienda salen BLOQUEO** |
| **Auditoría de la pieza terminada** | Listo. Botón en cada propuesta, imagen + copy juntos |
| **Importar marca** (`/importar`) | Listo. Tres caminos: IA, archivo JSON, formulario |
| Fondos | Biblioteca local. **Solo 2 imágenes, y una no es publicable** |
| Guion grabado (fixtures) | **Vacío a propósito** |

Arrancar: `npm install && npm run dev`. Funciona sin claves; con
`ANTHROPIC_API_KEY` en `.env.local` genera copy real y habilita las auditorías.

Para comprobar el build **sin tumbar el servidor de desarrollo**:
`npm run build:check` (escribe en `.next-check`). Correr `npm run build` con
`next dev` abierto corrompe `.next` y da `Cannot find module './331.js'`; se
arregla con `rm -rf .next`.

---

## Lo que hay que decidir (por orden de impacto)

### 1. La foto de tienda Six no es publicable

Lo encontró la auditoría de la biblioteca, y es el hallazgo más serio del
proyecto. Los **tres recortes** de `tienda-pasillo` salen bloqueo:

- **16x9** — galletas *Emperador*, *Marinela*, *Doradas* y barras tipo *Payaso*
  legibles en primer plano.
- **9x16** — cartel iluminado en la nevera que dice **«LA CERVEZA MÁS FRÍA»**
  con emblema rojo al lado, más latas y botellas de terceros.
- **1x1** — rótulo rojo y blanco con una «S» de otra cadena.

Es justo lo que el cliente pidió eliminar. Y es la foto que la herramienta
elige por defecto para casi todo brief de tienda. **Hay que retocarla o
sustituirla antes de enseñar la demo.** El informe completo, con dónde está
cada cosa, en `/auditoria`.

`mesa-larga-noche` sale aviso en los tres: sin marcas legibles, pero con copas
de vino servidas — el copy no puede rozar «seguir la fiesta» ni conducir.

### 2. El enlace es público y el gasto no tiene techo

Cada clic en Generar son **~6,5 MXN**, sin límite y para cualquiera que reciba
el enlace. Las auditorías y la importación **no** empeoran esto: ninguna corre
sola, todas piden clic. Pero el generador sigue sin tope.

- **Tope diario** en el servidor (p. ej. 100 generaciones/día). Recomendado.
  Sin implementar.
- **Código de acceso** compartido con los invitados.
- **`DEMO_MODE=strict`** — solo guion grabado, coste cero. También desactiva la
  importación con IA y hace que la auditoría de pieza use el motor local.

Coste por acción, para dimensionar:

| Acción | Coste | Cuándo corre |
|---|---|---|
| Generar (3 propuestas) | ~6,5 MXN | Al pulsar |
| Auditar una pieza | ~1 MXN | Solo al pulsar |
| Importar con IA | ~2 MXN | Solo al pulsar |
| Auditar la biblioteca | ~5,8 MXN las 6 imágenes | Solo en desarrollo, una vez |
| Abrir `/auditoria` | 0 | Lee el informe grabado |

### 3. Nada de lo que dice la herramienta viene del cliente

Tres cosas las escribí yo y **suenan plausibles, que es lo que las hace
peligrosas**:

- **Insights regionales y ocasiones** (`src/lib/seed.ts`).
- **Las 9 reglas legales** — 5 globales + 4 de zona. Todas nacen
  `validated: false` y se ven marcadas en `/legal`.
- **La tipografía.** `"Helvetica Neue", Helvetica, Arial` es la pila del
  sistema. **No tengo la fuente real de Six.** Hay que pedirla.

Lo bueno: el mecanismo ya existe. El auditor **distingue** — con una regla
validada bloquea una pieza, con una mía solo avisa. Se ve en el veredicto:
«la regla que lo prohíbe está en la lista sin validar, así que no bloqueo».

Sí es real: el logo, el favicon y la paleta muestreada de ese logo
(`#E1211D` / `#2B2A25` / `#F5B301`).

### 4. La biblioteca de fondos tiene 2 imágenes

Y con el punto 1, en realidad **una usable con salvedades**. Con cinco o seis
fotos del banco de Six deja de repetirse. Procedimiento en el README
(§ *Por qué los fondos no se generan*): dejar el archivo en
`public/backgrounds/`, añadir su entrada en `lib/backgrounds.ts`, y correr
`curl -X POST localhost:3000/api/dev/audit` para auditar solo las nuevas.

---

## Decisiones de diseño que conviene conocer

- **La interfaz de la herramienta es neutra a propósito** (crema, gris, rojo
  Six solo de acento). Una herramienta que grita marca compite con las piezas
  que enseña. Es una decisión, no un descuido.
- **El logo del menú es el de Six a fuego** (`Nav.tsx`). Desde que se pueden
  importar otras marcas, queda incoherente al cargar una distinta. Pendiente de
  decidir.
- **Importar vacía el logo.** Si no, la marca importada saldría con el logo de
  la anterior encima de sus piezas. El creativo dibuja entonces el wordmark
  tipográfico con el nombre y los colores nuevos.
- **La auditoría de pieza mira imagen y copy juntos.** En publicidad de alcohol
  el riesgo casi siempre está en las palabras, no en los píxeles.
- **Todo veredicto guardado lleva huella de lo auditado.** Si alguien edita el
  titular, la pantalla avisa de que el veredicto es de otra versión en vez de
  dejar un «aprobada» verde mintiendo.

---

## Lo que ya se probó y se descartó

- **`tool_choice: {type: "tool"}` forzado** — el modelo no razona: salta directo
  a la llamada y devuelve un único bloque `tool_use`. Por eso se usa `auto` con
  reintento forzado como red de seguridad. No volver a forzarlo sin quitar antes
  la traza de razonamiento.
- **Generar los fondos con IA** — ~500 MXN en unas pocas pruebas. Fuera.
- **Grabar el guion de propuestas** — se grabaron 4 combinaciones ($0,72 USD) y
  se borraron al reencuadrar la marca a tienda de conveniencia. El grabador
  sigue disponible en `POST /api/dev/record` (solo en desarrollo).
- **Motor local para la importación con IA** — descartado. Un motor de
  plantillas devolvería una marca falsa con pinta de extraída, que es peor que
  no tener nada. Sin clave, `/api/import` devuelve error y manda al JSON o al
  formulario.
- **Importar pegando un PDF y que la IA lo trocee en reglas** — se valoró y se
  dejó fuera: gasta una llamada más y para demo no aporta sobre pegar el texto.

---

## Cosas que se rompen de forma no obvia

- **`localStorage`**: los datos viven en el navegador de cada visitante. Al
  cambiar el esquema del seed hay que subir `STORAGE_KEY` en `src/lib/store.tsx`
  (va por `demo-six:v6`) o los navegadores con datos viejos arrancan rotos.
  Se subió a v6 al pasar las reglas legales de textos a objetos con estado.
- **Ahora hay copia de seguridad**: `/importar` → *Desde un archivo* →
  *Descargar en JSON*. Antes no había forma de salvar el trabajo.
- **Editar archivos con una generación en curso** corta el stream. Se ve en
  rojo en la consola en vez de quedarse en un «terminado» silencioso.
- **`/api/dev/record` y `/api/dev/audit`** devuelven 403 en producción.
- **El CSS global impone `min-height: 74px` a los `textarea.field`** y gana por
  especificidad a las clases de Tailwind. Hace falta `!min-h-…` para
  sobreescribirlo. Ya mordió dos veces.
- **Un byte NUL invisible se coló una vez** en `src/lib/audit/creative.ts`,
  dentro de un `.join(" ")`. El archivo compilaba, pero `grep` lo trataba como
  binario y la huella nunca coincidía consigo misma. Si algo se comporta de
  forma imposible, vale la pena descartarlo:
  `python3 -c "import glob; print(sum(open(p,'rb').read().count(b'\x00') for p in glob.glob('src/**/*.ts*', recursive=True)))"`
