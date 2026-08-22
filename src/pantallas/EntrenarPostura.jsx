/*
 * ENTRENAR > POSTURA (§17).
 *
 * Es una tarea diaria de 8–10 minutos, así que está en primer nivel y no
 * escondida como en la v1. Cada ejercicio muestra una instrucción y un error,
 * porque leerlo mientras lo haces tiene que ser cuestión de un vistazo.
 */

import { EXTRAS, FRASE, ejerciciosDeHoy } from "../datos/rutinaPostural.js";
import { useAjustes, usePosturaHoy } from "../ganchos/useDatos.js";
import { useTemporizador, formatear } from "../ganchos/useTemporizador.js";
import { alternarPostura } from "../logica/acciones.js";
import { diasEntre, hoyISO } from "../logica/fechas.js";

export default function EntrenarPostura() {
  const ajustes = useAjustes();
  const hoy = usePosturaHoy();
  const crono = useTemporizador();

  const desdeInicio = ajustes?.creada ? diasEntre(ajustes.creada, hoyISO()) : 0;
  const lista = ejerciciosDeHoy(desdeInicio);
  const hechos = hoy?.hechos ?? [];
  const completa = hechos.length >= lista.length;

  return (
    <>
      <div className="tarjeta entre">
        <div>
          <div className="rotulo" style={{ color: "var(--postura)" }}>Rutina de hoy</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 5 }}>
            {hechos.length}/{lista.length}
          </div>
          <div className="dato" style={{ fontSize: 13, marginTop: 2 }}>8–10 min</div>
        </div>
        {completa && (
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--exito)" }}>Completa ✓</span>
        )}
      </div>

      <div className="columna" style={{ gap: 10 }}>
        {lista.map((e) => {
          const hecho = hechos.includes(e.id);
          return (
            <div
              key={e.id}
              className="tarjeta"
              style={{
                borderColor: hecho ? "rgba(113,217,139,.35)" : undefined,
                opacity: hecho ? 0.72 : 1,
              }}
            >
              <div className="entre" style={{ alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div className="entre" style={{ justifyContent: "flex-start", gap: 10 }}>
                    <span style={{ fontSize: 15.5, fontWeight: 800 }}>{e.nombre}</span>
                    <span className="chip" style={{ padding: "3px 9px", fontSize: 10.5 }}>{e.dosis}</span>
                  </div>
                  <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.45 }}>
                    {e.instruccion}
                  </p>
                  <p style={{ margin: "5px 0 0", fontSize: 12.5, color: "var(--aviso)", lineHeight: 1.4 }}>
                    Error típico: {e.error}
                  </p>
                </div>

                <button
                  onClick={() => alternarPostura(e.id, lista.length)}
                  aria-label={hecho ? `Desmarcar ${e.nombre}` : `Marcar ${e.nombre}`}
                  aria-pressed={hecho}
                  style={{
                    width: 40, height: 40, borderRadius: 11, flexShrink: 0, marginLeft: 12,
                    border: "none", cursor: "pointer", fontSize: 16, fontWeight: 800,
                    background: hecho ? "var(--exito)" : "var(--superficie-3)",
                    color: hecho ? "var(--fondo)" : "var(--texto-tenue)",
                  }}
                >
                  ✓
                </button>
              </div>

              {e.segundos && !hecho && (
                <button
                  onClick={() => crono.arrancar(e.segundos, { enSegundoPlano: false })}
                  className="boton-texto"
                  style={{ marginTop: 10, color: "var(--postura)" }}
                >
                  ▶ Contar {e.segundos} s
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="tarjeta">
        <div className="rotulo" style={{ color: "var(--postura)" }}>De pie, siempre</div>
        <p style={{ margin: "8px 0 0", fontSize: 14.5, lineHeight: 1.5 }}>{FRASE}</p>
      </div>

      <div className="tarjeta columna" style={{ gap: 8 }}>
        <div className="rotulo">Extras</div>
        {EXTRAS.map((x) => (
          <div key={x.nombre} className="entre" style={{ fontSize: 13.5 }}>
            <span>{x.nombre}</span>
            <span style={{ color: "var(--texto-tenue)", textAlign: "right" }}>
              {x.dosis} · {x.cuando}
            </span>
          </div>
        ))}
      </div>

      {crono.activo && (
        <div
          style={{
            position: "fixed",
            bottom: "calc(var(--alto-nav) + 12px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 60,
            background: crono.terminado ? "var(--exito)" : "var(--postura)",
            color: "var(--fondo)",
            borderRadius: 999,
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            boxShadow: "0 8px 30px rgba(0,0,0,.5)",
          }}
        >
          <span style={{ fontSize: 19, fontWeight: 800 }}>{formatear(crono.restante)}</span>
          <button onClick={crono.parar} style={{ background: "rgba(0,0,0,.18)", border: "none", borderRadius: 999, padding: "7px 12px", fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}>
            PARAR
          </button>
        </div>
      )}
    </>
  );
}
