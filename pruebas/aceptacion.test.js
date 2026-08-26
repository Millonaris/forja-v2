/*
 * Pruebas de aceptación de la spec (§40, §41 y §42).
 *
 * Son literalmente los casos que la especificación exige que funcionen. Están
 * sobre los motores, no sobre la interfaz, porque es ahí donde vive la regla
 * que se quiere proteger: el estado manda, la fecha solo recomienda.
 *
 *   npm test
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import * as fuerza from "../src/logica/motorFuerza.js";
import * as carrera from "../src/logica/motorCarrera.js";
import {
  DIAS_ESPECIALES, FASES_MANUALES, MANTENIMIENTO_HIPOTESIS,
  calendarioDelTramo, diaEspecialDe, faseDe, kcalDe, objetivosDe, porQueDe,
} from "../src/datos/planNutricion.js";
import { TEMPORADAS, estadoTemporada } from "../src/datos/planAnual.js";
import { estadoCalibracion } from "../src/logica/calibracion.js";
import { revisar, revisionPendiente, semaforoPeso } from "../src/logica/revision.js";
import { seriesDeHoy, rirDeHoy } from "../src/datos/rampa.js";
import { RUTINAS, seriesTotales } from "../src/datos/rutinas.js";
import { CORE_CASA } from "../src/datos/rutinaPostural.js";
import * as progresion from "../src/logica/progresion.js";
import * as volumen from "../src/logica/volumen.js";
import * as agenda from "../src/logica/agenda.js";
import * as peso from "../src/logica/peso.js";
import { generarInforme } from "../src/logica/informe.js";
import { sumarDias, hoyISO } from "../src/logica/fechas.js";

const estadoInicial = { id: 1, indiceSiguiente: 0, ultimaCompletada: null };

/* ------------------------------------------------------------------ */
/* §40 · Fuerza                                                        */
/* ------------------------------------------------------------------ */

test("§40-A · tras completar Torso A, toca Pierna A", () => {
  const despues = fuerza.avanzar(estadoInicial, "torso-a");
  assert.equal(fuerza.siguiente(despues).id, "pierna-a");
});

test("§40-B · pasan días sin entrenar y sigue tocando lo mismo", () => {
  const despues = fuerza.avanzar(estadoInicial, "torso-a");
  // Ni un solo dato de fecha entra en la decisión: por eso pasar días no
  // puede cambiarla. Se comprueba llamando varias veces.
  assert.equal(fuerza.siguiente(despues).id, "pierna-a");
  assert.equal(fuerza.siguiente(despues).id, "pierna-a");
});

test("§40-D · al terminar Pierna A, la siguiente es Torso B", () => {
  let estado = fuerza.avanzar(estadoInicial, "torso-a");
  estado = fuerza.avanzar(estado, "pierna-a");
  assert.equal(fuerza.siguiente(estado).id, "torso-b");
});

test("la rotación da la vuelta después de Pierna B", () => {
  const estado = fuerza.avanzar({ id: 1, indiceSiguiente: 3 }, "pierna-b");
  assert.equal(fuerza.siguiente(estado).id, "torso-a");
});

test("§8 · elegir otra rutina pregunta, y se puede hacer sin mover la rotación", () => {
  const estado = fuerza.avanzar(estadoInicial, "torso-a"); // toca Pierna A
  const conflicto = fuerza.conflictoDeRotacion(estado, "torso-b");
  assert.ok(conflicto, "tenía que avisar del desvío");
  assert.match(conflicto.mensaje, /Pierna A/);

  const sinAvanzar = fuerza.avanzar(estado, "torso-b", { avanzarRotacion: false });
  assert.equal(fuerza.siguiente(sinAvanzar).id, "pierna-a", "la rotación no se movió");

  const avanzando = fuerza.avanzar(estado, "torso-b", { avanzarRotacion: true });
  assert.equal(fuerza.siguiente(avanzando).id, "pierna-b");
});

test("hacer justo lo que toca no genera ninguna pregunta", () => {
  assert.equal(fuerza.conflictoDeRotacion(estadoInicial, "torso-a"), null);
});

test("§40-E · entrenar dos días seguidos avisa pero no bloquea", () => {
  const ayer = { fecha: sumarDias(hoyISO(), -1), plantillaId: "torso-a" };
  // Zona distinta: no hay nada que avisar.
  assert.equal(fuerza.avisoRecuperacion(ayer, "pierna-a"), null);
  // Misma zona: avisa, y el aviso es solo texto — nadie impide nada.
  assert.match(fuerza.avisoRecuperacion(ayer, "torso-b"), /recuperación/i);
});

/* ------------------------------------------------------------------ */
/* §41 · Running                                                       */
/* ------------------------------------------------------------------ */

test("§41 · el bloque no se cierra hasta completar todas sus sesiones", () => {
  // Bloque 3: tres sesiones de 6 × (2′ + 2′).
  let estado = { id: 1, bloque: 3, sesion: 1, bloquesRepetidos: [] };
  assert.equal(carrera.siguiente(estado).texto, "6 × (2′ correr + 2′ caminar)");

  let paso = carrera.completar(estado);
  assert.equal(paso.bloqueCompletado, false);
  estado = paso.estado;
  assert.equal(carrera.siguiente(estado).numeroSesion, 2);

  paso = carrera.completar(estado);
  estado = paso.estado;
  paso = carrera.completar(estado);
  assert.equal(paso.bloqueCompletado, true, "la tercera cierra el bloque");
  assert.equal(paso.bloque, 3);
});

test("§41 · REPETIR mantiene el bloque aunque cambie la semana", () => {
  const estado = { id: 1, bloque: 5, sesion: 3, bloquesRepetidos: [] };
  const repetido = carrera.repetirBloque(estado);
  assert.equal(repetido.bloque, 5, "sigue en el 5");
  assert.equal(repetido.sesion, 1, "vuelve a empezarlo");
  assert.deepEqual(repetido.bloquesRepetidos, [5]);
});

test("§41 · correr dos días seguidos avisa, no bloquea", () => {
  const ayer = { fecha: sumarDias(hoyISO(), -1) };
  assert.match(carrera.avisoConsecutivo(ayer), /recuperar/i);
  assert.equal(carrera.avisoConsecutivo({ fecha: sumarDias(hoyISO(), -3) }), null);
});

test("las sesiones CaCo no piden km ni ritmo, las continuas sí (§51)", () => {
  const caco = carrera.siguiente({ bloque: 1, sesion: 1 });
  assert.equal(caco.sesion.tipo, "caco");
  assert.equal(caco.sesion.km, undefined);

  const continua = carrera.siguiente({ bloque: 19, sesion: 1 });
  assert.equal(continua.sesion.tipo, "continua");
  assert.equal(continua.sesion.km, 5);
});

test("el plan termina en una tirada de 20 km", () => {
  const final = carrera.siguiente({ bloque: 30, sesion: 3 });
  assert.equal(final.texto, "20 km");
  assert.equal(final.esUltima, true);
});

/* ------------------------------------------------------------------ */
/* §42 · Integración                                                   */
/* ------------------------------------------------------------------ */

