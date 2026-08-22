import { useEffect, useState } from "react";

import NavInferior from "./componentes/NavInferior.jsx";
import { sembrar } from "./datos/semilla.js";
import { useAjustes, useSesionAbierta } from "./ganchos/useDatos.js";
import { configurarSenales } from "./utiles/senales.js";
import Ajustes from "./pantallas/Ajustes.jsx";
import Calibracion from "./pantallas/Calibracion.jsx";
import Entrenar from "./pantallas/Entrenar.jsx";
import Hoy from "./pantallas/Hoy.jsx";
import Plan from "./pantallas/Plan.jsx";
import Progreso from "./pantallas/Progreso.jsx";

export default function App() {
  const [pestana, setPestana] = useState("hoy");
  const [sub, setSub] = useState(null);
  const [ajustesAbiertos, setAjustesAbiertos] = useState(false);
  const [sembrada, setSembrada] = useState(false);

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

  function irA(destino, subseccion = null) {
    setPestana(destino);
    setSub(subseccion);
  }

  if (!sembrada || ajustes === undefined) return <Cargando />;

  // Sin calibrar no hay nada que enseñar que no fuese inventado (§54).
  if (!ajustes?.calibrada) return <Calibracion alTerminar={() => irA("hoy")} />;

  // Con un entreno en curso, la app entra directa a él: es lo que estabas
  // haciendo cuando cerraste.
  const enEntreno = Boolean(sesionAbierta);

  return (
    <div className={enEntreno ? "lienzo" : "lienzo con-nav"}>
      {pestana === "hoy" && <Hoy irA={irA} alAbrirAjustes={() => setAjustesAbiertos(true)} />}
      {pestana === "entrenar" && <Entrenar key={sub} sub={sub ?? "fuerza"} />}
      {pestana === "progreso" && <Progreso sub={sub} />}
      {pestana === "plan" && <Plan sub={sub} />}

      {!enEntreno && <NavInferior activa={pestana} alCambiar={(p) => irA(p)} />}

      <Ajustes abierto={ajustesAbiertos} alCerrar={() => setAjustesAbiertos(false)} />
    </div>
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
