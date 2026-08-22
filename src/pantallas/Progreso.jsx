/*
 * PROGRESO (§18). Cuerpo, fuerza, carrera, postura e historial.
 *
 * Aquí van las gráficas y los análisis; en HOY no pinta nada de esto (§6).
 * La adherencia se mide en ventana móvil, no contra citas de calendario, así
 * que mover una sesión no puede salir nunca como un fallo (§19).
 */

import { useState } from "react";

import Volver from "../componentes/Volver.jsx";

import { BLOQUES, NOMBRES_FASE } from "../datos/planCarrera.js";
import { RUTINAS, nombreDe } from "../datos/rutinas.js";
import { ejerciciosDeHoy } from "../datos/rutinaPostural.js";
import {
  useAjustes, useCarreras, useCatalogoEjercicios, useEstadoCarrera,
  usePesos, usePostura, useSesionesFuerza,
} from "../ganchos/useDatos.js";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../datos/db.js";
import { diasEntre, fechaCorta, hoyISO, ultimosDias } from "../logica/fechas.js";
import { cambioSemanal, formatear as formatearPeso, media, serie, serieMedia } from "../logica/peso.js";
import { porSesion, veredicto } from "../logica/progresion.js";
import * as motorCarrera from "../logica/motorCarrera.js";
import {
  adherenciaFuerza, adherenciaPostura, consistencia,
  volumenPorMusculo, volumenUltimasSesiones,
} from "../logica/volumen.js";

const SECCIONES = [
  { id: "cuerpo", texto: "CUERPO" },
  { id: "fuerza", texto: "FUERZA" },
  { id: "carrera", texto: "CARRERA" },
  { id: "postura", texto: "POSTURA" },
  { id: "historial", texto: "HISTORIAL" },
];

