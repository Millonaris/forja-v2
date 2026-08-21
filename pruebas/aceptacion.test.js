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
import { faseDe, objetivosDe } from "../src/datos/planNutricion.js";
import { seriesDeHoy, rirDeHoy } from "../src/datos/rampa.js";
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
  // Mover el gimnasio del 1 al 2 de septiembre no cambia que el 2 empiece la
  // fase 2: son dos calendarios distintos a propósito.
  assert.equal(faseDe("2026-09-01").id, "minicut-fuerte");
  assert.equal(faseDe("2026-09-02").id, "minicut-moderado");
  assert.equal(faseDe("2026-09-09").id, "mantenimiento");
  assert.equal(faseDe("2026-10-30").id, "volumen", "la fase de volumen es abierta");
});

test("las macros por comida suman el total de la fase (§21)", () => {
  for (const escalon of [0, 1]) {
    const o = objetivosDe("2026-09-20", escalon);
    const suma = (k) => o.comidas.reduce((t, c) => t + c[k], 0);
    assert.equal(suma("p"), o.p, `proteína del escalón ${escalon}`);
    assert.equal(suma("hc"), o.hc, `hidratos del escalón ${escalon}`);
    assert.equal(suma("g"), o.g, `grasas del escalón ${escalon}`);
  }

  for (const fecha of ["2026-08-27", "2026-09-03", "2026-09-10"]) {
    const o = objetivosDe(fecha);
    assert.equal(o.comidas.reduce((t, c) => t + c.p, 0), o.p, `proteína el ${fecha}`);
    assert.equal(o.comidas.reduce((t, c) => t + c.hc, 0), o.hc, `hidratos el ${fecha}`);
    assert.equal(o.comidas.reduce((t, c) => t + c.g, 0), o.g, `grasas el ${fecha}`);
  }
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