test("§42 · la nutrición va por fecha y no la mueve el entrenamiento", () => {
  // Mover el gimnasio del 1 al 2 de septiembre no cambia que el 2 suba los
  // hidratos: son dos calendarios distintos a propósito.
  assert.equal(faseDe("2026-09-01").id, "deficit-moderado");
  assert.equal(faseDe("2026-09-02").id, "llenado");
  assert.equal(faseDe("2026-09-06").id, "transicion");
  assert.equal(faseDe("2026-09-09").id, "calibracion");
  assert.equal(faseDe("2026-09-22").id, "calibracion", "la calibración dura hasta el 22");
  assert.equal(faseDe("2026-09-23").id, "hipertrofia");
  assert.equal(faseDe("2027-01-30").id, "hipertrofia", "la hipertrofia es abierta");
});

test("los días de recarga y visuales mandan sobre su fase", () => {
  // El 3, el 4 y el 5 caen dentro del llenado, pero tienen reparto propio:
  // son justamente el motivo del plan.
  assert.equal(faseDe("2026-09-03").id, "llenado");
  assert.equal(objetivosDe("2026-09-03").kcal, 2500, "recarga + descanso");
  assert.equal(objetivosDe("2026-09-04").kcal, 2452, "día visual 1, ~2.450");
  assert.equal(objetivosDe("2026-09-05").kcal, 2452, "día visual 2, ~2.450");

  // Los dos días visuales llevan el MISMO reparto: el 5 no vuelve a 2.150.
  const v1 = objetivosDe("2026-09-04");
  const v2 = objetivosDe("2026-09-05");
  assert.deepEqual([v1.p, v1.hc, v1.g], [v2.p, v2.hc, v2.g]);

  // Y los días de alrededor siguen con las kcal de la fase.
  assert.equal(objetivosDe("2026-09-02").kcal, 2300, "empieza el llenado");
  assert.equal(objetivosDe("2026-09-06").kcal, 2500, "transición");
  assert.equal(diaEspecialDe("2026-09-06"), null);
});

test("el protocolo de septiembre clava las kcal del contexto maestro", () => {
  // El mini-cut de 1.700 está CANCELADO: el tramo 26 ago – 1 sep va a 2.150.
  assert.equal(objetivosDe("2026-08-26").kcal, 2150);
  assert.equal(objetivosDe("2026-08-26").hc, 208);
  // La calibración usa los macros del contexto: 190/309/67 ≈ 2.600.
  const cal = objetivosDe("2026-09-15");
  assert.deepEqual([cal.p, cal.hc, cal.g], [190, 309, 67]);
  // Y la proteína se queda en 190 g TODOS los días del tramo: no hace falta más.
  for (const dia of calendarioDelTramo()) {
    assert.equal(dia.p, 190, `proteína del ${dia.fecha}`);
  }
});

test("las kcal de cada día cuadran con sus macros (4/4/9)", () => {
  for (const dia of calendarioDelTramo()) {
    assert.equal(kcalDe(dia), dia.kcal, `las kcal del ${dia.fecha}`);
  }
});

test("el calendario del tramo va del 26 de agosto al 22 de septiembre", () => {
  const dias = calendarioDelTramo();
  assert.equal(dias.length, 28, "puesta a punto (14) + calibración (14)");
  assert.equal(dias[0].fecha, "2026-08-26");
  assert.equal(dias.at(-1).fecha, "2026-09-22");
  // Los 14 días de calibración, todos planos a ~2.600 (2.599 exactas por macros).
  assert.equal(dias.filter((d) => d.kcal === 2599).length, 14);

  // Siete días de déficit moderado antes de empezar el llenado.
  assert.equal(dias.filter((d) => d.kcal === 2150).length, 7);
  // Y dentro de la puesta a punto el pico está en la recarga del 3, no en los
  // días visuales: primero se llena, luego se mantiene.
  const puestaAPunto = dias.filter((d) => d.fecha <= "2026-09-08");
  const pico = puestaAPunto.reduce((a, b) => (a.kcal >= b.kcal ? a : b));
  assert.equal(pico.fecha, "2026-09-03");
});

test("las comidas de los días especiales suman su total", () => {
  for (const [fecha, dia] of Object.entries(DIAS_ESPECIALES)) {
    const suma = (k) => dia.comidas.reduce((t, c) => t + c[k], 0);
    assert.equal(suma("p"), dia.p, `proteína del ${fecha}`);
    assert.equal(suma("hc"), dia.hc, `hidratos del ${fecha}`);
    assert.equal(suma("g"), dia.g, `grasas del ${fecha}`);
    assert.equal(kcalDe(dia), dia.kcal, `kcal del ${fecha}`);
  }
});

test("todo el llenado viene del hidrato, no de la grasa", () => {
  const recarga = objetivosDe("2026-09-03");
  const deficit = objetivosDe("2026-08-27");
  assert.ok(recarga.hc - deficit.hc >= 90, "la recarga sube el hidrato con fuerza (208 → 300)");
  // La subida viene del hidrato: proteína y grasa apenas se mueven.
  assert.equal(recarga.p, deficit.p, "la proteína se queda en 190");
  assert.ok(Math.abs(recarga.g - deficit.g) <= 5, "la grasa se queda casi igual");
});

