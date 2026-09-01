/*
 * PROGRESO (§18). Cuerpo, fuerza, carrera, postura e historial.
 *
 * Aquí van las gráficas y los análisis; en HOY no pinta nada de esto (§6).
 * La adherencia se mide en ventana móvil, no contra citas de calendario, así
 * que mover una sesión no puede salir nunca como un fallo (§19).
 */

import { useMemo, useState } from "react";

import DialogoNumero from "../componentes/DialogoNumero.jsx";
import Fotos from "../componentes/Fotos.jsx";
import Volver from "../componentes/Volver.jsx";
import DetalleSesion from "./DetalleSesion.jsx";
import Informe from "./Informe.jsx";

import { BLOQUES, NOMBRES_FASE } from "../datos/planCarrera.js";
import { RUTINAS, nombreDe } from "../datos/rutinas.js";
import { ejerciciosDeHoy } from "../datos/rutinaPostural.js";
import {
  useAjustes, useCarreras, useCatalogoEjercicios, useEstadoCarrera,
  useMediciones, usePesos, usePostura, useSesionesFuerza, useTestsPared,
} from "../ganchos/useDatos.js";
import {
  borrarMedicion, borrarTestPared, guardarMedicion, guardarTestPared,
} from "../logica/acciones.js";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../datos/db.js";
import { diaCorto, diasDesde, diasEntre, fechaCorta, hoyISO, ultimosDias } from "../logica/fechas.js";
import { cambioSemanal, formatear as formatearPeso, media, serie, serieMedia } from "../logica/peso.js";
import { faseDe } from "../datos/planNutricion.js";
import { semaforoPeso } from "../logica/revision.js";
import { porSesion, veredicto } from "../logica/progresion.js";
import { rampaDe } from "../datos/rampa.js";
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
  { id: "informe", texto: "INFORME" },
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
      {activa === "informe" && <Informe />}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Cuerpo() {
  const pesos = usePesos();
  const ajustes = useAjustes();
  const [dias, setDias] = useState(30);

  const actual = pesos.length ? pesos[pesos.length - 1] : null;
  const cambio = cambioSemanal(pesos);
  const fase = faseDe(hoyISO(), ajustes ?? {});
  const semaforo = semaforoPeso(pesos, fase.id);

  if (!pesos.length) {
    return <Vacio texto="Apunta tu peso unos días y aquí aparecerá la tendencia." />;
  }

  const COLORES_SEMAFORO = {
    verde: "var(--exito)",
    ambar: "var(--aviso)",
    rojo: "var(--aviso)",
    info: "var(--carrera)",
  };

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

      {/* El semáforo del plan anual: qué significa esta velocidad EN TU FASE.
          Solo aparece con báscula suficiente en las dos ventanas (7 d y ~4 sem). */}
      {semaforo && (
        <div className="tarjeta" style={{ borderColor: COLORES_SEMAFORO[semaforo.estado] }}>
          <div className="entre">
            <div className="rotulo" style={{ color: COLORES_SEMAFORO[semaforo.estado] }}>
              Velocidad · {fase.nombre}
            </div>
            <span style={{ fontSize: 14, fontWeight: 800 }}>
              {semaforo.porSemana > 0 ? "+" : ""}
              {semaforo.porSemana.toFixed(2).replace(".", ",")} kg/sem
            </span>
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--texto-medio)", lineHeight: 1.55 }}>
            {semaforo.texto}
          </p>
        </div>
      )}

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

      <ListaPesos pesos={pesos} />

      <Cintura />

      <div className="tarjeta">
        <Fotos />
      </div>
    </>
  );
}

/*
 * Cintura (§18). Es el control que la báscula no da: en un mini-cut el peso
 * puede quedarse quieto una semana por agua mientras la cintura sigue bajando.
 */
