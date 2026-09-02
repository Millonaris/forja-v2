/*
 * Recordatorios con fecha.
 *
 * Queda uno solo: la medición de partida del 2 de septiembre, el punto cero
 * contra el que se compara todo el año. La app lo RECUERDA, no lo impone: si
 * se hace un día después, se guarda la fecha real.
 *
 * NO hay recordatorios recurrentes. Se probaron (cintura los domingos, fotos
 * cada cuatro semanas) y Jose los quitó: un aviso que aparece solo cada semana
 * en HOY es ruido, no ayuda. Medir cintura y hacer fotos se sigue haciendo, y
 * se apunta desde PROGRESO cuando toca.
 */

import { INICIO_CUT } from "./planNutricion.js";

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

export const PROTOCOLOS = [INICIO];

/** Los protocolos de una fecha. Puede haber más de uno. */
export function protocolosDe(iso) {
  return PROTOCOLOS.filter((p) => p.fecha === iso);
}

/** El siguiente protocolo a partir de una fecha, para avisar con tiempo. */
export function proximoProtocolo(iso) {
  return (
    PROTOCOLOS.filter((p) => p.fecha >= iso).sort((a, b) => a.fecha.localeCompare(b.fecha))[0] ??
    null
  );
}
