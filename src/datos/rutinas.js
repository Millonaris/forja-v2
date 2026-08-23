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

/*
 * Categoría del ejercicio. El descanso NO va aquí: cada ejercicio tiene el
 * suyo, cerrado uno a uno más abajo. Un básico pesado y un aislado no piden
 * lo mismo, y darles a todos el mismo número era una simplificación que
 * costaba minutos por sesión.
 */
const BASICO = { categoria: "basico" };
const AISLADO = { categoria: "aislado" };
const CORE = { categoria: "core" };

/*
 * Descansos, en segundos. El reloj empieza AL TERMINAR una serie y acaba al
 * empezar la siguiente.
 *
 *   3:00 · hack squat
 *   2:30 · prensa y presses principales
 *   2:00 · jalones, remos, hip thrust, curl femoral
 *   1:30 · brazos, pec deck, extensiones, pullover, gemelos
 *   1:15 · laterales, reverse pec deck, sóleo
 *   1:00 · tibial y core
 *
 * No hay que cumplirlos al segundo: el botón +30 s del temporizador está para
 * eso, y en los básicos pesados conviene usarlo si las repeticiones se caen
 * por ir ahogado y no por fatiga real del músculo.
 */
const D = {
  hack: 180,
  prensa: 150,
  press: 150,
  jalon: 120,
  remo: 120,
  hipThrust: 120,
  femoral: 120,
  brazo: 90,
  extension: 90,
  pullover: 90,
  gemelo: 90,
  lateral: 75,
  reverse: 75,
  soleo: 75,
  tibial: 60,
  core: 60,
};

/** ⭐ Prioritario: si se intenta saltar, la app avisa (pero deja saltarlo). */
const P = { prioritario: true };

export const ROTACION = ["torso-a", "pierna-a", "torso-b", "pierna-b"];

