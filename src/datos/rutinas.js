/*
 * Las cuatro rutinas de fuerza y su rotación (§24 de la spec).
 *
 *   TORSO A → PIERNA A → TORSO B → PIERNA B → ↻
 *
 * El orden es una SECUENCIA, no un calendario: aquí no hay ningún día de la
 * semana, y eso es deliberado (§8).
 *
 * Descansos (§24): básicos 2–3 min, aislados 90–120 s. Se guarda el valor por
 * defecto en segundos; el temporizador deja sumar o saltar.
 * RIR objetivo: 1–2 en todo, con la última serie de un aislado ocasionalmente
 * a 0–1. Sin fallo sistemático, sin dropsets, sin rest-pause como base.
 */

const BASICO = { categoria: "basico", descanso: 150 };
const AISLADO = { categoria: "aislado", descanso: 105 };
const CORE = { categoria: "core", descanso: 60 };

/** ⭐ Prioritario: si se intenta saltar, la app avisa (pero deja saltarlo). */
const P = { prioritario: true };

export const ROTACION = ["torso-a", "pierna-a", "torso-b", "pierna-b"];

export const RUTINAS = [
  {
    id: "torso-a",
    nombre: "Torso A",
    orden: 0,
    ejercicios: [
      { nombre: "Jalón al pecho", series: 3, repMin: 8, repMax: 12, musculos: ["dorsal"], ...BASICO },
      { nombre: "Elevaciones laterales", series: 4, repMin: 12, repMax: 20, musculos: ["deltoide lateral"], ...AISLADO, ...P },
      { nombre: "Press inclinado", series: 3, repMin: 8, repMax: 12, musculos: ["pectoral", "tríceps"], ...BASICO },
      { nombre: "Remo pecho apoyado", series: 3, repMin: 8, repMax: 12, musculos: ["espalda alta", "dorsal"], ...BASICO },
      { nombre: "Press hombro", series: 2, repMin: 8, repMax: 12, musculos: ["deltoide anterior", "tríceps"], ...BASICO },
      { nombre: "Reverse pec deck", series: 2, repMin: 12, repMax: 20, musculos: ["deltoide posterior"], ...AISLADO, ...P },
      { nombre: "Curl", series: 2, repMin: 10, repMax: 15, musculos: ["bíceps"], ...AISLADO },
      { nombre: "Tríceps polea", series: 2, repMin: 10, repMax: 15, musculos: ["tríceps"], ...AISLADO },
    ],
  },

  {
    id: "pierna-a",
    nombre: "Pierna A",
    orden: 1,
    ejercicios: [
      { nombre: "Hack squat", series: 3, repMin: 8, repMax: 12, musculos: ["cuádriceps"], ...BASICO },
      { nombre: "Prensa", series: 2, repMin: 10, repMax: 15, musculos: ["cuádriceps", "glúteo"], ...BASICO },
      { nombre: "Curl femoral", series: 3, repMin: 10, repMax: 15, musculos: ["isquios"], ...AISLADO },
      { nombre: "Extensión de cuádriceps", series: 2, repMin: 10, repMax: 15, musculos: ["cuádriceps"], ...AISLADO },
      { nombre: "Hip thrust", series: 2, repMin: 8, repMax: 12, musculos: ["glúteo"], ...BASICO },
      { nombre: "Gemelos", series: 3, repMin: 10, repMax: 20, musculos: ["gemelo"], ...AISLADO },
      { nombre: "Sóleo", series: 3, repMin: 12, repMax: 15, musculos: ["sóleo"], ...AISLADO, ...P },
      { nombre: "Tibial", series: 2, repMin: 15, repMax: 20, musculos: ["tibial"], ...AISLADO, ...P },
      { nombre: "Elevaciones laterales", series: 3, repMin: 12, repMax: 20, musculos: ["deltoide lateral"], ...AISLADO, ...P },
      { nombre: "Pullover", series: 2, repMin: 10, repMax: 15, musculos: ["dorsal"], ...AISLADO, ...P },
      { nombre: "Dead bug", series: 2, repMin: 8, repMax: 8, porLado: true, musculos: ["core"], ...CORE },
      { nombre: "Plancha lateral", series: 2, segMin: 20, segMax: 30, porLado: true, musculos: ["core"], ...CORE },
    ],
  },

  {
    id: "torso-b",
    nombre: "Torso B",
    orden: 2,
    ejercicios: [
      { nombre: "Press plano", series: 3, repMin: 8, repMax: 12, musculos: ["pectoral", "tríceps"], ...BASICO },
      { nombre: "Elevaciones laterales", series: 4, repMin: 12, repMax: 20, musculos: ["deltoide lateral"], ...AISLADO, ...P },
      { nombre: "Jalón neutro", series: 3, repMin: 8, repMax: 12, musculos: ["dorsal"], ...BASICO },
      { nombre: "High row", series: 3, repMin: 8, repMax: 12, musculos: ["espalda alta"], ...BASICO },
      { nombre: "Pec deck", series: 2, repMin: 10, repMax: 15, musculos: ["pectoral"], ...AISLADO },
      { nombre: "Reverse pec deck", series: 2, repMin: 12, repMax: 20, musculos: ["deltoide posterior"], ...AISLADO, ...P },
      { nombre: "Curl", series: 2, repMin: 10, repMax: 15, musculos: ["bíceps"], ...AISLADO },
      { nombre: "Tríceps sobre cabeza", series: 2, repMin: 10, repMax: 15, musculos: ["tríceps"], ...AISLADO },
    ],
  },

  {
    id: "pierna-b",
    nombre: "Pierna B",
    orden: 3,
    ejercicios: [
      { nombre: "Hip thrust", series: 3, repMin: 8, repMax: 12, musculos: ["glúteo"], ...BASICO },
      { nombre: "Prensa", series: 3, repMin: 8, repMax: 12, musculos: ["cuádriceps", "glúteo"], ...BASICO },
      { nombre: "Curl femoral", series: 3, repMin: 10, repMax: 15, musculos: ["isquios"], ...AISLADO },
      { nombre: "Extensión de cuádriceps", series: 2, repMin: 10, repMax: 15, musculos: ["cuádriceps"], ...AISLADO },
      { nombre: "Extensión 45°", series: 2, repMin: 10, repMax: 15, musculos: ["cadena posterior"], ...BASICO },
      { nombre: "Gemelos", series: 3, repMin: 10, repMax: 20, musculos: ["gemelo"], ...AISLADO },
      // Misma dosis que en Pierna A: la spec pide no inventarlas (§24).
      { nombre: "Sóleo", series: 3, repMin: 12, repMax: 15, musculos: ["sóleo"], ...AISLADO, ...P },
      { nombre: "Tibial", series: 2, repMin: 15, repMax: 20, musculos: ["tibial"], ...AISLADO, ...P },
      { nombre: "Elevaciones laterales", series: 3, repMin: 12, repMax: 20, musculos: ["deltoide lateral"], ...AISLADO, ...P },
      { nombre: "Pullover", series: 2, repMin: 10, repMax: 15, musculos: ["dorsal"], ...AISLADO, ...P },
      { nombre: "Pallof press", series: 2, repMin: 10, repMax: 10, porLado: true, musculos: ["core"], ...CORE },
      { nombre: "Plancha lateral", series: 2, segMin: 20, segMax: 30, porLado: true, musculos: ["core"], ...CORE },
    ],
  },
];

/**
 * Doble progresión (§24). No se exige récord cada sesión: se llena el rango de
 * repeticiones con el RIR correcto y solo entonces se sube el peso mínimo.
 */
export const REGLAS_PROGRESION = [
  "Mantener el peso hasta llenar el rango de repeticiones.",
  "Subir repeticiones dentro del rango antes que el peso.",
  "Llenar el rango con el RIR objetivo, no a base de fallo.",
  "Al llenarlo, subir el incremento más pequeño disponible.",
  "Reconstruir repeticiones desde abajo del rango con el peso nuevo.",
];

/** El texto del rango de un ejercicio: "3×8–12", "2×20–30 s/lado". */
export function dosis(ej) {
  const porLado = ej.porLado ? "/lado" : "";
  if (ej.segMin) {
    const rango = ej.segMin === ej.segMax ? `${ej.segMin}` : `${ej.segMin}–${ej.segMax}`;
    return `${ej.series}×${rango} s${porLado}`;
  }
  const rango = ej.repMin === ej.repMax ? `${ej.repMin}` : `${ej.repMin}–${ej.repMax}`;
  return `${ej.series}×${rango}${porLado}`;
}
