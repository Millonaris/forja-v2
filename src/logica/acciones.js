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
/* Agenda (§27)                                                        */
/* ------------------------------------------------------------------ */

/*
 * La agenda propone; esto guarda lo que TÚ decides. Un evento fijado a mano
 * pisa a la sugerencia de ese día y se marca como "programado" (§56), que se
 * dibuja distinto de lo que solo sugiere la app.
 *
 * Nada de esto toca el registro ni los motores: mover una sesión en la agenda
 * no adelanta la rotación ni el bloque de carrera (§30).
 */

export async function fijarEnAgenda({ fecha, tipo, titulo }) {
  const previo = await db.agenda.where("fecha").equals(fecha).filter((e) => e.tipo === tipo).first();
  if (previo) {
    await db.agenda.update(previo.id, { titulo, estado: "programado" });
    return previo.id;
  }
  return db.agenda.add({ fecha, tipo, titulo, estado: "programado" });
}

/** Mueve un evento fijado a otro día. */
export async function moverEnAgenda(id, fecha) {
  await db.agenda.update(id, { fecha });
}

/** Quita un evento fijado: el día vuelve a lo que sugiera la app. */
export async function quitarDeAgenda(id) {
  await db.agenda.delete(id);
}

/** Marca un evento como omitido a mano. Gris, nunca rojo (§56). */
export async function omitirEnAgenda(id) {
  await db.agenda.update(id, { estado: "omitido" });
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

/**
 * Cintura del día (§18).
 *
 * Se guarda con la fecha REAL, no con la sugerida por el protocolo: si la
 * medición del 26 se hace el 27, vale igual (§57).
 */
export async function guardarMedicion({ cintura, notas } = {}, fecha = hoyISO()) {
  const previa = (await db.mediciones.get(fecha)) ?? { fecha };
  await db.mediciones.put({
    ...previa,
    cintura: cintura ?? previa.cintura ?? null,
    notas: notas ?? previa.notas ?? "",
  });
}

export async function borrarMedicion(fecha) {
  await db.mediciones.delete(fecha);
}

/**
 * Foto de progreso. La imagen entra ya comprimida (utiles/imagenes.js) y se
 * guarda como Blob dentro de IndexedDB: nunca sale del móvil.
 */
export async function guardarFoto(imagen, { fecha = hoyISO(), pose = "frente", notas = "" } = {}) {
  return db.fotos.add({ fecha, pose, notas, imagen, bytes: imagen.size });
}

export async function borrarFoto(id) {
  await db.fotos.delete(id);
}

/** Test de la pared (§26): cada 6 semanas, la única medida objetiva de postura. */
export async function guardarTestPared({ resultado, notas } = {}, fecha = hoyISO()) {
  await db.testsPared.put({ fecha, resultado, notas: notas ?? "" });
}

export async function borrarTestPared(fecha) {
  await db.testsPared.delete(fecha);
}

/** Nota libre del día (§52). */
export async function guardarNota(texto, fecha = hoyISO()) {
  const previa = (await db.diario.get(fecha)) ?? { fecha };
  if (!texto?.trim()) {
    // Una nota vacía se borra en vez de dejar una fila fantasma en el diario.
    if (previa.id != null || previa.nota) await db.diario.delete(fecha);
    return;
  }
  await db.diario.put({ ...previa, nota: texto.trim() });
}

/* ------------------------------------------------------------------ */
/* Corregir el pasado (§52)                                            */
/* ------------------------------------------------------------------ */

/*
 * Un 800 en vez de un 80 envenena la progresión y la referencia de "anterior"
 * para siempre. Poder corregirlo es lo que permite fiarte de tus propios datos.
 * La corrección queda marcada para no confundirla con el registro original.
 */

export async function corregirSerie(serieId, datos) {
  await db.series.update(serieId, { ...datos, ajusteManual: true });
}

export async function borrarSerieId(serieId) {
  await db.series.delete(serieId);
}

/** Borra una sesión pasada entera, con sus series. */
export async function borrarSesion(sesionId) {
  await db.series.where("sesionId").equals(sesionId).delete();
  await db.sesionesFuerza.delete(sesionId);
}

/* ------------------------------------------------------------------ */
/* Recetario                                                           */
/* ------------------------------------------------------------------ */

/*
 * Las recetas son ideas de comidas, no registro: apuntarlas o borrarlas no
 * toca ninguna kcal ni ningún motor. Lo comido de verdad sigue en Fitia.
 */

/** Guarda una receta nueva o actualiza una existente (si trae id). */
export async function guardarReceta({ id, nombre, tipo, ingredientes, pasos } = {}) {
  const fila = {
    nombre: (nombre ?? "").trim(),
    tipo: tipo ?? "comida",
    ingredientes: (ingredientes ?? "").trim(),
    pasos: (pasos ?? "").trim(),
  };
  if (!fila.nombre) return null;

  if (id != null) {
    await db.recetas.update(id, fila);
    return id;
  }
  return db.recetas.add({ ...fila, creada: hoyISO() });
}

export async function borrarReceta(id) {
  await db.recetas.delete(id);
}

/* ------------------------------------------------------------------ */
/* Plan anual: mantenimiento real, revisiones y cambio de fase         */
/* ------------------------------------------------------------------ */

/** Guardar el mantenimiento real que sale del test de mantenimiento (o corregirlo). */
export async function guardarMantenimiento(kcal) {
  await db.ajustes.update(1, { mantenimientoReal: Math.round(Number(kcal)) });
}

/**
 * Cerrar la revisión mensual. `delta` es lo que se suma a las kcal (0 si la
 * decisión fue mantener). El reloj de 28 días se reinicia siempre.
 */
export async function aplicarRevision(delta = 0, fecha = hoyISO()) {
  const ajustes = await db.ajustes.get(1);
  await db.ajustes.update(1, {
    ajusteKcal: (ajustes?.ajusteKcal ?? 0) + Math.round(Number(delta) || 0),
    ultimaRevision: fecha,
  });
}

/**
 * Confirmar una fase manual del plan anual (mantenimiento, ganancia limpia,
 * cut de primavera, verano). La regla maestra manda: sus kcal parten del
 * mantenimiento real DE ESE MOMENTO, no del de hace medio año, así que se
 * guarda el que Jose confirma en el diálogo y el ajuste arranca en el punto
 * inicial de la fase (p. ej. +125 en la ganancia limpia).
 */
export async function empezarFase(faseId, { mantenimiento, ajusteInicial = 0 }, fecha = hoyISO()) {
  await db.ajustes.update(1, {
    faseManual: faseId,
    faseManualDesde: fecha,
    mantenimientoReal: Math.round(Number(mantenimiento)),
    ajusteKcal: Math.round(Number(ajusteInicial) || 0),
    // El reloj de revisiones empieza de cero con la fase nueva.
    ultimaRevision: fecha,
  });
}

/** Deshacer la fase manual y volver al plan por fechas (la definición). */
export async function quitarFaseManual() {
  await db.ajustes.update(1, { faseManual: null, faseManualDesde: null, ajusteKcal: 0 });
}
