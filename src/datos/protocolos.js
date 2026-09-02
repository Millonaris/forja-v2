/*
 * Recordatorios con fecha: mediciones y fotos (§16 del v3).
 *
 * Con el plan v3 la dieta ya no tiene un calendario de kcal, pero el
 * SEGUIMIENTO sí tiene ritmo: cintura una vez por semana y fotos cada cuatro.
 * Sin esos dos datos, la mitad de las decisiones del año se quedan cojas —
 * cuando la báscula se para, la cintura es la que dice si hay progreso.
 *
 * La app los RECUERDA, no los impone. Si la medición del domingo se hace el
 * lunes, se guarda la fecha real: mismo principio que con el entrenamiento, la
 * fecha recomienda y el registro manda.
 *
 * Se GENERAN en vez de escribirse a mano: una lista fija de fechas se queda
 * corta en tres meses y hay que volver a tocarla. Estas salen solas todo el
 * año a partir del arranque del cut.
 */

import { INICIO_CUT } from "./planNutricion.js";

/** La medición de partida: el punto cero contra el que se compara todo. */
const INICIO = {
  id: "medicion-inicio",
  fecha: INICIO_CUT,
  tipo: "medicion",
  titulo: "Medición de inicio de la definición",
  instrucciones: [
    "Peso en ayunas, después del baño.",
    "Cintura a la altura del ombligo, relajado, al final de una espiración normal. Dos medidas y guarda la media.",
    "Fotos de frente, lateral y espalda, con la misma luz y el mismo sitio.",
    "Estos números son el punto cero: contra ellos se compara todo el año.",
  ],
};

/*
 * Cintura: los domingos por la mañana. Siempre el mismo día y en las mismas
 * condiciones, porque lo que importa es la DIFERENCIA, no el número.
 */
const DIA_CINTURA = 0; // domingo

/** Cada cuántos días toca tanda de fotos (§16). */
const CADA_FOTOS = 28;

const CINTURA = {
  tipo: "medicion",
  titulo: "Cintura de la semana",
  instrucciones: [
    "Por la mañana, en ayunas y después del baño.",
    "Relajado, sin meter barriga, a la altura del ombligo.",
    "Al final de una espiración normal.",
    "Dos medidas y guarda la media.",
  ],
};

const FOTOS = {
  tipo: "foto",
  titulo: "Fotos de progreso",
  instrucciones: [
    "Frente, lateral y espalda.",
    "Mismas condiciones que la última vez: misma luz, mismo sitio, misma hora.",
    "Cuando la báscula se atasca, las fotos y la cintura son las que cuentan la verdad.",
  ],
};

/** Los protocolos de una fecha. Puede haber más de uno. */
export function protocolosDe(iso) {
  if (iso < INICIO_CUT) return [];
  if (iso === INICIO_CUT) return [INICIO];

  const lista = [];
  const dias = diasEntre(INICIO_CUT, iso);

  if (diaSemana(iso) === DIA_CINTURA) lista.push({ ...CINTURA, id: `cintura-${iso}`, fecha: iso });
  if (dias > 0 && dias % CADA_FOTOS === 0) lista.push({ ...FOTOS, id: `fotos-${iso}`, fecha: iso });

  return lista;
}

/** El siguiente protocolo a partir de una fecha, para avisar con tiempo. */
export function proximoProtocolo(iso) {
  for (let i = 0; i < 40; i += 1) {
    const [p] = protocolosDe(sumar(iso, i));
    if (p) return p;
  }
  return null;
}

/*
 * Lo que se siembra en la base: solo la medición de inicio. Las recurrentes se
 * calculan al vuelo, así que guardarlas sería duplicar la fuente de verdad.
 */
export const PROTOCOLOS = [INICIO];

/* ------------------------------------------------------------------ */

function aFecha(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

function sumar(iso, dias) {
  const f = aFecha(iso);
  f.setDate(f.getDate() + dias);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}

function diasEntre(a, b) {
  return Math.round((aFecha(b) - aFecha(a)) / 86400000);
}

function diaSemana(iso) {
  return aFecha(iso).getDay();
}
