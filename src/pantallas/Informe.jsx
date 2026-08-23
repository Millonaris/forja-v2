/*
 * PROGRESO > INFORME (§53).
 *
 * Genera un Markdown con todo lo del periodo para pegárselo a un entrenador o
 * a una IA. Es la función que convierte meses de registro en algo que otra
 * persona puede leer y usarlo para ajustarte el plan.
 */

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../datos/db.js";
import { PERIODOS, generarInforme } from "../logica/informe.js";

export default function Informe() {
  const [dias, setDias] = useState(14);
  const [copiado, setCopiado] = useState(false);
  const datos = useDatosDelInforme();

  if (!datos) return null;
  const texto = generarInforme(datos, { dias });

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles queda descargar o compartir.
      setCopiado(false);
    }
  }

  function descargar() {
    const blob = new Blob([texto], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forja-revision-${dias}d.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function compartir() {
    // En el móvil esto abre la hoja de compartir del sistema: WhatsApp, correo,
    // notas… Es la vía natural para mandárselo a alguien.
    try {
      await navigator.share({ title: "FORJA · Revisión", text: texto });
    } catch {
      // Cancelado o no soportado: los otros dos botones siguen ahí.
    }
  }

  return (
    <>
      <div className="fila" style={{ gap: 6 }}>
        {PERIODOS.map((p) => (
          <button
            key={p.dias}
            onClick={() => setDias(p.dias)}
            aria-pressed={p.dias === dias}
            className="chip"
            style={{
              flex: 1,
              cursor: "pointer",
              textAlign: "center",
              background: p.dias === dias ? "var(--texto)" : "var(--superficie-3)",
              color: p.dias === dias ? "var(--fondo)" : undefined,
              borderColor: p.dias === dias ? "var(--texto)" : undefined,
            }}
          >
            {p.texto}
          </button>
        ))}
      </div>

      <div className="acciones">
        <button className="boton boton-primario" onClick={copiar}>
          {copiado ? "COPIADO ✓" : "COPIAR"}
        </button>
        <button className="boton" onClick={descargar}>.MD</button>
        {typeof navigator !== "undefined" && navigator.share && (
          <button className="boton" onClick={compartir}>ENVIAR</button>
        )}
      </div>

      <p style={{ margin: 0, fontSize: 12.5, color: "var(--texto-tenue)", lineHeight: 1.55 }}>
        Se genera con tus datos de los últimos {dias} días. No incluye las fotos.
      </p>

      {/* Vista previa: lo que se copia es exactamente esto, sin sorpresas. */}
      <div className="tarjeta" style={{ padding: "14px 16px" }}>
        <pre
          style={{
            margin: 0,
            fontSize: 11.5,
            lineHeight: 1.6,
            color: "var(--texto-medio)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            maxHeight: "50svh",
            overflowY: "auto",
          }}
        >
          {texto}
        </pre>
      </div>
    </>
  );
}

/*
 * El informe necesita casi todas las tablas a la vez. Se leen aquí de una sola
 * vez en lugar de encadenar diez hooks: es una pantalla de consulta, no se
 * abre a menudo, y así el generador recibe todo junto y se puede probar sin
 * base de datos.
 */
function useDatosDelInforme() {
  return useLiveQuery(async () => {
    const [
      pesos, mediciones, fotos, sesiones, series, ejercicios,
      carreras, postura, testsPared, diario, ajustes, estadoFuerza, estadoCarrera,
    ] = await Promise.all([
      db.pesos.orderBy("fecha").toArray(),
      db.mediciones.toArray(),
      db.fotos.toArray(),
      db.sesionesFuerza.toArray(),
      db.series.toArray(),
      db.ejercicios.toArray(),
      db.carreras.toArray(),
      db.postura.toArray(),
      db.testsPared.orderBy("fecha").reverse().toArray(),
      db.diario.toArray(),
      db.ajustes.get(1),
      db.estadoFuerza.get(1),
      db.estadoCarrera.get(1),
    ]);

    return {
      pesos, mediciones, fotos, sesiones, series, ejercicios,
      carreras, postura, testsPared, diario,
      ajustes: ajustes ?? {},
      estadoFuerza: estadoFuerza ?? { indiceSiguiente: 0 },
      estadoCarrera: estadoCarrera ?? { bloque: 1, sesion: 1 },
    };
  }, []);
}
