/*
 * Wake Lock: mantiene la pantalla encendida mientras entrenas.
 *
 * Sin esto el móvil se bloquea a los 30 s y hay que desbloquearlo con las
 * manos sudadas cada vez que quieres apuntar una serie.
 *
 * No sustituye al aviso del service worker: si bloqueas la pantalla a mano o
 * te vas a otra app, esto se suelta y el que avisa es el despertador.
 */

import { useEffect, useRef } from "react";

export function useWakeLock(activo) {
  const bloqueo = useRef(null);

  useEffect(() => {
    if (!activo || !("wakeLock" in navigator)) return undefined;

    let cancelado = false;

    const pedir = async () => {
      try {
        if (document.visibilityState !== "visible") return;
        bloqueo.current = await navigator.wakeLock.request("screen");
        // Si el sistema lo suelta por su cuenta, dejamos la referencia limpia.
        bloqueo.current.addEventListener("release", () => {
          bloqueo.current = null;
        });
      } catch {
        // Batería baja o permiso denegado: la app sigue funcionando igual.
      }
    };

    // Android suelta el bloqueo al cambiar de app o apagar la pantalla, así
    // que hay que volver a pedirlo cada vez que la app se hace visible.
    const alVolver = () => {
      if (!cancelado && document.visibilityState === "visible" && !bloqueo.current) pedir();
    };

    pedir();
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      cancelado = true;
      document.removeEventListener("visibilitychange", alVolver);
      bloqueo.current?.release().catch(() => {});
      bloqueo.current = null;
    };
  }, [activo]);
}
