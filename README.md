# TenseCoach

PWA para practicar **tiempos verbales en inglés hablado** en situaciones de gestión de proyectos
(daily, status report, riesgos, retro, stakeholders). Pensada para el Galaxy Z Fold6:
una columna con el teléfono cerrado y doble panel al abrirlo.

## Cómo funciona
1. La app te da una situación en español (sin decirte el tiempo verbal).
2. Respondes en voz alta. El audio se convierte a WAV de 16 kHz y se envía **directo a Gemini**,
   que lo transcribe literal (con tus errores) y evalúa cada verbo en la misma llamada.
3. Ves tus verbos en verde/rojo, la corrección, la versión natural de un PM y la línea de tiempo.
4. Repites la versión corregida en voz alta para fijarla.

## Vocabulario
50 palabras de gestión de proyectos (más las que generes con IA), con pronunciación aproximada
para hispanohablantes (MAYÚSCULAS = sílaba fuerte) y el error típico de cada una.
1. **Escucha**: voz normal y lenta (🐢).
2. **Pronuncia**: Gemini escucha tu audio y te dice qué oyó y qué sonido corregir.
3. **Úsala**: di una oración con la palabra; además tiene un reto de tiempo verbal.
Las palabras siguen repetición espaciada (cajas de Leitner): si fallas vuelve mañana,
si aciertas se repasa a los 1, 3, 7, 14 y 30 días. La palabra y su definición en inglés
siempre están a la vista; el objetivo es asociarlas y usarlas al hablar.

## Diseño
Material Design 3 con la paleta de Google (claro/oscuro según el sistema), tipografía Google Sans
e íconos Material Symbols (solo los usados, ver `index.html` y `src/components/Icon.tsx`).
Barra de navegación inferior con el Fold cerrado y riel lateral al abrirlo.

## Desarrollo
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
```

## Instalar en el teléfono
El micrófono solo funciona en HTTPS, así que hay que publicar `dist/` en un hosting estático:
- **Netlify Drop** (lo más fácil): arrastra la carpeta `dist` a https://app.netlify.com/drop
- **GitHub Pages / Cloudflare Pages / Vercel** también sirven (las rutas son relativas).

Luego ábrela en Chrome del Fold → menú ⋮ → **Agregar a pantalla principal / Instalar app**.

## Gemini
- Crea la key gratis en https://aistudio.google.com → *Get API key* y pégala en **Ajustes**.
  Se guarda solo en el `localStorage` del teléfono.
- Modelo por defecto: `gemini-3.1-flash-lite` (≈500 solicitudes/día gratis, entiende audio).
  `gemini-3.8-flash` es más preciso pero el tier gratis permite ≈20 solicitudes/día.
- En el tier gratuito Google puede usar el contenido para mejorar sus productos: evita datos confidenciales.

## Estructura
- `src/data/tenses.ts` – tiempos verbales, reglas y líneas de tiempo
- `src/data/scenarios.ts` – escenarios de gestión de proyectos por pareja en conflicto
- `src/lib/gemini.ts` – prompt, esquema JSON y llamada a `generateContent`
- `src/lib/recorder.ts` – grabación y conversión a WAV
- `src/screens/*` – Inicio, Práctica, Progreso, Ajustes
