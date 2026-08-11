# Estado y siguientes pasos

Última sesión: 11 de agosto de 2026. El **README** explica cómo funciona la
herramienta; este documento es solo **en qué punto está y qué falta decidir**.

---

## Dónde está

Funcionando de punta a punta y desplegable. `main` en
[github.com/Richard7856/six-demo](https://github.com/Richard7856/six-demo).

| Pieza | Estado |
|---|---|
| Brand kit con herencia por zona | Listo |
| 5 regiones de México con insight propio | Listo, **contenido sin validar** (ver abajo) |
| 5 líneas de producto | Listo, **sin validar** |
| Generación de copy con Claude | Listo, en vivo |
| Traza de trabajo con razonamiento en pantalla | Listo |
| Vista previa dentro del feed | Instagram, Stories, TikTok y Facebook |
| YouTube y Spotify | `status: "soon"` — el copy funciona, falta su chrome |
| Fondos | Biblioteca local. **Solo 2 imágenes** |
| Guion grabado (fixtures) | **Vacío a propósito** |

Arrancar: `npm install && npm run dev`. Funciona sin claves; con
`ANTHROPIC_API_KEY` en `.env.local` genera copy real.

Para comprobar el build **sin tumbar el servidor de desarrollo**:
`npm run build:check` (escribe en `.next-check`). Correr `npm run build` con
`next dev` abierto corrompe `.next` y da `Cannot find module './331.js'`; se
arregla con `rm -rf .next`.

---

## Lo que hay que decidir (por orden de impacto)

### 1. El enlace es público y el gasto no tiene techo

Cada clic en Generar son **~6,5 MXN** de la cuenta de Anthropic (~13 si marcan
también Stories y TikTok), sin límite y para cualquiera que reciba el enlace.

Tres salidas, de menor a mayor restricción:

- **Tope diario** en el servidor (p. ej. 100 generaciones/día). No cambia la
  experiencia hasta que se alcanza. Es lo recomendado. Sin implementar.
- **Código de acceso** compartido con los invitados. Filtra reenvíos.
- **`DEMO_MODE=strict`** — solo reproduce el guion grabado, coste cero. Requiere
  grabar antes las combinaciones que se vayan a enseñar.

### 2. Los insights regionales no vienen del cliente

Los de `src/lib/seed.ts` los deduje del funcionamiento del retail de proximidad
en México y de búsqueda pública. **Suenan plausibles y son específicos, que es
justo lo que los hace peligrosos**: nadie va a sospechar que son suposiciones.

Igual con las notas regulatorias de cada región: son placeholders orientativos
y **tiene que validarlas legal** antes de que se publique nada generado aquí.

Todo es editable desde la app, así que sustituirlos son minutos.

### 3. La biblioteca de fondos tiene 2 imágenes

`public/backgrounds/`: una foto real de tienda Six y una escena de reunión en
casa. Con solo dos, varias propuestas salen con el mismo fondo y en cuanto se
prueben varias regiones va a cantar.

**Es lo que más sube el nivel de la demo ahora mismo y no cuesta nada.** Con
cinco o seis fotos del banco de Six ya no se repite. El procedimiento está en
el README (§ *Por qué los fondos no se generan*): dejar el archivo en
`public/backgrounds/` y añadir su entrada con etiquetas en `lib/backgrounds.ts`.

No se generan imágenes con IA a propósito: cuesta por imagen y para una marca es
la parte más débil (derechos, consistencia, aprobación). El proveedor de pago
solo se activa con `IMAGE_PROVIDER=gemini|openai`.

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

---

## Cosas que se rompen de forma no obvia

- **`localStorage`**: los datos viven en el navegador de cada visitante. Al
  cambiar el esquema del seed hay que subir `STORAGE_KEY` en `src/lib/store.tsx`
  (va por `demo-six:v5`) o los navegadores con datos viejos arrancan rotos.
- **Editar archivos con una generación en curso** corta el stream. Ahora se ve
  en rojo en la consola en vez de quedarse en un «terminado» silencioso.
- **`/api/dev/record`** devuelve 403 en producción. Si el repo es público y
  prefieres que ni exista, se borra sin perder nada.
