/*
 * Motor de fuerza (§28 de la spec).
 *
 * La idea entera del rediseño cabe en una frase: la rotación avanza cuando
 * completas una sesión, NO cuando pasa un día.
 *
 *   TORSO A → PIERNA A → TORSO B → PIERNA B → ↻
 *
 * Por eso aquí no entra ninguna fecha para decidir qué toca. Las fechas solo
 * sirven para dar contexto ("hace 2 días") y para avisar de recuperación, y un
 * aviso nunca bloquea (§16, prueba §40-E).
 */

import { ROTACION, RUTINAS } from "../datos/rutinas.js";
import { diasDesde } from "./fechas.js";

/** La rutina que toca ahora. */
export function siguiente(estado) {
  const id = ROTACION[(estado?.indiceSiguiente ?? 0) % ROTACION.length];
  return RUTINAS.find((r) => r.id === id);
}

/** La que vendría después de una dada. */
export function tras(plantillaId) {
  const i = ROTACION.indexOf(plantillaId);
  if (i === -1) return siguiente(null);
  return RUTINAS.find((r) => r.id === ROTACION[(i + 1) % ROTACION.length]);
}

/**
 * Estado nuevo tras cerrar una sesión.
 *
 * `avanzar` es explícito porque el usuario puede haber hecho una rutina fuera
 * de secuencia y haber elegido no mover la rotación (§8). Nunca se decide en
 * silencio.
 */
export function avanzar(estado, plantillaId, { avanzarRotacion = true } = {}) {
  const base = { ...estado, id: 1, ultimaCompletada: plantillaId };
  if (!avanzarRotacion) return base;

  const i = ROTACION.indexOf(plantillaId);
  return { ...base, indiceSiguiente: (i === -1 ? 0 : i + 1) % ROTACION.length };
}

/**
 * Qué preguntar cuando se elige una rutina distinta a la que toca (§8).
 * Devuelve null si coincide con la rotación: entonces no hay nada que preguntar.
 */
export function conflictoDeRotacion(estado, plantillaId) {
  const toca = siguiente(estado);
  if (toca.id === plantillaId) return null;

  const elegida = RUTINAS.find((r) => r.id === plantillaId);
  return {
    mensaje: `Según la rotación toca ${toca.nombre}. ¿Quieres hacer ${elegida.nombre}?`,
    opciones: [
      { id: "cancelar", texto: "Cancelar" },
      { id: "sin-avanzar", texto: "Hacerla sin mover la rotación" },
      { id: "avanzar", texto: "Hacerla y seguir desde ahí" },
    ],
  };
}

/**
 * Qué preguntar al omitir la sesión que toca (§28). Nunca se asume: omitir y
 * avanzar, o dejarla pendiente, son decisiones distintas.
 */
export const OPCIONES_OMITIR = [
  { id: "omitir-avanzar", texto: "Omitir y avanzar" },
  { id: "pendiente", texto: "Mantener pendiente" },
  { id: "cancelar", texto: "Cancelar" },
];

/** La última sesión registrada, o null si aún no hay historial. */
export function ultimaSesion(sesiones) {
  if (!sesiones?.length) return null;
  return sesiones.reduce((a, b) => (a.fecha >= b.fecha ? a : b));
}

/**
 * Aviso de recuperación. Devuelve un texto o null.
 *
 * Avisa, no impide (§40-E). El tono importa: es información, no una regañina
 * (§37) — de ahí "ayer entrenaste" y no "no deberías".
 */
export function avisoRecuperacion(ultima, plantillaId) {
  if (!ultima) return null;
  const dias = diasDesde(ultima.fecha);
  if (dias === null || dias > 1) return null;

  const mismaZona = zona(ultima.plantillaId) === zona(plantillaId);
  if (dias === 0) {
    return mismaZona
      ? "Hoy ya has entrenado esa zona. Puedes hacerlo igualmente."
      : "Hoy ya has entrenado. Dos sesiones el mismo día es mucho.";
  }
  return mismaZona
    ? "Ayer entrenaste la misma zona. Le queda recuperación pendiente."
    : null;
}

/** "torso-a" → "torso". Para saber si dos sesiones pisan el mismo terreno. */
function zona(plantillaId) {
  return plantillaId?.startsWith("pierna") ? "pierna" : "torso";
}

/**
 * Recomendación de HOY para la fuerza. Texto corto, nunca imperativo (§6).
 *
 * `objetivoSemanal` son ~3 sesiones cada 7 días (§38). Si ya se va sobrado, la
 * app lo dice sin dramatizar; si toca, lo sugiere sin ordenarlo.
 */
export function recomendacion(ultima, sesionesUltimos7 = 0) {
  const dias = ultima ? diasDesde(ultima.fecha) : null;

  if (dias === 0) return { texto: "ya has entrenado hoy", tono: "neutro" };
  if (dias === 1 && sesionesUltimos7 >= 3) {
    return { texto: "vas sobrado esta semana, puedes descansar", tono: "neutro" };
  }
  if (dias === null) return { texto: "cuando quieras empezar", tono: "bien" };
  if (dias >= 2) return { texto: "hoy", tono: "bien" };
  return { texto: "hoy o mañana", tono: "bien" };
}
