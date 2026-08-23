/*
 * Fotos de progreso (§18, §26).
 *
 * La báscula no ve lo que ve una foto: dos meses con el mismo peso pueden
 * verse completamente distintos. Por eso lo importante aquí no es la galería,
 * es la COMPARACIÓN — dos fotos lado a lado, la primera y la última por
 * defecto, que es la que cuenta la historia real.
 *
 * Todo local: la imagen se comprime y se guarda como Blob en IndexedDB. No
 * sale del móvil ni se sube a ningún sitio.
 */

import { useEffect, useMemo, useRef, useState } from "react";

import { useFotos } from "../ganchos/useDatos.js";
import { borrarFoto, guardarFoto } from "../logica/acciones.js";
import { fechaCorta } from "../logica/fechas.js";
import { comprimir } from "../utiles/imagenes.js";
import Hoja, { Opciones } from "./Hoja.jsx";

const POSES = [
  { id: "frente", texto: "Frente" },
  { id: "lateral", texto: "Perfil" },
  { id: "espalda", texto: "Espalda" },
];

export default function Fotos() {
  const fotos = useFotos();
  const ficheroRef = useRef(null);
  const [pose, setPose] = useState("frente");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [confirmarBorrado, setConfirmarBorrado] = useState(null);

  const deLaPose = useMemo(
    () => fotos.filter((f) => f.pose === pose).sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [fotos, pose],
  );

  // Por defecto se comparan la primera y la última: el antes y el después.
  const [izquierda, setIzquierda] = useState(null);
  const [derecha, setDerecha] = useState(null);
  useEffect(() => {
    setIzquierda(deLaPose[0]?.id ?? null);
    setDerecha(deLaPose.at(-1)?.id ?? null);
  }, [pose, deLaPose.length]);

  async function alElegir(e) {
    const fichero = e.target.files?.[0];
    e.target.value = "";
    if (!fichero) return;

    setGuardando(true);
    setError(null);
    try {
      const imagen = await comprimir(fichero);
      await guardarFoto(imagen, { pose });
    } catch (fallo) {
      setError(fallo.message);
    }
    setGuardando(false);
  }

  const a = deLaPose.find((f) => f.id === izquierda);
  const b = deLaPose.find((f) => f.id === derecha);
  const hayComparacion = a && b && a.id !== b.id;

  return (
    <div className="columna">
      <div className="entre">
        <div className="rotulo">Fotos</div>
        <span style={{ fontSize: 12, color: "var(--texto-tenue)" }}>
          {fotos.length} en total · solo en este móvil
        </span>
      </div>

      <div className="fila" style={{ gap: 6 }}>
        {POSES.map((p) => (
          <button
            key={p.id}
            onClick={() => setPose(p.id)}
            aria-pressed={p.id === pose}
            className="chip"
            style={{
              flex: 1,
              cursor: "pointer",
              textAlign: "center",
              background: p.id === pose ? "var(--texto)" : "var(--superficie-3)",
              color: p.id === pose ? "var(--fondo)" : undefined,
              borderColor: p.id === pose ? "var(--texto)" : undefined,
            }}
          >
            {p.texto}
          </button>
        ))}
      </div>

      {deLaPose.length === 0 ? (
        <div className="tarjeta" style={{ textAlign: "center", padding: "26px 18px" }}>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--texto-tenue)", lineHeight: 1.55 }}>
            Sin fotos de {POSES.find((p) => p.id === pose).texto.toLowerCase()} todavía. La primera
            es la referencia: misma luz, misma distancia y misma hora del día.
          </p>
        </div>
      ) : (
        <>
          {/* Comparación lado a lado */}
          <div className="fila" style={{ gap: 8, alignItems: "flex-start" }}>
            <Panel foto={a} etiqueta="Antes" />
            <Panel foto={b} etiqueta={hayComparacion ? "Ahora" : "Única"} />
          </div>

          {/* Tira para elegir qué se compara */}
          {deLaPose.length > 1 && (
            <div className="columna" style={{ gap: 8 }}>
              <Tira
                titulo="Antes"
                fotos={deLaPose}
                elegida={izquierda}
                alElegir={setIzquierda}
                alMantener={setConfirmarBorrado}
              />
              <Tira
                titulo="Ahora"
                fotos={deLaPose}
                elegida={derecha}
                alElegir={setDerecha}
                alMantener={setConfirmarBorrado}
              />
            </div>
          )}
        </>
      )}

      {error && (
        <div style={{ fontSize: 13, color: "var(--error)" }}>{error}</div>
      )}

      <button
        className="boton"
        onClick={() => ficheroRef.current?.click()}
        disabled={guardando}
        style={{ width: "100%" }}
      >
        {guardando ? "GUARDANDO…" : `+ FOTO DE ${POSES.find((p) => p.id === pose).texto.toUpperCase()}`}
      </button>
      <input
        ref={ficheroRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={alElegir}
        style={{ display: "none" }}
      />

      <Hoja
        abierta={Boolean(confirmarBorrado)}
        alCerrar={() => setConfirmarBorrado(null)}
        titulo="Borrar esta foto"
        subtitulo={confirmarBorrado ? `Del ${fechaCorta(confirmarBorrado.fecha)}. No se puede deshacer.` : ""}
      >
        <Opciones
          opciones={[
            { id: "cancelar", texto: "Conservarla" },
            { id: "borrar", texto: "Borrarla" },
          ]}
          alElegir={async (id) => {
            if (id === "borrar") await borrarFoto(confirmarBorrado.id);
            setConfirmarBorrado(null);
          }}
        />
      </Hoja>
    </div>
  );
}

