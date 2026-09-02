/*
 * El motor que APRENDE cuánto gasta Jose de verdad (§19, §41–§44 del v3).
 *
 * Aquí está la idea que sostiene todo el año: no hay ninguna fórmula que sepa
 * tu gasto. Mifflin-St Jeor da ~1.940 de metabolismo basal y una estimación de
 * TDEE de ~2.850–3.000, pero eso es un punto de partida, no una verdad. Lo que
 * sí se puede saber es esto:
 *
 *     si comes X y tu peso medio baja Y kg por semana,
 *     entonces gastabas aproximadamente X + (Y × 7.700 / 7)
 *
 * Ese número (el TDEE DEDUCIDO) vale mucho más que cualquier fórmula, pero
 * solo si los datos son limpios. Por eso hay tantos filtros: los 0,55 kg de
 * una semana no son 550 g de grasa exactos — hay agua, glucógeno, sodio,
 * inflamación y contenido intestinal metidos ahí. Con 4 días el número es
 * basura; con 3 semanas y adherencia alta empieza a ser útil.
 *
 * Todo trabaja sobre "registros": una fila por día en orden cronológico con
 * `weightKg`, `kcal` y `steps`. Los huecos se dejan como null a propósito —
 * `avgField` los ignora— para que un día sin báscula no desplace la ventana
 * de 7 días y convierta una media de la semana pasada en la de esta.
 */

import { NUTRICION_CFG } from "../datos/planNutricion.js";
import { hoyISO, sumarDias } from "./fechas.js";

/* ------------------------------------------------------------------ */
/* Utilidades sobre ventanas (§41)                                     */
/* ------------------------------------------------------------------ */

