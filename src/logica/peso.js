/*
 * Peso corporal (§6, §18 y §22).
 *
 * Lo que manda es la media de 7 días, nunca el número de un día suelto: el
 * peso diario sube y baja por agua, sal y hora del día, y tomar decisiones con
 * él es la forma más rápida de volverse loco.
 */

import { diasEntre, hoyISO, ultimosDias } from "./fechas.js";

/** "95,4" — coma decimal, un decimal, como se dice en voz alta. */
export function formatear(kg) {
  return kg == null ? "—" : kg.toFixed(1).replace(".", ",");
}

/** El peso de una fecha concreta. */
export function pesoDe(pesos, fecha) {
  return pesos.find((p) => p.fecha === fecha)?.kg ?? null;
}

/** ¿Falta el peso de hoy? Es la primera pregunta de la pantalla HOY. */
export function faltaHoy(pesos) {
  return pesoDe(pesos, hoyISO()) == null;
}

/**
 * Media de los últimos `dias` días con dato.
 *
 * Se promedian los registros que haya dentro de la ventana, no se exige tener
 * los 7: saltarse un día no puede dejar la app sin media.
 */
export function media(pesos, dias = 7, hasta = hoyISO()) {
  const dentro = pesos.filter((p) => {
    const d = diasEntre(p.fecha, hasta);
    return d >= 0 && d < dias;
  });
  if (!dentro.length) return null;
  return dentro.reduce((t, p) => t + p.kg, 0) / dentro.length;
}

/**
 * Cambio entre la media de esta semana y la de la anterior.
 * Negativo = bajando. En mini-cut eso es lo que se busca.
 */
export function cambioSemanal(pesos, hasta = hoyISO()) {
  const ahora = media(pesos, 7, hasta);
  const antes = media(pesos, 7, restar(hasta, 7));
  if (ahora == null || antes == null) return null;
  return ahora - antes;
}

function restar(iso, dias) {
  const [y, m, d] = iso.split("-").map(Number);
  const f = new Date(y, m - 1, d, 12);
  f.setDate(f.getDate() - dias);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}

/** Serie para la gráfica: un punto por día, con hueco donde no hay dato. */
export function serie(pesos, dias = 30) {
  const porFecha = new Map(pesos.map((p) => [p.fecha, p.kg]));
  return ultimosDias(dias).map((fecha) => ({ fecha, kg: porFecha.get(fecha) ?? null }));
}

/** Media móvil de 7 días para dibujarla encima de los puntos diarios. */
export function serieMedia(pesos, dias = 30) {
  return ultimosDias(dias).map((fecha) => ({ fecha, kg: media(pesos, 7, fecha) }));
}
