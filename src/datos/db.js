/*
 * FORJA 2.0 · Base de datos local (IndexedDB vía Dexie).
 *
 * Todo vive en el móvil: sin cuenta, sin servidor, sin internet (§46).
 *
 * La separación que manda el rediseño está en el esquema, no solo en la
 * pantalla (§30): el PLAN es lo que debería pasar y vive en `plantillas`,
 * `ejercicios` y `bloquesCarrera`; el REGISTRO es lo que pasó de verdad y vive
 * en `sesionesFuerza`, `series` y `carreras`; y la AGENDA es solo una
 * sugerencia movible, en `agenda`. Reprogramar toca la agenda y jamás el
 * registro.
 *
 * Fechas: siempre "YYYY-MM-DD" local (ver logica/fechas.js).
 */

import Dexie from "dexie";

export const db = new Dexie("forja2");

db.version(1).stores({
  /* --- Ajustes, fila única id = 1 --- */
  ajustes: "id",

  /* --- PLAN de fuerza --- */
  // Las cuatro rutinas. `orden` define la rotación.
  plantillas: "id, orden",
  // Ejercicios de cada rutina. Se consulta "los de esta plantilla, en orden".
  ejercicios: "id, plantillaId, [plantillaId+orden]",

  /* --- REGISTRO de fuerza --- */
  // Una fila por sesión realmente entrenada.
  sesionesFuerza: "++id, fecha, plantillaId",
  // Una fila por serie guardada. El motor de progresión pregunta siempre
  // "todas las series de ESTE ejercicio", de ahí el índice compuesto.
  series: "++id, sesionId, ejercicioId, [ejercicioId+sesionId]",
  // Posición en la rotación. Fila única id = 1. Solo la mueve completar u
  // omitir una sesión, nunca el paso de los días (§28).
  estadoFuerza: "id",

  /* --- PLAN de carrera: los 30 bloques del 0→20 km --- */
  bloquesCarrera: "numero, fase",

  /* --- REGISTRO de carrera --- */
  carreras: "++id, fecha, bloque",
  // Bloque y sesión actuales. Fila única id = 1. Avanza al completar
  // sesiones, no al cambiar de semana el calendario (§14).
  estadoCarrera: "id",

  /* --- Cuerpo --- */
  pesos: "fecha",
  mediciones: "fecha",
  fotos: "++id, fecha",

  /* --- Postura --- */
  postura: "fecha",
  testsPared: "fecha",

  /* --- Nutrición: esto SÍ va por fecha (§22) --- */
  fasesNutricion: "id, desde",
  // Días visuales, mediciones sugeridas y demás protocolos con fecha (§23, §57).
  protocolos: "id, fecha",

  /* --- Agenda: solo sugerencias, todas movibles (§27) --- */
  agenda: "++id, fecha, tipo",

  /* --- Nota libre y correcciones manuales por día (§52) --- */
  diario: "fecha",
});

/** Lee los ajustes (siempre id = 1). */
export async function leerAjustes() {
  return (await db.ajustes.get(1)) || null;
}

/** Actualiza ajustes de forma parcial. */
export async function guardarAjustes(cambios) {
  const actuales = (await db.ajustes.get(1)) || { id: 1 };
  const nuevos = { ...actuales, ...cambios, id: 1 };
  await db.ajustes.put(nuevos);
  return nuevos;
}

/** Estado de la rotación de fuerza. */
export async function leerEstadoFuerza() {
  return (await db.estadoFuerza.get(1)) || { id: 1, indiceSiguiente: 0, ultimaCompletada: null };
}

/** Estado del plan de carrera. */
export async function leerEstadoCarrera() {
  return (
    (await db.estadoCarrera.get(1)) || { id: 1, bloque: 1, sesion: 1, bloquesRepetidos: [] }
  );
}
