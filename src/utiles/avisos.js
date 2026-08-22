/*
 * Avisos del descanso con la app en segundo plano.
 *
 * El problema, en corto: cuando sales de la app o bloqueas el móvil, Android
 * congela la pestaña y con ella cualquier `setTimeout` de la página. Un
 * temporizador hecho solo con JavaScript de la pantalla NO puede avisarte: se
 * queda parado y salta tarde, justo cuando vuelves a mirar.
 *
 * La única pieza que sigue viva es el service worker, así que el descanso se
 * programa allí (ver `public/sw-avisos.js`) y él lanza la notificación del
 * sistema, que es la que suena y vibra aunque el móvil esté en el bolsillo.
 *
 * Aquí solo está el lado de la página: pedir permiso y mandarle el encargo.
 */

/** Patrón de vibración del fin de descanso: reconocible sin mirar. */
export const PATRON = [220, 110, 220, 110, 380];

/** ¿Puede este navegador avisar en segundo plano? */
export function soportado() {
  return "serviceWorker" in navigator && "Notification" in window;
}

/** "concedido" | "denegado" | "sin-pedir" | "no-soportado" */
export function estadoPermiso() {
  if (!soportado()) return "no-soportado";
  if (Notification.permission === "granted") return "concedido";
  if (Notification.permission === "denied") return "denegado";
  return "sin-pedir";
}

/**
 * Pide permiso de notificaciones.
 *
 * Tiene que llamarse desde un gesto del usuario (un toque), o los navegadores
 * lo rechazan sin preguntar. Por eso se pide al empezar un entreno y no al
 * abrir la app.
 */
export async function pedirPermiso() {
  if (!soportado()) return "no-soportado";
  if (Notification.permission === "granted") return "concedido";
  if (Notification.permission === "denied") return "denegado";

  const respuesta = await Notification.requestPermission();
  return respuesta === "granted" ? "concedido" : "denegado";
}

async function trabajador() {
  if (!("serviceWorker" in navigator)) return null;
  // OJO: `ready` aquí sería un cuelgue, no una espera. Si no hay service
  // worker registrado (primer arranque, o el servidor de desarrollo), `ready`
  // no se resuelve JAMÁS — y `terminar()` la esperaba, así que el botón de
  // terminar el entreno se quedaba colgado para siempre. `getRegistration`
  // contesta al momento, con undefined si no hay nada.
  const registro = await navigator.serviceWorker.getRegistration();
  return registro?.active ?? null;
}

/**
 * Programa el aviso de fin de descanso.
 *
 * Se le pasa el hueco en milisegundos, no una hora: el service worker cuenta
 * con su propio reloj y así no hay que sincronizar nada.
 */
export async function programarFinDeDescanso(enMs, { ejercicio } = {}) {
  if (Notification.permission !== "granted") return false;

  const sw = await trabajador();
  if (!sw) return false;

  sw.postMessage({
    tipo: "programar-aviso",
    enMs: Math.max(0, Math.round(enMs)),
    titulo: "Descanso terminado",
    cuerpo: ejercicio ? `Toca la siguiente serie de ${ejercicio}.` : "Toca la siguiente serie.",
    patron: PATRON,
    // Tag fijo: un descanso nuevo reemplaza la notificación del anterior en
    // vez de apilarlas.
    tag: "forja-descanso",
  });

  return true;
}

/** Cancela el aviso pendiente: al saltar el descanso o terminar el entreno. */
export async function cancelarAviso() {
  const sw = await trabajador();
  sw?.postMessage({ tipo: "cancelar-aviso" });
}
