# FORJA 2.0

App personal de fitness de Jose: hipertrofia en gimnasio, running 0→20 km (CaCo),
postura y nutrición. PWA local-first instalada en su móvil Android. **No es un
producto**: tiene un solo usuario y se optimiza para él.

## Sobre Jose (el usuario)

- Habla español y escribe con erratas; responderle SIEMPRE en español, claro y
  sin jerga técnica. No sabe programar: las explicaciones son de entrenador, no
  de desarrollador.
- Quiere las cosas 100 % funcionales, sin datos de prueba.
- Decisiones suyas ya tomadas (no reabrir): registro de comida en Fitia (la app
  NO registra comida), GPS en Garmin (la app no lo duplica), sin gamificación ni
  rachas, sin cuentas ni nube: todos los datos viven en su móvil y la copia de
  seguridad es un JSON exportado.

## Comandos

```bash
npm test              # 72 tests de aceptación (node --test pruebas/)
npx oxlint src pruebas
npx vite build
npm run publicar      # tests + iconos + build + force-push de dist/ a gh-pages
```

La app publicada: https://millonaris.github.io/forja-v2/ (rama `gh-pages`).
Actualizarla = `npm run publicar`. El móvil se actualiza solo al abrirla.
Servidor de desarrollo: entrada "forja" en `.claude/launch.json` (puerto 5173).

## Arquitectura

React 19 + Vite + vite-plugin-pwa (autoUpdate) + Dexie (IndexedDB) con
`useLiveQuery`. Sin router: la pestaña activa es estado en `App.jsx`; el hash
solo se usa para los atajos del manifest (#entrenar, #peso, #postura).

- `src/datos/` — el PLAN (rutinas, bloques de carrera, fases de nutrición,
  plan anual, semilla). Datos escritos, no registro.
- `src/logica/` — motores puros y testeables: rotación de fuerza, carrera,
  progresión (doble progresión), calibración, revisión mensual, agenda,
  informe, acciones (TODAS las escrituras a Dexie pasan por `acciones.js`).
- `src/pantallas/` — HOY, ENTRENAR (SesionFuerza), PROGRESO, PLAN, DIETA,
  Ajustes, DetalleSesion, Informe.
- `pruebas/aceptacion.test.js` — los casos que protegen las reglas de negocio.
- `docs/` — especificación maestra, plan maestro anual, rutina definitiva y
  contexto maestro de dieta (los documentos fuente de verdad que Jose entregó).
  `contexto-maestro-septiembre-2026.md` está SUPERADO de su día 7 en adelante.

## Invariantes que NO se rompen

1. **El estado manda, la fecha solo recomienda.** La rotación de fuerza
   (TORSO A → PIERNA A → TORSO B → PIERNA B) y los bloques de carrera avanzan
   SOLO al completar sesiones, nunca por calendario. No se reinician los lunes.
2. **La nutrición es lo único con fecha** — y solo hasta el 20-sep-2026
   (puesta a punto + test de mantenimiento). El protocolo vigente es
   `docs/contexto-maestro-dieta-02sep2026.md`, que sustituye al del 26 de
   agosto a partir del día 7: el mantenimiento estimado sube a ~2.800 y el test
   pasa a ser del 7 al 20 de septiembre. Desde el 21-sep manda la definición de
   seis semanas, y sus kcal se calculan:
   `mantenimientoReal + ajusteBase de la fase + ajusteKcal` (campos de
   `ajustes`). Las fases posteriores (mantenimiento, ganancia limpia, cut de
   primavera, verano 2027) NO entran por fecha: las confirma Jose desde
   DIETA → AÑO (`ajustes.faseManual`). Regla maestra: las calorías futuras
   nunca son cifras fijas, primero se mide el mantenimiento y después se le
   suma o resta.
3. **Ids de ejercicio estables**: `plantilla:clave` (p. ej. `torso-a:jalon-pecho`).
   Renombrar o reordenar no rompe el historial. Si se cambia una clave, añadir
   la migración en `CLAVES_ANTIGUAS` y subir `VERSION_PLAN` en `semilla.js`
   (el plan del código MANDA sobre lo sembrado; el registro jamás se toca).
4. **Fechas**: siempre strings locales "YYYY-MM-DD" vía `logica/fechas.js`
   (ancladas a mediodía). Nunca `toISOString()` para fechas de día.
5. **La rutina viene de** `docs/rutina-hipertrofia-definitiva.md` y el año de
   `docs/plan-maestro-anual-2026-2027.md`. Cambios de rutina no tocan dieta,
   CaCo, postura ni peso. Remo Torso A = agarre BAJO (dorsal); Torso B =
   agarre ALTO (espalda alta + posterior).

## Decisiones de diseño con motivo

- **Sesión de gimnasio estilo Hevy** (todo el entreno en una pantalla,
  desviación consciente de §9 de la spec, pedida por Jose). Al plegarla se
  oculta con `display:none`, NUNCA se desmonta: el temporizador de descanso
  sigue vivo. `descansoFin` se persiste en la fila de la sesión para
  sobrevivir recargas.
- **Alarma de descanso con el móvil bloqueado**: `public/sw-avisos.js`
  (despertador en el service worker). Usar `getRegistration()`, jamás
  `serviceWorker.ready` (se cuelga sin SW, p. ej. en dev). Superseries:
  la transición (posicionSS 1, 15 s) no programa aviso de sistema.
- **kg y reps se pre-rellenan** con la última sesión; el RIR se deja vacío a
  propósito: es el dato honesto diario que alimenta el motor de progresión.
- **Motor de progresión** (`logica/progresion.js`): doble progresión con
  veredictos SUBE/LLENA/MANTÉN/REVISAR, reto del día (`objetivoDeHoy`) y
  detección de estancamiento con causa (RIR 3+ = va sobrado ≠ meseta).
- **Revisión mensual** (`logica/revision.js`): algoritmo §66 del plan maestro
  con datos reales (peso, cintura, cumplimiento, progresión) → mantener /
  ±100–150 kcal. **Calibración** (`logica/calibracion.js`): medias 7d vs 7d,
  tope ±250 kcal (el rebote post-mini-cut es agua).
- Los datos de entrenamiento de Jose están EN SU MÓVIL. El IndexedDB del
  navegador de desarrollo es de pruebas y se puede ensuciar sin miedo.

## Al terminar cualquier cambio

1. `npm test` + `npx oxlint src pruebas` + `npx vite build` en verde.
2. Verificar en el navegador (servidor "forja") lo que sea visible.
3. `npm run publicar` para que llegue al móvil, y commit + push a `main`.
4. Contarle a Jose lo que cambió en términos de entrenamiento, no de código.