test("las macros por comida suman el total de la fase (§21)", () => {
  for (const fecha of ["2026-08-27", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-07", "2026-09-10", "2026-10-15"]) {
    const o = objetivosDe(fecha);
    assert.equal(o.comidas.reduce((t, c) => t + c.p, 0), o.p, `proteína el ${fecha}`);
    assert.equal(o.comidas.reduce((t, c) => t + c.hc, 0), o.hc, `hidratos el ${fecha}`);
    assert.equal(o.comidas.reduce((t, c) => t + c.g, 0), o.g, `grasas el ${fecha}`);
  }
});

/* ------------------------------------------------------------------ */
/* Plan maestro anual · fases dinámicas, calibración y revisión        */
/* ------------------------------------------------------------------ */

test("las fases dinámicas calculan sus kcal con el mantenimiento real", () => {
  // Sin calibrar: hipótesis de 2.600 y aviso de que lo es.
  const sinCalibrar = objetivosDe("2026-10-15", {});
  assert.equal(sinCalibrar.esHipotesis, true);
  assert.ok(Math.abs(sinCalibrar.kcal - MANTENIMIENTO_HIPOTESIS) <= 2);
  assert.equal(sinCalibrar.kcal, kcalDe(sinCalibrar), "las kcal cuadran 4/4/9");

  // Calibrado a 2.500 y con +150 de una revisión → ~2.650.
  const o = objetivosDe("2026-10-15", { mantenimientoReal: 2500, ajusteKcal: 150 });
  assert.equal(o.esHipotesis, false);
  assert.ok(Math.abs(o.kcal - 2650) <= 2, `kcal ≈ 2.650, salen ${o.kcal}`);
  assert.equal(o.p, 190);
  // Y las comidas generadas siempre suman el total.
  assert.equal(o.comidas.reduce((t, c) => t + c.p, 0), o.p);
  assert.equal(o.comidas.reduce((t, c) => t + c.hc, 0), o.hc);
  assert.equal(o.comidas.reduce((t, c) => t + c.g, 0), o.g);
});

test("la definición manda cuando está confirmada, y no antes", () => {
  assert.equal(FASES_MANUALES.definicion.ajusteInicial, -450, "arranca ~450 bajo mantenimiento");

  const ajustes = { mantenimientoReal: 2700, ajusteKcal: -450, faseManual: "definicion", faseManualDesde: "2027-02-01" };
  assert.equal(faseDe("2027-01-20", ajustes).id, "hipertrofia", "antes de su fecha sigue la hipertrofia");

  const o = objetivosDe("2027-02-10", ajustes);
  assert.equal(o.fase.id, "definicion");
  assert.ok(Math.abs(o.kcal - 2250) <= 2, `2.700 − 450 ≈ 2.250, salen ${o.kcal}`);
  assert.equal(o.p, 200, "en definición la proteína sube");
});

test("la calibración compara las dos semanas y propone el mantenimiento", () => {
  const pesos = [];
  for (let i = 0; i < 7; i += 1) pesos.push({ fecha: sumarDias("2026-09-09", i), kg: 95.0 });
  for (let i = 7; i < 14; i += 1) pesos.push({ fecha: sumarDias("2026-09-09", i), kg: 95.35 });

  // +0,35 kg/semana comiendo 2.600 ≈ 400 kcal/día de exceso, pero la
  // corrección se limita a ±250 (en dos semanas parte de esa subida es agua
  // y glucógeno): mantenimiento propuesto 2.350.
  const e = estadoCalibracion(pesos, {}, "2026-09-23");
  assert.equal(e.fase, "lista");
  assert.equal(e.mantenimiento, 2350);
  assert.equal(e.recortado, true, "avisa de que aplicó el tope");

  // Peso plano → 2.600 ES el mantenimiento real.
  const plano = estadoCalibracion(pesos.map((p) => ({ ...p, kg: 95 })), {}, "2026-09-23");
  assert.equal(plano.mantenimiento, 2600);

  // Con pocos pesajes no se inventa un número fiable.
  const pocos = estadoCalibracion(pesos.slice(0, 3), {}, "2026-09-23");
  assert.equal(pocos.fase, "incompleta");

  // Durante los 14 días se informa, no se juzga.
  assert.equal(estadoCalibracion(pesos, {}, "2026-09-15").fase, "en-curso");
  // Y guardado el número, la tarjeta desaparece.
  assert.equal(estadoCalibracion(pesos, { mantenimientoReal: 2550 }, "2026-09-23").fase, "guardada");
});

test("§66 · la revisión mensual aplica el algoritmo del plan", () => {
  const hoy = "2026-11-20";
  const pesosPlanos = [];
  for (let i = 0; i < 28; i += 1) pesosPlanos.push({ fecha: sumarDias(hoy, -i), kg: 96 });

  const sesiones = [];
  const carreras = [];
  for (let i = 0; i < 12; i += 1) {
    sesiones.push({ id: i + 1, fecha: sumarDias(hoy, -1 - i * 2), estado: "completada" });
    carreras.push({ fecha: sumarDias(hoy, -2 - i * 2), estado: "completada" });
  }

  // Peso plano + progresión parada + todo cumplido → el caso exacto de subir.
  const estancadas = [
    { sesionId: 12, ejercicioId: "e1", kg: 60, reps: 10, hecha: true },
    { sesionId: 1, ejercicioId: "e1", kg: 60, reps: 10, hecha: true },
  ];
  const r1 = revisar({ pesos: pesosPlanos, sesiones, carreras, series: estancadas }, "hipertrofia", hoy);
  assert.equal(r1.accion, "subir");

  // Lo mismo pero progresando → mantener: puede haber recomposición.
  const mejorando = [
    { sesionId: 12, ejercicioId: "e1", kg: 60, reps: 10, hecha: true },
    { sesionId: 1, ejercicioId: "e1", kg: 65, reps: 10, hecha: true },
  ];
  const r2 = revisar({ pesos: pesosPlanos, sesiones, carreras, series: mejorando }, "hipertrofia", hoy);
  assert.equal(r2.accion, "mantener");

  // Peso subiendo demasiado rápido → bajar, aunque el gimnasio progrese.
  const pesosRapidos = [];
  for (let i = 0; i < 28; i += 1) pesosRapidos.push({ fecha: sumarDias(hoy, -i), kg: 96 - i * 0.08 });
  const r3 = revisar({ pesos: pesosRapidos, sesiones, carreras, series: mejorando }, "hipertrofia", hoy);
  assert.equal(r3.accion, "bajar");

  // Cumplimiento bajo → el plan no se toca (paso 1 del algoritmo).
  const r4 = revisar(
    { pesos: pesosPlanos, sesiones: sesiones.slice(0, 4), carreras: carreras.slice(0, 4), series: [] },
    "hipertrofia",
    hoy,
  );
  assert.equal(r4.accion, "cumplir");

  // En definición, perder dentro del 0,4–0,9 % semanal es mantener.
  const bajando = [];
  for (let i = 0; i < 28; i += 1) bajando.push({ fecha: sumarDias(hoy, -i), kg: 90 + i * 0.08 });
  const r5 = revisar({ pesos: bajando, sesiones, carreras, series: mejorando }, "definicion", hoy);
  assert.equal(r5.accion, "mantener");
});

test("la revisión aparece cada 4 semanas, no antes", () => {
  // La primera cuenta desde el arranque de la hipertrofia (23 sep + 28 días).
  assert.equal(revisionPendiente("hipertrofia", {}, "2026-10-20"), false);
  assert.equal(revisionPendiente("hipertrofia", {}, "2026-10-21"), true);
  // Cerrada una, el reloj se reinicia.
  assert.equal(revisionPendiente("hipertrofia", { ultimaRevision: "2026-10-21" }, "2026-11-17"), false);
  assert.equal(revisionPendiente("hipertrofia", { ultimaRevision: "2026-10-21" }, "2026-11-18"), true);
  // En calibración y puesta a punto no hay nada que revisar: las kcal están escritas.
  assert.equal(revisionPendiente("calibracion", {}, "2026-12-01"), false);
});

test("el semáforo del peso habla el idioma de la fase", () => {
  const hoy = "2026-11-20";

  const despacio = [];
  for (let i = 0; i < 28; i += 1) despacio.push({ fecha: sumarDias(hoy, -i), kg: 96 - i * 0.02 });
  assert.equal(semaforoPeso(despacio, "hipertrofia", hoy).estado, "verde", "subir ~0,14 kg/sem es el objetivo");

  const rapido = [];
  for (let i = 0; i < 28; i += 1) rapido.push({ fecha: sumarDias(hoy, -i), kg: 96 - i * 0.08 });
  assert.equal(semaforoPeso(rapido, "hipertrofia", hoy).estado, "rojo", "subir ~0,56 kg/sem es grasa");

  const bajando = [];
  for (let i = 0; i < 28; i += 1) bajando.push({ fecha: sumarDias(hoy, -i), kg: 90 + i * 0.08 });
  assert.equal(semaforoPeso(bajando, "definicion", hoy).estado, "verde", "perder ~0,6 %/sem es el rango");

  assert.equal(semaforoPeso([], "hipertrofia", hoy), null, "sin báscula no hay veredicto");
});

test("las temporadas del AÑO saben cuál es la actual", () => {
  assert.equal(TEMPORADAS.length, 7);
  const t = (id) => TEMPORADAS.find((x) => x.id === id);

  assert.equal(estadoTemporada(t("puesta-a-punto"), "2026-08-30", {}), "actual");
  assert.equal(estadoTemporada(t("hipertrofia"), "2026-08-30", {}), "futura");
  assert.equal(estadoTemporada(t("hipertrofia"), "2026-10-15", {}), "actual");
  assert.equal(estadoTemporada(t("definicion"), "2026-10-15", {}), "futura", "definición no entra por fecha");

  // Confirmada la definición, la hipertrofia queda atrás.
  const conDef = { faseManual: "definicion", faseManualDesde: "2027-02-01" };
  assert.equal(estadoTemporada(t("definicion"), "2027-02-10", conDef), "actual");
  assert.equal(estadoTemporada(t("hipertrofia"), "2027-02-10", conDef), "pasada");

  // Y el porqué de un día de calibración cuenta lo que toca.
  assert.ok(porQueDe("2026-09-15").includes("calibración"));
});

test("§10 · la rampa recorta series sin crear una rutina aparte", () => {
  const ejercicio = { series: 4, nombre: "Elevaciones laterales" };

  assert.equal(seriesDeHoy(ejercicio, "2026-08-28"), 3, "primera semana, ~78 %");
  assert.equal(rirDeHoy("2026-08-28"), "3");

  assert.equal(seriesDeHoy(ejercicio, "2026-09-04"), 4, "segunda semana, ~95 %");
  assert.equal(rirDeHoy("2026-09-04"), "2");

  assert.equal(seriesDeHoy(ejercicio, "2026-09-20"), 4, "fuera de rampa, al 100 %");
  assert.equal(rirDeHoy("2026-09-20"), "1–2");
});

test("la rampa nunca deja un ejercicio en cero series", () => {
  assert.equal(seriesDeHoy({ series: 1 }, "2026-08-28"), 1);
});

/* ------------------------------------------------------------------ */
/* §12 · Progresión y volumen                                          */
/* ------------------------------------------------------------------ */

test("§12 · rango lleno con el RIR correcto pide subir peso", () => {
  const ejercicio = { repMin: 8, repMax: 12 };
  const historial = [
    { fecha: "2026-08-20", series: [
      { numeroSerie: 1, kg: 70, reps: 12, rir: 2 },
      { numeroSerie: 2, kg: 70, reps: 12, rir: 1 },
      { numeroSerie: 3, kg: 70, reps: 12, rir: 1 },
    ] },
  ];
  assert.equal(progresion.veredicto(ejercicio, historial).id, "sube");
});

test("§12 · con margen de repeticiones toca llenar el rango, no subir", () => {
  const ejercicio = { repMin: 8, repMax: 12 };
  const historial = [
    { fecha: "2026-08-20", series: [
      { numeroSerie: 1, kg: 70, reps: 9, rir: 2 },
      { numeroSerie: 2, kg: 70, reps: 9, rir: 2 },
    ] },
  ];
  assert.equal(progresion.veredicto(ejercicio, historial).id, "llena");
});

test("§12 · tres sesiones clavado al mismo peso pide revisar", () => {
  const ejercicio = { repMin: 8, repMax: 12 };
  const serie = (reps) => [
    { numeroSerie: 1, kg: 70, reps, rir: 2 },
    { numeroSerie: 2, kg: 70, reps, rir: 2 },
  ];
  const historial = [
    { fecha: "2026-08-20", series: serie(9) },
    { fecha: "2026-08-14", series: serie(9) },
    { fecha: "2026-08-08", series: serie(9) },
    { fecha: "2026-08-02", series: serie(9) },
  ];
  assert.equal(progresion.veredicto(ejercicio, historial).id, "revisar");
});

test("§9 · la línea de referencia sale como '70 kg · 10/10/9 · RIR 2'", () => {
  const series = [
    { numeroSerie: 1, kg: 70, reps: 10, rir: 2 },
    { numeroSerie: 2, kg: 70, reps: 10, rir: 2 },
    { numeroSerie: 3, kg: 70, reps: 9, rir: 2 },
  ];
  assert.equal(progresion.resumirSesion(series), "70 kg · 10/10/9 · RIR 2");
});

test("§42 · el volumen no se corta por semanas naturales", () => {
  // Dos sesiones en domingo y lunes: por semanas naturales caerían en semanas
  // distintas y saldría "una floja y otra cargada". En ventana móvil son dos
  // sesiones seguidas, que es lo que de verdad pasó.
  const domingo = sumarDias(hoyISO(), -2);
  const lunes = sumarDias(hoyISO(), -1);

  const sesiones = [
    { id: 1, fecha: domingo, plantillaId: "torso-a" },
    { id: 2, fecha: lunes, plantillaId: "pierna-a" },
  ];
  const ejercicios = [
    { id: "e1", musculos: ["deltoide lateral"] },
    { id: "e2", musculos: ["cuádriceps"] },
  ];
  const series = [
    { sesionId: 1, ejercicioId: "e1" },
    { sesionId: 1, ejercicioId: "e1" },
    { sesionId: 1, ejercicioId: "e1" },
    { sesionId: 2, ejercicioId: "e2" },
    { sesionId: 2, ejercicioId: "e2" },
  ];

  const v7 = volumen.volumenPorMusculo(sesiones, series, ejercicios, 7);
  assert.deepEqual(v7, [
    { musculo: "deltoide lateral", series: 3 },
    { musculo: "cuádriceps", series: 2 },
  ]);

  // Y por últimos N entrenamientos, sin mirar el calendario para nada.
  const v4 = volumen.volumenUltimasSesiones(sesiones, series, ejercicios, 4);
  assert.equal(v4.reduce((t, m) => t + m.series, 0), 5);
});

test("§42 · una sesión sugerida el miércoles y hecha el jueves cuenta como hecha", () => {
  // La adherencia solo mira lo que se hizo dentro de la ventana. La fecha
  // sugerida no aparece por ningún lado, que es justo el objetivo.
  const jueves = sumarDias(hoyISO(), -1);
  const { hechas, objetivo } = volumen.adherenciaFuerza([
    { id: 1, fecha: jueves, plantillaId: "pierna-a" },
  ]);
  assert.equal(hechas, 1);
  assert.equal(objetivo, 3);
});

test("§19 · un día sin nada no es un fallo, es un día en blanco", () => {
  const dias = [sumarDias(hoyISO(), -1), hoyISO()];
  const mapa = volumen.consistencia(dias, [{ fecha: hoyISO() }], [], []);
  assert.equal(mapa[0].acciones, 0, "ayer, sin acciones");
  assert.equal(mapa[1].acciones, 1);
  // No hay ningún campo de "fallado" ni "incumplido": no existe a propósito.
  assert.deepEqual(Object.keys(mapa[0]).sort(), ["acciones", "carrera", "fecha", "fuerza", "postura"]);
});

/* ------------------------------------------------------------------ */
/* §27 y §38 · Agenda                                                  */
/* ------------------------------------------------------------------ */

test("§27 · la agenda propone 7 días y todo lo futuro va como SUGERIDO", () => {
  const dias = agenda.proximos7Dias({
    ajustes: { diasFuerza: [1, 3, 5], diasCarrera: [2, 4, 0] },
    estadoFuerza: { indiceSiguiente: 0 },
    estadoCarrera: { bloque: 3, sesion: 1 },
  });

  assert.equal(dias.length, 7);
  for (const dia of dias) {
    for (const e of dia.entradas) {
      assert.equal(e.estado, "sugerido");
      assert.equal(agenda.etiqueta(e), "SUGERIDO");
    }
  }
});

test("§38 · la agenda no propone correr dos días seguidos", () => {
  const dias = agenda.proximos7Dias({
    // Todos los días marcados como preferentes para correr: aun así la regla
    // de días consecutivos tiene que dejar huecos.
    ajustes: { diasFuerza: [], diasCarrera: [0, 1, 2, 3, 4, 5, 6] },
    estadoFuerza: { indiceSiguiente: 0 },
    estadoCarrera: { bloque: 3, sesion: 1 },
  });

  const conCarrera = dias.map((d) => d.entradas.some((e) => e.tipo === "carrera"));
  for (let i = 1; i < conCarrera.length; i++) {
    assert.ok(!(conCarrera[i] && conCarrera[i - 1]), `días ${i - 1} y ${i} seguidos`);
  }
});

test("§16 · si fuerza y carrera caen el mismo día, se propone mover la carrera", () => {
  const choque = agenda.conflicto("2026-08-27", [
    { tipo: "fuerza", titulo: "Pierna A" },
    { tipo: "carrera", titulo: "6 × (2′ + 2′)" },
  ]);
  assert.match(choque.mensaje, /mantener la fuerza/i);
  assert.deepEqual(choque.opciones.map((o) => o.id), [
    "mover-carrera", "omitir-carrera", "ambos", "cancelar",
  ]);
});

test("§56 · omitido no se pinta con el color de error", () => {
  assert.ok(agenda.ESTILO_ESTADO.omitido.opacidad < agenda.ESTILO_ESTADO.realizado.opacidad);
  const estilos = JSON.stringify(agenda.ESTILO_ESTADO);
  assert.ok(!/error|rojo|red/i.test(estilos), "ningún estado usa el rojo de error");
});

/* ------------------------------------------------------------------ */
/* §6 y §22 · Peso                                                     */
/* ------------------------------------------------------------------ */

test("§6 · la media de 7 días aguanta días sin apuntar", () => {
  const pesos = [
    { fecha: hoyISO(), kg: 95.4 },
    { fecha: sumarDias(hoyISO(), -2), kg: 95.8 },
    { fecha: sumarDias(hoyISO(), -4), kg: 96.2 },
  ];
  assert.equal(peso.media(pesos, 7).toFixed(1), "95.8");
  assert.equal(peso.faltaHoy(pesos), false);
  assert.equal(peso.faltaHoy(pesos.slice(1)), true);
});

test("el peso se escribe con coma, como se dice", () => {
  assert.equal(peso.formatear(95.4), "95,4");
  assert.equal(peso.formatear(95), "95,0");
  // La media sale de una división y trae muchos decimales: se recorta a uno.
  assert.equal(peso.formatear(95.4666), "95,5");
  assert.equal(peso.formatear(null), "—");
});

test("cada día del tramo explica por qué es como es, sin números absurdos", () => {
  for (const dia of calendarioDelTramo()) {
    const texto = porQueDe(dia.fecha);
    assert.ok(texto.length > 40, `el ${dia.fecha} se queda sin explicación`);
    // "Día -3 de 7" salía al mirar un día anterior al arranque del plan.
    assert.ok(!/-\d/.test(texto), `el ${dia.fecha} cuenta días en negativo: ${texto}`);
  }

  // Y antes de que empiece el plan se dice, en vez de contar hacia atrás.
  assert.match(porQueDe("2026-08-22"), /arranca el 26 de agosto/);
});

test("§38 · la agenda respeta las carreras reales, no solo las suyas", () => {
  // Corriste AYER de verdad: hoy no puede proponer carrera aunque sea tu día
  // preferido. Este fallo existía porque la regla solo miraba las carreras
  // que la propia agenda iba proponiendo.
  const conAyer = agenda.proximos7Dias({
    ajustes: { diasFuerza: [], diasCarrera: [0, 1, 2, 3, 4, 5, 6] },
    estadoFuerza: { indiceSiguiente: 0 },
    estadoCarrera: { bloque: 3, sesion: 1 },
    ultimaCarreraHecha: sumarDias(hoyISO(), -1),
  });
  assert.equal(conAyer[0].entradas.some((e) => e.tipo === "carrera"), false, "hoy descansa");
  assert.equal(conAyer[1].entradas.some((e) => e.tipo === "carrera"), true, "mañana sí");

  // Y si ya corriste HOY, hoy tampoco.
  const conHoy = agenda.proximos7Dias({
    ajustes: { diasFuerza: [], diasCarrera: [0, 1, 2, 3, 4, 5, 6] },
    estadoFuerza: { indiceSiguiente: 0 },
    estadoCarrera: { bloque: 3, sesion: 2 },
    ultimaCarreraHecha: hoyISO(),
  });
  assert.equal(conHoy[0].entradas.some((e) => e.tipo === "carrera"), false);
});

/* ------------------------------------------------------------------ */
/* §53 · Informe de revisión                                           */
/* ------------------------------------------------------------------ */

test("§53 · el informe recoge lo que pasó, con las series tal cual", () => {
  const hoy = hoyISO();
  const ayer = sumarDias(hoy, -1);

  const datos = {
    pesos: [{ fecha: ayer, kg: 95.8 }, { fecha: hoy, kg: 95.2 }],
    mediciones: [{ fecha: hoy, cintura: 92.5 }],
    fotos: [],
    sesiones: [{ id: 1, fecha: ayer, plantillaId: "torso-a", estado: "completada", duracion: 3600 }],
    series: [
      { sesionId: 1, ejercicioId: "e1", numeroSerie: 1, kg: 70, reps: 10, rir: 2, hecha: true },
      { sesionId: 1, ejercicioId: "e1", numeroSerie: 2, kg: 70, reps: 9, rir: 1, hecha: true },
    ],
    ejercicios: [{ id: "e1", nombre: "Jalón al pecho", repMin: 8, repMax: 12, musculos: ["dorsal"] }],
    carreras: [
      { fecha: hoy, bloque: 3, descripcion: "6 × (2′ + 2′)", estado: "completada", notas: "bien" },
    ],
    postura: [{ fecha: hoy, completada: true }],
    testsPared: [{ fecha: hoy, resultado: 4, notas: "" }],
    diario: [{ fecha: hoy, nota: "Rodilla rara en la prensa" }],
    estadoFuerza: { indiceSiguiente: 1 },
    estadoCarrera: { bloque: 3, sesion: 2, bloquesRepetidos: [] },
    ajustes: { escalonVolumen: 0 },
  };

  const md = generarInforme(datos, { dias: 7 });

  // Las seis secciones de §53.
  for (const titulo of ["## Resumen", "## Fuerza", "## Carrera", "## Postura", "## Cuerpo", "## Notas"]) {
    assert.ok(md.includes(titulo), `falta ${titulo}`);
  }

  // Series con kg, reps y RIR, que es lo que hace útil el informe.
  assert.match(md, /Jalón al pecho:\*\* 70×10 \(RIR 2\), 70×9 \(RIR 1\)/);
  assert.match(md, /Peso actual:\*\* 95,2 kg/);
  assert.match(md, /Cintura:\*\* 92,5 cm/);
  assert.match(md, /Rodilla rara en la prensa/);
  // Las notas de carrera se mezclan con las del diario, no en dos sitios.
  assert.match(md, /\(carrera\) bien/);
  assert.match(md, /Bloque de carrera:\*\* 3/);
  assert.match(md, /Próxima fuerza:\*\* Pierna A/);
});

test("el informe no inventa nada cuando no hay datos", () => {
  const vacio = {
    pesos: [], mediciones: [], fotos: [], sesiones: [], series: [], ejercicios: [],
    carreras: [], postura: [], testsPared: [], diario: [],
    estadoFuerza: { indiceSiguiente: 0 },
    estadoCarrera: { bloque: 1, sesion: 1, bloquesRepetidos: [] },
    ajustes: {},
  };
  const md = generarInforme(vacio, { dias: 7 });

  assert.match(md, /Sin entrenos registrados/);
  assert.match(md, /Sin carreras en este periodo/);
  assert.match(md, /Peso actual:\*\* sin datos/);
  assert.match(md, /Test de la pared:\*\* sin hacer/);
  // Sin notas no se imprime una sección vacía.
  assert.ok(!md.includes("## Notas"));
});

test("el informe solo mira dentro del periodo pedido", () => {
  const hoy = hoyISO();
  const datos = {
    pesos: [], mediciones: [], fotos: [], ejercicios: [], series: [],
    sesiones: [
      { id: 1, fecha: sumarDias(hoy, -3), plantillaId: "torso-a", estado: "completada" },
      { id: 2, fecha: sumarDias(hoy, -20), plantillaId: "pierna-a", estado: "completada" },
    ],
    carreras: [], postura: [], testsPared: [], diario: [],
    estadoFuerza: { indiceSiguiente: 0 },
    estadoCarrera: { bloque: 1, sesion: 1 },
    ajustes: {},
  };

  const semana = generarInforme(datos, { dias: 7 });
  assert.match(semana, /Sesiones en el periodo:\*\* 1/);
  assert.ok(!semana.includes("Pierna A"), "la sesión de hace 20 días queda fuera");

  const mes = generarInforme(datos, { dias: 30 });
  assert.match(mes, /Sesiones en el periodo:\*\* 2/);
});

test("§27 · lo que fijas a mano consume cupo y no se duplica la sugerencia", () => {
  const base = {
    ajustes: { diasFuerza: [0, 1, 2, 3, 4, 5, 6], diasCarrera: [] },
    estadoFuerza: { indiceSiguiente: 0 },
    estadoCarrera: { bloque: 3, sesion: 1 },
  };

  // Sin nada fijado: la app propone su cupo de ~3 sesiones de fuerza.
  const sinFijar = agenda.proximos7Dias(base);
  const cuenta = (dias) =>
    dias.reduce((t, d) => t + d.entradas.filter((e) => e.tipo === "fuerza").length, 0);
  assert.equal(cuenta(sinFijar), 3);

  // Al fijar dos a mano, la app solo propone una más: tres en total, no cinco.
  const conFijadas = agenda.proximos7Dias({
    ...base,
    eventos: [
      { id: 1, fecha: sumarDias(hoyISO(), 4), tipo: "fuerza", titulo: "Torso B", estado: "programado" },
      { id: 2, fecha: sumarDias(hoyISO(), 6), tipo: "fuerza", titulo: "Pierna B", estado: "programado" },
    ],
  });
  assert.equal(cuenta(conFijadas), 3, "dos fijadas + una sugerida");

  // Y ninguna rutina sale dos veces: mover Torso B al jueves hace que los
  // días anteriores propongan otra, no la misma sesión repetida.
  const titulos = conFijadas.flatMap((d) =>
    d.entradas.filter((e) => e.tipo === "fuerza").map((e) => e.titulo),
  );
  assert.equal(new Set(titulos).size, titulos.length, `rutina repetida: ${titulos.join(", ")}`);

  // Y una omitida no gasta cupo: sigue habiendo tres sesiones de verdad.
  const conOmitida = agenda.proximos7Dias({
    ...base,
    eventos: [
      { id: 1, fecha: sumarDias(hoyISO(), 4), tipo: "fuerza", titulo: "Torso B", estado: "omitido" },
    ],
  });
  const reales = conOmitida.reduce(
    (t, d) => t + d.entradas.filter((e) => e.tipo === "fuerza" && e.estado !== "omitido").length,
    0,
  );
  assert.equal(reales, 3);
});

/* ------------------------------------------------------------------ */
/* Rutina definitiva (informe de investigación)                        */
/* ------------------------------------------------------------------ */

test("cada rutina tiene sus series, su prioridad y su duración", () => {
  const esperado = {
    "torso-a": { series: 21, prioridad: "Espalda" },
    "pierna-a": { series: 23, prioridad: "Cuádriceps + glúteo" },
    "torso-b": { series: 21, prioridad: "Deltoide lateral" },
    "pierna-b": { series: 23, prioridad: "Glúteo" },
  };
  for (const rutina of RUTINAS) {
    assert.equal(seriesTotales(rutina), esperado[rutina.id].series, `series de ${rutina.nombre}`);
    assert.equal(rutina.prioridad, esperado[rutina.id].prioridad);
    assert.match(rutina.duracion, /^\d+–\d+ min$/, `duración de ${rutina.nombre}`);
  }
});

test("Torso A empieza por espalda con jalón y remo SEGUIDOS", () => {
  // Era la duda concreta del informe: no se intercalan laterales entre ambos.
  const torsoA = RUTINAS.find((r) => r.id === "torso-a").ejercicios;
  assert.equal(torsoA[0].clave, "jalon-pecho");
  assert.equal(torsoA[1].clave, "remo-pecho-apoyado");
  assert.equal(torsoA[2].clave, "laterales", "las laterales van justo después, no antes");
});

test("Torso B da el primer puesto absoluto a las laterales", () => {
  const torsoB = RUTINAS.find((r) => r.id === "torso-b").ejercicios;
  assert.equal(torsoB[0].clave, "laterales");
  assert.equal(torsoB[0].series, 4);
});

test("cada ejercicio tiene RIR objetivo y descanso con su rango", () => {
  for (const rutina of RUTINAS) {
    for (const e of rutina.ejercicios) {
      assert.match(e.rir, /^(1–2|2)$/, `RIR de ${e.nombre}`);
      assert.equal(typeof e.descanso, "number", `descanso de ${e.nombre}`);

      if (e.posicionSS === 1) {
        // El primero de una superserie solo transiciona: no lleva rango.
        assert.ok(e.descanso <= 20, `${e.nombre} debería transicionar`);
        continue;
      }
      assert.ok(e.descansoMin <= e.descanso, `rango bajo de ${e.nombre}`);
      assert.ok(e.descansoMax >= e.descanso, `rango alto de ${e.nombre}`);
    }
  }
});

test("las superseries van emparejadas, seguidas y solo entre accesorios", () => {
  for (const rutina of RUTINAS) {
    const grupos = new Map();
    for (const e of rutina.ejercicios) {
      if (!e.superserie) continue;
      if (!grupos.has(e.superserie)) grupos.set(e.superserie, []);
      grupos.get(e.superserie).push(e);
    }

    for (const [grupo, lista] of grupos) {
      assert.equal(lista.length, 2, `la superserie ${grupo} de ${rutina.nombre} no es pareja`);
      assert.deepEqual(lista.map((e) => e.posicionSS), [1, 2], `orden de ${grupo}`);
      assert.ok(lista[1].descanso >= 60, `${grupo}: falta el descanso de la pareja`);

      const a = rutina.ejercicios.indexOf(lista[0]);
      assert.equal(rutina.ejercicios.indexOf(lista[1]) - a, 1, `${grupo} no va seguida`);

      // Nada de emparejar compuestos: hack, prensa, hip thrust, jalones,
      // remos, presses y curl femoral conservan descanso completo.
      for (const e of lista) {
        assert.notEqual(e.categoria, "basico", `${e.nombre} es básico y está en superserie`);
      }
    }
  }
});

test("las laterales de los dos torso van solas, sin superserie", () => {
  // Son la prioridad de esas sesiones: emparejarlas les quitaría calidad.
  for (const id of ["torso-a", "torso-b"]) {
    const lat = RUTINAS.find((r) => r.id === id).ejercicios.find((e) => e.clave === "laterales");
    assert.equal(lat.superserie, undefined, `las laterales de ${id} no deberían ir emparejadas`);
    assert.equal(lat.series, 4);
  }
});

test("el core ya no está en el gimnasio: se hace en casa", () => {
  for (const rutina of RUTINAS) {
    for (const e of rutina.ejercicios) {
      assert.notEqual(e.categoria, "core", `${rutina.nombre} todavía tiene core: ${e.nombre}`);
    }
  }
  assert.equal(CORE_CASA.ejercicios.length, 3);
});

test("las claves de ejercicio son únicas dentro de cada rutina", () => {
  for (const rutina of RUTINAS) {
    const claves = rutina.ejercicios.map((e) => e.clave);
    assert.equal(new Set(claves).size, claves.length, `claves repetidas en ${rutina.nombre}`);
    for (const c of claves) assert.match(c, /^[a-z0-9-]+$/, `clave rara: ${c}`);
  }
});

test("el deltoide lateral suma 12 series directas cada cuatro sesiones", () => {
  const porRutina = RUTINAS.map((r) =>
    r.ejercicios
      .filter((e) => e.musculos?.includes("deltoide lateral"))
      .reduce((t, e) => t + e.series, 0),
  );
  assert.deepEqual(porRutina, [4, 2, 4, 2], "laterales por rutina");
  assert.equal(porRutina.reduce((a, b) => a + b, 0), 12);
});

test("Pierna B sesga más a glúteo que Pierna A", () => {
  const glutex = (id) =>
    RUTINAS.find((r) => r.id === id)
      .ejercicios.filter((e) => e.musculos?.some((m) => m.startsWith("glúteo")))
      .reduce((t, e) => t + e.series, 0);
  assert.ok(glutex("pierna-b") > glutex("pierna-a"));
});

test("la variante agresiva solo añade una serie en seis ejercicios", () => {
  // No es "más fallo": es exactamente +1 serie donde toca, con el mismo RIR.
  const conMas = RUTINAS.flatMap((r) => r.ejercicios).filter((e) => e.extraAgresiva);
  assert.equal(conMas.length, 6);

  const base = RUTINAS.map((r) => seriesTotales(r));
  const agresiva = RUTINAS.map((r) => seriesTotales(r, { agresiva: true }));
  assert.deepEqual(base, [21, 23, 21, 23]);
  assert.deepEqual(agresiva, [22, 25, 22, 25]);
});

test("los ejercicios principales traen alternativa si la máquina está ocupada", () => {
  for (const rutina of RUTINAS) {
    for (const e of rutina.ejercicios.filter((x) => x.categoria === "basico")) {
      assert.ok(e.alternativas?.length >= 2, `${e.nombre} necesita alternativas`);
    }
  }
});

test("§4 · la rampa recorta 4→3 y 3→2, y deja los de 2 series", () => {
  assert.equal(seriesDeHoy({ series: 4 }, "2026-08-28"), 3);
  assert.equal(seriesDeHoy({ series: 3 }, "2026-08-28"), 2);
  assert.equal(seriesDeHoy({ series: 2 }, "2026-08-28"), 2);

  assert.equal(seriesDeHoy({ series: 4 }, "2026-09-04"), 4);
  assert.equal(seriesDeHoy({ series: 3 }, "2026-09-04"), 3);

  // Y la rampa se aplica DESPUÉS de la variante, no antes.
  assert.equal(seriesDeHoy({ series: 3, extraAgresiva: 1 }, "2026-08-28", { agresiva: true }), 3);
});

test("los dos remos tienen agarre y objetivo distintos", () => {
  // Sin esto se acababa haciendo el mismo remo dos veces por vuelta.
  const bajo = RUTINAS.find((r) => r.id === "torso-a").ejercicios
    .find((e) => e.clave === "remo-pecho-apoyado");
  const alto = RUTINAS.find((r) => r.id === "torso-b").ejercicios
    .find((e) => e.clave === "high-row");

  assert.match(bajo.nombre, /agarre bajo/i);
  assert.match(alto.nombre, /agarre alto/i);

  // Torso A tira de dorsal (anchura); Torso B, de espalda alta y posterior.
  assert.equal(bajo.musculos[0], "dorsal");
  assert.deepEqual(alto.musculos, ["espalda alta", "deltoide posterior"]);
  assert.ok(!bajo.musculos.includes("deltoide posterior"));

  // Y cada uno explica su agarre, que es lo que no se especificaba.
  assert.match(bajo.nota, /codos relativamente pegados/i);
  assert.match(alto.nota, /codos más abiertos/i);
});

/* ------------------------------------------------------------------ */
/* El entrenador metódico                                              */
/* ------------------------------------------------------------------ */

test("techo del rango rozando el fallo NO sube: consolida primero", () => {
  // El plan pide el techo CON el RIR objetivo. Llegar a 12 al fallo no cuenta.
  const ejercicio = { repMin: 8, repMax: 12, rir: "2" };
  const historial = [
    { fecha: "2026-09-20", series: [
      { numeroSerie: 1, kg: 70, reps: 12, rir: 1 },
      { numeroSerie: 2, kg: 70, reps: 12, rir: 0 },
    ] },
  ];
  const v = progresion.veredicto(ejercicio, historial);
  assert.equal(v.id, "manten");
  assert.match(v.motivo, /rozando el fallo/i);
});

test("peso pasado: todas las series bajo el suelo del rango piden bajar", () => {
  const ejercicio = { repMin: 8, repMax: 12, rir: "2" };
  const historial = [
    { fecha: "2026-09-20", series: [
      { numeroSerie: 1, kg: 80, reps: 6, rir: 1 },
      { numeroSerie: 2, kg: 80, reps: 5, rir: 0 },
    ] },
  ];
  const v = progresion.veredicto(ejercicio, historial);
  assert.equal(v.id, "revisar");
  assert.match(v.motivo, /baja el incremento/i);
});

test("salto de peso demasiado grande: aconseja volver al anterior", () => {
  const ejercicio = { repMin: 8, repMax: 12, rir: "2" };
  const historial = [
    { fecha: "2026-09-20", series: [{ numeroSerie: 1, kg: 80, reps: 6, rir: 1 }] },
    { fecha: "2026-09-14", series: [{ numeroSerie: 1, kg: 70, reps: 12, rir: 2 }] },
  ];
  const v = progresion.veredicto(ejercicio, historial);
  assert.equal(v.id, "revisar");
  assert.match(v.motivo, /Vuelve a 70 kg|incremento menor/);
});

test("recién subido de peso: reconstruir no es retroceder", () => {
  const ejercicio = { repMin: 8, repMax: 12, rir: "2" };
  const historial = [
    { fecha: "2026-09-20", series: [
      { numeroSerie: 1, kg: 72.5, reps: 9, rir: 2 },
      { numeroSerie: 2, kg: 72.5, reps: 8, rir: 2 },
    ] },
    { fecha: "2026-09-14", series: [
      { numeroSerie: 1, kg: 70, reps: 12, rir: 2 },
      { numeroSerie: 2, kg: 70, reps: 12, rir: 1 },
    ] },
  ];
  const v = progresion.veredicto(ejercicio, historial);
  assert.equal(v.id, "llena");
  assert.match(v.motivo, /reconstruye/i);
  assert.match(v.motivo, /no retroceso|es progreso/i);
});

test("en rampa de vuelta no se piden récords", () => {
  const ejercicio = { repMin: 8, repMax: 12, rir: "2" };
  const historial = [
    { fecha: "2026-08-20", series: [{ numeroSerie: 1, kg: 70, reps: 12, rir: 2 }] },
  ];
  const v = progresion.veredicto(ejercicio, historial, { enRampa: true });
  assert.equal(v.id, "manten");
  assert.match(v.motivo, /rampa/i);
});

test("la mejora dice el objetivo concreto de la próxima sesión", () => {
  const ejercicio = { repMin: 8, repMax: 12, rir: "2" };
  const historial = [
    { fecha: "2026-09-20", series: [
      { numeroSerie: 1, kg: 70, reps: 11, rir: 2 },
      { numeroSerie: 2, kg: 70, reps: 10, rir: 2 },
    ] },
    { fecha: "2026-09-14", series: [
      { numeroSerie: 1, kg: 70, reps: 10, rir: 2 },
      { numeroSerie: 2, kg: 70, reps: 9, rir: 2 },
    ] },
  ];
  const v = progresion.veredicto(ejercicio, historial);
  assert.equal(v.id, "manten");
  assert.match(v.motivo, /19 → 21/);
  assert.match(v.motivo, /22 totales o más/);
});

test("el reto de hoy sale de la última sesión", () => {
  const ejercicio = { repMin: 8, repMax: 12, rir: "2" };

  // Con margen: batir el total.
  assert.match(
    progresion.objetivoDeHoy(ejercicio, [
      { numeroSerie: 1, kg: 70, reps: 10, rir: 2 },
      { numeroSerie: 2, kg: 70, reps: 9, rir: 2 },
    ]),
    /70 kg · batir 19 reps/,
  );

  // Techo con RIR correcto: subir.
  assert.match(
    progresion.objetivoDeHoy(ejercicio, [
      { numeroSerie: 1, kg: 70, reps: 12, rir: 2 },
      { numeroSerie: 2, kg: 70, reps: 12, rir: 1 },
    ]),
    /SUBE el mínimo desde 70 kg/,
  );

  // Techo al fallo: repetir con RIR objetivo.
  assert.match(
    progresion.objetivoDeHoy(ejercicio, [
      { numeroSerie: 1, kg: 70, reps: 12, rir: 0 },
    ]),
    /repite 70 kg/,
  );

  // Sin historial: nada que batir todavía.
  assert.equal(progresion.objetivoDeHoy(ejercicio, []), null);
});

test("atascado con RIR 3+ no es meseta: pide esfuerzo, no más peso", () => {
  // Cinco sesiones idénticas pero yendo sobrado: el consejo correcto es meter
  // la rep que ya está en el tanque, nunca subir carga para esconderlo.
  const ejercicio = { repMin: 8, repMax: 12, rir: "2" };
  const sesion = (fecha) => ({
    fecha,
    series: [
      { numeroSerie: 1, kg: 70, reps: 10, rir: 3 },
      { numeroSerie: 2, kg: 70, reps: 10, rir: 4 },
    ],
  });
  const historial = ["2026-09-20", "2026-09-14", "2026-09-08", "2026-09-02", "2026-08-27"]
    .map(sesion);

  const v = progresion.veredicto(ejercicio, historial);
  assert.equal(v.id, "llena");
  assert.match(v.motivo, /RIR 3\+/);
  assert.match(v.motivo, /No subas peso/i);
});

test("cinco sesiones de meseta real escalan a cambiar el estímulo", () => {
  const ejercicio = { repMin: 8, repMax: 12, rir: "2" };
  const sesion = (fecha) => ({
    fecha,
    series: [
      { numeroSerie: 1, kg: 70, reps: 10, rir: 2 },
      { numeroSerie: 2, kg: 70, reps: 10, rir: 1 },
    ],
  });
  const historial = ["2026-09-20", "2026-09-14", "2026-09-08", "2026-09-02", "2026-08-27", "2026-08-21"]
    .map(sesion);

  const v = progresion.veredicto(ejercicio, historial);
  assert.equal(v.id, "revisar");
  assert.match(v.motivo, /cambiar el estímulo/i);
  assert.match(v.motivo, /microcarga/i);
});

test("el reto del día detecta que fuiste sobrado", () => {
  const ejercicio = { repMin: 8, repMax: 12, rir: "2" };
  assert.match(
    progresion.objetivoDeHoy(ejercicio, [
      { numeroSerie: 1, kg: 70, reps: 10, rir: 3 },
      { numeroSerie: 2, kg: 70, reps: 10, rir: 4 },
    ]),
    /sobrado \(RIR 3\+\): suma reps/,
  );
});