export function media(valores) {
  if (!valores.length) return null;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

/** Los `n` registros que terminan `desplazamiento` días antes del final. */
export function ultimosN(registros, n, desplazamiento = 0) {
  const fin = registros.length - desplazamiento;
  const inicio = Math.max(0, fin - n);
  return registros.slice(Math.max(0, inicio), Math.max(0, fin));
}

export function mediaCampo(registros, campo) {
  return media(registros.map((r) => r[campo]).filter((v) => Number.isFinite(v)));
}

export function media7(registros, campo, desplazamiento = 0) {
  return mediaCampo(ultimosN(registros, 7, desplazamiento), campo);
}

/**
 * La tendencia del peso en kg/semana: media de los últimos 7 días contra la de
 * los 7 anteriores. Negativa = bajando.
 *
 * Hacen falta 14 días de ventana. Con menos, null: es mejor no decir nada que
 * decir una cifra que el ruido de la báscula puede inventar entera.
 */
export function tendenciaSemanal(registros) {
  if (registros.length < 14) return null;
  const actual = media7(registros, "weightKg", 0);
  const anterior = media7(registros, "weightKg", 7);
  if (actual == null || anterior == null) return null;
  return actual - anterior;
}

/** La tendencia mensual en kg/mes: media de 7 días contra la de hace 4 semanas. */
export function tendenciaMensual(registros) {
  if (registros.length < 28) return null;
  const actual = media7(registros, "weightKg", 0);
  const anterior = media7(registros, "weightKg", 28);
  if (actual == null || anterior == null) return null;
  return actual - anterior;
}

/* ------------------------------------------------------------------ */
/* Adherencia y pasos (§17, §42)                                       */
/* ------------------------------------------------------------------ */

/**
 * Qué porcentaje de días has comido cerca del objetivo (±150 kcal).
 *
 * No mide virtud, mide si los datos SIRVEN. Si comes 2.400 siete días, 3.000
 * tres días y cuatro no sabes cuánto, es imposible juzgar si 2.400 funciona:
 * lo que falla no es el plan, es la medición. Por eso con adherencia baja
 * FORJA revisa el registro antes de tocar una sola caloría.
 *
 * Los días sin kcal apuntadas cuentan como no adherentes: si no se supieran,
 * bastaría con dejar de apuntar los días malos para tener un 100 %.
 */
export function adherencia(registros, kcalObjetivo, dias = 14) {
  const muestra = ultimosN(registros, dias);
  // Sin una sola kcal apuntada no hay nada que medir. Devolver 0 % aquí sería
  // enseñarle un suspenso a alguien que todavía no ha empezado a apuntar.
  if (!muestra.some((r) => Number.isFinite(r.kcal))) return null;
  const validos = muestra.filter(
    (r) =>
      Number.isFinite(r.kcal) &&
      Math.abs(r.kcal - kcalObjetivo) <= NUTRICION_CFG.adherencia.toleranciaKcal,
  ).length;
  return validos / muestra.length;
}

/** ¿Te has movido esta semana parecido a la anterior? (±20 %). */
export function pasosComparables(registros) {
  const actual = media7(registros, "steps", 0);
  const anterior = media7(registros, "steps", 7);
  if (!actual || !anterior) return false;
  return Math.abs(actual - anterior) / anterior <= NUTRICION_CFG.tdee.varianzaPasosMax;
}

/* ------------------------------------------------------------------ */
/* TDEE deducido (§43, §44)                                            */
/* ------------------------------------------------------------------ */

/**
 * El gasto que encaja con lo que has comido y cómo se ha movido tu peso.
 *
 * Test obligatorio del plan: 2.400 kcal con −0,55 kg/semana → 3.005 kcal.
 */
export function tdeeDeducido(registros) {
  if (registros.length < 21) return null;

  const tendencia = tendenciaSemanal(registros);
  if (tendencia == null) return null;

  const kcalMedias = mediaCampo(ultimosN(registros, 14), "kcal");
  if (kcalMedias == null) return null;

  return Math.round(kcalMedias - (tendencia * NUTRICION_CFG.kcalPorKg) / 7);
}

/**
 * ¿Se puede fiar uno del número? Cuatro condiciones, y las cuatro son
 * necesarias: días suficientes, tiempo desde el último cambio de kcal,
 * adherencia y pasos comparables.
 */
export function tdeeUtilizable(registros, kcalObjetivo, diasDesdeCambio) {
  if (registros.length < NUTRICION_CFG.tdee.diasMinimos) return false;
  if (diasDesdeCambio != null && diasDesdeCambio < NUTRICION_CFG.tdee.diasMinimosTrasCambio) return false;
  const a = adherencia(registros, kcalObjetivo, 14);
  if (a == null || a < NUTRICION_CFG.adherencia.min) return false;
  return pasosComparables(registros);
}

/**
 * El estado del gasto para pintarlo con su etiqueta honesta (§37).
 *
 *   CONFIRMADO — el mantenimiento medido y validado en la fase de mantenimiento.
 *   DEDUCIDO   — sale de tus datos reales y cumple los filtros.
 *   ESTIMADO   — todavía una hipótesis de partida.
 *
 * `historico` son las últimas deducciones válidas; se devuelve la media
 * suavizada porque una sola semana rara movería el número entero.
 */
export const TDEE_ESTIMADO_INICIAL = { medio: 2900, min: 2850, max: 3000, bmr: 1940 };

export function estadoTdee({ registros = [], kcalObjetivo, diasDesdeCambio, ajustes = {} }) {
  if (ajustes.mantenimientoConfirmado != null) {
    return {
      valor: ajustes.mantenimientoConfirmado,
      etiqueta: "CONFIRMADO",
      confianza: ajustes.confianzaMantenimiento ?? "high",
    };
  }

  if (tdeeUtilizable(registros, kcalObjetivo, diasDesdeCambio)) {
    const ahora = tdeeDeducido(registros);
    const historico = [...(ajustes.tdeeHistorico ?? []), ahora].filter(Number.isFinite).slice(-4);
    return {
      valor: Math.round(media(historico) / 10) * 10,
      etiqueta: "DEDUCIDO",
      ultimo: ahora,
      muestras: historico.length,
    };
  }

  return {
    valor: ajustes.tdeeDeducido ?? TDEE_ESTIMADO_INICIAL.medio,
    etiqueta: ajustes.tdeeDeducido != null ? "DEDUCIDO" : "ESTIMADO",
    rango: ajustes.tdeeDeducido != null ? null : [TDEE_ESTIMADO_INICIAL.min, TDEE_ESTIMADO_INICIAL.max],
    motivo: motivoNoDeducible(registros, kcalObjetivo, diasDesdeCambio),
  };
}

/** Por qué todavía no se puede deducir el gasto, en una frase. */
function motivoNoDeducible(registros, kcalObjetivo, diasDesdeCambio) {
  if (registros.length < NUTRICION_CFG.tdee.diasMinimos) {
    return `Faltan días: hacen falta ${NUTRICION_CFG.tdee.diasMinimos} y llevas ${registros.length}.`;
  }
  if (diasDesdeCambio != null && diasDesdeCambio < NUTRICION_CFG.tdee.diasMinimosTrasCambio) {
    return `Solo ${diasDesdeCambio} días desde el último cambio de calorías; hacen falta 21.`;
  }
  const a = adherencia(registros, kcalObjetivo, 14);
  if (a == null || a < NUTRICION_CFG.adherencia.min) {
    return a == null
      ? "Faltan kcal apuntadas para medir la adherencia."
      : `Adherencia del ${Math.round(a * 100)} %: por debajo del 85 % los datos no sirven para deducir el gasto.`;
  }
  if (!pasosComparables(registros)) {
    return "Los pasos de esta semana y la anterior son demasiado distintos: la actividad cambió.";
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Construcción de los registros                                       */
/* ------------------------------------------------------------------ */

/**
 * Una fila por día, en orden, desde `desde` hasta `hasta`, cruzando báscula y
 * diario. Los días sin dato quedan con null y las medias los ignoran.
 */
export function registrosDiarios({ pesos = [], diario = [], desde, hasta = hoyISO() }) {
  const porFechaPeso = new Map(pesos.map((p) => [p.fecha, p.kg]));
  const porFechaDiario = new Map(diario.map((d) => [d.fecha, d]));

  const filas = [];
  let iso = desde;
  while (iso <= hasta) {
    const d = porFechaDiario.get(iso) ?? {};
    filas.push({
      fecha: iso,
      weightKg: porFechaPeso.get(iso) ?? null,
      kcal: Number.isFinite(d.kcal) ? d.kcal : null,
      proteinaG: Number.isFinite(d.p) ? d.p : null,
      steps: Number.isFinite(d.pasos) ? d.pasos : null,
    });
    iso = sumarDias(iso, 1);
  }
  return filas;
}

/* ------------------------------------------------------------------ */
/* Balance semanal y comidas libres (§35, §53)                         */
/* ------------------------------------------------------------------ */

/**
 * Cuánto llevas por encima o por debajo del objetivo ESTA semana.
 *
 * No existe la comida gratis, pero tampoco el castigo: si un sábado comes 600
 * de más, las opciones honestas son aceptarlo (esa semana pierdes algo menos)
 * o repartir el ajuste en varios días. Nunca ayunar al día siguiente ni fingir
 * que esas calorías no existieron.
 */
export function balanceSemanal(registros, kcalObjetivo, dias = 7) {
  const muestra = ultimosN(registros, dias).filter((r) => Number.isFinite(r.kcal));
  if (!muestra.length) return null;

  const consumido = muestra.reduce((t, r) => t + r.kcal, 0);
  const objetivo = kcalObjetivo * muestra.length;
  const diferencia = consumido - objetivo;

  return {
    dias: muestra.length,
    consumido,
    objetivo,
    diferencia,
    // El reparto suave que sugiere el plan: nunca de golpe.
    repartoSugerido: Math.abs(diferencia) < 200 ? null : Math.round(diferencia / 6 / 10) * 10,
  };
}
