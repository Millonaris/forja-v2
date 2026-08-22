import { useEffect, useRef, useState } from "react";

import NavInferior from "./componentes/NavInferior.jsx";
import { nombreDe } from "./datos/rutinas.js";
import { sembrar } from "./datos/semilla.js";
import { useAjustes, useSesionAbierta } from "./ganchos/useDatos.js";
import { formatear } from "./ganchos/useTemporizador.js";
import { mostrarEntrenoEnCurso, ocultarEntrenoEnCurso } from "./utiles/avisos.js";
import { configurarSenales } from "./utiles/senales.js";
import Ajustes from "./pantallas/Ajustes.jsx";
import Calibracion from "./pantallas/Calibracion.jsx";
import Dieta from "./pantallas/Dieta.jsx";
import Entrenar from "./pantallas/Entrenar.jsx";
import Hoy from "./pantallas/Hoy.jsx";
import Plan from "./pantallas/Plan.jsx";
import Progreso from "./pantallas/Progreso.jsx";
import ResumenSesion from "./pantallas/ResumenSesion.jsx";
import SesionFuerza from "./pantallas/SesionFuerza.jsx";

export default function App() {
  const [pestana, setPestana] = useState("hoy");
  const [sub, setSub] = useState(null);
  const [ajustesAbiertos, setAjustesAbiertos] = useState(false);
  const [sembrada, setSembrada] = useState(false);
  // Entreno plegado: sigue en curso, pero deja usar el resto de la app.
  const [plegado, setPlegado] = useState(false);
  // El resumen del entreno vive AQUÍ y no dentro de SesionFuerza: cerrar la
  // sesión hace que `useSesionAbierta` pase a null y desmonte SesionFuerza, y
  // un resumen guardado ahí dentro desaparecía con ella sin dar tiempo a leerlo.
  const [resumen, setResumen] = useState(null);

  const ajustes = useAjustes();
  const sesionAbierta = useSesionAbierta();

  // El plan se siembra en cada arranque: es idempotente y así una versión
  // nueva de la app puede añadir contenido sin tocar nada de lo registrado.
  useEffect(() => {
    sembrar().then(() => setSembrada(true));
  }, []);

  useEffect(() => {
    if (ajustes) configurarSenales({ vibracion: ajustes.vibracion, sonido: ajustes.sonido });
  }, [ajustes?.vibracion, ajustes?.sonido]);

  // Una sesión recién abierta se muestra entera. Solo se pliega a mano.
  useEffect(() => {
    if (sesionAbierta?.id) setPlegado(false);
  }, [sesionAbierta?.id]);

  /*
   * Con una sesión abierta, salir de la app deja una notificación fija de
   * "Entreno en curso"; tocarla vuelve al entreno y al volver desaparece sola.
   */
  useEffect(() => {
    if (!sesionAbierta) {
      ocultarEntrenoEnCurso();
      return undefined;
    }
    const nombre = nombreDe(sesionAbierta.plantillaId);
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === "hidden") mostrarEntrenoEnCurso(nombre);
      else ocultarEntrenoEnCurso();
    };
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    return () => {
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      ocultarEntrenoEnCurso();
    };
  }, [sesionAbierta?.id, sesionAbierta?.plantillaId]);

  /*
   * Gesto de atrás de Android. Al salir de HOY se apila una entrada de
   * historial; el gesto (o la flecha ‹) la consume y vuelve a HOY en vez de
   * cerrar la app, que es lo que hacía antes y desconcertaba.
   */
  const entradaApilada = useRef(false);
  useEffect(() => {
    const alRetroceder = () => {
      entradaApilada.current = false;
      setPestana("hoy");
      setSub(null);
    };
    window.addEventListener("popstate", alRetroceder);
    return () => window.removeEventListener("popstate", alRetroceder);
  }, []);

  function volverAHoy() {
    if (entradaApilada.current) history.back();
    else irA("hoy");
  }

  function irA(destino, subseccion = null) {
    // Re-tocar la pestaña en la que ya estás no debe remontar la pantalla:
    // Entrenar y Dieta van con key={sub}, y el remonte perdía la subpestaña y
    // cualquier hoja abierta.
    if (destino === pestana && subseccion === sub) return;
    if (destino !== "hoy" && !entradaApilada.current) {
      history.pushState({ forja: true }, "");
      entradaApilada.current = true;
    }
    setPestana(destino);
    setSub(subseccion);
  }

  if (!sembrada || ajustes === undefined) return <Cargando />;

  // Sin calibrar no hay nada que enseñar que no fuese inventado (§54).
  if (!ajustes?.calibrada) return <Calibracion alTerminar={() => irA("hoy")} />;

  return (
    <div className="lienzo con-nav">
      {pestana === "hoy" && (
        <Hoy
          irA={irA}
          alAbrirAjustes={() => setAjustesAbiertos(true)}
          alRetomarEntreno={() => setPlegado(false)}
        />
      )}
      {pestana === "entrenar" && (
        <Entrenar
          key={sub}
          sub={sub ?? "fuerza"}
          alRetomarEntreno={() => setPlegado(false)}
          alVolver={volverAHoy}
        />
      )}
      {pestana === "dieta" && <Dieta key={sub} sub={sub} alVolver={volverAHoy} />}
      {pestana === "progreso" && <Progreso sub={sub} alVolver={volverAHoy} />}
      {pestana === "plan" && <Plan sub={sub} alVolver={volverAHoy} />}

      <NavInferior activa={pestana} alCambiar={(p) => irA(p)} />

      {sesionAbierta && plegado && (
        <BarraEntreno sesion={sesionAbierta} alRetomar={() => setPlegado(false)} />
      )}

      {/* El entreno plegado se OCULTA, no se desmonta: el temporizador de
          descanso vive en su estado, y desmontarlo a mitad de descanso lo
          mataba — al volver no había cuenta atrás y el aviso en primer plano
          no sonaba (el service worker se calla cuando la app está visible). */}
      {sesionAbierta && (
        <SesionFuerza
          sesion={sesionAbierta}
          oculta={plegado}
          alPlegar={() => setPlegado(true)}
          alResumen={setResumen}
        />
      )}

      {resumen && <ResumenSesion resumen={resumen} alCerrar={() => setResumen(null)} />}

      <Ajustes abierto={ajustesAbiertos} alCerrar={() => setAjustesAbiertos(false)} />
    </div>
  );
}

