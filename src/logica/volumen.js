/*
 * Volumen por músculo (§12) y adherencia (§19).
 *
 * Las dos cosas cambian de raíz respecto a la v1, y por el mismo motivo: con
 * un calendario flexible, cortar por semanas de lunes a domingo miente. Dos
 * sesiones en domingo y lunes salían como "una semana floja y otra cargada"
 * cuando en realidad fueron dos días seguidos (prueba §42).
 *
 * Aquí se mide en VENTANAS MÓVILES y en últimos N entrenamientos.
 */

import { diasEntre, hoyISO } from "./fechas.js";

/**
 * Series por músculo en los últimos `dias` días.
 *
 * `sesiones` son las sesiones de fuerza registradas, `series` todas las series
 * y `ejercicios` el catálogo (para saber qué músculo toca cada uno).
 */
export function volumenPorMusculo(sesiones, series, ejercicios, dias = 7, hasta = hoyISO()) {
  const dentro = new Set(
    sesiones.filter((s) => enVentana(s.fecha, dias, hasta)).map((s) => s.id),
  );
  return contar(series.filter((s) => dentro.has(s.sesionId)), ejercicios);
}

/** Lo mismo pero sobre los últimos `n` entrenamientos, sin mirar fechas. */
export function volumenUltimasSesiones(sesiones, series, ejercicios, n = 4) {
  const ultimas = new Set(
    [...sesiones].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, n).map((s) => s.id),
  );
  return contar(series.filter((s) => ultimas.has(s.sesionId)), ejercicios);
}

function contar(series, ejercicios) {
  const musculoDe = new Map(ejercicios.map((e) => [e.id, e.musculos ?? []]));
  const total = new Map();

  for (const serie of series) {
    for (const musculo of musculoDe.get(serie.ejercicioId) ?? []) {
      total.set(musculo, (total.get(musculo) ?? 0) + 1);
    }
  }

  return [...total.entries()]
    .map(([musculo, series]) => ({ musculo, series }))
    .sort((a, b) => b.series - a.series);
}

function enVentana(fecha, dias, hasta) {
  const d = diasEntre(fecha, hasta);
  return d >= 0 && d < dias;
}

/* ------------------------------------------------------------------ */
/* Adherencia (§19)                                                    */
/* ------------------------------------------------------------------ */

/*
 * NO se mide "¿hiciste Pierna A el miércoles?". Se mide qué has hecho de
 * verdad en una ventana móvil. Una sesión sugerida el miércoles y hecha el
 * jueves cuenta como hecha, y punto: no es "miércoles fallado + jueves extra"
 * (prueba §42).
 */

/** Sesiones de fuerza en los últimos 7 días. El objetivo son ~3 (§38). */
export function adherenciaFuerza(sesiones, dias = 7, objetivo = 3) {
  const hechas = sesiones.filter((s) => enVentana(s.fecha, dias, hoyISO())).length;
  return { hechas, objetivo, dias };
}

/** Sesiones completadas del bloque de running actual. */
export function adherenciaCarrera(estadoCarrera, totalSesiones) {
  return { hechas: (estadoCarrera?.sesion ?? 1) - 1, objetivo: totalSesiones };
}

/** Días con la rutina postural completa en la ventana. */
export function adherenciaPostura(dias7, ventana = 7) {
  const hechos = dias7.filter((d) => d.completada && enVentana(d.fecha, ventana, hoyISO())).length;
  return { hechas: hechos, objetivo: ventana, dias: ventana };
}

/**
 * Consistencia para el mapa de calor (§19): acciones REALES por día, no citas
 * incumplidas. Un día sin nada es un día en blanco, no un día en rojo.
 */
export function consistencia(fechas, sesiones, carreras, postura) {
  const conFuerza = new Set(sesiones.map((s) => s.fecha));
  const conCarrera = new Set(carreras.map((c) => c.fecha));
  const conPostura = new Set(postura.filter((p) => p.completada).map((p) => p.fecha));

  return fechas.map((fecha) => ({
    fecha,
    fuerza: conFuerza.has(fecha),
    carrera: conCarrera.has(fecha),
    postura: conPostura.has(fecha),
    // 0–3 acciones. Cero no es un fallo: es un día de descanso.
    acciones:
      (conFuerza.has(fecha) ? 1 : 0) +
      (conCarrera.has(fecha) ? 1 : 0) +
      (conPostura.has(fecha) ? 1 : 0),
  }));
}
