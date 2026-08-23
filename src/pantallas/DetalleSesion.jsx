/*
 * Detalle de un entreno pasado, con corrección (§52).
 *
 * Un 800 en vez de un 80 no es un caso raro: es el error de teclado más
 * probable de toda la app, y sin poder corregirlo envenena la progresión y la
 * referencia de "anterior" para siempre. Poder editar el pasado es lo que hace
 * que puedas fiarte de tus propios datos.
 *
 * Las correcciones quedan marcadas como `ajusteManual` para no confundirlas
 * con el registro original.
 */

import { useState } from "react";

import Hoja, { Opciones } from "../componentes/Hoja.jsx";
import { nombreDe } from "../datos/rutinas.js";
import { useCatalogoEjercicios, useSeriesDeSesion } from "../ganchos/useDatos.js";
import { borrarSerieId, borrarSesion, corregirSerie } from "../logica/acciones.js";
import { fechaLarga } from "../logica/fechas.js";
import { miles } from "../logica/formato.js";
import { formatear as formatearTiempo } from "../ganchos/useTemporizador.js";

export default function DetalleSesion({ sesion, alCerrar }) {
  const series = useSeriesDeSesion(sesion.id);
  const ejercicios = useCatalogoEjercicios();
  const [editando, setEditando] = useState(null);
  const [borrandoSesion, setBorrandoSesion] = useState(false);

  const porEjercicio = new Map();
  for (const serie of series) {
    if (!porEjercicio.has(serie.ejercicioId)) porEjercicio.set(serie.ejercicioId, []);
    porEjercicio.get(serie.ejercicioId).push(serie);
  }

  const nombreEjercicio = (id) => ejercicios.find((e) => e.id === id)?.nombre ?? id;
  const volumen = series.reduce((t, s) => t + (s.kg ?? 0) * (s.reps ?? 0), 0);

  return (
    <Hoja abierta alCerrar={alCerrar} titulo={fechaLarga(sesion.fecha)} subtitulo={nombreDe(sesion.plantillaId)}>
      <div className="columna" style={{ gap: 16 }}>
        <div className="tarjeta fila" style={{ gap: 24 }}>
          <Cifra etiqueta="Duración" valor={sesion.duracion ? formatearTiempo(sesion.duracion) : "—"} />
          <Cifra etiqueta="Series" valor={series.length} />
          <Cifra etiqueta="Volumen" valor={`${miles(Math.round(volumen))} kg`} />
        </div>

        <p style={{ margin: 0, fontSize: 12.5, color: "var(--texto-tenue)", lineHeight: 1.5 }}>
          Toca cualquier serie para corregirla.
        </p>

        {[...porEjercicio.entries()].map(([ejercicioId, lista]) => (
          <div key={ejercicioId} className="columna" style={{ gap: 7 }}>
            <div className="rotulo" style={{ color: "var(--fuerza)" }}>
              {nombreEjercicio(ejercicioId)}
            </div>
            {lista
              .sort((a, b) => a.numeroSerie - b.numeroSerie)
              .map((serie) => (
                <button
                  key={serie.id}
                  onClick={() => setEditando(serie)}
                  className="entre"
                  style={{
                    width: "100%",
                    background: "var(--superficie)",
                    border: "1px solid var(--borde)",
                    borderRadius: 12,
                    padding: "11px 14px",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 14,
                  }}
                >
                  <span style={{ color: "var(--texto-tenue)" }}>Serie {serie.numeroSerie}</span>
                  <span style={{ fontWeight: 700 }}>
                    {serie.kg ?? "—"} kg × {serie.reps ?? "—"}
                    {serie.rir != null && (
                      <span style={{ color: "var(--texto-tenue)", fontWeight: 400 }}>
                        {" "}· RIR {serie.rir}
                      </span>
                    )}
                    {serie.ajusteManual && (
                      <span style={{ color: "var(--aviso)", fontSize: 11, marginLeft: 6 }}>
                        corregida
                      </span>
                    )}
                  </span>
                </button>
              ))}
          </div>
        ))}

        <button
          className="boton-texto"
          style={{ textAlign: "center", color: "var(--texto-tenue)" }}
          onClick={() => setBorrandoSesion(true)}
        >
          Borrar este entreno entero
        </button>
      </div>

      {editando && (
        <EditorSerie
          serie={editando}
          nombre={nombreEjercicio(editando.ejercicioId)}
          alCerrar={() => setEditando(null)}
        />
      )}

      <Hoja
        abierta={borrandoSesion}
        alCerrar={() => setBorrandoSesion(false)}
        titulo="Borrar el entreno"
        subtitulo={
          "Se borran sus " + series.length + " series. La rotación NO vuelve atrás: " +
          "si quieres cambiarla, hazlo en Ajustes."
        }
      >
        <Opciones
          opciones={[
            { id: "cancelar", texto: "Conservarlo" },
            { id: "borrar", texto: "Borrarlo" },
          ]}
          alElegir={async (id) => {
            setBorrandoSesion(false);
            if (id === "borrar") {
              await borrarSesion(sesion.id);
              alCerrar();
            }
          }}
        />
      </Hoja>
    </Hoja>
  );
}

function EditorSerie({ serie, nombre, alCerrar }) {
  const [kg, setKg] = useState(serie.kg != null ? String(serie.kg).replace(".", ",") : "");
  const [reps, setReps] = useState(serie.reps != null ? String(serie.reps) : "");
  const [rir, setRir] = useState(serie.rir != null ? String(serie.rir) : "");

  const num = (v) => (v === "" ? null : Number(String(v).replace(",", ".")));
  const valido = reps !== "" && !Number.isNaN(num(reps));

  return (
    <Hoja abierta alCerrar={alCerrar} titulo={nombre} subtitulo={`Serie ${serie.numeroSerie}`}>
      <form
        className="columna"
        style={{ gap: 14 }}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!valido) return;
          await corregirSerie(serie.id, { kg: num(kg), reps: num(reps), rir: num(rir) });
          alCerrar();
        }}
      >
        <div className="fila" style={{ gap: 8 }}>
          <Campo etiqueta="kg" valor={kg} alCambiar={setKg} decimal />
          <Campo etiqueta="reps" valor={reps} alCambiar={setReps} />
          <Campo etiqueta="RIR" valor={rir} alCambiar={setRir} />
        </div>

        <button type="submit" className="boton boton-primario" disabled={!valido}>
          GUARDAR CORRECCIÓN
        </button>

        <button
          type="button"
          className="boton-texto"
          style={{ textAlign: "center" }}
          onClick={async () => {
            await borrarSerieId(serie.id);
            alCerrar();
          }}
        >
          Borrar esta serie
        </button>
      </form>
    </Hoja>
  );
}

function Campo({ etiqueta, valor, alCambiar, decimal }) {
  return (
    <label style={{ flex: 1 }}>
      <span className="rotulo" style={{ display: "block", marginBottom: 6 }}>{etiqueta}</span>
      <input
        type="text"
        inputMode={decimal ? "decimal" : "numeric"}
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        style={{
          width: "100%",
          background: "var(--superficie)",
          border: "1px solid var(--borde)",
          borderRadius: 12,
          padding: "13px 12px",
          color: "var(--texto)",
          fontSize: 19,
          fontWeight: 700,
          textAlign: "center",
        }}
      />
    </label>
  );
}

function Cifra({ etiqueta, valor }) {
  return (
    <div>
      <div className="rotulo">{etiqueta}</div>
      <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{valor}</div>
    </div>
  );
}
