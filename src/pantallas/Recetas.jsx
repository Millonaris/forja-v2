/*
 * RECETAS — el recetario de Jose, dentro de DIETA.
 *
 * Ideas de comidas apuntadas por él, organizadas por tipo (desayuno, comida,
 * merienda, cena, snack), cada una con sus ingredientes y su preparación.
 * NO registra lo comido — eso sigue siendo cosa de Fitia (§58) —: es la
 * libreta a la que mirar cuando no sabes qué hacer de cena.
 */

import { useState } from "react";

import Hoja from "../componentes/Hoja.jsx";
import { useRecetas } from "../ganchos/useDatos.js";
import { borrarReceta, guardarReceta } from "../logica/acciones.js";

export const TIPOS_RECETA = [
  { id: "desayuno", texto: "Desayuno" },
  { id: "comida", texto: "Comida" },
  { id: "merienda", texto: "Merienda" },
  { id: "cena", texto: "Cena" },
  { id: "snack", texto: "Snack" },
];

const nombreTipo = (id) => TIPOS_RECETA.find((t) => t.id === id)?.texto ?? id;

/** Las líneas no vacías de un texto: así se pintan los ingredientes. */
const lineas = (texto) => (texto ?? "").split("\n").map((l) => l.trim()).filter(Boolean);

export default function Recetas() {
  const recetas = useRecetas();
  const [filtro, setFiltro] = useState("todas");
  const [abierta, setAbierta] = useState(null); // receta abierta en detalle
  const [editando, setEditando] = useState(null); // null | { receta vacía o existente }

  const visibles = filtro === "todas" ? recetas : recetas.filter((r) => r.tipo === filtro);

  // En "todas" se agrupa por tipo, en el orden natural del día.
  const grupos =
    filtro === "todas"
      ? TIPOS_RECETA.map((t) => ({ ...t, recetas: recetas.filter((r) => r.tipo === t.id) })).filter(
          (g) => g.recetas.length,
        )
      : visibles.length
        ? [{ id: filtro, texto: nombreTipo(filtro), recetas: visibles }]
        : [];

  return (
    <>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
        {[{ id: "todas", texto: "Todas" }, ...TIPOS_RECETA].map((t) => (
          <button
            key={t.id}
            onClick={() => setFiltro(t.id)}
            className="chip"
            style={{
              flexShrink: 0, cursor: "pointer",
              background: filtro === t.id ? "var(--texto)" : "var(--superficie-3)",
              color: filtro === t.id ? "var(--fondo)" : undefined,
              borderColor: filtro === t.id ? "var(--texto)" : undefined,
            }}
          >
            {t.texto.toUpperCase()}
          </button>
        ))}
      </div>

      <button
        className="boton boton-primario"
        onClick={() => setEditando({ tipo: filtro === "todas" ? "comida" : filtro })}
      >
        AÑADIR RECETA
      </button>

      {!recetas.length && (
        <div className="tarjeta" style={{ textAlign: "center", padding: "26px 18px" }}>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--texto-tenue)", lineHeight: 1.55 }}>
            Apunta aquí tus ideas de comidas: un nombre, sus ingredientes y cómo se hace.
            Cuando no sepas qué cenar, la respuesta estará aquí.
          </p>
        </div>
      )}

      {recetas.length > 0 && !visibles.length && (
        <div className="tarjeta" style={{ textAlign: "center", padding: "26px 18px" }}>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--texto-tenue)", lineHeight: 1.55 }}>
            Todavía no hay ninguna receta de {nombreTipo(filtro).toLowerCase()}.
          </p>
        </div>
      )}

      {grupos.map((g) => (
        <div key={g.id} className="tarjeta columna" style={{ gap: 0 }}>
          <div className="rotulo" style={{ marginBottom: 6 }}>
            {g.texto} · {g.recetas.length}
          </div>
          {g.recetas.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setAbierta(r)}
              aria-label={`Ver la receta ${r.nombre}`}
              style={{
                display: "block", width: "calc(100% + 20px)", margin: "0 -10px",
                textAlign: "left", border: "none", cursor: "pointer",
                color: "var(--texto)", padding: "11px 10px", borderRadius: 10,
                background: "transparent",
                borderTop: i === 0 ? "none" : "1px solid var(--borde)",
              }}
            >
              <div className="entre" style={{ gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>{r.nombre}</div>
                  {lineas(r.ingredientes).length > 0 && (
                    <div
                      style={{
                        fontSize: 12, color: "var(--texto-tenue)", marginTop: 2,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}
                    >
                      {lineas(r.ingredientes).join(" · ")}
                    </div>
                  )}
                </div>
                <span style={{ color: "var(--texto-tenue)", fontSize: 15, flexShrink: 0 }}>›</span>
              </div>
            </button>
          ))}
        </div>
      ))}

      {/* Detalle de una receta */}
      <Hoja abierta={Boolean(abierta)} alCerrar={() => setAbierta(null)} titulo={abierta?.nombre ?? ""}>
        {abierta && (
          <DetalleReceta
            receta={abierta}
            alEditar={() => {
              setEditando(abierta);
              setAbierta(null);
            }}
            alBorrar={async () => {
              await borrarReceta(abierta.id);
              setAbierta(null);
            }}
          />
        )}
      </Hoja>

      {/* Alta y edición */}
      <Hoja
        abierta={Boolean(editando)}
        alCerrar={() => setEditando(null)}
        titulo={editando?.id != null ? "Editar receta" : "Nueva receta"}
      >
        {editando && <EditorReceta receta={editando} alCerrar={() => setEditando(null)} />}
      </Hoja>
    </>
  );
}

