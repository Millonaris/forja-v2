/*
 * Motor de carrera (§14, §15 y §29 de la spec).
 *
 * Igual que en fuerza, el progreso es por ESTADO y no por fecha: la siguiente
 * carrera depende de fase, bloque y sesiones completadas, nunca de que hoy sea
 * jueves. Un bloque no avanza porque cambie la semana del calendario.
 *
 * Y una sesión perdida no se amontona con la siguiente (§15): se mueve, se
 * omite o se queda pendiente, pero jamás se "recupera" pegándola a otra.
 */

import { BLOQUES, bloque as bloquePorNumero, describirSesion } from "../datos/planCarrera.js";
import { diasDesde } from "./fechas.js";

/** La sesión que toca ahora: bloque, posición dentro del bloque y contenido. */
export function siguiente(estado) {
  const numero = estado?.bloque ?? 1;
  const indice = (estado?.sesion ?? 1) - 1;
  const b = bloquePorNumero(numero);
  if (!b) return null;

  const sesion = b.sesiones[Math.min(indice, b.sesiones.length - 1)];
  return {
    bloque: b,
    numeroSesion: indice + 1,
    totalSesiones: b.sesiones.length,
    sesion,
    texto: describirSesion(sesion),
    esUltima: indice >= b.sesiones.length - 1,
  };
}

/**
 * Estado tras completar una sesión.
 *
 * Si era la última del bloque, NO avanza solo: devuelve `bloqueCompletado` y
 * espera respuesta (§14). Avanzar, repetir o revisar es decisión del usuario.
 */
export function completar(estado) {
  const actual = siguiente(estado);
  if (!actual) return { estado, bloqueCompletado: false };

  if (!actual.esUltima) {
    return {
      estado: { ...estado, id: 1, sesion: actual.numeroSesion + 1 },
      bloqueCompletado: false,
    };
  }

  return { estado, bloqueCompletado: true, bloque: actual.bloque.numero };
}

/** Preguntas del final de bloque (§14). */
export const CIERRE_BLOQUE = {
  pregunta: "¿Cómo ha ido el bloque?",
  respuestas: [
    { id: "bien", texto: "Fácil, bien", accion: "avanzar" },
    { id: "justo", texto: "Justo", accion: "repetir" },
    { id: "molestias", texto: "Con molestias", accion: "revisar" },
  ],
};

/** Avanza al bloque siguiente. Si no hay más, el plan está terminado. */
export function avanzarBloque(estado) {
  const siguienteNumero = (estado.bloque ?? 1) + 1;
  if (!bloquePorNumero(siguienteNumero)) {
    return { ...estado, id: 1, sesion: 1, terminado: true };
  }
  return { ...estado, id: 1, bloque: siguienteNumero, sesion: 1 };
}

/**
 * Repite el bloque actual. Se anota en `bloquesRepetidos` para que Progreso
 * pueda enseñarlo sin que parezca un fallo: repetir es parte del plan (§25).
 */
export function repetirBloque(estado) {
  const repetidos = [...(estado.bloquesRepetidos ?? []), estado.bloque];
  return { ...estado, id: 1, sesion: 1, bloquesRepetidos: repetidos };
}

/** Opciones al perder una carrera (§15). Ninguna la recupera automáticamente. */
export const OPCIONES_PERDIDA = [
  { id: "mover", texto: "Moverla a otro día" },
  { id: "omitir", texto: "Omitirla" },
  { id: "pendiente", texto: "Dejarla pendiente" },
];

/**
 * Aviso de días consecutivos (§15). Avisa, no bloquea, y lo dice como un dato,
 * no como una prohibición.
 */
export function avisoConsecutivo(ultimaCarrera) {
  if (!ultimaCarrera) return null;
  const dias = diasDesde(ultimaCarrera.fecha);
  if (dias === 0) return "Hoy ya has corrido.";
  if (dias === 1) return "Corriste ayer. Para esta fase es preferible recuperar.";
  return null;
}

/** Recomendación de HOY para la carrera. Igual de suave que en fuerza (§37). */
export function recomendacion(ultimaCarrera) {
  const dias = ultimaCarrera ? diasDesde(ultimaCarrera.fecha) : null;
  if (dias === null) return { texto: "cuando quieras empezar", tono: "bien" };
  if (dias === 0) return { texto: "ya has corrido hoy", tono: "neutro" };
  if (dias === 1) return { texto: "espera hasta mañana", tono: "aviso" };
  return { texto: "hoy", tono: "bien" };
}

/**
 * Aviso de tirada larga (§38): antes de una larga de más de 10 km conviene no
 * meter una pierna dura el día anterior. Se avisa; no se impide.
 */
export function avisoTiradaLarga(estado) {
  const proxima = siguiente(estado);
  const larga = proxima?.sesion?.larga && proxima.sesion.km > 10;
  return larga ? "La próxima larga pasa de 10 km: mejor no meter pierna dura el día antes." : null;
}

/** Cuántas sesiones lleva completadas el bloque actual, para la barra de progreso. */
export function progresoDeBloque(estado) {
  const b = bloquePorNumero(estado?.bloque ?? 1);
  if (!b) return { hechas: 0, total: 0 };
  return { hechas: (estado?.sesion ?? 1) - 1, total: b.sesiones.length };
}

/** Cuántos bloques quedan hasta los 20 km. */
export function bloquesRestantes(estado) {
  return Math.max(0, BLOQUES.length - (estado?.bloque ?? 1));
}