export default function Progreso({ sub, alVolver }) {
  const [activa, setActiva] = useState(sub ?? "cuerpo");

  return (
    <div style={{ padding: "20px var(--margen) 0" }} className="columna">
      <div className="fila" style={{ gap: 12, paddingTop: 10 }}>
        <Volver alVolver={alVolver} />
        <h1 className="titulo">Progreso</h1>
      </div>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
        {SECCIONES.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiva(s.id)}
            aria-pressed={s.id === activa}
            style={{
              flexShrink: 0, borderRadius: 999, padding: "9px 14px",
              fontSize: 11.5, fontWeight: 800, letterSpacing: ".06em", cursor: "pointer",
              background: s.id === activa ? "var(--fuerza)" : "transparent",
              border: `1px solid ${s.id === activa ? "var(--fuerza)" : "var(--borde)"}`,
              color: s.id === activa ? "var(--fondo)" : "var(--texto-tenue)",
            }}
          >
            {s.texto}
          </button>
        ))}
      </div>

      {activa === "cuerpo" && <Cuerpo />}
      {activa === "fuerza" && <Fuerza />}
      {activa === "carrera" && <Carrera />}
      {activa === "postura" && <Postura />}
      {activa === "historial" && <Historial />}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Cuerpo() {
  const pesos = usePesos();
  const [dias, setDias] = useState(30);

  const actual = pesos.length ? pesos[pesos.length - 1] : null;
  const cambio = cambioSemanal(pesos);

  if (!pesos.length) {
    return <Vacio texto="Apunta tu peso unos días y aquí aparecerá la tendencia." />;
  }

  return (
    <>
      <div className="tarjeta fila" style={{ gap: 24 }}>
        <Cifra etiqueta="Actual" valor={`${formatearPeso(actual?.kg)} kg`} />
        <Cifra etiqueta="Media 7 d" valor={`${formatearPeso(media(pesos))} kg`} />
        <Cifra
          etiqueta="Cambio"
          valor={cambio == null ? "—" : `${cambio > 0 ? "+" : ""}${formatearPeso(cambio)} kg`}
          color={cambio == null ? undefined : cambio < 0 ? "var(--exito)" : "var(--texto)"}
        />
      </div>

      <div className="tarjeta">
        <div className="entre" style={{ marginBottom: 14 }}>
          <div className="rotulo">Últimos {dias} días</div>
          <div className="fila" style={{ gap: 6 }}>
            {[30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDias(d)}
                className="chip"
                style={{
                  cursor: "pointer",
                  background: dias === d ? "var(--fuerza)" : "var(--superficie-3)",
                  color: dias === d ? "var(--fondo)" : undefined,
                  borderColor: dias === d ? "var(--fuerza)" : undefined,
                }}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <GraficaPeso puntos={serie(pesos, dias)} medias={serieMedia(pesos, dias)} />
      </div>
    </>
  );
}

/*
 * Gráfica en SVG a mano: son dos series de puntos sobre una escala lineal, y
 * meter una librería de gráficas para esto sería añadir 60 KB al arranque de
 * una app que tiene que abrir instantánea en el gimnasio.
 */
function GraficaPeso({ puntos, medias }) {
  const valores = [...puntos, ...medias].map((p) => p.kg).filter((k) => k != null);
  if (valores.length < 2) return <Vacio texto="Faltan días para dibujar la tendencia." />;

  const min = Math.min(...valores) - 0.4;
  const max = Math.max(...valores) + 0.4;
  const ancho = 320;
  const alto = 120;

  const x = (i) => (i / (puntos.length - 1)) * ancho;
  const y = (kg) => alto - ((kg - min) / (max - min)) * alto;

  const camino = medias
    .map((p, i) => (p.kg == null ? null : `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.kg).toFixed(1)}`))
    .filter(Boolean)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} style={{ width: "100%", height: "auto", overflow: "visible" }} role="img" aria-label="Evolución del peso">
      <path d={camino} fill="none" stroke="var(--fuerza)" strokeWidth="2" strokeLinejoin="round" />
      {puntos.map((p, i) =>
        p.kg == null ? null : (
          <circle key={p.fecha} cx={x(i)} cy={y(p.kg)} r="1.9" fill="var(--texto-tenue)" />
        ),
      )}
      <text x="0" y={alto + 14} fill="var(--texto-tenue)" fontSize="9">{fechaCorta(puntos[0].fecha)}</text>
      <text x={ancho} y={alto + 14} fill="var(--texto-tenue)" fontSize="9" textAnchor="end">hoy</text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */

function Fuerza() {
  const sesiones = useSesionesFuerza();
  const ejercicios = useCatalogoEjercicios();
  const todasSeries = useLiveQuery(async () => (await db.series.toArray()) ?? [], [], []);

  const completadas = sesiones.filter((s) => s.estado === "completada");
  const adherencia = adherenciaFuerza(completadas);

  if (!completadas.length) {
    return <Vacio texto="Cuando completes tu primer entreno, aquí verás la progresión por ejercicio." />;
  }

  const v7 = volumenPorMusculo(completadas, todasSeries, ejercicios, 7);
  const v14 = volumenPorMusculo(completadas, todasSeries, ejercicios, 14);
  const v4 = volumenUltimasSesiones(completadas, todasSeries, ejercicios, 4);

  return (
    <>
      <div className="tarjeta">
        <div className="rotulo">Adherencia</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>
          {adherencia.hechas} de ~{adherencia.objetivo}
        </div>
        <div className="dato" style={{ fontSize: 13, marginTop: 2 }}>
          sesiones en los últimos {adherencia.dias} días
        </div>
      </div>

      <div className="tarjeta columna" style={{ gap: 14 }}>
        <div className="rotulo">Volumen por músculo</div>
        <TablaVolumen titulo="Últimos 7 días" filas={v7} />
        <TablaVolumen titulo="Últimos 14 días" filas={v14} />
        <TablaVolumen titulo="Últimos 4 entrenos" filas={v4} />
      </div>

      {RUTINAS.map((rutina) => (
        <div key={rutina.id} className="tarjeta columna" style={{ gap: 10 }}>
          <div className="rotulo">{rutina.nombre}</div>
          {ejercicios
            .filter((e) => e.plantillaId === rutina.id)
            .sort((a, b) => a.orden - b.orden)
            .map((ejercicio) => {
              const suyas = todasSeries.filter((s) => s.ejercicioId === ejercicio.id);
              if (!suyas.length) return null;
              const v = veredicto(ejercicio, porSesion(suyas, completadas));
              return (
                <div key={ejercicio.id} className="entre" style={{ alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{ejercicio.nombre}</div>
                    <div style={{ fontSize: 12, color: "var(--texto-tenue)", marginTop: 2 }}>{v.motivo}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: v.color, marginLeft: 10, textAlign: "right", flexShrink: 0 }}>
                    {v.texto.toUpperCase()}
                  </span>
                </div>
              );
            })}
        </div>
      ))}
    </>
  );
}

function TablaVolumen({ titulo, filas }) {
  if (!filas.length) return null;
  const max = Math.max(...filas.map((f) => f.series));
  return (
    <div>
      <div style={{ fontSize: 12.5, color: "var(--texto-medio)", marginBottom: 8 }}>{titulo}</div>
      <div className="columna" style={{ gap: 5 }}>
        {filas.map((f) => (
          <div key={f.musculo} className="fila" style={{ gap: 10 }}>
            <span style={{ fontSize: 12.5, width: 108, flexShrink: 0, color: "var(--texto-medio)" }}>
              {f.musculo}
            </span>
            <span style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--borde-fuerte)" }}>
              <span style={{ display: "block", width: `${(f.series / max) * 100}%`, height: "100%", borderRadius: 999, background: "var(--fuerza)" }} />
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, width: 22, textAlign: "right" }}>{f.series}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Carrera() {
  const carreras = useCarreras();
  const estado = useEstadoCarrera();
  const hechas = carreras.filter((c) => c.estado === "completada");

  if (!estado) return null;
  if (!hechas.length) {
    return <Vacio texto="Marca tu primera carrera y aquí aparecerán el volumen y la tirada más larga." />;
  }

  const bloque = BLOQUES.find((b) => b.numero === estado.bloque);
  const progreso = motorCarrera.progresoDeBloque(estado);
  const continuas = hechas.filter((c) => c.km);
  const larga = continuas.length ? Math.max(...continuas.map((c) => c.km)) : null;
  const kmTotales = continuas.reduce((t, c) => t + c.km, 0);

  return (
    <>
      <div className="tarjeta">
        <div className="rotulo" style={{ color: "var(--carrera)" }}>Bloque actual</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>
          Bloque {estado.bloque} · sesión {progreso.hechas + 1} de {progreso.total}
        </div>
        <div className="dato" style={{ fontSize: 13, marginTop: 3 }}>
          Fase {bloque?.fase} · {NOMBRES_FASE[bloque?.fase]}
          {estado.bloquesRepetidos?.length ? ` · ${estado.bloquesRepetidos.length} bloques repetidos` : ""}
        </div>
        <div className="dato" style={{ fontSize: 13, marginTop: 3 }}>
          Quedan {motorCarrera.bloquesRestantes(estado)} bloques hasta los 20 km
        </div>
      </div>

      <div className="tarjeta fila" style={{ gap: 24 }}>
        <Cifra etiqueta="Carreras" valor={hechas.length} />
        <Cifra etiqueta="Km totales" valor={kmTotales ? kmTotales.toFixed(1).replace(".", ",") : "—"} />
        <Cifra etiqueta="Más larga" valor={larga ? `${String(larga).replace(".", ",")} km` : "—"} />
      </div>

      <div className="tarjeta columna" style={{ gap: 9 }}>
        <div className="rotulo">Últimas carreras</div>
        {hechas.slice(0, 10).map((c) => (
          <div key={c.id} className="entre" style={{ fontSize: 13.5 }}>
            <span style={{ color: "var(--texto-tenue)", width: 58, flexShrink: 0 }}>{fechaCorta(c.fecha)}</span>
            <span style={{ flex: 1 }}>{c.descripcion}</span>
            {/* En CaCo no hay ritmo que enseñar y no se inventa (§51). */}
            <span style={{ color: "var(--carrera)", fontSize: 12.5 }}>
              {c.km ? `${String(c.km).replace(".", ",")} km` : "hecha"}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Postura() {
  const ajustes = useAjustes();
  const dias = usePostura();
  const total = ejerciciosDeHoy(
    ajustes?.creada ? diasEntre(ajustes.creada, hoyISO()) : 0,
  ).length;
  const adherencia = adherenciaPostura(dias);
  const completos = dias.filter((d) => d.completada);

  return (
    <>
      <div className="tarjeta">
        <div className="rotulo" style={{ color: "var(--postura)" }}>Cumplimiento</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>
          {adherencia.hechas} de {adherencia.objetivo} días
        </div>
        <div className="dato" style={{ fontSize: 13, marginTop: 2 }}>últimos 7 días</div>
      </div>

      {completos.length > 0 ? (
        <div className="tarjeta columna" style={{ gap: 8 }}>
          <div className="rotulo">Días completos</div>
          {completos.slice(0, 14).map((d) => (
            <div key={d.fecha} className="entre" style={{ fontSize: 13.5 }}>
              <span>{fechaCorta(d.fecha)}</span>
              <span style={{ color: "var(--exito)" }}>{d.hechos.length}/{total} ✓</span>
            </div>
          ))}
        </div>
      ) : (
        <Vacio texto="Cuando completes la rutina algún día, aparecerá aquí." />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

function Historial() {
  const sesiones = useSesionesFuerza();
  const carreras = useCarreras();
  const postura = usePostura();
  const pesos = usePesos();
  const [filtro, setFiltro] = useState("todo");

  const eventos = [
    ...sesiones.filter((s) => s.estado === "completada").map((s) => ({
      fecha: s.fecha, tipo: "fuerza", texto: nombreDe(s.plantillaId), color: "var(--fuerza)",
    })),
    ...carreras.map((c) => ({
      fecha: c.fecha,
      tipo: "carrera",
      texto: c.estado === "omitida" ? `${c.descripcion} · omitida` : c.descripcion,
      color: "var(--carrera)",
      tenue: c.estado === "omitida",
    })),
    ...postura.filter((p) => p.completada).map((p) => ({
      fecha: p.fecha, tipo: "postura", texto: "Rutina postural", color: "var(--postura)",
    })),
    ...pesos.map((p) => ({
      fecha: p.fecha, tipo: "peso", texto: `${formatearPeso(p.kg)} kg`, color: "var(--texto-tenue)",
    })),
  ]
    .filter((e) => filtro === "todo" || e.tipo === filtro)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const mapa = consistencia(
    ultimosDias(28),
    sesiones.filter((s) => s.estado === "completada"),
    carreras.filter((c) => c.estado === "completada"),
    postura,
  );

  return (
    <>
      <div className="tarjeta">
        <div className="rotulo">Consistencia · 28 días</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gap: 4, marginTop: 12 }}>
          {mapa.map((d) => (
            <div
              key={d.fecha}
              title={`${d.fecha} · ${d.acciones} acciones`}
              style={{
                aspectRatio: "1",
                borderRadius: 4,
                // Cero acciones = casilla apagada, nunca roja: un día de
                // descanso no es un incumplimiento (§19, §36).
                background: d.acciones === 0 ? "var(--superficie-3)" : "var(--fuerza)",
                opacity: d.acciones === 0 ? 1 : 0.35 + d.acciones * 0.22,
              }}
            />
          ))}
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--texto-tenue)" }}>
          Cuenta lo que hiciste, no lo que dejaste de hacer.
        </p>
      </div>

      <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
        {["todo", "fuerza", "carrera", "postura", "peso"].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className="chip"
            style={{
              flexShrink: 0, cursor: "pointer",
              background: filtro === f ? "var(--fuerza)" : "var(--superficie-3)",
              color: filtro === f ? "var(--fondo)" : undefined,
              borderColor: filtro === f ? "var(--fuerza)" : undefined,
            }}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {eventos.length ? (
        <div className="tarjeta columna" style={{ gap: 10 }}>
          {eventos.slice(0, 60).map((e, i) => (
            <div key={`${e.fecha}-${e.tipo}-${i}`} className="fila" style={{ gap: 12, opacity: e.tenue ? 0.5 : 1 }}>
              <span style={{ width: 54, flexShrink: 0, fontSize: 12.5, color: "var(--texto-tenue)" }}>
                {fechaCorta(e.fecha)}
              </span>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: e.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13.5 }}>{e.texto}</span>
            </div>
          ))}
        </div>
      ) : (
        <Vacio texto="Todavía no hay nada registrado." />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

function Cifra({ etiqueta, valor, color }) {
  return (
    <div>
      <div className="rotulo">{etiqueta}</div>
      <div style={{ fontSize: 19, fontWeight: 800, marginTop: 4, color }}>{valor}</div>
    </div>
  );
}

function Vacio({ texto }) {
  return (
    <div className="tarjeta" style={{ textAlign: "center", padding: "26px 18px" }}>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--texto-tenue)", lineHeight: 1.55 }}>{texto}</p>
    </div>
  );
}


