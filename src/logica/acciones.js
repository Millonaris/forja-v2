/*
 * Escrituras. Todo lo que cambia datos pasa por aquí.
 *
 * Están juntas a propósito: son las que mueven los motores de estado, y tener
 * la regla "esto avanza la rotación, esto no" repartida por las pantallas es
 * exactamente como se rompe (§30: plan y registro son distintos).
 *
 * Ninguna función de este fichero borra nada. Cerrar, omitir o corregir
 * escriben un estado nuevo; el registro real se queda.
 */

import { db, leerEstadoCarrera, leerEstadoFuerza } from "../datos/db.js";
import { hoyISO } from "./fechas.js";
import * as motorCarrera from "./motorCarrera.js";
import * as motorFuerza from "./motorFuerza.js";

/* ------------------------------------------------------------------ */
/* Peso                                                                */
/* ------------------------------------------------------------------ */

/** Apuntar el peso del día. Dos toques desde HOY (§50). */
export async function guardarPeso(kg, fecha = hoyISO()) {
  await db.pesos.put({ fecha, kg: Number(kg) });
}

/* ------------------------------------------------------------------ */
/* Carrera                                                             */
/* ------------------------------------------------------------------ */

/**
 * Marcar como hecha la carrera que toca.
 *
 * Guarda el registro real y mueve el estado del plan. Si era la última sesión
 * del bloque, NO avanza sola: devuelve `bloqueCompletado` para que la pantalla
 * pregunte qué tal fue (§14).
 *
 * `datos` admite km, minutos y nota. En una sesión CaCo no se piden (§51).
 */
export async function marcarCarreraHecha(datos = {}) {
  const estado = await leerEstadoCarrera();
  const actual = motorCarrera.siguiente(estado);
  if (!actual) return { bloqueCompletado: false };

  await db.carreras.add({
    fecha: datos.fecha ?? hoyISO(),
    bloque: actual.bloque.numero,
    sesion: actual.numeroSesion,
    tipo: actual.sesion.tipo,
    descripcion: actual.texto,
    km: datos.km ?? null,
    minutos: datos.minutos ?? null,
    notas: datos.notas ?? "",
    estado: "completada",
    // Se guarda la fecha que la app sugería, aparte de la real (§57). Sirve
    // para mirar atrás sin convertir la diferencia en un incumplimiento.
    fechaSugerida: datos.fechaSugerida ?? null,
  });

  const paso = motorCarrera.completar(estado);

  // Al cerrar el bloque, el estado se queda en la última sesión hasta que se
  // conteste si avanzar o repetir. Se marca `esperandoCierre` para que la
  // pantalla no vuelva a ofrecer esa misma sesión: sin esto, cerrar la hoja
  // sin contestar deja marcar la última carrera otra vez y se duplica.
  await db.estadoCarrera.put({
    ...paso.estado,
    id: 1,
    esperandoCierre: paso.bloqueCompletado ? paso.bloque : null,
  });

  return { bloqueCompletado: paso.bloqueCompletado, bloque: paso.bloque, sesion: actual };
}

/** Respuesta al cierre de bloque: avanzar, repetir o dejarlo para revisar. */
export async function cerrarBloqueCarrera(accion) {
  const estado = await leerEstadoCarrera();
  const limpio = { ...estado, esperandoCierre: null };

  if (accion === "avanzar") {
    await db.estadoCarrera.put({ ...motorCarrera.avanzarBloque(limpio), id: 1 });
  } else if (accion === "repetir") {
    await db.estadoCarrera.put({ ...motorCarrera.repetirBloque(limpio), id: 1 });
  } else {
    // Revisar: repite el bloque igualmente (es lo prudente si hubo molestias),
    // pero deja constancia para poder mirarlo en Progreso.
    await db.estadoCarrera.put({
      ...motorCarrera.repetirBloque(limpio),
      id: 1,
      revisar: { bloque: estado.esperandoCierre ?? estado.bloque, fecha: hoyISO() },
    });
  }
}

/** Omitir la carrera que toca, sin recuperarla pegándola a otra (§15). */
export async function omitirCarrera({ avanzar }) {
  const estado = await leerEstadoCarrera();
  const actual = motorCarrera.siguiente(estado);
  if (!actual) return;

  await db.carreras.add({
    fecha: hoyISO(),
    bloque: actual.bloque.numero,
    sesion: actual.numeroSesion,
    tipo: actual.sesion.tipo,
    descripcion: actual.texto,
    estado: "omitida",
    notas: "Omitida manualmente",
  });

  if (avanzar) {
    // Mismo tratamiento que al completar: si la omitida era la última sesión
    // del bloque, `completar` devuelve el estado SIN avanzar y toca preguntar
    // qué hacer con el bloque. Sin esto, omitir la última dejaba el estado
    // clavado y la misma sesión se ofrecía para siempre.
    const paso = motorCarrera.completar(estado);
    await db.estadoCarrera.put({
      ...paso.estado,
      id: 1,
      esperandoCierre: paso.bloqueCompletado ? paso.bloque : null,
    });
  }
}

/* ------------------------------------------------------------------ */
/* Fuerza                                                              */
/* ------------------------------------------------------------------ */

/** Abre una sesión. Queda en curso hasta que se cierra: se puede salir y volver. */
export async function empezarSesionFuerza(plantillaId, { avanzarRotacion = true } = {}) {
  const abierta = await db.sesionesFuerza.filter((s) => s.estado === "en-curso").first();
  if (abierta) return abierta.id;

  return db.sesionesFuerza.add({
    fecha: hoyISO(),
    plantillaId,
    estado: "en-curso",
    empezada: Date.now(),
    avanzarRotacion,
  });
}

