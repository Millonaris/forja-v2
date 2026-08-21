/*
 * Fechas.
 *
 * Convención de toda la app: una fecha es SIEMPRE la cadena "YYYY-MM-DD" en
 * hora local. Nunca un Date, nunca UTC, nunca un timestamp. Así se indexan y
 * se comparan como texto, y no hay sorpresas al cambiar de huso o de hora de
 * verano — que en una app de entrenamiento se traducen en sesiones que
 * aparecen el día equivocado.
 */

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** La fecha local de un Date, como "YYYY-MM-DD". */
export function aISO(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Hoy, en local. */
export function hoyISO() {
  return aISO(new Date());
}

/** Convierte "YYYY-MM-DD" en un Date a mediodía local.
 *
 * A mediodía y no a medianoche a propósito: sumar días sobre las 00:00 se
 * puede ir a la hora anterior en los cambios de horario de verano y devolver
 * el día de antes.
 */
export function aFecha(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** Suma días (o los resta, con negativo) a una fecha ISO. */
export function sumarDias(iso, dias) {
  const f = aFecha(iso);
  f.setDate(f.getDate() + dias);
  return aISO(f);
}

/** Días entre dos fechas ISO: positivo si `b` es posterior a `a`. */
export function diasEntre(a, b) {
  return Math.round((aFecha(b) - aFecha(a)) / 86400000);
}

/** Días desde una fecha hasta hoy. */
export function diasDesde(iso) {
  return iso ? diasEntre(iso, hoyISO()) : null;
}

/** "Viernes, 21 agosto" — la cabecera de HOY. */
export function fechaLarga(iso) {
  const f = aFecha(iso);
  const dia = DIAS[f.getDay()];
  return `${dia[0].toUpperCase()}${dia.slice(1)}, ${f.getDate()} ${MESES[f.getMonth()]}`;
}

/** "21 ago" — para listas e historial. */
export function fechaCorta(iso) {
  const f = aFecha(iso);
  return `${f.getDate()} ${MESES[f.getMonth()].slice(0, 3)}`;
}

/** "Lun", "Mar"… — para la agenda de 7 días. */
export function diaCorto(iso) {
  const d = DIAS[aFecha(iso).getDay()];
  return `${d[0].toUpperCase()}${d.slice(1, 3)}`;
}

/**
 * "hace 2 días" / "ayer" / "hoy". Nunca en negativo ni en tono de reproche:
 * es contexto, no una regañina (§6, §37).
 */
export function haceCuanto(iso) {
  if (!iso) return "nunca";
  const d = diasDesde(iso);
  if (d === 0) return "hoy";
  if (d === 1) return "ayer";
  if (d < 0) return `en ${-d} ${-d === 1 ? "día" : "días"}`;
  return `hace ${d} días`;
}

/** Las fechas de los últimos `n` días, de la más antigua a hoy. */
export function ultimosDias(n, desde = hoyISO()) {
  return Array.from({ length: n }, (_, i) => sumarDias(desde, i - n + 1));
}

/** ¿Cae `iso` dentro de [desde, hasta]? `hasta` puede faltar (fase abierta). */
export function dentroDe(iso, desde, hasta) {
  if (iso < desde) return false;
  return !hasta || iso <= hasta;
}
