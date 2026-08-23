/*
 * Las cuatro rutinas de fuerza y su rotación.
 *
 * Versión definitiva (informe de investigación, 23 de agosto de 2026).
 *
 *   TORSO A → PIERNA A → TORSO B → PIERNA B → ↻
 *
 * El orden es una SECUENCIA, no un calendario. Entrenando tres veces por
 * semana una vuelta tarda 1,33 semanas, así que la rutina NO se reinicia los
 * lunes: la app guarda cuál es la siguiente y punto.
 *
 * Las dos sesiones de torso tienen identidad distinta a propósito:
 *
 *   Torso A · espalda primero (jalón y remo SEGUIDOS) → lateral → pecho
 *   Torso B · lateral primero → dorsal → pecho
 *
 * El orden de ejercicios no cambia por sí solo la hipertrofia, pero lo que va
 * al principio rinde mejor. Por eso cada prioridad tiene una sesión donde
 * arranca fresca.
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

/**
 * Descanso: valor por defecto del temporizador + rango autorregulado.
 *
 * El primer número es lo que arranca solo al terminar la serie; el rango es
 * lo aceptable. El botón +30 s está para eso, y usarlo no rompe nada: en hack,
 * prensa o hip thrust vale más medio minuto extra y una buena serie.
 */
const d = (defecto, min, max) => ({ descanso: defecto, descansoMin: min, descansoMax: max });

/**
 * Superserie: A → 15 s de transición → B → descanso completo → repetir.
 *
 * `posicion: 1` solo transiciona; `posicion: 2` cierra y lleva el descanso de
 * la pareja. NO se descansa entre A y B.
 */
const ss = (grupo, posicion) => ({ superserie: grupo, posicionSS: posicion });
const TRANSICION = 15;

/** La versión agresiva solo añade una serie aquí, y no antes de 6-8 semanas. */
const MAS = { extraAgresiva: 1 };

export const ROTACION = ["torso-a", "pierna-a", "torso-b", "pierna-b"];

