/*
 * ENTRENAR (§7). Un selector con los tres pilares que se ejecutan: fuerza,
 * carrera y postura. Lo que se consulta vive en PLAN; aquí solo se hace.
 */

import { useState } from "react";

import Volver from "../componentes/Volver.jsx";

import EntrenarCarrera from "./EntrenarCarrera.jsx";
import EntrenarFuerza from "./EntrenarFuerza.jsx";
import EntrenarPostura from "./EntrenarPostura.jsx";

const PESTANAS = [
  { id: "fuerza", texto: "FUERZA", color: "var(--fuerza)" },
  { id: "carrera", texto: "CARRERA", color: "var(--carrera)" },
  { id: "postura", texto: "POSTURA", color: "var(--postura)" },
];

export default function Entrenar({ sub = "fuerza", alRetomarEntreno, alVolver }) {
  const [activa, setActiva] = useState(sub);

  return (
    <div style={{ padding: "20px var(--margen) 0" }} className="columna">
      <div className="fila" style={{ gap: 12, paddingTop: 10 }}>
        <Volver alVolver={alVolver} />
        <h1 className="titulo">Entrenar</h1>
      </div>

      <div className="fila" style={{ gap: 8 }}>
        {PESTANAS.map((p) => {
          const puesta = p.id === activa;
          return (
            <button
              key={p.id}
              onClick={() => setActiva(p.id)}
              aria-pressed={puesta}
              style={{
                flex: 1,
                borderRadius: 999,
                padding: "11px 6px",
                fontSize: 12.5,
                fontWeight: 800,
                letterSpacing: ".05em",
                cursor: "pointer",
                background: puesta ? p.color : "transparent",
                border: `1px solid ${puesta ? p.color : "var(--borde)"}`,
                color: puesta ? "var(--fondo)" : "var(--texto-tenue)",
              }}
            >
              {p.texto}
            </button>
          );
        })}
      </div>

      {activa === "fuerza" && <EntrenarFuerza alRetomarEntreno={alRetomarEntreno} />}
      {activa === "carrera" && <EntrenarCarrera />}
      {activa === "postura" && <EntrenarPostura />}
    </div>
  );
}
