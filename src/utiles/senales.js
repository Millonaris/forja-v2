/*
 * Vibración y sonido del temporizador.
 *
 * En el gimnasio el móvil está en el suelo o en el bolsillo: el aviso de fin
 * de descanso tiene que notarse sin mirar la pantalla.
 */

let ajustes = { vibracion: true, sonido: false };

export function configurarSenales(nuevos) {
  ajustes = { ...ajustes, ...nuevos };
}

export function vibrar(patron = [180, 90, 180]) {
  if (!ajustes.vibracion) return;
  // No existe en iOS ni en escritorio: se ignora sin romper nada.
  navigator.vibrate?.(patron);
}

/*
 * Un pitido corto generado al vuelo. Sin fichero de audio que precachear ni
 * que descargar, y así el aviso funciona igual sin conexión.
 */
export function pitar() {
  if (!ajustes.sonido) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.frequency.value = 880;
    vol.gain.setValueAtTime(0.0001, ctx.currentTime);
    vol.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    vol.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.connect(vol).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.42);
    osc.onended = () => ctx.close();
  } catch {
    // Si el navegador bloquea el audio hasta que haya interacción, no pasa
    // nada: la vibración ya ha avisado.
  }
}

export function avisar() {
  vibrar();
  pitar();
}
