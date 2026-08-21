/*
 * Protocolos con fecha: mediciones, fotos y días visuales (§23 y §57).
 *
 * La app los RECUERDA, no los impone. Si la medición del 26 se hace el 27, se
 * guarda la fecha real y se conserva aparte la sugerida (§57). Mismo principio
 * que con el entrenamiento: la fecha recomienda, el registro manda.
 */

export const PROTOCOLOS = [
  { id: "med-26-ago", fecha: "2026-08-26", tipo: "medicion", titulo: "Medición de inicio", instrucciones: ["Peso en ayunas", "Cintura", "Foto de perfil"] },
  { id: "med-29-ago", fecha: "2026-08-29", tipo: "medicion", titulo: "Control de cintura", instrucciones: ["Cintura", "Peso"] },

  {
    id: "previo-4-sep",
    fecha: "2026-09-03",
    tipo: "dia-anterior",
    titulo: "Día anterior al día visual",
    instrucciones: [
      "Mantener kcal y macros del día, sin recortes.",
      "Agua y sal normales.",
      "Nada de atracón ni alcohol.",
      "Evitar los alimentos que a ti te hinchan.",
      "Cena moderada.",
      "Entrenar según el plan, sin llegar al fallo.",
    ],
  },
  {
    id: "visual-4-sep",
    fecha: "2026-09-04",
    tipo: "dia-visual",
    titulo: "Día visual",
    instrucciones: [
      "Mantener las kcal. No cortar agua. No quitar sal.",
      "Si interesa, reservar 20–30 g de HC del total para antes del pump.",
      "Pump opcional de 10–15 min.",
      "Evitar correr (CaCo) antes del momento importante.",
    ],
    // Con calendario flexible no se puede dar por hecho que ese día toque
    // Torso A (§23). Si el siguiente entreno real es de torso, sirve de pump;
    // si toca pierna o no se quiere entrenar, se ofrece este pump corto.
    pump: [
      "Elevaciones laterales 2–3×15–20",
      "Jalón o pullover 2×12–15",
      "Press o flexiones 2×12–15",
      "Bíceps 1–2×12–15",
      "Tríceps 1–2×12–15",
      "RIR 2–3, sin fallo",
    ],
  },

  { id: "med-8-sep", fecha: "2026-09-08", tipo: "medicion", titulo: "Fin del mini-cut", instrucciones: ["Peso", "Cintura", "Foto de perfil"] },
  { id: "med-15-sep", fecha: "2026-09-15", tipo: "medicion", titulo: "Fin de mantenimiento", instrucciones: ["Peso", "Cintura", "Foto de perfil"] },
];

/** Los protocolos de una fecha. Puede haber más de uno. */
export function protocolosDe(iso) {
  return PROTOCOLOS.filter((p) => p.fecha === iso);
}

/** El siguiente protocolo a partir de una fecha, para avisar con tiempo. */
export function proximoProtocolo(iso) {
  return PROTOCOLOS.filter((p) => p.fecha >= iso).sort((a, b) => a.fecha.localeCompare(b.fecha))[0] || null;
}
