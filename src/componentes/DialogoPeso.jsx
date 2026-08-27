/*
 * Apuntar el peso. Dos toques desde HOY (§50).
 *
 * El teclado sale numérico y el campo viene enfocado: la idea es que se pueda
 * hacer con una mano al salir de la ducha, no que sea un formulario.
 *
 * También se puede apuntar el de AYER: pesarse y olvidarse de abrir la app
 * pasa (pasó el primer día del plan), y perder ese dato duele en la media de
 * 7 días y sobre todo en la calibración de septiembre, que vive de pesajes
 * diarios. Solo ayer, no un calendario entero: el registro de días viejos a
 * ojo vale poco y complicaría un diálogo que se usa recién duchado.
 */

import { useEffect, useState } from "react";

import { guardarPeso } from "../logica/acciones.js";
import { hoyISO, sumarDias } from "../logica/fechas.js";
import Hoja from "./Hoja.jsx";

export default function DialogoPeso({ abierto, alCerrar, pesoActual, pesoAyer, ultimo }) {
  const [valor, setValor] = useState("");
  const [dia, setDia] = useState("hoy");

  useEffect(() => {
    if (abierto) {
      setDia("hoy");
      setValor(pesoActual != null ? String(pesoActual).replace(".", ",") : "");
    }
  }, [abierto, pesoActual]);

  // Al cambiar de día se enseña lo ya guardado de ESE día, para corregirlo.
  function cambiarDia(nuevo) {
    setDia(nuevo);
    const guardado = nuevo === "hoy" ? pesoActual : pesoAyer;
    setValor(guardado != null ? String(guardado).replace(".", ",") : "");
  }

  const numero = Number(valor.replace(",", "."));
  const valido = valor !== "" && !Number.isNaN(numero) && numero > 20 && numero < 400;

  async function guardar() {
    if (!valido) return;
    await guardarPeso(numero, dia === "hoy" ? hoyISO() : sumarDias(hoyISO(), -1));
    alCerrar();
  }

  return (
    <Hoja
      abierta={abierto}
      alCerrar={alCerrar}
      titulo={dia === "hoy" ? "Peso de hoy" : "Peso de ayer"}
      subtitulo={ultimo != null ? `La última vez: ${String(ultimo).replace(".", ",")} kg` : undefined}
    >
      <form
        onSubmit={(e) => { e.preventDefault(); guardar(); }}
        className="columna"
        style={{ gap: 16 }}
      >
        <div className="fila" style={{ gap: 6 }}>
          {[
            { id: "hoy", texto: "HOY" },
            { id: "ayer", texto: "AYER" },
          ].map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => cambiarDia(d.id)}
              aria-pressed={dia === d.id}
              style={{
                flex: 1, borderRadius: 999, padding: "9px 6px",
                fontSize: 11.5, fontWeight: 800, letterSpacing: ".05em", cursor: "pointer",
                background: dia === d.id ? "var(--texto)" : "transparent",
                border: `1px solid ${dia === d.id ? "var(--texto)" : "var(--borde)"}`,
                color: dia === d.id ? "var(--fondo)" : "var(--texto-tenue)",
              }}
            >
              {d.texto}
            </button>
          ))}
        </div>

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
