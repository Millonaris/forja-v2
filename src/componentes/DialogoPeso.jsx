/*
 * Apuntar el peso. Dos toques desde HOY (§50).
 *
 * El teclado sale numérico y el campo viene enfocado: la idea es que se pueda
 * hacer con una mano al salir de la ducha, no que sea un formulario.
 */

import { useEffect, useState } from "react";

import { guardarPeso } from "../logica/acciones.js";
import Hoja from "./Hoja.jsx";

export default function DialogoPeso({ abierto, alCerrar, pesoActual, ultimo }) {
  const [valor, setValor] = useState("");

  useEffect(() => {
    if (abierto) setValor(pesoActual != null ? String(pesoActual).replace(".", ",") : "");
  }, [abierto, pesoActual]);

  const numero = Number(valor.replace(",", "."));
  const valido = valor !== "" && !Number.isNaN(numero) && numero > 20 && numero < 400;

  async function guardar() {
    if (!valido) return;
    await guardarPeso(numero);
    alCerrar();
  }

  return (
    <Hoja
      abierta={abierto}
      alCerrar={alCerrar}
      titulo="Peso de hoy"
      subtitulo={ultimo != null ? `La última vez: ${String(ultimo).replace(".", ",")} kg` : undefined}
    >
      <form
        onSubmit={(e) => { e.preventDefault(); guardar(); }}
        className="columna"
        style={{ gap: 16 }}
      >
        <div className="fila" style={{ gap: 12 }}>
          <input
            type="text"
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="95,4"
            autoFocus
            aria-label="Peso en kilos"
            style={{
              flex: 1,
              background: "var(--superficie)",
              border: "1px solid var(--borde)",
              borderRadius: 14,
              padding: "16px 18px",
              color: "var(--texto)",
              fontSize: 26,
              fontWeight: 800,
            }}
          />
          <span style={{ fontSize: 20, fontWeight: 700, color: "var(--texto-medio)" }}>kg</span>
        </div>

        <button type="submit" className="boton boton-primario" disabled={!valido}>
          GUARDAR
        </button>
      </form>
    </Hoja>
  );
}