/* ------------------------------------------------------------------ */

function DetalleReceta({ receta, alEditar, alBorrar }) {
  const [confirmando, setConfirmando] = useState(false);
  const ingredientes = lineas(receta.ingredientes);

  return (
    <div className="columna">
      <span className="chip" style={{ alignSelf: "flex-start" }}>
        {nombreTipo(receta.tipo).toUpperCase()}
      </span>

      {ingredientes.length > 0 && (
        <div>
          <div className="rotulo" style={{ marginBottom: 8 }}>Ingredientes</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "var(--texto-medio)", fontSize: 13.5, lineHeight: 1.7 }}>
            {ingredientes.map((x, i) => <li key={`${x}-${i}`}>{x}</li>)}
          </ul>
        </div>
      )}

      {receta.pasos && (
        <div>
          <div className="rotulo" style={{ marginBottom: 8 }}>Preparación</div>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {receta.pasos}
          </p>
        </div>
      )}

      <div className="fila" style={{ gap: 8 }}>
        <button className="boton boton-primario" style={{ flex: 1 }} onClick={alEditar}>
          EDITAR
        </button>
        <button
          onClick={() => (confirmando ? alBorrar() : setConfirmando(true))}
          style={{
            flex: 1, background: "none", borderRadius: 12, cursor: "pointer",
            border: `1px solid ${confirmando ? "var(--aviso)" : "var(--borde-fuerte)"}`,
            color: confirmando ? "var(--aviso)" : "var(--texto-tenue)",
            padding: "12px", fontSize: 13, fontWeight: 800,
          }}
        >
          {confirmando ? "¿SEGURO? BORRAR" : "BORRAR"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function EditorReceta({ receta, alCerrar }) {
  const [nombre, setNombre] = useState(receta.nombre ?? "");
  const [tipo, setTipo] = useState(receta.tipo ?? "comida");
  const [ingredientes, setIngredientes] = useState(receta.ingredientes ?? "");
  const [pasos, setPasos] = useState(receta.pasos ?? "");

  const estiloCampo = {
    width: "100%", marginTop: 6, padding: "12px 14px", fontSize: 15,
    background: "var(--superficie-3)", border: "1px solid var(--borde-fuerte)",
    borderRadius: 12, color: "var(--texto)", fontFamily: "inherit",
  };

  async function guardar() {
    if (!nombre.trim()) return;
    await guardarReceta({ id: receta.id, nombre, tipo, ingredientes, pasos });
    alCerrar();
  }

  return (
    <div className="columna">
      <label style={{ fontSize: 13, color: "var(--texto-medio)" }}>
        Nombre
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tortilla de claras con avena"
          style={{ ...estiloCampo, fontWeight: 700 }}
        />
      </label>

      <div>
        <div style={{ fontSize: 13, color: "var(--texto-medio)", marginBottom: 8 }}>¿Para cuándo es?</div>
        <div className="fila" style={{ gap: 6, flexWrap: "wrap" }}>
          {TIPOS_RECETA.map((t) => (
            <button
              key={t.id}
              onClick={() => setTipo(t.id)}
              className="chip"
              style={{
                cursor: "pointer",
                background: tipo === t.id ? "var(--texto)" : "var(--superficie-3)",
                color: tipo === t.id ? "var(--fondo)" : undefined,
                borderColor: tipo === t.id ? "var(--texto)" : undefined,
              }}
            >
              {t.texto.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <label style={{ fontSize: 13, color: "var(--texto-medio)" }}>
        Ingredientes (uno por línea)
        <textarea
          value={ingredientes}
          onChange={(e) => setIngredientes(e.target.value)}
          placeholder={"4 claras\n40 g de avena\n1 plátano"}
          rows={5}
          style={{ ...estiloCampo, resize: "vertical", lineHeight: 1.5 }}
        />
      </label>

      <label style={{ fontSize: 13, color: "var(--texto-medio)" }}>
        Preparación o notas (opcional)
        <textarea
          value={pasos}
          onChange={(e) => setPasos(e.target.value)}
          placeholder="Batir todo y a la sartén a fuego medio…"
          rows={4}
          style={{ ...estiloCampo, resize: "vertical", lineHeight: 1.5 }}
        />
      </label>

      <button
        className="boton boton-primario"
        onClick={guardar}
        disabled={!nombre.trim()}
        style={{ opacity: nombre.trim() ? 1 : 0.5 }}
      >
        GUARDAR
      </button>
    </div>
  );
}
