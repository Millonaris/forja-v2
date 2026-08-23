/*
 * Hoja para apuntar un número suelto: cintura, un test, lo que sea.
 *
 * Existe porque el diálogo del peso ya demostró la forma correcta — campo
 * enfocado, teclado numérico, un botón — y repetirla a mano en cada sitio
 * acaba en cuatro versiones distintas del mismo formulario.
 */

import { useEffect, useState } from "react";

import Hoja from "./Hoja.jsx";

export default function DialogoNumero({
  abierto,
  alCerrar,
  titulo,
  subtitulo,
  unidad,
  marcador,
  valorInicial,
  min = 0,
  max = 1000,
  alGuardar,
  alBorrar,
}) {
  const [valor, setValor] = useState("");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    if (!abierto) return;
    setValor(valorInicial?.valor != null ? String(valorInicial.valor).replace(".", ",") : "");
    setNotas(valorInicial?.notas ?? "");
  }, [abierto, valorInicial?.valor, valorInicial?.notas]);

  const numero = Number(valor.replace(",", "."));
  const valido = valor !== "" && !Number.isNaN(numero) && numero > min && numero < max;

  async function guardar(e) {
    e.preventDefault();
    if (!valido) return;
    await alGuardar({ valor: numero, notas: notas.trim() });
    alCerrar();
  }

  return (
    <Hoja abierta={abierto} alCerrar={alCerrar} titulo={titulo} subtitulo={subtitulo}>
      <form onSubmit={guardar} className="columna" style={{ gap: 14 }}>
        <div className="fila" style={{ gap: 12 }}>
          <input
            type="text"
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={marcador}
            autoFocus
            aria-label={titulo}
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
          {unidad && (
            <span style={{ fontSize: 20, fontWeight: 700, color: "var(--texto-medio)" }}>{unidad}</span>
          )}
        </div>

        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Nota (opcional)"
          rows={2}
          style={{
            background: "var(--superficie)",
            border: "1px solid var(--borde)",
            borderRadius: 14,
            padding: "12px 14px",
            color: "var(--texto)",
            fontSize: 14,
            resize: "none",
          }}
        />

        <button type="submit" className="boton boton-primario" disabled={!valido}>
          GUARDAR
        </button>

        {alBorrar && valorInicial?.valor != null && (
          <button
            type="button"
            className="boton-texto"
            style={{ textAlign: "center" }}
            onClick={async () => {
              await alBorrar();
              alCerrar();
            }}
          >
            Borrar este registro
          </button>
        )}
      </form>
    </Hoja>
  );
}