/** Guarda o actualiza una serie. Se identifica por sesión, ejercicio y número. */
export async function guardarSerie(sesionId, ejercicioId, numeroSerie, datos) {
  const previa = await db.series
    .where("[ejercicioId+sesionId]")
    .equals([ejercicioId, sesionId])
    .filter((s) => s.numeroSerie === numeroSerie)
    .first();

  const fila = {
    sesionId,
    ejercicioId,
    numeroSerie,
    kg: datos.kg ?? null,
    reps: datos.reps ?? null,
    rir: datos.rir ?? null,
    hecha: datos.hecha ?? true,
  };

  if (previa) {
    await db.series.update(previa.id, fila);
    return previa.id;
  }
  return db.series.add(fila);
}

/** Desmarcar una serie: se borra la fila, porque nunca llegó a pasar. */
export async function borrarSerie(sesionId, ejercicioId, numeroSerie) {
  const previa = await db.series
    .where("[ejercicioId+sesionId]")
    .equals([ejercicioId, sesionId])
    .filter((s) => s.numeroSerie === numeroSerie)
    .first();
  if (previa) await db.series.delete(previa.id);
}

/**
 * Cierra la sesión y mueve la rotación si toca.
 *
 * Una sesión sin ninguna serie no se guarda: sería un entrenamiento fantasma
 * que ensuciaría la adherencia y el volumen.
 */
export async function terminarSesionFuerza(sesionId) {
  const sesion = await db.sesionesFuerza.get(sesionId);
  if (!sesion) return null;

  const series = await db.series.where("sesionId").equals(sesionId).toArray();
  if (!series.length) {
    await db.sesionesFuerza.delete(sesionId);
    return { vacia: true };
  }

  const duracion = sesion.empezada ? Math.round((Date.now() - sesion.empezada) / 1000) : null;
  await db.sesionesFuerza.update(sesionId, { estado: "completada", duracion });

  const estado = await leerEstadoFuerza();
  await db.estadoFuerza.put({
    ...motorFuerza.avanzar(estado, sesion.plantillaId, {
      avanzarRotacion: sesion.avanzarRotacion !== false,
    }),
    id: 1,
  });

  // `numSeries` y no `series`: el que llama compone el resumen con el ARRAY de
  // series bajo ese mismo nombre, y un número que lo pisa por orden de spread
  // es un accidente esperando a un refactor.
  return { vacia: false, sesionId, duracion, numSeries: series.length };
}

/** Descartar una sesión en curso sin dejar rastro. */
export async function descartarSesionFuerza(sesionId) {
  await db.series.where("sesionId").equals(sesionId).delete();
  await db.sesionesFuerza.delete(sesionId);
}

/** Omitir la sesión que toca (§28). Nunca se decide solo si avanza o no. */
export async function omitirFuerza({ avanzar }) {
  const estado = await leerEstadoFuerza();
  if (!avanzar) return;
  const toca = motorFuerza.siguiente(estado);
  await db.estadoFuerza.put({ ...motorFuerza.avanzar(estado, toca.id), id: 1 });
}

/* ------------------------------------------------------------------ */
/* Correcciones manuales de estado (Ajustes)                           */
/* ------------------------------------------------------------------ */

/*
 * Ajustes escribía directamente en las tablas de estado con un spread del
 * estado viejo, y eso arrastraba `esperandoCierre` y `revisar`: corregías el
 * bloque a mano y la app seguía preguntando por el cierre del bloque antiguo —
 * y al contestar, machacaba tu corrección. Una corrección manual empieza
 * siempre de un estado limpio.
 */

/** Fija a mano la siguiente rutina de la rotación. */
export async function corregirEstadoFuerza(indiceSiguiente) {
  const estado = await leerEstadoFuerza();
  await db.estadoFuerza.put({ ...estado, id: 1, indiceSiguiente });
}

/** Fija a mano el bloque de carrera, limpiando cualquier cierre pendiente. */
export async function corregirEstadoCarrera(bloque) {
  const estado = await leerEstadoCarrera();
  await db.estadoCarrera.put({
    id: 1,
    bloque,
    sesion: 1,
    bloquesRepetidos: estado.bloquesRepetidos ?? [],
    esperandoCierre: null,
  });
}

/* ------------------------------------------------------------------ */
/* Postura                                                             */
/* ------------------------------------------------------------------ */

/** Marca o desmarca un ejercicio postural del día. */
export async function alternarPostura(ejercicioId, total) {
  const fecha = hoyISO();
  const dia = (await db.postura.get(fecha)) ?? { fecha, hechos: [], completada: false };

  const hechos = dia.hechos.includes(ejercicioId)
    ? dia.hechos.filter((id) => id !== ejercicioId)
    : [...dia.hechos, ejercicioId];

  await db.postura.put({ ...dia, hechos, completada: hechos.length >= total });
}

/* ------------------------------------------------------------------ */
/* Cuerpo y diario                                                     */
/* ------------------------------------------------------------------ */

export async function guardarMedicion({ cintura, notas }, fecha = hoyISO()) {
  const previa = (await db.mediciones.get(fecha)) ?? { fecha };
  await db.mediciones.put({ ...previa, cintura: cintura ?? previa.cintura ?? null, notas });
}

export async function guardarTestPared({ resultado, notas }, fecha = hoyISO()) {
  await db.testsPared.put({ fecha, resultado, notas: notas ?? "" });
}

/** Nota libre del día (§52). */
export async function guardarNota(texto, fecha = hoyISO()) {
  const previa = (await db.diario.get(fecha)) ?? { fecha };
  await db.diario.put({ ...previa, nota: texto });
}