/** Aviso flotante mientras el entreno está plegado. Toca y vuelves a él. */
function BarraEntreno({ sesion, alRetomar }) {
  const [duracion, setDuracion] = useState(0);

  useEffect(() => {
    const tick = () => setDuracion(Math.round((Date.now() - (sesion.empezada ?? Date.now())) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sesion.empezada]);

  return (
    <button
      onClick={alRetomar}
      style={{
        position: "fixed",
        bottom: "calc(var(--alto-nav) + 8px)",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(var(--ancho) - var(--margen) * 2)",
        zIndex: 50,
        background: "var(--fuerza)",
        color: "var(--fondo)",
        border: "none",
        borderRadius: 16,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        cursor: "pointer",
        boxShadow: "0 8px 30px rgba(0,0,0,.5)",
      }}
    >
      <span style={{ textAlign: "left" }}>
        <span style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".14em", opacity: 0.65 }}>
          ENTRENO EN CURSO
        </span>
        <span style={{ display: "block", fontSize: 15, fontWeight: 800, marginTop: 2 }}>
          {nombreDe(sesion.plantillaId)} · {formatear(duracion)}
        </span>
      </span>
      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".06em" }}>VOLVER ›</span>
    </button>
  );
}


function Cargando() {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100svh", width: "100%" }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".22em", color: "var(--fuerza)" }}>
        FORJA
      </div>
    </div>
  );
}
