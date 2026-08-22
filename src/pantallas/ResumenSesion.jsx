/*
 * Resumen al terminar (§11).
 *
 * Duración, series, mejoras principales y una recomendación corta. El detalle
 * completo va plegado: al acabar de entrenar nadie quiere una tabla.
 *
 * Las "mejoras" se calculan contra la última vez al MISMO peso, que es la
 * única comparación que significa algo en doble progresión.
 */

import { useState } from "react";

import { formatear as formatearTiempo } from "../ganchos/useTemporizador.js";
import { formatearPeso, repsTotales } from "../logica/progresion.js";

export default function ResumenSesion({ resumen, alCerrar }) {
  const [detalle, setDetalle] = useState(false);
  const { rutina, ejercicios, series, anteriores, duracion } = resumen;

  const porEjercicio = ejercicios
    .map((ejercicio) => {
      const hechas = series.filter((s) => s.ejercicioId === ejercicio.id && s.hecha);
      if (!hechas.length) return null;

      const previas = [...(anteriores.get(ejercicio.id)?.values() ?? [])];
      return {
        ejercicio,
        hechas,
        diferencia: previas.length ? repsTotales(hechas) - repsTotales(previas) : null,
      };
    })
    .filter(Boolean);

  const mejoras = porEjercicio.filter((e) => e.diferencia > 0);
  const volumen = series.reduce((t, s) => t + (s.hecha ? (s.kg ?? 0) * (s.reps ?? 0) : 0), 0);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, background: "var(--fondo)", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: "var(--ancho)",
          padding: `calc(26px + env(safe-area-inset-top)) var(--margen) calc(24px + env(safe-area-inset-bottom))`,
          overflowY: "auto",
        }}
        className="columna"
      >
        <div>
          <div className="rotulo" style={{ color: "var(--exito)" }}>Entreno guardado</div>
          <h1 className="titulo" style={{ marginTop: 8 }}>{rutina?.nombre}</h1>
        </div>

        <div className="tarjeta fila" style={{ gap: 24 }}>
          <Cifra etiqueta="Duración" valor={duracion ? formatearTiempo(duracion) : "—"} />
          <Cifra etiqueta="Series" valor={series.filter((s) => s.hecha).length} />
          <Cifra etiqueta="Volumen" valor={`${Math.round(volumen).toLocaleString("es-ES")} kg`} />
        </div>

        {mejoras.length > 0 && (
          <div className="tarjeta columna" style={{ gap: 8 }}>
            <div className="rotulo" style={{ color: "var(--exito)" }}>Mejoras</div>
            {mejoras.map(({ ejercicio, diferencia }) => (
              <div key={ejercicio.id} className="entre" style={{ fontSize: 14 }}>
                <span>{ejercicio.nombre}</span>
                <span style={{ color: "var(--exito)", fontWeight: 700 }}>+{diferencia} reps</span>
              </div>
            ))}
          </div>
        )}

        <button className="boton-texto" onClick={() => setDetalle(!detalle)} style={{ textAlign: "left" }}>
          {detalle ? "Ocultar detalle" : "Ver detalle completo"} ›
        </button>

        {detalle && (
          <div className="columna" style={{ gap: 14 }}>
            {porEjercicio.map(({ ejercicio, hechas }) => (
              <div key={ejercicio.id}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{ejercicio.nombre}</div>
                <div style={{ fontSize: 13, color: "var(--texto-medio)" }}>
                  {hechas
                    .sort((a, b) => a.numeroSerie - b.numeroSerie)
                    .map((s) => `${formatearPeso(s.kg)} × ${s.reps}${s.rir != null ? ` (RIR ${s.rir})` : ""}`)
                    .join("  ·  ")}
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="boton boton-primario" onClick={alCerrar} style={{ marginTop: "auto" }}>
          LISTO
        </button>
      </div>
    </div>
  );
}

function Cifra({ etiqueta, valor }) {
  return (
    <div>
      <div className="rotulo">{etiqueta}</div>
      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{valor}</div>
    </div>
  );
}
