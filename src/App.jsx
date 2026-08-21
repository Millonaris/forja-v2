import { useState } from "react";

import NavInferior from "./componentes/NavInferior.jsx";
import Hoy from "./pantallas/Hoy.jsx";
import Entrenar from "./pantallas/Entrenar.jsx";
import Progreso from "./pantallas/Progreso.jsx";
import Plan from "./pantallas/Plan.jsx";

export default function App() {
  const [pestana, setPestana] = useState("hoy");

  return (
    <div className="lienzo con-nav">
      {pestana === "hoy" && <Hoy irA={setPestana} />}
      {pestana === "entrenar" && <Entrenar />}
      {pestana === "progreso" && <Progreso />}
      {pestana === "plan" && <Plan />}

      <NavInferior activa={pestana} alCambiar={setPestana} />
    </div>
  );
}
