/*
 * Temporizador de descanso.
 *
 * Cuenta contra el reloj del sistema, no sumando segundos: si Android duerme
 * la pestaña o bloqueas la pantalla a mitad del descanso, al volver el tiempo
 * es el correcto. Un temporizador que se queda parado en el bolsillo es peor
 * que no tenerlo.
 */

import { useCallback, useEffect, useRef, useState } from "react";

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
        avisar();
      }
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [finEn]);

  const arrancar = useCallback((segundos) => {
    yaAvisado.current = false;
    setFinEn(Date.now() + segundos * 1000);
  }, []);

  const sumar = useCallback((segundos) => {
    yaAvisado.current = false;
    setFinEn((f) => (f == null ? null : f + segundos * 1000));
  }, []);

  const parar = useCallback(() => {
    setFinEn(null);
    setRestante(0);
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
