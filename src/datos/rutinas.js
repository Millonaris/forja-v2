/*
 * Las cuatro rutinas de fuerza y su rotación.
 *
 * Versión del 23 de agosto de 2026. Prioridades: hombro y espalda en torso,
 * glúteo en pierna. Superseries solo entre accesorios que no compiten, para
 * que la sesión quepa en una hora. El core sale del gimnasio y se hace en casa.
 *
 *   TORSO A → PIERNA A → TORSO B → PIERNA B → ↻
 *
 * El orden es una SECUENCIA, no un calendario: aquí no hay ningún día de la
 * semana, y eso es deliberado (§8). Si la última fue Torso A, la siguiente es
 * Pierna A, se haga el miércoles, el jueves o el sábado.
 *
 * Cada ejercicio lleva `clave`: un identificador estable que NO depende de su
 * posición ni de su nombre visible. Es lo que permite reordenar la rutina o
 * renombrar un ejercicio sin romper el historial de series.
 */

/* Categoría del ejercicio. El descanso va aparte, uno por ejercicio. */
const BASICO = { categoria: "basico" };
const AISLADO = { categoria: "aislado" };

/** ⭐ Prioritario: si se intenta saltar, la app avisa (pero deja saltarlo). */
const P = { prioritario: true };

/*
 * Descansos, en segundos. El reloj empieza AL TERMINAR una serie y acaba al
 * empezar la siguiente.
 *
 *   3:00 · hack squat
 *   2:30 · prensa, hip thrust y presses principales
 *   2:00 · jalones, remos, curl femoral, extensión 45°
 *   1:30 · brazos, pec deck, pullover
 *   1:15 · laterales y reverse pec deck
 *
 * En superserie el descanso va TRAS LA PAREJA; entre los dos ejercicios solo
 * hay una transición de 15–30 s.
 */
const D = {
  hack: 180,
  prensa: 150,
  hipThrust: 150,
  press: 150,
  jalon: 120,
  remo: 120,
  femoral: 120,
  extension45: 120,
  brazo: 90,
  pecDeck: 90,
  pullover: 90,
  lateral: 75,
  reverse: 75,
};

/** Transición entre los dos ejercicios de una superserie. */
const TRANSICION = 20;

/**
 * Marca un ejercicio como parte de una superserie.
 *
 * `posicion: 1` es el primero de la pareja y su "descanso" es solo la
 * transición; `posicion: 2` cierra y lleva el descanso de verdad.
 */
const ss = (grupo, posicion) => ({ superserie: grupo, posicionSS: posicion });

export const ROTACION = ["torso-a", "pierna-a", "torso-b", "pierna-b"];

