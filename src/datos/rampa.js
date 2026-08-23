/*
 * Rampa de vuelta (§10 de la spec).
 *
 * NO existe una rutina "light" aparte. La rutina base es siempre la misma y la
 * app le pone encima una capa temporal que recorta series y sube el RIR. Así
 * no hay dos versiones de Torso A que mantener, y al terminar la rampa no hay
 * que "cambiar de plan": simplemente deja de aplicarse.
 *
 * Esto sí depende de la fecha, como la nutrición.
 */

import { seriesObjetivo } from "./rutinas.js";

export const TRAMOS = [
  {
    id: "rampa-1",
    desde: "2026-08-26",
    hasta: "2026-09-01",
    // ~75–80 % de las series.
    proporcion: 0.78,
    rir: "3",
    etiqueta: "Rampa de vuelta",
  },
  {
    id: "rampa-2",
    desde: "2026-09-02",
    hasta: "2026-09-08",
    // ~90–100 %.
    proporcion: 0.95,
    rir: "2",
    etiqueta: "Rampa de vuelta",
  },
];

/** El tramo de rampa activo en una fecha, o null si ya se entrena al 100 %. */
export function rampaDe(iso) {
  return TRAMOS.find((t) => iso >= t.desde && iso <= t.hasta) || null;
}

/**
 * Las series que tocan hoy en un ejercicio.
 *
 * Se redondea hacia arriba y nunca baja de 1: recortar un 2×12 a cero series
 * sería borrar el ejercicio, que no es lo que pide una rampa.
 */
export function seriesDeHoy(ejercicio, iso, opciones) {
  const base = seriesObjetivo(ejercicio, opciones);
  const tramo = rampaDe(iso);
  if (!tramo) return base;
  return Math.max(1, Math.round(base * tramo.proporcion));
}

/** El RIR objetivo del día: el de la rampa si la hay, el del plan si no. */
export function rirDeHoy(iso) {
  return rampaDe(iso)?.rir ?? "1–2";
}
