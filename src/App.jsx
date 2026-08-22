import { useEffect, useState } from "react";

import NavInferior from "./componentes/NavInferior.jsx";
import { sembrar } from "./datos/semilla.js";
import { useAjustes, useSesionAbierta } from "./ganchos/useDatos.js";
import { formatear } from "./ganchos/useTemporizador.js";
import { configurarSenales } from "./utiles/senales.js";
import Ajustes from "./pantallas/Ajustes.jsx";
import Calibracion from "./pantallas/Calibracion.jsx";
import Dieta from "./pantallas/Dieta.jsx";
import Entrenar from "./pantallas/Entrenar.jsx";
import Hoy from "./pantallas/Hoy.jsx";
import Plan from "./pantallas/Plan.jsx";
import Progreso from "./pantallas/Progreso.jsx";
import SesionFuerza from "./pantallas/SesionFuerza.jsx";

export default function App() {
  const [pestana, setPestana] = useState("hoy");
  const [sub, setSub] = useState(null);
  const [ajustesAbiertos, setAjustesAbiertos] = useState(false);
  const [sembrada, setSembrada] = useState(false);
  // Entreno plegado: sigue en curso, pero deja usar el resto de la app.
  const [plegado, setPlegado] = useState(false);

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

  function irA(destino, subseccion = null) {
    setPestana(destino);
    setSub(subseccion);
  }

  if (!sembrada || ajustes === undefined) return <Cargando />;

  // Sin calibrar no hay nada que enseñar que no fuese inventado (§54).
  if (!ajustes?.calibrada) return <Calibracion alTerminar={() => irA("hoy")} />;

  // El entreno se pliega, no se cierra: puedes consultar el plan o apuntar el
  // peso a mitad de sesión sin perder nada. Sin esto, empezar un entreno
  // dejaba la app sin barra de pestañas y sin salida que no fuese terminarlo.
  const enEntreno = Boolean(sesionAbierta) && !plegado;

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
        <Entrenar key={sub} sub={sub ?? "fuerza"} alRetomarEntreno={() => setPlegado(false)} />
      )}
      {pestana === "dieta" && <Dieta key={sub} sub={sub} />}
      {pestana === "progreso" && <Progreso sub={sub} />}
      {pestana === "plan" && <Plan sub={sub} />}

      <NavInferior activa={pestana} alCambiar={(p) => irA(p)} />

      {sesionAbierta && plegado && (
        <BarraEntreno sesion={sesionAbierta} alRetomar={() => setPlegado(false)} />
      )}

      {enEntreno && (
        <SesionFuerza sesion={sesionAbierta} alPlegar={() => setPlegado(true)} />
      )}

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
          {NOMBRES[sesion.plantillaId] ?? sesion.plantillaId} · {formatear(duracion)}
        </span>
      </span>
      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".06em" }}>VOLVER ›</span>
    </button>
  );
}

const NOMBRES = {
  "torso-a": "Torso A", "pierna-a": "Pierna A",
  "torso-b": "Torso B", "pierna-b": "Pierna B",
};

function Cargando() {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100svh", width: "100%" }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".22em", color: "var(--fuerza)" }}>
        FORJA
      </div>
    </div>
  );
}