export const RUTINAS = [
  {
    id: "torso-a",
    nombre: "Torso A",
    orden: 0,
    prioridad: "Espalda",
    duracion: "55–63 min",
    ejercicios: [
      {
        clave: "jalon-pecho",
        nombre: "Jalón al pecho agarre medio",
        series: 3, repMin: 8, repMax: 12, rir: "2",
        ...d(120, 105, 150), ...BASICO, ...MAS,
        musculos: ["dorsal"],
        nota: "Prioridad dorsal: es el primer ejercicio de la sesión para que reciba tu mejor rendimiento.",
        alternativas: ["Jalón plate-loaded", "Dominada asistida"],
      },
      {
        clave: "remo-pecho-apoyado",
        nombre: "Remo con pecho apoyado",
        series: 3, repMin: 8, repMax: 12, rir: "2",
        ...d(120, 105, 150), ...BASICO,
        musculos: ["espalda alta", "dorsal"],
        nota: "Va justo detrás del jalón a propósito: los dos reciben el principio de la sesión. Sin fatiga lumbar innecesaria.",
        alternativas: ["Remo máquina sentado", "Remo cable con apoyo"],
      },
      {
        clave: "laterales",
        nombre: "Elevación lateral máquina/cable",
        series: 4, repMin: 12, repMax: 20, rir: "1–2",
        ...d(75, 60, 90), ...AISLADO, ...P,
        musculos: ["deltoide lateral"],
        nota: "Prioridad. Sola, sin superserie, para no perder calidad. Control y tensión, nada de balanceo.",
        alternativas: ["Cable lateral", "Mancuernas"],
      },
      {
        clave: "press-inclinado",
        nombre: "Press inclinado máquina",
        series: 3, repMin: 8, repMax: 12, rir: "2",
        ...d(150, 120, 180), ...BASICO,
        musculos: ["pectoral", "tríceps"],
        alternativas: ["Smith inclinado", "Press convergente"],
      },
      {
        clave: "reverse-pec-deck",
        nombre: "Reverse pec deck",
        series: 2, repMin: 12, repMax: 20, rir: "1–2",
        ...d(75, 60, 90), ...AISLADO, ...P,
        musculos: ["deltoide posterior"],
        alternativas: ["Reverse fly en cables", "Máquina posterior"],
      },
      {
        clave: "press-hombro",
        nombre: "Press hombro máquina",
        series: 2, repMin: 8, repMax: 12, rir: "2",
        ...d(120, 105, 150), ...BASICO,
        musculos: ["deltoide anterior", "tríceps"],
        nota: "No perseguir el fallo aquí.",
        alternativas: ["Smith sentado", "Otra máquina convergente"],
      },

      // Superserie A · brazos, acciones opuestas.
      {
        clave: "curl",
        nombre: "Curl bíceps máquina/polea",
        series: 2, repMin: 10, repMax: 15, rir: "1–2",
        descanso: TRANSICION, ...AISLADO, ...ss("A", 1),
        musculos: ["bíceps"],
      },
      {
        clave: "triceps-polea",
        nombre: "Extensión tríceps polea",
        series: 2, repMin: 10, repMax: 15, rir: "1–2",
        ...d(90, 75, 105), ...AISLADO, ...ss("A", 2),
        musculos: ["tríceps"],
        nota: "Última serie opcionalmente a 0–1 RIR si la técnica aguanta.",
      },
    ],
  },

  {
    // Cuádriceps + glúteo. El core no está aquí: se hace en casa.
    id: "pierna-a",
    nombre: "Pierna A",
    orden: 1,
    prioridad: "Cuádriceps + glúteo",
    duracion: "60–68 min",
    ejercicios: [
      {
        clave: "hack-squat",
        nombre: "Hack squat",
        series: 3, repMin: 8, repMax: 12, rir: "2",
        ...d(180, 150, 210), ...BASICO,
        musculos: ["cuádriceps"],
        nota: "Nunca en superserie: mucha fatiga sistémica y local.",
        alternativas: ["Pendulum squat", "Prensa"],
      },
      {
        clave: "hip-thrust",
        nombre: "Hip thrust máquina",
        series: 3, repMin: 8, repMax: 12, rir: "1–2",
        ...d(150, 120, 180), ...BASICO, ...P, ...MAS,
        musculos: ["glúteo"],
        nota: "Glúteo prioritario. Extensión de cadera con la cadera como protagonista.",
        alternativas: ["Glute drive", "Hip thrust Smith"],
      },
      {
        clave: "prensa",
        nombre: "Prensa",
        series: 2, repMin: 10, repMax: 15, rir: "2",
        ...d(150, 120, 180), ...BASICO,
        musculos: ["cuádriceps", "glúteo"],
        alternativas: ["Otra prensa estable", "Hack o pendulum"],
      },
      {
        clave: "curl-femoral",
        nombre: "Curl femoral sentado",
        series: 3, repMin: 10, repMax: 15, rir: "1–2",
        ...d(120, 90, 150), ...AISLADO,
        musculos: ["isquios"],
        nota: "Sentado antes que tumbado: entrena el isquio a mayor longitud y en comparación directa creció más.",
        alternativas: ["Curl femoral tumbado", "Curl máquina unilateral"],
      },

      // Superserie A · extensión + laterales.
      {
        clave: "extension-cuadriceps",
        nombre: "Extensión de cuádriceps",
        series: 2, repMin: 10, repMax: 15, rir: "1–2",
        descanso: TRANSICION, ...AISLADO, ...ss("A", 1),
        musculos: ["cuádriceps"],
        alternativas: ["Otra máquina de extensión", "Esperar si no hay equivalente"],
      },
      {
        clave: "laterales",
        nombre: "Elevaciones laterales",
        series: 2, repMin: 12, repMax: 20, rir: "1–2",
        ...d(90, 75, 105), ...AISLADO, ...P, ...ss("A", 2), ...MAS,
        musculos: ["deltoide lateral"],
        alternativas: ["Cable lateral", "Mancuernas"],
      },

      // Superserie B · gemelo + pullover.
      {
        clave: "gemelo-pie",
        nombre: "Gemelo de pie",
        series: 2, repMin: 10, repMax: 15, rir: "1–2",
        descanso: TRANSICION, ...AISLADO, ...ss("B", 1),
        musculos: ["gemelo"],
        nota: "Rodilla casi extendida. Bajar el talón controlado, estirar, subir y pausa arriba. Sin rebotes.",
        alternativas: ["Calf press en prensa", "Gemelo Smith"],
      },
      {
        clave: "pullover",
        nombre: "Pullover máquina/polea",
        series: 2, repMin: 10, repMax: 15, rir: "1–2",
        ...d(90, 75, 105), ...AISLADO, ...P, ...ss("B", 2),
        musculos: ["dorsal"],
        nota: "Microdosis de dorsal en día de pierna.",
        alternativas: ["Straight-arm pulldown", "Máquina pullover"],
      },

      // Superserie C · sóleo + tibial.
      {
        clave: "soleo",
        nombre: "Sóleo sentado",
        series: 2, repMin: 12, repMax: 20, rir: "1–2",
        descanso: TRANSICION, ...AISLADO, ...ss("C", 1),
        musculos: ["sóleo"],
        nota: "Rodilla flexionada: así es sóleo y no gemelo.",
        alternativas: ["Seated calf machine", "Calf con rodilla flexionada"],
      },
      {
        clave: "tibial",
        nombre: "Tibial anterior",
        series: 2, repMin: 15, repMax: 25, rir: "1–2",
        ...d(75, 60, 90), ...AISLADO, ...ss("C", 2),
        musculos: ["tibial"],
        nota: "Elevar la punta del pie hacia la tibia. Protege la espinilla al correr.",
        alternativas: ["Tib bar", "Dorsiflexión en cable o banda"],
      },
    ],
  },

  {
    id: "torso-b",
    nombre: "Torso B",
    orden: 2,
    prioridad: "Deltoide lateral",
    duracion: "54–62 min",
    ejercicios: [
      {
        clave: "laterales",
        nombre: "Elevación lateral máquina/cable",
        series: 4, repMin: 12, repMax: 20, rir: "1–2",
        ...d(75, 60, 90), ...AISLADO, ...P,
        musculos: ["deltoide lateral"],
        nota: "Máxima prioridad: primer ejercicio absoluto de la sesión, con el hombro totalmente fresco.",
        alternativas: ["Cable lateral", "Mancuernas"],
      },
      {
        clave: "jalon-neutro",
        nombre: "Jalón neutro/semineutro",
        series: 3, repMin: 8, repMax: 12, rir: "2",
        ...d(120, 105, 150), ...BASICO, ...P,
        musculos: ["dorsal"],
        alternativas: ["Jalón plate-loaded", "Dominada asistida"],
      },
      {
        clave: "press-plano",
        nombre: "Press plano máquina",
        series: 3, repMin: 8, repMax: 12, rir: "2",
        ...d(150, 120, 180), ...BASICO,
        musculos: ["pectoral", "tríceps"],
        alternativas: ["Smith plano", "Press convergente"],
      },
      {
        clave: "high-row",
        nombre: "High row / remo pecho apoyado",
        series: 3, repMin: 8, repMax: 12, rir: "2",
        ...d(120, 105, 150), ...BASICO, ...P, ...MAS,
        musculos: ["espalda alta", "dorsal"],
        alternativas: ["Remo máquina sentado", "Remo cable con apoyo"],
      },

      // Superserie A · posterior + pectoral, acciones opuestas.
      {
        clave: "reverse-pec-deck",
        nombre: "Reverse pec deck",
        series: 2, repMin: 12, repMax: 20, rir: "1–2",
        descanso: TRANSICION, ...AISLADO, ...P, ...ss("A", 1),
        musculos: ["deltoide posterior"],
        alternativas: ["Reverse fly en cables", "Máquina posterior"],
      },
      {
        clave: "pec-deck",
        nombre: "Pec deck",
        series: 2, repMin: 10, repMax: 15, rir: "1–2",
        ...d(90, 75, 105), ...AISLADO, ...ss("A", 2),
        musculos: ["pectoral"],
        nota: "Se empareja con el reverse porque son acciones opuestas: ninguno estorba al otro.",
        alternativas: ["Cruces en polea", "Máquina de aperturas"],
      },

      // Superserie B · brazos.
      {
        clave: "curl",
        nombre: "Curl bíceps máquina/polea",
        series: 2, repMin: 10, repMax: 15, rir: "1–2",
        descanso: TRANSICION, ...AISLADO, ...ss("B", 1),
        musculos: ["bíceps"],
      },
      {
        clave: "triceps-sobre-cabeza",
        nombre: "Tríceps overhead con cable",
        series: 2, repMin: 10, repMax: 15, rir: "1–2",
        ...d(90, 75, 105), ...AISLADO, ...ss("B", 2),
        musculos: ["tríceps"],
      },
    ],
  },

  {
    id: "pierna-b",
    nombre: "Pierna B",
    orden: 3,
    prioridad: "Glúteo",
    duracion: "60–69 min",
    ejercicios: [
      {
        clave: "hip-thrust",
        nombre: "Hip thrust máquina",
        series: 3, repMin: 8, repMax: 12, rir: "1–2",
        ...d(150, 120, 180), ...BASICO, ...P, ...MAS,
        musculos: ["glúteo"],
        nota: "Prioridad absoluta de glúteo.",
        alternativas: ["Glute drive", "Hip thrust Smith"],
      },
      {
        clave: "prensa",
        nombre: "Prensa con sesgo glúteo",
        series: 3, repMin: 10, repMax: 15, rir: "2",
        ...d(150, 120, 180), ...BASICO, ...P,
        musculos: ["glúteo", "cuádriceps"],
        nota: "Pies algo más altos que en Pierna A, sin exagerar. Baja solo hasta donde la pelvis siga estable: no despegar el sacro ni redondear lumbar para ganar profundidad.",
        alternativas: ["Otra prensa estable", "Hack o pendulum"],
      },
      {
        clave: "extension-45",
        nombre: "Extensión 45° sesgo glúteo",
        series: 2, repMin: 10, repMax: 15, rir: "1–2",
        ...d(90, 75, 120), ...BASICO, ...P,
        musculos: ["glúteo", "cadena posterior"],
        nota: "Pensar en mover la cadera. Subir hasta quedar alineado y apretar glúteo arriba; no seguir subiendo arqueando la lumbar.",
        alternativas: ["Máquina de extensión de cadera", "Glute drive ligero"],
      },
      {
        clave: "curl-femoral",
        nombre: "Curl femoral sentado",
        series: 3, repMin: 10, repMax: 15, rir: "1–2",
        ...d(120, 90, 150), ...AISLADO,
        musculos: ["isquios"],
        alternativas: ["Curl femoral tumbado", "Curl máquina unilateral"],
      },

      // Superserie A · abductora + gemelo.
      {
        clave: "abductora",
        nombre: "Máquina abductora",
        series: 2, repMin: 15, repMax: 25, rir: "1–2",
        descanso: TRANSICION, ...AISLADO, ...P, ...ss("A", 1),
        musculos: ["glúteo medio"],
        alternativas: ["Abducción en cable con apoyo", "Banda solo como emergencia"],
      },
      {
        clave: "gemelo-pie",
        nombre: "Gemelo de pie",
        series: 2, repMin: 10, repMax: 15, rir: "1–2",
        ...d(90, 75, 105), ...AISLADO, ...ss("A", 2),
        musculos: ["gemelo"],
        nota: "Rodilla casi extendida, sin rebotes.",
        alternativas: ["Calf press en prensa", "Gemelo Smith"],
      },

      // Superserie B · extensión + laterales.
      {
        clave: "extension-cuadriceps",
        nombre: "Extensión de cuádriceps",
        series: 2, repMin: 10, repMax: 15, rir: "1–2",
        descanso: TRANSICION, ...AISLADO, ...ss("B", 1),
        musculos: ["cuádriceps"],
        alternativas: ["Otra máquina de extensión", "Esperar si no hay equivalente"],
      },
      {
        clave: "laterales",
        nombre: "Elevaciones laterales",
        series: 2, repMin: 12, repMax: 20, rir: "1–2",
        ...d(90, 75, 105), ...AISLADO, ...P, ...ss("B", 2), ...MAS,
        musculos: ["deltoide lateral"],
        alternativas: ["Cable lateral", "Mancuernas"],
      },

      // Superserie C · sóleo + tibial.
      {
        clave: "soleo",
        nombre: "Sóleo sentado",
        series: 2, repMin: 12, repMax: 20, rir: "1–2",
        descanso: TRANSICION, ...AISLADO, ...ss("C", 1),
        musculos: ["sóleo"],
        nota: "Rodilla flexionada.",
        alternativas: ["Seated calf machine", "Calf con rodilla flexionada"],
      },
      {
        clave: "tibial",
        nombre: "Tibial anterior",
        series: 2, repMin: 15, repMax: 25, rir: "1–2",
        ...d(75, 60, 90), ...AISLADO, ...ss("C", 2),
        musculos: ["tibial"],
        alternativas: ["Tib bar", "Dorsiflexión en cable o banda"],
      },
    ],
  },
];

