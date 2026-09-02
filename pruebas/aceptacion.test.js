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
  ADAPTACION, BLOQUES_CUT, INICIO_CUT, NUTRICION_CFG, OBJETIVO_INICIAL, VARIANTES_CUT,
  bloqueDe, enAdaptacion, faseDe, kcalDe, macrosDesdeKcal, objetivosDe, porQueDe,
} from "../src/datos/planNutricion.js";
import { TEMPORADAS, estadoTemporada } from "../src/datos/planAnual.js";
import {
  adherencia, balanceSemanal, estadoTdee, registrosDiarios,
  tdeeDeducido, tdeeUtilizable, tendenciaSemanal,
} from "../src/logica/nutricion.js";
import { proximaRevision, revisar, revisionPendiente, salidaDelCut, semaforo } from "../src/logica/revision.js";
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
/* §42 · Integración · la dieta v3                                     */
/* ------------------------------------------------------------------ */

/*
 * Con el SOURCE OF TRUTH v3 la nutrición dejó de ir por fechas. Estos casos
 * protegen justo eso: que el objetivo salga del ESTADO, que nada se mueva por
 * el calendario y que el gasto se deduzca de los datos reales.
 */

test("§42 · el objetivo sale del estado, no de la fecha ni del entrenamiento", () => {
  const arranque = objetivosDe({}, "2026-09-15");
  assert.equal(arranque.fase.id, "cut");
  assert.equal(arranque.kcal, 2400, "FORJA muestra 2.400, no 2.399");
  assert.deepEqual([arranque.p, arranque.hc, arranque.g], [185, 246, 75]);

  // El mismo estado da el mismo objetivo en cualquier día: entrenes pierna,
  // torso, corras o descanses (§12). Aquí no hay días altos ni bajos.
  for (const dia of ["2026-09-15", "2026-10-04", "2026-11-30"]) {
    assert.equal(objetivosDe({}, dia).kcal, 2400, `kcal del ${dia}`);
  }

  // Y cambiar de fase cambia proteína y grasa, no solo las kcal.
  const mant = objetivosDe({ faseNutricion: "mantenimiento", kcalObjetivo: 2750, proteinaObjetivo: 175, grasaObjetivo: 80 });
  assert.equal(mant.fase.id, "mantenimiento");
  assert.deepEqual([mant.p, mant.hc, mant.g], [175, 333, 80]);
});

test("los macros de 2.400 son los del plan y las comidas suman el total", () => {
  const o = objetivosDe({}, "2026-09-15");
  // La tabla del §11, comida por comida.
  assert.deepEqual(
    o.comidas.map((c) => [c.p, c.hc, c.g]),
    [[45, 70, 12], [55, 90, 15], [40, 40, 18], [45, 46, 30]],
  );
  assert.equal(o.comidas.reduce((t, c) => t + c.p, 0), o.p);
  assert.equal(o.comidas.reduce((t, c) => t + c.hc, 0), o.hc);
  assert.equal(o.comidas.reduce((t, c) => t + c.g, 0), o.g);
  assert.equal(kcalDe(o), o.kcalMacros, "las kcal cuadran 4/4/9");
});

test("los ajustes van a los hidratos: proteína y grasa se quedan (§46)", () => {
  const base = macrosDesdeKcal(2400, 185, 75);
  const menos = macrosDesdeKcal(2300, 185, 75);
  assert.equal(menos.p, base.p, "la proteína protege el músculo: no baja");
  assert.equal(menos.g, base.g, "la grasa ya está en su mínimo razonable");
  assert.equal(base.hc - menos.hc, 25, "las 100 kcal salen del hidrato");

  // Y las variantes escritas del §13 cuadran todas con 4/4/9.
  for (const v of VARIANTES_CUT) {
    assert.ok(Math.abs(kcalDe(v) - v.kcal) <= 1, `variante de ${v.kcal}`);
    assert.equal(v.p, 185, "la proteína es la misma en todas");
  }
  assert.ok(VARIANTES_CUT.find((v) => v.kcal === NUTRICION_CFG.cut.zonaRevisionKcal).zonaRevision);
});

test("la semana de adaptación no se evalúa y no se toca nada (§14)", () => {
  assert.equal(ADAPTACION.desde, INICIO_CUT);
  assert.equal(enAdaptacion({}, "2026-09-02"), true);
  assert.equal(enAdaptacion({}, "2026-09-08"), true);
  assert.equal(enAdaptacion({}, "2026-09-09"), false);

  // El banner cambia: durante la adaptación avisa de agua y glucógeno.
  assert.match(objetivosDe({}, "2026-09-04").banner, /ADAPTACIÓN/);
  assert.match(objetivosDe({}, "2026-09-15").banner, /DEFINICIÓN/);

  // Y en mantenimiento la adaptación son los 7 primeros días de la fase.
  const mant = { faseNutricion: "mantenimiento", faseDesde: "2026-12-01" };
  assert.equal(enAdaptacion(mant, "2026-12-05"), true);
  assert.equal(enAdaptacion(mant, "2026-12-09"), false);
});

