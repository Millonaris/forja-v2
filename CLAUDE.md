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
  no lleva un diario de alimentos; solo se copia el TOTAL del día en el "cierre
  del día", que es lo que alimenta adherencia y TDEE deducido), GPS en Garmin
  (la app no lo duplica), sin gamificación ni rachas, sin cuentas ni nube: todos
  los datos viven en su móvil y la copia de seguridad es un JSON exportado.

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
  progresión (doble progresión), `nutricion.js` (adherencia, tendencias y TDEE
  deducido), `revision.js` (las revisiones de cada fase y el semáforo), agenda,
  informe, acciones (TODAS las escrituras a Dexie pasan por `acciones.js`).
- `src/pantallas/` — HOY, ENTRENAR (SesionFuerza), PROGRESO, PLAN, DIETA,
  Ajustes, DetalleSesion, Informe.
- `pruebas/aceptacion.test.js` — los casos que protegen las reglas de negocio.
- `docs/` — especificación maestra, plan maestro anual, rutina definitiva y el
  SOURCE OF TRUTH v3 de dieta (los documentos que Jose entregó). Los dos
  `contexto-maestro-*.md` están SUPERADOS enteros: no consultarlos.

## Invariantes que NO se rompen

1. **El estado manda, la fecha solo recomienda.** La rotación de fuerza
   (TORSO A → PIERNA A → TORSO B → PIERNA B) y los bloques de carrera avanzan
   SOLO al completar sesiones, nunca por calendario. No se reinician los lunes.
2. **La nutrición va por DATOS, no por fechas** (SOURCE OF TRUTH v3,
   `docs/dieta-v3-source-of-truth.md`; la versión en cristiano para Jose está
   en `docs/dieta-v3-explicada-facil.md`). Solo tienen fecha el arranque del
   cut (2-sep-2026), su semana de adaptación (2–8 sep) y el mapa orientativo de
   bloques. Todo lo demás sale del estado en `ajustes`: `faseNutricion`
   (cut → mantenimiento → ganancia → verano), `kcalObjetivo`, `proteinaObjetivo`,
   `grasaObjetivo`, `tdeeDeducido` y `mantenimientoConfirmado`. **Ninguna fase
   entra sola**: las confirma Jose desde DIETA → AÑO cuando se cumplen los
   criterios de salida. Las kcal no se tocan antes de 14 días desde el último
   cambio, y se mueven de 100 en 100 saliendo de los hidratos.
   Ciclo: medir → esperar → comparar → cambiar poco → volver a medir.
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
- **TDEE deducido** (`logica/nutricion.js`): `kcalMedias − tendenciaKg×7700/7`.
  Test obligatorio del plan: 2.400 kcal con −0,55 kg/sem → 3.005. Solo se usa
  con ≥21 días, ≥21 desde el último cambio de kcal, adherencia ≥85 % y pasos
  comparables (±20 %). Se enseña siempre con etiqueta ESTIMADO / DEDUCIDO /
  CONFIRMADO: nunca se presenta una fórmula como una verdad.
- **Revisiones** (`logica/revision.js`): una por fase (cut, mantenimiento,
  ganancia) con los algoritmos §45/§48/§50. Proponen, no aplican. Cuando las
  seis preguntas de la regla maestra no apuntan igual, la respuesta es MANTENER.
- **Lo que la app NUNCA hace** (§55 del v3, y hay lista en la UI): cambiar kcal
  por una pesada, contar dos veces el running (los pasos ya lo incluyen), leer
  agua/glucógeno como grasa, bajar kcal por dolor al correr, hacer mini-cut
  porque toca junio, o acusar a Jose de registrar mal.
- Los datos de entrenamiento de Jose están EN SU MÓVIL. El IndexedDB del
  navegador de desarrollo es de pruebas y se puede ensuciar sin miedo.

## Al terminar cualquier cambio

1. `npm test` + `npx oxlint src pruebas` + `npx vite build` en verde.
2. Verificar en el navegador (servidor "forja") lo que sea visible.
3. `npm run publicar` para que llegue al móvil, y commit + push a `main`.
4. Contarle a Jose lo que cambió en términos de entrenamiento, no de código.