export const RUTINAS = [
  {
    id: "torso-a",
    nombre: "Torso A",
    orden: 0,
    ejercicios: [
      { nombre: "Jalón al pecho", series: 3, repMin: 8, repMax: 12, musculos: ["dorsal"], ...BASICO, descanso: D.jalon },
      { nombre: "Elevaciones laterales", series: 4, repMin: 12, repMax: 20, musculos: ["deltoide lateral"], ...AISLADO, ...P, descanso: D.lateral },
      { nombre: "Press inclinado", series: 3, repMin: 8, repMax: 12, musculos: ["pectoral", "tríceps"], ...BASICO, descanso: D.press },
      { nombre: "Remo pecho apoyado", series: 3, repMin: 8, repMax: 12, musculos: ["espalda alta", "dorsal"], ...BASICO, descanso: D.remo },
      { nombre: "Press hombro", series: 2, repMin: 8, repMax: 12, musculos: ["deltoide anterior", "tríceps"], ...BASICO, descanso: D.jalon },
      { nombre: "Reverse pec deck", series: 2, repMin: 12, repMax: 20, musculos: ["deltoide posterior"], ...AISLADO, ...P, descanso: D.reverse },
      { nombre: "Curl", series: 2, repMin: 10, repMax: 15, musculos: ["bíceps"], ...AISLADO, descanso: D.brazo },
      { nombre: "Tríceps polea", series: 2, repMin: 10, repMax: 15, musculos: ["tríceps"], ...AISLADO, descanso: D.brazo },
    ],
  },

  {
    id: "pierna-a",
    nombre: "Pierna A",
    orden: 1,
    ejercicios: [
      { nombre: "Hack squat", series: 3, repMin: 8, repMax: 12, musculos: ["cuádriceps"], ...BASICO, descanso: D.hack },
      { nombre: "Prensa", series: 2, repMin: 10, repMax: 15, musculos: ["cuádriceps", "glúteo"], ...BASICO, descanso: D.prensa },
      { nombre: "Curl femoral", series: 3, repMin: 10, repMax: 15, musculos: ["isquios"], ...AISLADO, descanso: D.femoral },
      { nombre: "Extensión de cuádriceps", series: 2, repMin: 10, repMax: 15, musculos: ["cuádriceps"], ...AISLADO, descanso: D.extension },
      { nombre: "Hip thrust", series: 2, repMin: 8, repMax: 12, musculos: ["glúteo"], ...BASICO, descanso: D.hipThrust },
      { nombre: "Gemelos", series: 3, repMin: 10, repMax: 20, musculos: ["gemelo"], ...AISLADO, descanso: D.gemelo },
      { nombre: "Sóleo", series: 3, repMin: 12, repMax: 15, musculos: ["sóleo"], ...AISLADO, ...P, descanso: D.soleo },
      { nombre: "Tibial", series: 2, repMin: 15, repMax: 20, musculos: ["tibial"], ...AISLADO, ...P, descanso: D.tibial },
      { nombre: "Elevaciones laterales", series: 3, repMin: 12, repMax: 20, musculos: ["deltoide lateral"], ...AISLADO, ...P, descanso: D.lateral },
      { nombre: "Pullover", series: 2, repMin: 10, repMax: 15, musculos: ["dorsal"], ...AISLADO, ...P, descanso: D.pullover },
      { nombre: "Dead bug", series: 2, repMin: 8, repMax: 8, porLado: true, musculos: ["core"], ...CORE, descanso: D.core },
      { nombre: "Plancha lateral", series: 2, segMin: 20, segMax: 30, porLado: true, musculos: ["core"], ...CORE, descanso: D.core },
    ],
  },

  {
    id: "torso-b",
    nombre: "Torso B",
    orden: 2,
    ejercicios: [
      { nombre: "Press plano", series: 3, repMin: 8, repMax: 12, musculos: ["pectoral", "tríceps"], ...BASICO, descanso: D.press },
      { nombre: "Elevaciones laterales", series: 4, repMin: 12, repMax: 20, musculos: ["deltoide lateral"], ...AISLADO, ...P, descanso: D.lateral },
      { nombre: "Jalón neutro", series: 3, repMin: 8, repMax: 12, musculos: ["dorsal"], ...BASICO, descanso: D.jalon },
      { nombre: "High row", series: 3, repMin: 8, repMax: 12, musculos: ["espalda alta"], ...BASICO, descanso: D.remo },
      { nombre: "Pec deck", series: 2, repMin: 10, repMax: 15, musculos: ["pectoral"], ...AISLADO, descanso: D.extension },
      { nombre: "Reverse pec deck", series: 2, repMin: 12, repMax: 20, musculos: ["deltoide posterior"], ...AISLADO, ...P, descanso: D.reverse },
      { nombre: "Curl", series: 2, repMin: 10, repMax: 15, musculos: ["bíceps"], ...AISLADO, descanso: D.brazo },
      { nombre: "Tríceps sobre cabeza", series: 2, repMin: 10, repMax: 15, musculos: ["tríceps"], ...AISLADO, descanso: D.brazo },
    ],
  },

  {
    id: "pierna-b",
    nombre: "Pierna B",
    orden: 3,
    ejercicios: [
      { nombre: "Hip thrust", series: 3, repMin: 8, repMax: 12, musculos: ["glúteo"], ...BASICO, descanso: D.hipThrust },
      { nombre: "Prensa", series: 3, repMin: 8, repMax: 12, musculos: ["cuádriceps", "glúteo"], ...BASICO, descanso: D.prensa },
      { nombre: "Curl femoral", series: 3, repMin: 10, repMax: 15, musculos: ["isquios"], ...AISLADO, descanso: D.femoral },
      { nombre: "Extensión de cuádriceps", series: 2, repMin: 10, repMax: 15, musculos: ["cuádriceps"], ...AISLADO, descanso: D.extension },
      { nombre: "Extensión 45°", series: 2, repMin: 10, repMax: 15, musculos: ["cadena posterior"], ...BASICO, descanso: D.extension },
      { nombre: "Gemelos", series: 3, repMin: 10, repMax: 20, musculos: ["gemelo"], ...AISLADO, descanso: D.gemelo },
      // Misma dosis que en Pierna A: la spec pide no inventarlas (§24).
      { nombre: "Sóleo", series: 3, repMin: 12, repMax: 15, musculos: ["sóleo"], ...AISLADO, ...P, descanso: D.soleo },
      { nombre: "Tibial", series: 2, repMin: 15, repMax: 20, musculos: ["tibial"], ...AISLADO, ...P, descanso: D.tibial },
      { nombre: "Elevaciones laterales", series: 3, repMin: 12, repMax: 20, musculos: ["deltoide lateral"], ...AISLADO, ...P, descanso: D.lateral },
      { nombre: "Pullover", series: 2, repMin: 10, repMax: 15, musculos: ["dorsal"], ...AISLADO, ...P, descanso: D.pullover },
      { nombre: "Pallof press", series: 2, repMin: 10, repMax: 10, porLado: true, musculos: ["core"], ...CORE, descanso: D.core },
      { nombre: "Plancha lateral", series: 2, segMin: 20, segMax: 30, porLado: true, musculos: ["core"], ...CORE, descanso: D.core },
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

/** Cómo usar el temporizador. Va plegado en PLAN > FUERZA (§35). */
export const REGLAS_DESCANSO = [
  "El reloj empieza al TERMINAR una serie y acaba al empezar la siguiente.",
  "No hace falta cumplirlo al segundo: si necesitas 15–30 s más para mantener las repeticiones y la técnica, los tomas.",
  "El +30 s es sobre todo para hack squat, prensa, presses, jalones y remos.",
  "Si en un press haces 12 → 9 → 7 y notas que la caída es por ir ahogado, descansa 30 s más.",
  "En laterales, reverse pec deck, bíceps o tibial no hace falta estirar el descanso a 2–3 min.",
];

/** El descanso en texto: 150 → "2:30". */
export function descansoTexto(segundos) {
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;
}

/** "pierna-a" → "Pierna A". Un único sitio: había cuatro copias de este mapa. */
export function nombreDe(plantillaId) {
  return RUTINAS.find((r) => r.id === plantillaId)?.nombre ?? plantillaId;
}

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