test("los bloques del cut son un mapa, no una obligación (§15)", () => {
  assert.equal(bloqueDe("2026-09-04").id, "adaptacion");
  assert.equal(bloqueDe("2026-09-09").id, "bloque-1");
  assert.equal(bloqueDe("2026-10-05").id, "bloque-2");
  assert.equal(bloqueDe("2026-12-20"), null, "pasado el mapa, no hay bloque que inventar");
  assert.ok(BLOQUES_CUT.find((b) => b.id === "bloque-4").opcional);
  assert.ok(BLOQUES_CUT.find((b) => b.id === "adaptacion").noEvaluar);
});

/* ------------------------------------------------------------------ */
/* El motor que aprende: adherencia y TDEE deducido                    */
/* ------------------------------------------------------------------ */

/** Días seguidos con peso, kcal y pasos, para no repetir el andamiaje. */
function dias(n, { desde = "2026-09-02", peso0 = 97, kgSemana = 0, kcal = 2400, pasos = 12800 } = {}) {
  const filas = [];
  for (let i = 0; i < n; i += 1) {
    filas.push({
      fecha: sumarDias(desde, i),
      weightKg: peso0 + (kgSemana / 7) * i,
      kcal: typeof kcal === "function" ? kcal(i) : kcal,
      steps: pasos,
    });
  }
  return filas;
}

test("§43 · el test obligatorio del plan: 2.400 kcal y −0,55 kg/sem → 3.005", () => {
  assert.equal(tdeeDeducido(dias(28, { kgSemana: -0.55 })), 3005);

  // Con menos de 21 días no se inventa nada.
  assert.equal(tdeeDeducido(dias(14, { kgSemana: -0.55 })), null);

  // Y el signo funciona al revés: si el peso sube, gastabas menos.
  assert.ok(tdeeDeducido(dias(28, { kgSemana: 0.3 })) < 2400);
});

test("§44 · el TDEE deducido solo vale si los datos están limpios", () => {
  const limpios = dias(28, { kgSemana: -0.55 });
  assert.equal(tdeeUtilizable(limpios, 2400, 28), true);

  // Poco tiempo desde el último cambio de calorías: no vale.
  assert.equal(tdeeUtilizable(limpios, 2400, 10), false);

  // Adherencia baja: no vale. Aquí come 800 kcal de más media semana.
  const sucios = dias(28, { kgSemana: -0.55, kcal: (i) => (i % 2 ? 2400 : 3200) });
  assert.equal(tdeeUtilizable(sucios, 2400, 28), false);

  // La actividad cambió de golpe: tampoco.
  const otrosPasos = limpios.map((d, i) => ({ ...d, steps: i >= 21 ? 5000 : 12800 }));
  assert.equal(tdeeUtilizable(otrosPasos, 2400, 28), false);
});

test("§17 · la adherencia mide si los datos SIRVEN, no la virtud", () => {
  assert.equal(adherencia(dias(14), 2400, 14), 1);
  // ±150 kcal siguen contando como día bueno.
  assert.equal(adherencia(dias(14, { kcal: 2540 }), 2400, 14), 1);
  assert.equal(adherencia(dias(14, { kcal: 2600 }), 2400, 14), 0);

  // Un día sin apuntar cuenta como NO adherente: si no, bastaría con dejar de
  // apuntar los días malos para tener siempre un 100 %.
  const conHueco = dias(14).map((d, i) => (i === 3 ? { ...d, kcal: null } : d));
  assert.equal(adherencia(conHueco, 2400, 14), 13 / 14);

  // Pero con la ventana entera en blanco no se enseña un 0 %: no hay nada que
  // medir todavía, y un suspenso el primer día solo desanima.
  assert.equal(adherencia(dias(3, { kcal: null }), 2400, 14), null);
});