/*
 * Nombre antiguo (normalizado) → clave nueva.
 *
 * Migra el historial de versiones anteriores de la rutina, cuando los ids se
 * construían con la posición y el nombre visible.
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
 * Series objetivo de un ejercicio.
 *
 * La versión agresiva NO es "más fallo": es exactamente una serie más en seis
 * ejercicios concretos, conservando RIR y técnica. Se pasa a ella solo después
 * de 6-8 semanas yendo bien, sin dolor y con el CaCo intacto.
 */
export function seriesObjetivo(ejercicio, { agresiva = false } = {}) {
  return ejercicio.series + (agresiva ? (ejercicio.extraAgresiva ?? 0) : 0);
}

/** Doble progresión. */
export const REGLAS_PROGRESION = [
  "Mantener el peso hasta llenar el rango de repeticiones en TODAS las series.",
  "Ejemplo con 3×8–12: 10/9/8 → 11/10/9 → 12/11/10 → 12/12/11 → 12/12/12.",
  "Al llegar al techo del rango con el RIR objetivo, subir el incremento MÍNIMO que permita la máquina.",
  "Con el peso nuevo es normal volver a 9/9/8. No es un retroceso.",
  "Mirar la tendencia de varias sesiones, no el resultado de una.",
];

/** Cómo usar el temporizador. */
export const REGLAS_DESCANSO = [
  "El reloj arranca solo al terminar la serie, con el descanso del ejercicio.",
  "El +30 s amplía solo ese descanso: no marca nada como fallido ni cambia la programación.",
  "Úsalo si aún respiras fuerte, el músculo sigue cargado o la serie anterior fue muy dura.",
  "En hack, prensa e hip thrust vale más 30 s extra y una gran serie que ahorrar medio minuto.",
  "En superserie el descanso va tras la pareja: entre los dos ejercicios solo hay 15 s.",
];