function Panel({ foto, etiqueta }) {
  const url = useUrlDeBlob(foto?.imagen);
  if (!foto) return <div style={{ flex: 1 }} />;

  return (
    <div style={{ flex: 1 }}>
      <div
        style={{
          aspectRatio: "3 / 4",
          borderRadius: 14,
          overflow: "hidden",
          background: "var(--superficie)",
          border: "1px solid var(--borde)",
        }}
      >
        {url && (
          <img
            src={url}
            alt={`Foto del ${foto.fecha}`}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
      </div>
      <div style={{ marginTop: 7 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: "var(--texto-tenue)" }}>
          {etiqueta.toUpperCase()}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{fechaCorta(foto.fecha)}</div>
      </div>
    </div>
  );
}

function Tira({ titulo, fotos, elegida, alElegir, alMantener }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--texto-tenue)", marginBottom: 6 }}>{titulo}</div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
        {fotos.map((f) => (
          <Miniatura
            key={f.id}
            foto={f}
            puesta={f.id === elegida}
            alElegir={() => alElegir(f.id)}
            alMantener={() => alMantener(f)}
          />
        ))}
      </div>
    </div>
  );
}

function Miniatura({ foto, puesta, alElegir, alMantener }) {
  const url = useUrlDeBlob(foto.imagen);
  const pulsacion = useRef(null);

  // Mantener pulsado para borrar: no hay sitio para una papelera por foto, y
  // borrar no puede ser un toque accidental.
  const empezar = () => {
    pulsacion.current = setTimeout(alMantener, 550);
  };
  const soltar = () => clearTimeout(pulsacion.current);

  return (
    <button
      onClick={alElegir}
      onPointerDown={empezar}
      onPointerUp={soltar}
      onPointerLeave={soltar}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={`Foto del ${foto.fecha}`}
      aria-pressed={puesta}
      style={{
        flexShrink: 0,
        width: 52,
        aspectRatio: "3 / 4",
        borderRadius: 8,
        overflow: "hidden",
        padding: 0,
        cursor: "pointer",
        background: "var(--superficie)",
        border: `2px solid ${puesta ? "var(--fuerza)" : "transparent"}`,
        opacity: puesta ? 1 : 0.55,
      }}
    >
      {url && (
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      )}
    </button>
  );
}

/*
 * Un Blob se pinta con una URL de objeto, y esas URL hay que revocarlas: si no,
 * cada render deja una copia de la imagen retenida en memoria y una galería de
 * meses acaba tumbando la pestaña.
 */
function useUrlDeBlob(blob) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return undefined;
    }
    const nueva = URL.createObjectURL(blob);
    setUrl(nueva);
    return () => URL.revokeObjectURL(nueva);
  }, [blob]);

  return url;
}