test("el gasto se enseña con su etiqueta honesta (§37)", () => {
  // Sin datos suficientes: ESTIMADO, y se dice por qué.
  const pocos = estadoTdee({ registros: dias(5), kcalObjetivo: 2400, diasDesdeCambio: 5, ajustes: {} });
  assert.equal(pocos.etiqueta, "ESTIMADO");
  assert.equal(pocos.valor, 2900);
  assert.ok(pocos.motivo.includes("Faltan días"));

  // Con datos limpios: DEDUCIDO.
  const deducido = estadoTdee({
    registros: dias(28, { kgSemana: -0.55 }),
    kcalObjetivo: 2400,
    diasDesdeCambio: 28,
    ajustes: {},
  });
  assert.equal(deducido.etiqueta, "DEDUCIDO");
  assert.equal(deducido.ultimo, 3005);

  // Con mantenimiento confirmado manda ese, por encima de todo lo demás.
  const confirmado = estadoTdee({
    registros: dias(28, { kgSemana: -0.55 }),
    kcalObjetivo: 2400,
    diasDesdeCambio: 28,
    ajustes: { mantenimientoConfirmado: 2750, confianzaMantenimiento: "high" },
  });
  assert.equal(confirmado.etiqueta, "CONFIRMADO");
  assert.equal(confirmado.valor, 2750);
});

test("los registros diarios dejan huecos en vez de desplazar las ventanas", () => {
  const registros = registrosDiarios({
    pesos: [{ fecha: "2026-09-02", kg: 96.8 }, { fecha: "2026-09-04", kg: 96.6 }],
    diario: [{ fecha: "2026-09-02", kcal: 2400, pasos: 12000 }],
    desde: "2026-09-02",
    hasta: "2026-09-05",
  });

  assert.equal(registros.length, 4, "un día es un día, aunque no haya dato");
  assert.equal(registros[1].weightKg, null, "el 3 no tiene báscula y se queda vacío");
  assert.equal(registros[0].kcal, 2400);
  assert.equal(registros[1].kcal, null);
});

/* ------------------------------------------------------------------ */
/* Las revisiones                                                      */
/* ------------------------------------------------------------------ */

test("§54 · nunca se ajusta antes de 14 días desde el último cambio", () => {
  const ajustes = { faseNutricion: "cut", faseDesde: "2026-09-02", ultimoCambioKcal: "2026-09-02", kcalObjetivo: 2400 };

  assert.equal(revisionPendiente(ajustes, "2026-09-15"), false);
  assert.equal(revisionPendiente(ajustes, "2026-09-16"), true);
  assert.equal(proximaRevision(ajustes), "2026-09-16");

  // Aunque los datos griten, dentro de la ventana la respuesta es esperar.
  const r = revisar({ registros: dias(20, { kgSemana: 0 }) }, { ...ajustes, ultimoCambioKcal: "2026-09-18" }, "2026-09-22");
  assert.equal(r.accion, "hold");
  assert.ok(r.motivo.includes("14"));
});

test("§45 · la revisión del cut aplica el algoritmo del plan", () => {
  const hoy = "2026-10-15";
  const base = { faseNutricion: "cut", faseDesde: "2026-09-02", ultimoCambioKcal: "2026-09-02", kcalObjetivo: 2400 };

  // Ritmo adecuado (0,4–0,8 kg/sem) → no se toca. "Si funciona, seguimos."
  const bien = revisar({ registros: dias(28, { kgSemana: -0.55 }) }, base, hoy);
  assert.equal(bien.accion, "hold");

  // Peso plano, cintura plana, adherencia buena y pasos comparables → −100.
  const parado = revisar(
    {
      registros: dias(28, { kgSemana: 0 }),
      mediciones: [{ fecha: "2026-09-27", cintura: 101 }, { fecha: "2026-10-14", cintura: 101 }],
    },
    base,
    hoy,
  );
  assert.equal(parado.accion, "decrease");
  assert.equal(parado.kcal, 100);

  // Lento PERO la cintura baja → hay progreso, no se toca nada.
  const lento = revisar(
    {
      registros: dias(28, { kgSemana: -0.25 }),
      mediciones: [{ fecha: "2026-09-27", cintura: 102.5 }, { fecha: "2026-10-14", cintura: 101 }],
    },
    base,
    hoy,
  );
  assert.equal(lento.accion, "hold");
  assert.ok(lento.motivo.includes("cintura"));

  // Demasiado rápido → +100.
  const rapido = revisar({ registros: dias(28, { kgSemana: -1.1 }) }, base, hoy);
  assert.equal(rapido.accion, "increase");

  // Adherencia mala → auditar el registro, NO tocar calorías.
  const sucio = revisar(
    { registros: dias(28, { kgSemana: 0, kcal: (i) => (i % 2 ? 2400 : 3200) }) },
    base,
    hoy,
  );
  assert.equal(sucio.accion, "audit");
  assert.ok(!sucio.motivo.includes("mal"), "no acusa al usuario de registrar mal");
});