export const RUTINAS = [
  {
    id: "torso-a",
    nombre: "Torso A",
    orden: 0,
    duracion: "55–70 min",
    ejercicios: [
      { clave: "jalon-pecho", nombre: "Jalón al pecho", series: 3, repMin: 8, repMax: 12, descanso: D.jalon, musculos: ["dorsal"], ...BASICO },
      { clave: "laterales", nombre: "Elevaciones laterales", series: 4, repMin: 12, repMax: 20, descanso: D.lateral, musculos: ["deltoide lateral"], ...AISLADO, ...P },
      { clave: "press-inclinado", nombre: "Press inclinado", series: 3, repMin: 8, repMax: 12, descanso: D.press, musculos: ["pectoral", "tríceps"], ...BASICO },
      { clave: "remo-pecho-apoyado", nombre: "Remo con pecho apoyado", series: 3, repMin: 8, repMax: 12, descanso: D.remo, musculos: ["espalda alta", "dorsal"], ...BASICO },
      { clave: "press-hombro", nombre: "Press hombro", series: 2, repMin: 8, repMax: 12, descanso: D.jalon, musculos: ["deltoide anterior", "tríceps"], ...BASICO },
      { clave: "reverse-pec-deck", nombre: "Reverse pec deck", series: 2, repMin: 12, repMax: 20, descanso: D.reverse, musculos: ["deltoide posterior"], ...AISLADO, ...P },
      { clave: "curl", nombre: "Curl bíceps", series: 2, repMin: 10, repMax: 15, descanso: D.brazo, musculos: ["bíceps"], ...AISLADO },
      { clave: "triceps-polea", nombre: "Tríceps en polea", series: 2, repMin: 10, repMax: 15, descanso: D.brazo, musculos: ["tríceps"], ...AISLADO },
    ],
  },

  {
    // Cuádriceps y glúteo. El core ya no está aquí: se hace en casa.
    id: "pierna-a",
    nombre: "Pierna A",
    orden: 1,
    duracion: "55–65 min",
    ejercicios: [
      { clave: "hack-squat", nombre: "Hack squat", series: 3, repMin: 8, repMax: 12, descanso: D.hack, musculos: ["cuádriceps"], ...BASICO },
      { clave: "hip-thrust", nombre: "Hip thrust máquina", series: 3, repMin: 8, repMax: 12, descanso: D.hipThrust, musculos: ["glúteo"], ...BASICO, ...P },
      { clave: "prensa", nombre: "Prensa", series: 2, repMin: 10, repMax: 15, descanso: D.prensa, musculos: ["cuádriceps", "glúteo"], ...BASICO },
      { clave: "curl-femoral", nombre: "Curl femoral sentado", series: 3, repMin: 10, repMax: 15, descanso: D.femoral, musculos: ["isquios"], ...AISLADO },

      // Superserie A · extensión + laterales (no compiten entre sí).
      { clave: "extension-cuadriceps", nombre: "Extensión de cuádriceps", series: 2, repMin: 10, repMax: 15, descanso: TRANSICION, musculos: ["cuádriceps"], ...AISLADO, ...ss("A", 1) },
      { clave: "laterales", nombre: "Elevaciones laterales", series: 2, repMin: 12, repMax: 20, descanso: 90, musculos: ["deltoide lateral"], ...AISLADO, ...P, ...ss("A", 2) },

      // Superserie B · gemelo + pullover.
      { clave: "gemelo-pie", nombre: "Gemelo de pie", series: 2, repMin: 10, repMax: 20, descanso: TRANSICION, musculos: ["gemelo"], ...AISLADO, ...ss("B", 1) },
      { clave: "pullover", nombre: "Pullover", series: 2, repMin: 10, repMax: 15, descanso: 90, musculos: ["dorsal"], ...AISLADO, ...P, ...ss("B", 2) },

      // Superserie C · sóleo + tibial.
      { clave: "soleo", nombre: "Sóleo sentado", series: 2, repMin: 12, repMax: 20, descanso: TRANSICION, musculos: ["sóleo"], ...AISLADO, ...ss("C", 1) },
      { clave: "tibial", nombre: "Tibial anterior", series: 2, repMin: 15, repMax: 20, descanso: 75, musculos: ["tibial"], ...AISLADO, ...ss("C", 2) },
    ],
  },

  {
    id: "torso-b",
    nombre: "Torso B",
    orden: 2,
    duracion: "55–70 min",
    ejercicios: [
      { clave: "press-plano", nombre: "Press plano", series: 3, repMin: 8, repMax: 12, descanso: D.press, musculos: ["pectoral", "tríceps"], ...BASICO },
      { clave: "laterales", nombre: "Elevaciones laterales", series: 4, repMin: 12, repMax: 20, descanso: D.lateral, musculos: ["deltoide lateral"], ...AISLADO, ...P },
      { clave: "jalon-neutro", nombre: "Jalón neutro", series: 3, repMin: 8, repMax: 12, descanso: D.jalon, musculos: ["dorsal"], ...BASICO },
      { clave: "high-row", nombre: "High row", series: 3, repMin: 8, repMax: 12, descanso: D.remo, musculos: ["espalda alta"], ...BASICO },
      { clave: "pec-deck", nombre: "Pec deck", series: 2, repMin: 10, repMax: 15, descanso: D.pecDeck, musculos: ["pectoral"], ...AISLADO },
      { clave: "reverse-pec-deck", nombre: "Reverse pec deck", series: 2, repMin: 12, repMax: 20, descanso: D.reverse, musculos: ["deltoide posterior"], ...AISLADO, ...P },
      { clave: "curl", nombre: "Curl bíceps", series: 2, repMin: 10, repMax: 15, descanso: D.brazo, musculos: ["bíceps"], ...AISLADO },
      { clave: "triceps-sobre-cabeza", nombre: "Tríceps sobre cabeza", series: 2, repMin: 10, repMax: 15, descanso: D.brazo, musculos: ["tríceps"], ...AISLADO },
    ],
  },

  {
    // El día de mayor sesgo a glúteo. Sin gemelo de pie: se quita para no
    // alargar la sesión y dejar sitio a la abductora, que es prioridad. El
    // gastrocnemio se mantiene en Pierna A.
    id: "pierna-b",
    nombre: "Pierna B",
    orden: 3,
    duracion: "55–65 min",
    ejercicios: [
      { clave: "hip-thrust", nombre: "Hip thrust máquina", series: 3, repMin: 8, repMax: 12, descanso: D.hipThrust, musculos: ["glúteo"], ...BASICO, ...P },
      { clave: "prensa", nombre: "Prensa con sesgo glúteo", series: 3, repMin: 8, repMax: 12, descanso: D.prensa, musculos: ["glúteo", "cuádriceps"], ...BASICO, ...P },
      { clave: "curl-femoral", nombre: "Curl femoral", series: 3, repMin: 10, repMax: 15, descanso: D.femoral, musculos: ["isquios"], ...AISLADO },
      { clave: "extension-45", nombre: "Extensión 45° con sesgo glúteo", series: 2, repMin: 10, repMax: 15, descanso: D.extension45, musculos: ["glúteo", "cadena posterior"], ...BASICO, ...P },

      // Superserie A · abductora + laterales.
      { clave: "abductora", nombre: "Máquina abductora", series: 2, repMin: 15, repMax: 25, descanso: TRANSICION, musculos: ["glúteo medio"], ...AISLADO, ...P, ...ss("A", 1) },
      { clave: "laterales", nombre: "Elevaciones laterales", series: 2, repMin: 12, repMax: 20, descanso: 90, musculos: ["deltoide lateral"], ...AISLADO, ...P, ...ss("A", 2) },

      // El pullover va suelto, no en superserie.
      { clave: "pullover", nombre: "Pullover", series: 2, repMin: 10, repMax: 15, descanso: D.pullover, musculos: ["dorsal"], ...AISLADO, ...P },

      // Superserie B · sóleo + tibial.
      { clave: "soleo", nombre: "Sóleo sentado", series: 2, repMin: 12, repMax: 20, descanso: TRANSICION, musculos: ["sóleo"], ...AISLADO, ...ss("B", 1) },
      { clave: "tibial", nombre: "Tibial anterior", series: 2, repMin: 15, repMax: 20, descanso: 75, musculos: ["tibial"], ...AISLADO, ...ss("B", 2) },
    ],
  },
];

