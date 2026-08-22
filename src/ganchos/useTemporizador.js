/*
 * Temporizador de descanso.
 *
 * Dos relojes, y los dos hacen falta:
 *
 *  1. El de la pantalla, para ver la cuenta atrás. Cuenta contra el reloj del
 *     sistema (no sumando segundos) para que al volver a la app el número sea
 *     el correcto y no el que se quedó congelado.
 *
 *  2. El del service worker, que es el que AVISA. Con el móvil bloqueado o la
 *     app en segundo plano, Android congela la pestaña y este `setInterval`
 *     deja de correr: si el aviso dependiera de él, saltaría tarde. Ver
 *     `utiles/avisos.js`.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { cancelarAviso, programarFinDeDescanso } from "../utiles/avisos.js";
import { avisar } from "../utiles/senales.js";

export function useTemporizador() {
  const [finEn, setFinEn] = useState(null);
  const [restante, setRestante] = useState(0);
  const yaAvisado = useRef(false);

  useEffect(() => {
    if (finEn == null) return undefined;

    const tick = () => {
      const quedan = Math.max(0, Math.round((finEn - Date.now()) / 1000));
      setRestante(quedan);
      if (quedan === 0 && !yaAvisado.current) {
        yaAvisado.current = true;
        // Con la app delante avisa la propia pantalla; el service worker se
        // calla al ver que hay una ventana visible, para no duplicar el ruido.
        avisar();
      }
    };

    tick();
    const id = setInterval(tick, 250);

    // Android puede congelar el intervalo: al volver, se recalcula de golpe.
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [finEn]);

  const arrancar = useCallback((segundos, opciones = {}) => {
    yaAvisado.current = false;
    setFinEn(Date.now() + segundos * 1000);
    if (opciones.enSegundoPlano !== false) {
      programarFinDeDescanso(segundos * 1000, { ejercicio: opciones.ejercicio });
    }
  }, []);

  const sumar = useCallback((segundos) => {
    yaAvisado.current = false;
    setFinEn((f) => {
      if (f == null) return null;
      const nuevo = f + segundos * 1000;
      // El despertador del service worker se reprograma entero: no sabe nada
      // de "sumar", solo de cuánto falta desde ahora.
      programarFinDeDescanso(nuevo - Date.now());
      return nuevo;
    });
  }, []);

  const parar = useCallback(() => {
    setFinEn(null);
    setRestante(0);
    cancelarAviso();
  }, []);

  return {
    activo: finEn != null,
    restante,
    terminado: finEn != null && restante === 0,
    texto: formatear(restante),
    arrancar,
    sumar,
    parar,
  };
}

/** 125 → "2:05". */
export function formatear(segundos) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