test("§48 · el mantenimiento no se confirma con una sola semana", () => {
  const base = {
    faseNutricion: "mantenimiento", faseDesde: "2026-12-01",
    ultimoCambioKcal: "2026-12-01", kcalObjetivo: 2750,
  };

  // Dentro de las tres primeras semanas: adaptación, no se juzga.
  const pronto = revisar({ registros: dias(14, { desde: "2026-12-01", kcal: 2750 }) }, base, "2026-12-15");
  assert.equal(pronto.accion, "hold");

  const hoy = "2026-12-29";
  const quieto = dias(28, { desde: "2026-12-01", kgSemana: 0, kcal: 2750 });

  const confirma = revisar(
    { registros: quieto, mediciones: [{ fecha: "2026-12-13", cintura: 96 }, { fecha: "2026-12-27", cintura: 96 }] },
    base,
    hoy,
  );
  assert.equal(confirma.accion, "confirm");
  assert.equal(confirma.confianza, "high");
  assert.equal(confirma.kcal, 2750);

  // Si sigue bajando en mantenimiento, el gasto real es mayor: +100.
  const bajando = revisar({ registros: dias(28, { desde: "2026-12-01", kgSemana: -0.4, kcal: 2750 }) }, base, hoy);
  assert.equal(bajando.accion, "increase");
});

test("§50 · la ganancia se juzga por MES, y la cintura manda", () => {
  const base = {
    faseNutricion: "ganancia", faseDesde: "2027-01-05",
    ultimoCambioKcal: "2027-01-05", kcalObjetivo: 2925, cinturaInicioFase: 94,
  };
  const hoy = "2027-02-10";

  // +0,35 kg/mes con la cintura quieta y fuerza progresando: perfecto.
  const sesiones = [
    { id: 1, fecha: "2027-01-12", estado: "completada" },
    { id: 2, fecha: "2027-02-08", estado: "completada" },
  ];
  const series = [
    { sesionId: 1, ejercicioId: "e1", kg: 60, reps: 10, hecha: true },
    { sesionId: 2, ejercicioId: "e1", kg: 65, reps: 10, hecha: true },
  ];
  const bien = revisar(
    {
      registros: dias(35, { desde: "2027-01-05", kgSemana: 0.0875, peso0: 93.5, kcal: 2925 }),
      mediciones: [{ fecha: "2027-01-20", cintura: 94 }, { fecha: "2027-02-08", cintura: 94.2 }],
      sesiones,
      series,
    },
    base,
    hoy,
  );
  assert.equal(bien.accion, "hold");

  // Cintura +2 cm desde el inicio: NO es un cut, es volver a mantenimiento.
  const gorda = revisar(
    {
      registros: dias(35, { desde: "2027-01-05", kgSemana: 0.0875, peso0: 93.5, kcal: 2925 }),
      mediciones: [{ fecha: "2027-01-20", cintura: 95 }, { fecha: "2027-02-08", cintura: 96.2 }],
      sesiones,
      series,
    },
    base,
    hoy,
  );
  assert.equal(gorda.accion, "maintenanceBlock");
  assert.ok(!gorda.motivo.includes("mini-cut"));

  // Subiendo demasiado rápido: −100.
  const rapido = revisar(
    { registros: dias(35, { desde: "2027-01-05", kgSemana: 0.25, peso0: 93.5, kcal: 2925 }), sesiones, series },
    base,
    hoy,
  );
  assert.equal(rapido.accion, "decrease");
});

test("§38 · el semáforo dice 'todavía no sabemos' cuando no sabe", () => {
  const base = { faseNutricion: "cut", faseDesde: "2026-09-02", ultimoCambioKcal: "2026-09-02", kcalObjetivo: 2400 };

  assert.equal(semaforo({ registros: dias(5) }, base, "2026-09-07").estado, "amarillo");
  assert.equal(semaforo({ registros: dias(28, { kgSemana: -0.55 }) }, base, "2026-10-15").estado, "verde");

  // Poco tiempo desde el ajuste: amarillo, aunque el número sea bueno.
  const reciente = { ...base, ultimoCambioKcal: "2026-10-10" };
  assert.equal(semaforo({ registros: dias(28, { kgSemana: -0.55 }) }, reciente, "2026-10-15").estado, "amarillo");

  // Varias semanas sin bajar nada con buena adherencia: rojo.
  assert.equal(semaforo({ registros: dias(28, { kgSemana: 0 }) }, base, "2026-10-15").estado, "rojo");
});

