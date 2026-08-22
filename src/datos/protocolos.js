/*
 * Protocolos con fecha: mediciones, fotos y días visuales (§23 y §57).
 *
 * La app los RECUERDA, no los impone. Si la medición del 26 se hace el 27, se
 * guarda la fecha real y se conserva aparte la sugerida (§57). Mismo principio
 * que con el entrenamiento: la fecha recomienda, el registro manda.
 *
 * El detalle de comidas de los días de recarga y visual NO está aquí: vive en
 * `planNutricion.js`, que es la fuente de verdad de todo lo que se come.
 */

export const PROTOCOLOS = [
  {
    id: "med-26-ago",
    fecha: "2026-08-26",
    tipo: "medicion",
    titulo: "Medición de inicio",
    instrucciones: ["Peso en ayunas", "Cintura", "Foto de perfil"],
  },
  {
    id: "visual-29-ago",
    fecha: "2026-08-29",
    tipo: "dia-visual",
    titulo: "Día visual 1",
    instrucciones: [
      "Se mantienen las 1.700 kcal: no se toca nada.",
      "Agua y sal normales.",
      "Evitar los alimentos que a ti te hinchan.",
      "Es un ensayo del día 4, no el día importante.",
    ],
  },
  {
    id: "med-29-ago",
    fecha: "2026-08-29",
    tipo: "medicion",
    titulo: "Control de cintura",
    instrucciones: ["Cintura", "Peso"],
  },
  {
    id: "recarga-3-sep",
    fecha: "2026-09-03",
    tipo: "recarga",
    titulo: "Recarga controlada · 2.200 kcal",
    instrucciones: [
      "La subida viene de los hidratos, no de la grasa.",
      "Hidratos conocidos: arroz, patata, avena, pan, pasta, fruta.",
      "No es un día libre: nada de pizza, alcohol ni helado.",
      "Agua y sal normales. Fibra moderada.",
    ],
  },
  {
    id: "visual-4-sep",
    fecha: "2026-09-04",
    tipo: "dia-visual",
    titulo: "Día visual principal · 2.050 kcal",
    instrucciones: [
      "Llegas con el músculo lleno del día anterior. Hoy solo se mantiene.",
      "No cortar agua. No quitar sal.",
      "25–35 g de hidratos 1–2 h antes del momento clave, sacados del total del día.",
      "Evitar correr antes del momento importante.",
    ],
  },
  {
    id: "med-8-sep",
    fecha: "2026-09-08",
    tipo: "medicion",
    titulo: "Fin del mini-cut",
    instrucciones: ["Peso", "Cintura", "Foto de perfil"],
  },
  {
    id: "med-15-sep",
    fecha: "2026-09-15",
    tipo: "medicion",
    titulo: "Fin de mantenimiento",
    instrucciones: ["Peso", "Cintura", "Foto de perfil"],
  },
];

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
