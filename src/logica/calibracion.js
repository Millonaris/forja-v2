/*
 * Calibración del mantenimiento real (fase 2 del plan maestro, 9–22 sep).
 *
 * El protocolo del plan, en números: 14 días comiendo 2.600 kcal planas y
 * pesándose cada mañana. Se compara la media de los días 1–7 con la de los
 * 8–14. Como los centros de las dos ventanas están a una semana, la
 * diferencia de medias ES la velocidad en kg/semana, sin más cuentas.
 *
 * De ahí sale el mantenimiento: 1 kg de tejido son ~7.700 kcal, así que
 * kg/semana × 7.700 ÷ 7 es el superávit (o déficit) DIARIO que había sobre
 * las 2.600. Mantenimiento real ≈ 2.600 − ese exceso, redondeado a 50.
 *
 * El ajuste se limita a ±250 kcal a propósito: tras un mini-cut la primera
 * semana arrastra rebote de glucógeno y agua, y una corrección mayor que eso
 * casi seguro está midiendo agua, no comida. El plan lo dice igual: "no
 * necesitamos precisión de 20 kcal, necesitamos un valor suficientemente
 * bueno para tomar decisiones".
 */

import { MANTENIMIENTO_HIPOTESIS } from "../datos/planNutricion.js";
import { diasEntre, hoyISO, sumarDias } from "./fechas.js";

export const CALIBRACION = {
  desde: "2026-09-09",
  hasta: "2026-09-22",
  kcal: MANTENIMIENTO_HIPOTESIS,
  // Con menos de 4 pesajes por semana la media deja de ser fiable.
  minPesajes: 4,
};

const KCAL_POR_KG = 7700;
const TOPE_AJUSTE = 250;

/** Media de los pesos registrados dentro de un rango de fechas, o null. */
function media(pesos, desde, hasta) {
  const kgs = pesos.filter((p) => p.fecha >= desde && p.fecha <= hasta && p.kg != null).map((p) => p.kg);
  if (!kgs.length) return null;
  return kgs.reduce((t, k) => t + k, 0) / kgs.length;
}

function contar(pesos, desde, hasta) {
  return pesos.filter((p) => p.fecha >= desde && p.fecha <= hasta && p.kg != null).length;
}

/**
 * El estado completo de la calibración para pintar la tarjeta.
 *
 * Fases: "antes" (aún no toca), "en-curso" (registrando), "lista" (hay
 * veredicto que guardar), "incompleta" (acabó pero faltan pesajes),
 * "guardada" (el mantenimiento ya está en ajustes).
 */
export function estadoCalibracion(pesos = [], ajustes = {}, hoy = hoyISO()) {
  if (ajustes.mantenimientoReal != null) {
    return { fase: "guardada", mantenimiento: ajustes.mantenimientoReal };
  }
  if (hoy < CALIBRACION.desde) return { fase: "antes" };

  const finSemana1 = sumarDias(CALIBRACION.desde, 6);
  const semana1 = { desde: CALIBRACION.desde, hasta: finSemana1 };
  const semana2 = { desde: sumarDias(CALIBRACION.desde, 7), hasta: CALIBRACION.hasta };

  const dias1 = contar(pesos, semana1.desde, semana1.hasta);
  const dias2 = contar(pesos, semana2.desde, semana2.hasta);
  const media1 = media(pesos, semana1.desde, semana1.hasta);
  const media2 = media(pesos, semana2.desde, semana2.hasta);

  const base = { dias1, dias2, media1, media2, dia: diasEntre(CALIBRACION.desde, hoy) + 1 };

  if (hoy <= CALIBRACION.hasta) {
    return { fase: "en-curso", ...base };
  }

  if (dias1 < CALIBRACION.minPesajes || dias2 < CALIBRACION.minPesajes) {
    // Sin datos suficientes el número no es fiable: se ofrece la hipótesis.
    return { fase: "incompleta", ...base, mantenimiento: CALIBRACION.kcal };
  }

  const porSemana = media2 - media1;
  const excesoDiario = (porSemana * KCAL_POR_KG) / 7;
  const ajuste = Math.max(-TOPE_AJUSTE, Math.min(TOPE_AJUSTE, Math.round(excesoDiario / 50) * 50));

  return {
    fase: "lista",
    ...base,
    porSemana,
    ajuste,
    recortado: Math.abs(Math.round(excesoDiario / 50) * 50) > TOPE_AJUSTE,
    mantenimiento: CALIBRACION.kcal - ajuste,
  };
}
