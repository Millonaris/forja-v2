/*
 * Hoja inferior: el diálogo de toda la app.
 *
 * Sale desde abajo porque es donde llega el pulgar. Se cierra tocando fuera o
 * con Escape, y nunca se cierra sola: las decisiones de FORJA (omitir, avanzar
 * la rotación, cerrar un bloque) no se toman por descuido.
 */

import { useEffect } from "react";

export default function Hoja({ abierta, alCerrar, titulo, subtitulo, children }) {
  useEffect(() => {
    if (!abierta) return undefined;
    const alPulsar = (e) => e.key === "Escape" && alCerrar?.();
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [abierta, alCerrar]);

  if (!abierta) return null;

  return (
    <div
      onClick={alCerrar}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 95,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(0,0,0,.65)",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        style={{
          width: "var(--ancho)",
          background: "var(--superficie-2)",
          borderRadius: "24px 24px 0 0",
          padding: `22px var(--margen) calc(22px + env(safe-area-inset-bottom))`,
          maxHeight: "88svh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: 38,
            height: 4,
            borderRadius: 999,
            background: "rgba(255,255,255,.18)",
            margin: "-8px auto 16px",
          }}
        />
        {titulo && <h2 style={{ fontSize: 21, marginBottom: subtitulo ? 4 : 14 }}>{titulo}</h2>}
        {subtitulo && (
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--texto-medio)" }}>{subtitulo}</p>
        )}
        {children}
      </div>
    </div>
  );
}

/** Lista de opciones de una decisión. Ninguna se elige sola. */
export function Opciones({ opciones, alElegir }) {
  return (
    <div className="columna" style={{ gap: 8 }}>
      {opciones.map((o, i) => (
        <button
          key={o.id}
          onClick={() => alElegir(o.id)}
          className={`boton ${i === 0 ? "boton-primario" : ""}`}
          style={{ width: "100%", textAlign: "center" }}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}