function Cintura() {
  const mediciones = useMediciones();
  const [abierto, setAbierto] = useState(false);

  const ultima = mediciones[0] ?? null;
  const primera = mediciones.at(-1) ?? null;
  const cambio =
    ultima && primera && ultima.fecha !== primera.fecha ? ultima.cintura - primera.cintura : null;
  const deHoy = mediciones.find((m) => m.fecha === hoyISO()) ?? null;

  return (
    <>
      <div className="tarjeta columna" style={{ gap: 12 }}>
        <div className="entre">
          <div className="rotulo">Cintura</div>
          <button className="boton-texto" onClick={() => setAbierto(true)}>
            {deHoy ? "Corregir" : "Apuntar"}
          </button>
        </div>

        {ultima ? (
          <>
            <div className="fila" style={{ gap: 24 }}>
              <Cifra etiqueta="Actual" valor={`${formatearPeso(ultima.cintura)} cm`} />
              <Cifra
                etiqueta="Desde el inicio"
                valor={cambio == null ? "—" : `${cambio > 0 ? "+" : ""}${formatearPeso(cambio)} cm`}
                color={cambio == null ? undefined : cambio < 0 ? "var(--exito)" : "var(--texto)"}
              />
              <Cifra etiqueta="Medida" valor={fechaCorta(ultima.fecha)} />
            </div>

            {mediciones.length > 1 && (
              <div className="columna" style={{ gap: 6 }}>
                {mediciones.slice(0, 6).map((m) => (
                  <div key={m.fecha} className="entre" style={{ fontSize: 13 }}>
                    <span style={{ color: "var(--texto-tenue)" }}>{fechaCorta(m.fecha)}</span>
                    <span style={{ fontWeight: 700 }}>{formatearPeso(m.cintura)} cm</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--texto-tenue)", lineHeight: 1.55 }}>
            Mídete a la altura del ombligo, en ayunas y sin apretar. Siempre igual: lo que importa
            es la diferencia, no el número.
          </p>
        )}
      </div>

      <DialogoNumero
        abierto={abierto}
        alCerrar={() => setAbierto(false)}
        titulo="Cintura de hoy"
        subtitulo={
          ultima && ultima.fecha !== hoyISO()
            ? `La última vez: ${formatearPeso(ultima.cintura)} cm el ${fechaCorta(ultima.fecha)}`
            : "A la altura del ombligo, en ayunas y sin apretar."
        }
        unidad="cm"
        marcador="92,5"
        min={30}
        max={250}
        valorInicial={deHoy ? { valor: deHoy.cintura, notas: deHoy.notas } : null}
        alGuardar={({ valor, notas }) => guardarMedicion({ cintura: valor, notas })}
        alBorrar={deHoy ? () => borrarMedicion(hoyISO()) : undefined}
      />
    </>
  );
}

/*
 * Gráfica en SVG a mano: son dos series de puntos sobre una escala lineal, y
 * meter una librería de gráficas para esto sería añadir 60 KB al arranque de
 * una app que tiene que abrir instantánea en el gimnasio.
 */
function GraficaPeso({ puntos, medias }) {
  // Antes de la primera pesada no hay nada que enseñar: se recortan esos días
  // para que la gráfica no sea un hueco enorme con los puntos arrinconados.
  const primero = puntos.findIndex((p) => p.kg != null);
  if (primero > 0) {
    puntos = puntos.slice(primero);
    medias = medias.slice(primero);
  }
  if (primero === -1 || puntos.length < 2) {
    return <Vacio texto="Faltan días para dibujar la tendencia." />;
  }

  const valores = [...puntos, ...medias].map((p) => p.kg).filter((k) => k != null);
  const min = Math.min(...valores) - 0.3;
  const max = Math.max(...valores) + 0.3;

  const ancho = 320;
  const alto = 132;
  const izq = 32; // hueco para la escala de kg
  const abajo = 17; // hueco para las fechas

  const x = (i) => izq + (i / (puntos.length - 1)) * (ancho - izq - 5);
  const y = (kg) => 4 + ((max - kg) / (max - min)) * (alto - abajo - 4);

  // Rayas horizontales en kg redondos, para que el ojo tenga escala.
  const paso = max - min > 8 ? 2 : max - min > 4 ? 1 : 0.5;
  const rayas = [];
  for (let v = Math.ceil(min / paso) * paso; v <= max; v += paso) {
    rayas.push(Math.round(v * 10) / 10);
  }
  const etiquetaKg = (v) => (v % 1 === 0 ? String(v) : v.toFixed(1).replace(".", ","));

  // La línea de la media de 7 días, por tramos: cada hueco (más de una semana
  // sin pesarse) corta la línea, y cada tramo abre con "M" — empezar con "L"
  // es un camino inválido y el SVG no pintaría nada.
  const tramos = [];
  let tramo = [];
  medias.forEach((p, i) => {
    if (p.kg == null) {
      if (tramo.length) tramos.push(tramo);
      tramo = [];
      return;
    }
    tramo.push([x(i), y(p.kg)]);
  });
  if (tramo.length) tramos.push(tramo);

  const dibujar = (t) =>
    t.map(([px, py], j) => `${j ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
  const camino = tramos.map(dibujar).join(" ");

  // Relleno suave bajo la línea: da cuerpo a la tendencia de un vistazo.
  const base = alto - abajo;
  const area = tramos
    .filter((t) => t.length > 1)
    .map((t) => `${dibujar(t)} L${t.at(-1)[0].toFixed(1)},${base} L${t[0][0].toFixed(1)},${base} Z`)
    .join(" ");

  let iUltimo = puntos.length - 1;
  while (puntos[iUltimo].kg == null) iUltimo -= 1;
  const yUltimo = y(puntos[iUltimo].kg);

  return (
    <>
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        style={{ width: "100%", height: "auto" }}
        role="img"
        aria-label="Evolución del peso"
      >
        <defs>
          <linearGradient id="relleno-peso" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--fuerza)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--fuerza)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {rayas.map((v) => (
          <g key={v}>
            <line
              x1={izq} x2={ancho} y1={y(v)} y2={y(v)}
              stroke="var(--borde)" strokeDasharray="3 4"
            />
            <text x="0" y={y(v) + 3.5} fill="var(--texto-tenue)" fontSize="10">
              {etiquetaKg(v)}
            </text>
          </g>
        ))}

        {area && <path d={area} fill="url(#relleno-peso)" />}
        <path
          d={camino} fill="none" stroke="var(--fuerza)"
          strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
        />

        {puntos.map((p, i) =>
          p.kg == null ? null : (
            <circle
              key={p.fecha}
              cx={x(i)} cy={y(p.kg)}
              r={i === iUltimo ? 4 : 2.7}
              fill={i === iUltimo ? "var(--texto)" : "var(--texto-tenue)"}
            />
          ),
        )}

        {/* El peso de la última pesada, pegado a su punto. */}
        <text
          x={x(iUltimo) - 8}
          y={yUltimo < 18 ? yUltimo + 16 : yUltimo - 9}
          fill="var(--texto)" fontSize="11.5" fontWeight="700" textAnchor="end"
        >
          {formatearPeso(puntos[iUltimo].kg)}
        </text>

        <text x={izq} y={alto - 2} fill="var(--texto-tenue)" fontSize="10">
          {fechaCorta(puntos[0].fecha)}
        </text>
        <text x={ancho} y={alto - 2} fill="var(--texto-tenue)" fontSize="10" textAnchor="end">
          hoy
        </text>
      </svg>

      <div className="fila" style={{ gap: 16, marginTop: 10, fontSize: 11.5, color: "var(--texto-tenue)" }}>
        <span className="fila" style={{ gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--texto-tenue)", flexShrink: 0 }} />
          Peso de cada día
        </span>
        <span className="fila" style={{ gap: 6 }}>
          <span style={{ width: 16, height: 3, borderRadius: 2, background: "var(--fuerza)", flexShrink: 0 }} />
          Media de 7 días
        </span>
      </div>
    </>
  );
}

/*
 * La lista de pesadas, día a día. La gráfica da la foto general; esta lista
 * responde "¿qué marqué el martes?" sin interpretar nada. El cambio compara
 * cada pesada con la anterior: bailar unas décimas de un día a otro es agua
 * y es normal — por eso la que manda sigue siendo la media de arriba.
 */
function ListaPesos({ pesos }) {
  const [verTodos, setVerTodos] = useState(false);

  // De la más reciente a la más antigua, con el cambio contra la anterior.
  const filas = pesos
    .map((p, i) => ({ ...p, cambio: i > 0 ? p.kg - pesos[i - 1].kg : null }))
    .reverse();
  const visibles = verTodos ? filas : filas.slice(0, 10);

  const etiquetaDia = (fecha) => {
    const d = diasDesde(fecha);
    if (d === 0) return "Hoy";
    if (d === 1) return "Ayer";
    return `${diaCorto(fecha)} ${fechaCorta(fecha)}`;
  };

  return (
    <div className="tarjeta columna" style={{ gap: 9 }}>
      <div className="entre" style={{ marginBottom: 3 }}>
        <div className="rotulo">Pesos por día</div>
        <span style={{ fontSize: 12, color: "var(--texto-tenue)" }}>
          {filas.length} {filas.length === 1 ? "pesada" : "pesadas"}
        </span>
      </div>

      {visibles.map((p) => (
        <div key={p.fecha} className="entre" style={{ fontSize: 13.5 }}>
          <span style={{ color: "var(--texto-medio)" }}>{etiquetaDia(p.fecha)}</span>
          <span className="fila" style={{ gap: 12 }}>
            <span
              style={{
                fontSize: 12,
                width: 42,
                textAlign: "right",
                color: p.cambio != null && p.cambio < 0 ? "var(--exito)" : "var(--texto-tenue)",
              }}
            >
              {p.cambio == null ? "" : `${p.cambio > 0 ? "+" : ""}${formatearPeso(p.cambio)}`}
            </span>
            <span style={{ fontWeight: 700, width: 56, textAlign: "right" }}>
              {formatearPeso(p.kg)} kg
            </span>
          </span>
        </div>
      ))}

      {filas.length > 10 && (
        <button
          className="boton-texto"
          onClick={() => setVerTodos((v) => !v)}
          style={{ alignSelf: "center", marginTop: 4 }}
        >
          {verTodos ? "Ver menos" : `Ver las ${filas.length} pesadas`}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Fuerza() {
  const sesiones = useSesionesFuerza();
  const ejercicios = useCatalogoEjercicios();
  const todasSeries = useLiveQuery(async () => (await db.series.toArray()) ?? [], [], []);

  const completadas = useMemo(
    () => sesiones.filter((s) => s.estado === "completada"),
    [sesiones],
  );

  /*
   * Todo el trabajo pesado, memorizado y en UNA pasada.
   *
   * Antes: por cada uno de los ~40 ejercicios se recorría la tabla entera de
   * series (`filter`), y encima se rehacía en cada render — cientos de miles
   * de comparaciones al tocar cualquier pestaña. Con un año de historial eso
   * son decenas de milisegundos de bloqueo por toque.
   */
  const { porEjercicio, v7, v14, v4, adherencia } = useMemo(() => {
    const agrupadas = new Map();
    for (const serie of todasSeries) {
      if (!agrupadas.has(serie.ejercicioId)) agrupadas.set(serie.ejercicioId, []);
      agrupadas.get(serie.ejercicioId).push(serie);
    }
    return {
      porEjercicio: agrupadas,
      v7: volumenPorMusculo(completadas, todasSeries, ejercicios, 7),
      v14: volumenPorMusculo(completadas, todasSeries, ejercicios, 14),
      v4: volumenUltimasSesiones(completadas, todasSeries, ejercicios, 4),
      adherencia: adherenciaFuerza(completadas),
    };
  }, [todasSeries, completadas, ejercicios]);

  if (!completadas.length) {
    return <Vacio texto="Cuando completes tu primer entreno, aquí verás la progresión por ejercicio." />;
  }

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
              const suyas = porEjercicio.get(ejercicio.id) ?? [];
              if (!suyas.length) return null;
              const v = veredicto(ejercicio, porSesion(suyas, completadas), {
                enRampa: Boolean(rampaDe(hoyISO())),
              });
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

      <TestPared />

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

/*
 * Test de la pared (§26). Cada 6 semanas, y es la única medida objetiva de si
 * la postura mejora: talones, glúteos, escápulas y cabeza contra la pared, y
 * se mide el hueco entre la nuca y la pared.
 */
function TestPared() {
  const tests = useTestsPared();
  const [abierto, setAbierto] = useState(false);

  const ultimo = tests[0] ?? null;
  const anterior = tests[1] ?? null;
  const cambio = ultimo && anterior ? ultimo.resultado - anterior.resultado : null;
  const dias = ultimo ? diasEntre(ultimo.fecha, hoyISO()) : null;
  const toca = dias == null || dias >= 42;

  return (
    <>
      <div
        className="tarjeta columna"
        style={{ gap: 12, borderColor: toca ? "var(--aviso)" : undefined }}
      >
        <div className="entre">
          <div className="rotulo" style={{ color: toca ? "var(--aviso)" : undefined }}>
            Test de la pared
          </div>
          <button className="boton-texto" onClick={() => setAbierto(true)}>
            {ultimo ? "Repetir" : "Hacerlo"}
          </button>
        </div>

        {ultimo ? (
          <div className="fila" style={{ gap: 24 }}>
            <Cifra etiqueta="Hueco" valor={`${formatearPeso(ultimo.resultado)} cm`} />
            <Cifra
              etiqueta="Cambio"
              valor={cambio == null ? "—" : `${cambio > 0 ? "+" : ""}${formatearPeso(cambio)} cm`}
              color={cambio == null ? undefined : cambio < 0 ? "var(--exito)" : "var(--aviso)"}
            />
            <Cifra etiqueta="Hace" valor={`${dias} d`} />
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.55 }}>
            Talones, glúteos y espalda alta contra la pared, sin forzar. Mide el hueco entre la
            nuca y la pared: cuanto menos, mejor.
          </p>
        )}

        {toca && ultimo && (
          <div style={{ fontSize: 12.5, color: "var(--aviso)" }}>
            Han pasado {dias} días. Toca repetirlo.
          </div>
        )}
      </div>

      <DialogoNumero
        abierto={abierto}
        alCerrar={() => setAbierto(false)}
        titulo="Test de la pared"
        subtitulo="Hueco entre la nuca y la pared, en centímetros. Sin forzar la postura."
        unidad="cm"
        marcador="4"
        min={-1}
        max={40}
        valorInicial={
          tests.find((t) => t.fecha === hoyISO())
            ? {
                valor: tests.find((t) => t.fecha === hoyISO()).resultado,
                notas: tests.find((t) => t.fecha === hoyISO()).notas,
              }
            : null
        }
        alGuardar={({ valor, notas }) => guardarTestPared({ resultado: valor, notas })}
        alBorrar={
          tests.some((t) => t.fecha === hoyISO()) ? () => borrarTestPared(hoyISO()) : undefined
        }
      />
    </>
  );
}

/* ------------------------------------------------------------------ */

function Historial() {
  const [abierta, setAbierta] = useState(null);
  const sesiones = useSesionesFuerza();
  const carreras = useCarreras();
  const postura = usePostura();
  const pesos = usePesos();
  const [filtro, setFiltro] = useState("todo");

  const eventos = [
    ...sesiones.filter((s) => s.estado === "completada").map((s) => ({
      fecha: s.fecha, tipo: "fuerza", texto: nombreDe(s.plantillaId), color: "var(--fuerza)",
      // Solo los entrenos se pueden abrir y corregir: son los únicos con
      // series dentro que puedan estar mal tecleadas.
      sesion: s,
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
          {eventos.slice(0, 60).map((e, i) => {
            const Etiqueta = e.sesion ? "button" : "div";
            return (
              <Etiqueta
                key={`${e.fecha}-${e.tipo}-${i}`}
                onClick={e.sesion ? () => setAbierta(e.sesion) : undefined}
                className="fila"
                style={{
                  gap: 12,
                  opacity: e.tenue ? 0.5 : 1,
                  width: "100%",
                  background: "none",
                  border: "none",
                  padding: 0,
                  textAlign: "left",
                  cursor: e.sesion ? "pointer" : "default",
                }}
              >
                <span style={{ width: 54, flexShrink: 0, fontSize: 12.5, color: "var(--texto-tenue)" }}>
                  {fechaCorta(e.fecha)}
                </span>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: e.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13.5, flex: 1 }}>{e.texto}</span>
                {e.sesion && <span style={{ color: "var(--texto-tenue)", fontSize: 13 }}>›</span>}
              </Etiqueta>
            );
          })}
        </div>
      ) : (
        <Vacio texto="Todavía no hay nada registrado." />
      )}

      {abierta && <DetalleSesion sesion={abierta} alCerrar={() => setAbierta(null)} />}
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