/** Qué NO emparejar nunca, y por qué. */
export const REGLAS_SUPERSERIE = [
  "Hack, hip thrust, prensa, jalón y remo principales: nunca en superserie.",
  "Presses y curl femoral tampoco: se quiere calidad de serie completa.",
  "Las laterales de Torso A y B van solas: son la prioridad de esas sesiones.",
  "Solo se emparejan accesorios con acciones opuestas o que no compiten entre sí.",
];

/** El descanso en texto: 150 → "2:30". */
export function descansoTexto(segundos) {
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;
}

/** El rango recomendado: "1:45–2:30". Null si el ejercicio no lo tiene. */
export function rangoDescansoTexto(ejercicio) {
  if (!ejercicio.descansoMin || !ejercicio.descansoMax) return null;
  return `${descansoTexto(ejercicio.descansoMin)}–${descansoTexto(ejercicio.descansoMax)}`;
}

/** "pierna-a" → "Pierna A". Un único sitio: había cuatro copias de este mapa. */
export function nombreDe(plantillaId) {
  return RUTINAS.find((r) => r.id === plantillaId)?.nombre ?? plantillaId;
}

/** El texto del rango de un ejercicio: "3×8–12". */
export function dosis(ej, opciones) {
  const series = seriesObjetivo(ej, opciones);
  const rango = ej.repMin === ej.repMax ? `${ej.repMin}` : `${ej.repMin}–${ej.repMax}`;
  return `${series}×${rango}`;
}

/** Series totales de una rutina, para comprobar la dosis de un vistazo. */
export function seriesTotales(rutina, opciones) {
  return rutina.ejercicios.reduce((t, e) => t + seriesObjetivo(e, opciones), 0);
}
