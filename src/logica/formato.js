/*
 * Formatos de números.
 *
 * `toLocaleString("es-ES")` deja los cuatro dígitos sin separador (1700), pero
 * el plan está escrito como 1.700 y en una app de una sola persona el número
 * tiene que verse igual en los dos sitios.
 */

const MILES = new Intl.NumberFormat("es-ES", { useGrouping: "always" });

/** 1700 → "1.700". */
export function miles(n) {
  return MILES.format(n);
}
