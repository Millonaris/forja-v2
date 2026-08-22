/*
 * Primera calibración en instalación limpia (§54).
 *
 * Sin datos que migrar, la app necesita saber tres cosas antes de poder decir
 * nada útil: cuánto pesas, por dónde vas en la rotación de fuerza y por dónde
 * vas en el plan de carrera. Sin esto, "próxima: Pierna A" sería una
 * suposición, y suponer es justo lo que este rediseño quiere quitar.
 *
 * Nada aquí es obligatorio salvo el peso: el test de pared y las fotos se
 * pueden posponer sin bloquear el uso de la app.
 */

import { useState } from "react";

import { db, guardarAjustes } from "../datos/db.js";
import { BLOQUES, describirSesion } from "../datos/planCarrera.js";
import { RUTINAS } from "../datos/rutinas.js";
import { guardarPeso } from "../logica/acciones.js";

const DIAS = [
  { n: 1, t: "L" }, { n: 2, t: "M" }, { n: 3, t: "X" }, { n: 4, t: "J" },
  { n: 5, t: "V" }, { n: 6, t: "S" }, { n: 0, t: "D" },
];

export default function Calibracion({ alTerminar }) {
  const [paso, setPaso] = useState(0);
  const [peso, setPeso] = useState("");
  const [ultimaRutina, setUltimaRutina] = useState(null);
  const [bloque, setBloque] = useState(1);
  const [sesion, setSesion] = useState(1);
  const [diasFuerza, setDiasFuerza] = useState([1, 3, 5]);
  const [diasCarrera, setDiasCarrera] = useState([2, 4, 0]);
  const [guardando, setGuardando] = useState(false);

  const bloqueElegido = BLOQUES.find((b) => b.numero === bloque);

  async function terminar() {
    setGuardando(true);

    if (peso) await guardarPeso(Number(peso.replace(",", ".")));

    // La rotación empieza DESPUÉS de la última que hiciste. Si no has hecho
    // ninguna, empieza por Torso A.
    const indice = ultimaRutina == null ? 0 : (RUTINAS.findIndex((r) => r.id === ultimaRutina) + 1) % 4;
    await db.estadoFuerza.put({ id: 1, indiceSiguiente: indice, ultimaCompletada: ultimaRutina });
    await db.estadoCarrera.put({ id: 1, bloque, sesion, bloquesRepetidos: [] });
    await guardarAjustes({ calibrada: true, diasFuerza, diasCarrera });

    alTerminar?.();
  }

  const alternar = (lista, set, n) =>
    set(lista.includes(n) ? lista.filter((d) => d !== n) : [...lista, n]);

  const pasos = [
    /* ---- 1 · Peso ---- */
    {
      rotulo: "Punto de partida",
      titulo: "¿Cuánto pesas hoy?",
      pie: "Lo que manda después es la media de 7 días, no este número suelto.",
      puedeSeguir: peso !== "" && !Number.isNaN(Number(peso.replace(",", "."))),
      contenido: (
        <div className="fila" style={{ gap: 12 }}>
          <input
            type="text"
            inputMode="decimal"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            placeholder="95,4"
            autoFocus
            style={entrada}
          />
          <span style={{ fontSize: 20, fontWeight: 700, color: "var(--texto-medio)" }}>kg</span>
        </div>
      ),
    },

    /* ---- 2 · Rotación de fuerza ---- */
    {
      rotulo: "Fuerza",
      titulo: "¿Cuál fue tu último entreno?",
      pie: "A partir de ahí, la rotación avanza sola cada vez que completes una sesión.",
      puedeSeguir: true,
      contenido: (
        <div className="columna" style={{ gap: 8 }}>
          {RUTINAS.map((r) => (
            <Opcion
              key={r.id}
              puesta={ultimaRutina === r.id}
              alPulsar={() => setUltimaRutina(r.id)}
              titulo={r.nombre}
              detalle={`siguiente sería ${RUTINAS[(r.orden + 1) % 4].nombre}`}
            />
          ))}
          <Opcion
            puesta={ultimaRutina === null}
            alPulsar={() => setUltimaRutina(null)}
            titulo="Ninguno todavía"
            detalle="empiezo por Torso A"
          />
        </div>
      ),
    },

    /* ---- 3 · Bloque de carrera ---- */
    {
      rotulo: "Carrera",
      titulo: "¿Por dónde vas en el 0→20 km?",
      pie: "Si no has empezado, déjalo en el bloque 1.",
      puedeSeguir: true,
      contenido: (
        <div className="columna" style={{ gap: 14 }}>
          <div>
            <div className="rotulo" style={{ marginBottom: 8 }}>Bloque</div>
            <select
              value={bloque}
              onChange={(e) => { setBloque(Number(e.target.value)); setSesion(1); }}
              style={entrada}
            >
              {BLOQUES.map((b) => (
                <option key={b.numero} value={b.numero}>
                  Bloque {b.numero} · {describirSesion(b.sesiones[0])}
                  {b.esDescarga ? " (descarga)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="rotulo" style={{ marginBottom: 8 }}>Próxima sesión del bloque</div>
            <div className="fila" style={{ gap: 8 }}>
              {bloqueElegido?.sesiones.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSesion(i + 1)}
                  className={`boton ${sesion === i + 1 ? "boton-primario" : ""}`}
                  style={{ flex: 1, padding: "12px 6px", fontSize: 12 }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--texto-medio)" }}>
              {describirSesion(bloqueElegido?.sesiones[sesion - 1])}
            </p>
          </div>
        </div>
      ),
    },

    /* ---- 4 · Días preferidos ---- */
    {
      rotulo: "Agenda",
      titulo: "¿Qué días te van mejor?",
      pie: "Solo sirve para proponer. Puedes entrenar cualquier día sin que nada se rompa.",
      puedeSeguir: true,
      contenido: (
        <div className="columna" style={{ gap: 18 }}>
          <SelectorDias
            etiqueta="Fuerza"
            color="var(--fuerza)"
            elegidos={diasFuerza}
            alAlternar={(n) => alternar(diasFuerza, setDiasFuerza, n)}
          />
          <SelectorDias
            etiqueta="Carrera"
            color="var(--carrera)"
            elegidos={diasCarrera}
            alAlternar={(n) => alternar(diasCarrera, setDiasCarrera, n)}
          />
        </div>
      ),
    },
  ];

  const actual = pasos[paso];
  const ultimo = paso === pasos.length - 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "var(--fondo)",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "var(--ancho)",
          padding: `calc(28px + env(safe-area-inset-top)) var(--margen) calc(24px + env(safe-area-inset-bottom))`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="fila" style={{ gap: 5, marginBottom: 26 }}>
          {pasos.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 999,
                background: i <= paso ? "var(--fuerza)" : "var(--borde-fuerte)",
              }}
            />
          ))}
        </div>

        <div className="rotulo" style={{ color: "var(--fuerza)" }}>{actual.rotulo}</div>
        <h1 style={{ fontSize: 27, margin: "8px 0 22px" }}>{actual.titulo}</h1>

        <div style={{ flex: 1 }}>{actual.contenido}</div>

        <p style={{ fontSize: 13, color: "var(--texto-tenue)", margin: "22px 0 16px" }}>
          {actual.pie}
        </p>

        <div className="fila" style={{ gap: 8 }}>
          {paso > 0 && (
            <button className="boton boton-fantasma" onClick={() => setPaso(paso - 1)} style={{ flex: 1 }}>
              ATRÁS
            </button>
          )}
          <button
            className="boton boton-primario"
            disabled={!actual.puedeSeguir || guardando}
            onClick={() => (ultimo ? terminar() : setPaso(paso + 1))}
            style={{ flex: 2 }}
          >
            {ultimo ? "EMPEZAR" : "SIGUIENTE"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Opcion({ puesta, alPulsar, titulo, detalle }) {
  return (
    <button
      onClick={alPulsar}
      style={{
        width: "100%",
        textAlign: "left",
        background: puesta ? "var(--fuerza-tinte)" : "var(--superficie)",
        border: `1px solid ${puesta ? "var(--fuerza)" : "var(--borde)"}`,
        borderRadius: 14,
        padding: "14px 16px",
        color: "var(--texto)",
        cursor: "pointer",
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700 }}>{titulo}</div>
      <div style={{ fontSize: 12.5, color: "var(--texto-tenue)", marginTop: 3 }}>{detalle}</div>
    </button>
  );
}

function SelectorDias({ etiqueta, color, elegidos, alAlternar }) {
  return (
    <div>
      <div className="rotulo" style={{ color, marginBottom: 10 }}>{etiqueta}</div>
      <div className="fila" style={{ gap: 6 }}>
        {DIAS.map((d) => {
          const puesto = elegidos.includes(d.n);
          return (
            <button
              key={d.n}
              onClick={() => alAlternar(d.n)}
              aria-pressed={puesto}
              style={{
                flex: 1,
                aspectRatio: "1",
                borderRadius: 999,
                border: `1px solid ${puesto ? color : "var(--borde)"}`,
                background: puesto ? color : "transparent",
                color: puesto ? "var(--fondo)" : "var(--texto-tenue)",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {d.t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const entrada = {
  width: "100%",
  background: "var(--superficie)",
  border: "1px solid var(--borde)",
  borderRadius: 14,
  padding: "16px 18px",
  color: "var(--texto)",
  fontSize: 22,
  fontWeight: 700,
};