/*
 * Nombre antiguo (normalizado) → clave nueva.
 *
 * Solo sirve para migrar el historial de la versión anterior de la rutina,
 * cuando los ids se construían con la posición y el nombre visible. Sin esto,
 * las series de "Curl femoral" no seguirían a "Curl femoral sentado" y el
 * historial de ese ejercicio empezaría de cero.
 */
export const CLAVES_ANTIGUAS = {
  "jalon-al-pecho": "jalon-pecho",
  "elevaciones-laterales": "laterales",
  "press-inclinado": "press-inclinado",
  "remo-pecho-apoyado": "remo-pecho-apoyado",
  "press-hombro": "press-hombro",
  "reverse-pec-deck": "reverse-pec-deck",
  curl: "curl",
  "triceps-polea": "triceps-polea",
  "hack-squat": "hack-squat",
  prensa: "prensa",
  "curl-femoral": "curl-femoral",
  "extension-de-cuadriceps": "extension-cuadriceps",
  "hip-thrust": "hip-thrust",
  gemelos: "gemelo-pie",
  soleo: "soleo",
  tibial: "tibial",
  pullover: "pullover",
  "press-plano": "press-plano",
  "jalon-neutro": "jalon-neutro",
  "high-row": "high-row",
  "pec-deck": "pec-deck",
  "triceps-sobre-cabeza": "triceps-sobre-cabeza",
  "extension-45": "extension-45",
};

/**
 * Doble progresión. No se exige récord cada sesión: se llena el rango de
 * repeticiones con el RIR correcto y solo entonces se sube el peso mínimo.
 */
export const REGLAS_PROGRESION = [
  "Mantener el peso hasta llenar el rango de repeticiones.",
  "Subir repeticiones dentro del rango antes que el peso.",
  "Llenar el rango con el RIR objetivo, no a base de fallo.",
  "Al llenarlo, subir el incremento más pequeño disponible.",
  "Reconstruir repeticiones desde abajo del rango con el peso nuevo.",
  "Mirar la tendencia de varias sesiones, no el resultado de una.",
];

/** Cómo usar el temporizador. Va plegado en PLAN > FUERZA (§35). */
export const REGLAS_DESCANSO = [
  "El reloj empieza al TERMINAR una serie y acaba al empezar la siguiente.",
  "No hace falta cumplirlo al segundo: si necesitas 15–30 s más para mantener las repeticiones y la técnica, los tomas.",
  "El +30 s es sobre todo para hack squat, prensa, presses, jalones y remos.",
  "Si en un press haces 12 → 9 → 7 y notas que la caída es por ir ahogado, descansa 30 s más.",
  "En laterales, reverse pec deck, bíceps o tibial no hace falta estirar el descanso a 2–3 min.",
  "En superserie el descanso va tras la pareja: entre los dos ejercicios solo hay 15–30 s de transición.",
];

/** Superseries: solo entre accesorios que no compiten (§13). */
export const REGLAS_SUPERSERIE = [
  "Extensión + laterales, gemelo + pullover, sóleo + tibial, abductora + laterales.",
  "Nunca entre dos ejercicios principales de pierna.",
  "Nada de hack + prensa, hack + hip thrust, prensa + extensión ni hip thrust + prensa.",
  "Los ejercicios grandes conservan su descanso completo.",
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

/** Series totales de una rutina, para comprobar la dosis de un vistazo. */
export function seriesTotales(rutina) {
  return rutina.ejercicios.reduce((t, e) => t + e.series, 0);
}
