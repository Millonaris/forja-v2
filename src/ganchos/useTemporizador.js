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
  // Las opciones del arranque se recuerdan para que `sumar` reprograme el
  // despertador con el MISMO contrato: sin esto, un +30s perdía el nombre del
  // ejercicio en la notificación y armaba un aviso de sistema en temporizadores
  // que se pidieron solo de primer plano (postura).
  const opciones = useRef({});

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

  const arrancar = useCallback((segundos, nuevasOpciones = {}) => {
    yaAvisado.current = false;
    opciones.current = nuevasOpciones;
    setFinEn(Date.now() + segundos * 1000);
    if (nuevasOpciones.enSegundoPlano !== false) {
      programarFinDeDescanso(segundos * 1000, { ejercicio: nuevasOpciones.ejercicio });
    }
  }, []);

  const sumar = useCallback((segundos) => {
    yaAvisado.current = false;
    setFinEn((f) => {
      if (f == null) return null;
      const nuevo = f + segundos * 1000;
      // El despertador del service worker se reprograma entero: no sabe nada
      // de "sumar", solo de cuánto falta desde ahora. Se reenvían las opciones
      // del arranque para no perder el nombre del ejercicio por el camino.
      if (opciones.current.enSegundoPlano !== false) {
        programarFinDeDescanso(nuevo - Date.now(), { ejercicio: opciones.current.ejercicio });
      }
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