test("§20 · la zona de 2.150 hace que FORJA pare, no que siga bajando", () => {
  const base = {
    faseNutricion: "cut", faseDesde: "2026-09-02",
    ultimoCambioKcal: "2026-10-01", kcalObjetivo: 2150,
  };
  const motivos = salidaDelCut({ registros: dias(28, { kgSemana: 0, kcal: 2150 }) }, base, "2026-10-20");
  assert.ok(motivos.some((m) => m.id === "zona-baja"));

  // Y a las ~14 semanas avisa por tiempo, sin exigir ningún peso final.
  const largo = salidaDelCut({ registros: dias(28) }, base, "2026-12-15");
  assert.ok(largo.some((m) => m.id === "tiempo"));
});

/* ------------------------------------------------------------------ */
/* Comidas libres y fases del año                                      */
/* ------------------------------------------------------------------ */

test("§35 · una comida libre ni destruye la semana ni desaparece", () => {
  // Seis días clavados y un sábado de 3.000: +600 sobre el objetivo.
  const registros = dias(7, { kcal: (i) => (i === 5 ? 3000 : 2400) });
  const b = balanceSemanal(registros, 2400);

  assert.equal(b.dias, 7);
  assert.equal(b.diferencia, 600);
  assert.equal(b.repartoSugerido, 100, "−100 kcal durante seis días, no un ayuno");
});

test("las cuatro fases del año no entran solas por fecha", () => {
  assert.equal(TEMPORADAS.length, 4);
  const t = (id) => TEMPORADAS.find((x) => x.id === id);

  // Con el estado en cut, todo lo demás es futuro por muy tarde que sea.
  assert.equal(estadoTemporada(t("cut"), "2027-06-01", { faseNutricion: "cut" }), "actual");
  assert.equal(estadoTemporada(t("ganancia"), "2027-06-01", { faseNutricion: "cut" }), "futura");

  // Confirmada la ganancia, el cut y el mantenimiento quedan atrás.
  const enGanancia = { faseNutricion: "ganancia" };
  assert.equal(estadoTemporada(t("ganancia"), "2026-12-10", enGanancia), "actual");
  assert.equal(estadoTemporada(t("cut"), "2026-12-10", enGanancia), "pasada");
  assert.equal(estadoTemporada(t("mantenimiento"), "2026-12-10", enGanancia), "pasada");
  assert.equal(estadoTemporada(t("verano"), "2026-12-10", enGanancia), "futura");

  // Y la fase por defecto, sin nada guardado, es la definición.
  assert.equal(faseDe({}).id, "cut");
  assert.equal(OBJETIVO_INICIAL.kcal, NUTRICION_CFG.cut.kcalInicio);
});

test("cada momento del plan se explica sin números absurdos", () => {
  assert.ok(porQueDe({}, "2026-09-04").includes("adaptación"));
  assert.ok(porQueDe({}, "2026-09-20").includes("0,5–0,7 %"));
  assert.ok(porQueDe({ faseNutricion: "mantenimiento", faseDesde: "2026-12-01" }, "2027-01-05").includes("CONFIRMAR"));
  assert.ok(porQueDe({ faseNutricion: "ganancia", faseDesde: "2027-01-05" }, "2027-02-01").includes("AL MES"));

  // Antes del arranque no se cuenta un "día −3" absurdo.
  assert.ok(porQueDe({}, "2026-08-20").includes("2 de septiembre"));

  // Y ninguna explicación se queda vacía ni deja un NaN suelto.
  for (const fase of ["cut", "mantenimiento", "ganancia", "verano"]) {
    const texto = porQueDe({ faseNutricion: fase, faseDesde: "2026-09-02" }, "2026-10-01");
    assert.ok(texto.length > 60, `${fase} se explica`);
    assert.ok(!texto.includes("NaN") && !texto.includes("undefined"), `${fase} sin basura`);
  }
});

test("la tendencia semanal necesita dos semanas, no dos pesadas", () => {
  assert.equal(tendenciaSemanal(dias(10, { kgSemana: -0.5 })), null);
  const t = tendenciaSemanal(dias(14, { kgSemana: -0.5 }));
  assert.ok(Math.abs(t + 0.5) < 0.01, `≈ −0,50 kg/sem, sale ${t}`);
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

test("ningún día de la definición cuenta los días en negativo", () => {
  // "Día -3 de 7" salía al mirar un día anterior al arranque del plan.
  for (let i = 0; i < 40; i += 1) {
    const dia = sumarDias(INICIO_CUT, i);
    const texto = porQueDe({}, dia);
    assert.ok(texto.length > 40, `el ${dia} se queda sin explicación`);
    assert.ok(!/-\d/.test(texto), `el ${dia} cuenta días en negativo: ${texto}`);
  }
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
