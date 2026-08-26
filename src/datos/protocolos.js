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
    id: "med-29-ago",
    fecha: "2026-08-29",
    tipo: "medicion",
    titulo: "Control de cintura",
    instrucciones: ["Cintura", "Peso"],
  },
  {
    id: "ultima-sesion-2-sep",
    fecha: "2026-09-02",
    tipo: "aviso",
    titulo: "Última sesión completa antes del 4–5",
    instrucciones: [
      "Hoy es el último día recomendable para una sesión completa de gimnasio antes de los días visuales.",
      "La sesión que toque por rotación, sin romperla: si es torso, mejor todavía.",
      "Buena técnica y RIR ~2: nada de fallo repetido, récords ni agujetas enormes.",
      "Empieza el llenado: 2.300 kcal con los hidratos a 250 g.",
    ],
  },
  {
    id: "recarga-3-sep",
    fecha: "2026-09-03",
    tipo: "recarga",
    titulo: "Recarga + descanso · 2.500 kcal",
    instrucciones: [
      "Hoy NO hay sesión dura de gimnasio: interesa recuperar, evitar agujetas y rellenar el músculo.",
      "Sí: caminar normal, movilidad, postura, core suave. No: HIIT, carrera intensa, pierna o torso duros.",
      "La subida viene de los hidratos conocidos: arroz, patata, avena, pan, pasta, fruta.",
      "No es un día libre: nada de pizza, alcohol ni helado. Agua y sal normales. Fibra moderada.",
    ],
  },
  {
    id: "visual-4-sep",
    fecha: "2026-09-04",
    tipo: "dia-visual",
    titulo: "Día visual 1 · ~2.450 kcal",
    instrucciones: [
      "Llegas con el músculo lleno de ayer. Hoy se mantiene: hidrato alto, agua y sal normales.",
      "Reserva 50–70 g de hidratos para 2–3 h antes del momento clave, sacados del total del día.",
      "En esa comida: alimentos conocidos, digestión fácil, poca grasa y nada enorme.",
      "Evitar entrenar duro o correr fuerte antes del momento importante.",
    ],
    pump: [
      "Elevaciones laterales 2–3×15–20",
      "Pullover o jalón ligero 2×12–15",
      "Press ligero o flexiones 2×12–15",
      "Bíceps 1–2×12–15",
      "Tríceps 1–2×12–15",
      "Todo con RIR 2–3, en 10–15 min, 20–60 min antes de vestirse",
    ],
  },
  {
    id: "visual-5-sep",
    fecha: "2026-09-05",
    tipo: "dia-visual",
    titulo: "Día visual 2 · ~2.450 kcal",
    instrucciones: [
      "Mismo reparto que ayer si funcionó bien: NO volver a las 2.150 esta mañana.",
      "Agua y sal normales, comidas conocidas.",
      "El pump es opcional: solo si te ves menos lleno. Sin fallo y sin acumular fatiga.",
      "Después del momento importante, vuelta a la rotación normal de fuerza.",
    ],
    pump: [
      "El mismo pump corto de ayer, si hace falta",
      "RIR 2–3, en 10–15 min, sin agotarse",
    ],
  },
  {
    id: "med-8-sep",
    fecha: "2026-09-08",
    tipo: "medicion",
    titulo: "Medición antes de la calibración",
    instrucciones: ["Peso", "Cintura", "Foto de perfil"],
  },
  {
    id: "med-15-sep",
    fecha: "2026-09-15",
    tipo: "medicion",
    titulo: "Mitad de la calibración",
    instrucciones: ["Peso", "Cintura"],
  },
  {
    id: "med-22-sep",
    fecha: "2026-09-22",
    tipo: "medicion",
    titulo: "Última medición de la calibración",
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
