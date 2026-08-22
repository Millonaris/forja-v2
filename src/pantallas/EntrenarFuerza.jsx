/*
 * ENTRENAR > FUERZA (§8).
 *
 * Arriba, qué toca. Debajo, la rotación entera para ver de dónde vienes y a
 * dónde vas — sin ningún día de la semana atado a ninguna sesión, que es el
 * cambio de fondo respecto a la v1.
 *
 * Se puede empezar cualquier otra rutina: la app pregunta si mover la rotación
 * o no, y nunca lo decide en silencio.
 */

import { useState } from "react";

import Hoja, { Opciones } from "../componentes/Hoja.jsx";
import { RUTINAS } from "../datos/rutinas.js";
import { rampaDe, rirDeHoy } from "../datos/rampa.js";
import { useEstadoFuerza, useSesionAbierta, useSesionesFuerza } from "../ganchos/useDatos.js";
import { empezarSesionFuerza, omitirFuerza } from "../logica/acciones.js";
import { haceCuanto, hoyISO } from "../logica/fechas.js";
import * as motor from "../logica/motorFuerza.js";
import { pedirPermiso } from "../utiles/avisos.js";

export default function EntrenarFuerza({ alRetomarEntreno }) {
  const estado = useEstadoFuerza();
  const sesiones = useSesionesFuerza();
  const abierta = useSesionAbierta();

  const [conflicto, setConflicto] = useState(null);
  const [omitiendo, setOmitiendo] = useState(false);
  const [aviso, setAviso] = useState(null);

  if (!estado) return null;

  const toca = motor.siguiente(estado);
  const completadas = sesiones.filter((s) => s.estado === "completada");
  const ultima = motor.ultimaSesion(completadas);
  const rampa = rampaDe(hoyISO());

  async function empezar(plantillaId, avanzarRotacion = true) {
    const avisoRec = motor.avisoRecuperacion(ultima, plantillaId);
    if (avisoRec) {
      setAviso({ texto: avisoRec, plantillaId, avanzarRotacion });
      return;
    }
    // El permiso de notificaciones solo se puede pedir desde un toque, y este
    // lo es. Sin él no hay aviso de descanso con el móvil bloqueado.
    await pedirPermiso();
    await empezarSesionFuerza(plantillaId, { avanzarRotacion });
  }

  function elegir(plantillaId) {
    const choque = motor.conflictoDeRotacion(estado, plantillaId);
    if (choque) setConflicto({ ...choque, plantillaId });
    else empezar(plantillaId);
  }

  return (
    <>
      {/* ---------- Entreno plegado ---------- */}
      {abierta && (
        <button
          onClick={alRetomarEntreno}
          className="tarjeta entre"
          style={{ width: "100%", cursor: "pointer", textAlign: "left", borderColor: "var(--fuerza)" }}
        >
          <div>
            <div className="rotulo" style={{ color: "var(--fuerza)" }}>Entreno en curso</div>
            <div style={{ fontSize: 17, fontWeight: 800, marginTop: 4 }}>
              {nombreDe(abierta.plantillaId)}
            </div>
          </div>
          <span className="boton boton-primario">CONTINUAR</span>
        </button>
      )}

      {/* ---------- Lo que toca ---------- */}
      <div className="tarjeta columna" style={{ gap: 14 }}>
        <div>
          <div className="rotulo">Siguiente</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "var(--fuerza)", margin: "6px 0 12px" }}>
            {toca.nombre.toUpperCase()}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 13.5 }}>
            <Dato etiqueta="Último" valor={ultima ? nombreDe(ultima.plantillaId) : "—"} />
            <Dato etiqueta="Hace" valor={ultima ? haceCuanto(ultima.fecha) : "—"} />
            <Dato etiqueta="Rampa" valor={rampa ? "Activa" : "No activa"} />
            <Dato etiqueta="RIR objetivo" valor={rirDeHoy(hoyISO())} />
          </div>
        </div>

        <div className="acciones">
          <button className="boton boton-primario" onClick={() => empezar(toca.id)}>
            EMPEZAR AHORA
          </button>
          <button className="boton" onClick={() => setOmitiendo(true)}>OMITIR</button>
        </div>
      </div>

      {/* ---------- La rotación ---------- */}
      <div>
        <div className="rotulo" style={{ marginBottom: 10 }}>Rotación</div>
        <div className="fila" style={{ gap: 6, flexWrap: "wrap" }}>
          {RUTINAS.map((r, i) => {
            const esSiguiente = r.id === toca.id;
            const esUltima = r.id === ultima?.plantillaId;
            return (
              <span key={r.id} className="fila" style={{ gap: 6 }}>
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    padding: "7px 12px",
                    borderRadius: 999,
                    background: esSiguiente ? "var(--fuerza)" : "transparent",
                    color: esSiguiente ? "var(--fondo)" : esUltima ? "var(--exito)" : "var(--texto-tenue)",
                    border: `1px solid ${esSiguiente ? "var(--fuerza)" : esUltima ? "var(--exito)" : "var(--borde)"}`,
                  }}
                >
                  {r.nombre}
                </span>
                <span style={{ color: "var(--texto-tenue)", fontSize: 12 }}>
                  {i === RUTINAS.length - 1 ? "↻" : "→"}
                </span>
              </span>
            );
          })}
        </div>
        <p style={{ fontSize: 12.5, color: "var(--texto-tenue)", margin: "10px 0 0" }}>
          El orden solo avanza al completar una sesión, no al pasar los días.
        </p>
      </div>

      {/* ---------- Elegir otra ---------- */}
      <div>
        <div className="rotulo" style={{ marginBottom: 10 }}>Elegir otra rutina</div>
        <div className="columna" style={{ gap: 8 }}>
          {RUTINAS.map((r) => (
            <button
              key={r.id}
              onClick={() => elegir(r.id)}
              className="tarjeta entre"
              style={{ width: "100%", cursor: "pointer", textAlign: "left", padding: "14px 16px" }}
            >
              <span style={{ fontSize: 15, fontWeight: 700 }}>{r.nombre}</span>
              <span style={{ fontSize: 12.5, color: "var(--texto-tenue)" }}>
                {r.id === toca.id ? "siguiente en rotación" : `${r.ejercicios.length} ejercicios`}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ---------- Fuera de secuencia ---------- */}
      <Hoja
        abierta={Boolean(conflicto)}
        alCerrar={() => setConflicto(null)}
        titulo="No es la que toca"
        subtitulo={conflicto?.mensaje}
      >
        <Opciones
          opciones={(conflicto?.opciones ?? []).slice().reverse()}
          alElegir={(id) => {
            const plantillaId = conflicto.plantillaId;
            setConflicto(null);
            if (id === "avanzar") empezar(plantillaId, true);
            if (id === "sin-avanzar") empezar(plantillaId, false);
          }}
        />
      </Hoja>

      {/* ---------- Aviso de recuperación: avisa, no bloquea ---------- */}
      <Hoja
        abierta={Boolean(aviso)}
        alCerrar={() => setAviso(null)}
        titulo="Poca recuperación"
        subtitulo={aviso?.texto}
      >
        <Opciones
          opciones={[
            { id: "seguir", texto: "Entrenar igualmente" },
            { id: "cancelar", texto: "Dejarlo para otro día" },
          ]}
          alElegir={async (id) => {
            const guardado = aviso;
            setAviso(null);
            if (id === "seguir") {
              await pedirPermiso();
              await empezarSesionFuerza(guardado.plantillaId, {
                avanzarRotacion: guardado.avanzarRotacion,
              });
            }
          }}
        />
      </Hoja>

      {/* ---------- Omitir ---------- */}
      <Hoja
        abierta={omitiendo}
        alCerrar={() => setOmitiendo(false)}
        titulo={`Omitir ${toca.nombre}`}
        subtitulo="¿La saltas y sigues con la siguiente, o la dejas pendiente?"
      >
        <Opciones
          opciones={motor.OPCIONES_OMITIR}
          alElegir={async (id) => {
            if (id !== "cancelar") await omitirFuerza({ avanzar: id === "omitir-avanzar" });
            setOmitiendo(false);
          }}
        />
      </Hoja>
    </>
  );
}

function Dato({ etiqueta, valor }) {
  return (
    <span>
      <span style={{ color: "var(--texto-tenue)" }}>{etiqueta}: </span>
      <span style={{ fontWeight: 700 }}>{valor}</span>
    </span>
  );
}

const NOMBRES = {
  "torso-a": "Torso A", "pierna-a": "Pierna A",
  "torso-b": "Torso B", "pierna-b": "Pierna B",
};
const nombreDe = (id) => NOMBRES[id] ?? id;
