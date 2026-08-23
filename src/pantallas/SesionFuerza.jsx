/*
 * Sesión de fuerza en vivo — TODO el entreno en una sola pantalla.
 *
 * Esto se aparta de §9 de la spec, que pedía un ejercicio cada vez. Es una
 * decisión explícita del usuario: en el gimnasio quiere ver el entreno entero
 * como en Hevy, poder saltar de un ejercicio a otro y no ir en modo asistente.
 *
 * Lo que sí se conserva de §9, porque es lo que hace útil el registro:
 *   · la referencia de la última vez, serie a serie ("27,5 kg × 11");
 *   · el temporizador de descanso, que arranca solo al marcar una serie;
 *   · el RIR junto a kg y reps, no escondido;
 *   · el aviso al saltarse un ⭐ prioritario, que deja saltarlo igualmente.
 *
 * La sesión queda abierta en la base de datos: se puede bloquear el móvil,
 * salir de la app y volver sin perder nada.
 */

import { memo, useCallback, useEffect, useMemo, useState } from "react";

import Hoja, { Opciones } from "../componentes/Hoja.jsx";
import { db } from "../datos/db.js";
import { RUTINAS, dosis } from "../datos/rutinas.js";
import { rampaDe, rirDeHoy, seriesDeHoy } from "../datos/rampa.js";
import { useEjercicios, useSeriesDeSesion, useSesionesDeEjercicio } from "../ganchos/useDatos.js";
import { useTemporizador, formatear as formatearTiempo } from "../ganchos/useTemporizador.js";
import { useWakeLock } from "../ganchos/useWakeLock.js";
import { cancelarAviso, estadoPermiso, pedirPermiso } from "../utiles/avisos.js";
import { borrarSerie, descartarSesionFuerza, guardarSerie, terminarSesionFuerza } from "../logica/acciones.js";
import { fechaCorta, hoyISO } from "../logica/fechas.js";
import { veredicto } from "../logica/progresion.js";
import { miles } from "../logica/formato.js";

export default function SesionFuerza({ sesion, oculta, alPlegar, alResumen }) {
  const rutina = RUTINAS.find((r) => r.id === sesion.plantillaId);
  const ejercicios = useEjercicios(sesion.plantillaId);
  const series = useSeriesDeSesion(sesion.id);
  const anteriores = useAnteriores(sesion);

  const descanso = useTemporizador();
  const [duracion, setDuracion] = useState(0);

  // La pantalla no se apaga mientras entrenas.
  useWakeLock(true);
  const [terminando, setTerminando] = useState(false);
  const [avisoPrioritario, setAvisoPrioritario] = useState(null);
  const [permiso, setPermiso] = useState(() => estadoPermiso());
  const [verHistorial, setVerHistorial] = useState(null);

  // El cronómetro se calcula desde la marca de inicio guardada, no sumando:
  // así sobrevive a que Android duerma la pestaña.
  useEffect(() => {
    const tick = () => setDuracion(Math.round((Date.now() - (sesion.empezada ?? Date.now())) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sesion.empezada]);

  /*
   * El fin del descanso se guarda también en la fila de la sesión: si la app
   * se recarga a mitad de descanso, al volver se retoma la cuenta donde iba
   * (y se rearma el despertador del service worker, que un reinicio del
   * navegador puede haber matado).
   */
  useEffect(() => {
    if (sesion.descansoFin && sesion.descansoFin > Date.now()) {
      descanso.arrancar((sesion.descansoFin - Date.now()) / 1000, {
        ejercicio: sesion.descansoEjercicio,
      });
    }
    // Solo al montar la sesión: el resto de cambios de la fila no reinician nada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion.id]);

  function armarDescanso(segundos, nombreEjercicio) {
    descanso.arrancar(segundos, { ejercicio: nombreEjercicio });
    db.sesionesFuerza.update(sesion.id, {
      descansoFin: Date.now() + segundos * 1000,
      descansoEjercicio: nombreEjercicio,
    });
  }

  function sumarDescanso(segundos) {
    descanso.sumar(segundos);
    db.sesionesFuerza.update(sesion.id, {
      descansoFin: (sesion.descansoFin ?? Date.now()) + segundos * 1000,
    });
  }

  function pararDescanso() {
    descanso.parar();
    db.sesionesFuerza.update(sesion.id, { descansoFin: null });
  }

  const porEjercicio = useMemo(() => {
    const mapa = new Map();
    for (const s of series) {
      if (!mapa.has(s.ejercicioId)) mapa.set(s.ejercicioId, new Map());
      mapa.get(s.ejercicioId).set(s.numeroSerie, s);
    }
    return mapa;
  }, [series]);

  const hechas = series.filter((s) => s.hecha).length;
  const previstas = ejercicios.reduce((t, e) => t + seriesDeHoy(e, hoyISO()), 0);
  const volumen = series.reduce((t, s) => t + (s.hecha ? (s.kg ?? 0) * (s.reps ?? 0) : 0), 0);
  const rampa = rampaDe(hoyISO());

  const alMarcar = useCallback(async (ejercicio, numeroSerie, datos) => {
    // Saltarse un prioritario avisa, pero nunca impide (§9).
    const pendientePrioritario = ejercicios.find(
      (e) => e.prioritario && e.orden < ejercicio.orden && !tieneAlgo(porEjercicio.get(e.id)),
    );
    if (pendientePrioritario && !avisoPrioritario) {
      setAvisoPrioritario({ ejercicio: pendientePrioritario, seguir: { ejercicio, numeroSerie, datos } });
      return;
    }

    await guardarSerie(sesion.id, ejercicio.id, numeroSerie, { ...datos, hecha: true });
    armarDescanso(ejercicio.descanso ?? 120, ejercicio.nombre);
    // `armarDescanso` y los ejercicios se recrean con la sesión, no con el tic.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion.id, ejercicios, porEjercicio, avisoPrioritario]);

  async function terminar() {
    // Un despertador pendiente sonaría con el entreno ya cerrado.
    descanso.parar();
    await cancelarAviso();
    const resultado = await terminarSesionFuerza(sesion.id);
    setTerminando(false);
    if (resultado?.vacia) return;
    // El resumen sube a App: al completarse la sesión, este componente se
    // desmonta (deja de haber sesión abierta) y un resumen local moriría con él.
    alResumen?.({ ...resultado, rutina, series, ejercicios, anteriores });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "var(--fondo)",
        // Plegada se oculta, no se desmonta: el descanso sigue contando y
        // avisa aunque estés mirando otra pestaña de la app.
        display: oculta ? "none" : "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "var(--ancho)", display: "flex", flexDirection: "column", minHeight: 0 }}>
        {/* ---------- Cabecera fija ---------- */}
        <header
          style={{
            padding: `calc(12px + env(safe-area-inset-top)) var(--margen) 12px`,
            borderBottom: "1px solid var(--borde)",
            background: "var(--fondo)",
          }}
        >
          <div className="entre">
            <div className="fila" style={{ gap: 10 }}>
              {/* Plegar, no cerrar: el entreno sigue corriendo por debajo y se
                  recupera desde la barra flotante. */}
              <button
                onClick={alPlegar}
                aria-label="Plegar el entreno y volver a la app"
                style={{
                  width: 36, height: 36, borderRadius: 999, flexShrink: 0,
                  background: "var(--superficie-3)", border: "1px solid var(--borde)",
                  color: "var(--texto-medio)", fontSize: 15, cursor: "pointer",
                }}
              >
                ⌄
              </button>
              <div>
                <div className="rotulo" style={{ color: "var(--fuerza)" }}>En curso</div>
                <h1 style={{ fontSize: 22, marginTop: 4 }}>{rutina?.nombre}</h1>
              </div>
            </div>
            <button className="boton boton-primario" onClick={() => setTerminando(true)}>
              TERMINAR
            </button>
          </div>

          <div className="fila" style={{ gap: 22, marginTop: 12 }}>
            <Contador etiqueta="Duración" valor={formatearTiempo(duracion)} />
            <Contador etiqueta="Volumen" valor={`${miles(Math.round(volumen))} kg`} />
            <Contador etiqueta="Series" valor={`${hechas}/${previstas}`} />
          </div>

          {rampa && (
            <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--aviso)" }}>
              {rampa.etiqueta} · series recortadas, RIR objetivo {rirDeHoy(hoyISO())}
            </div>
          )}

          {/* Sin permiso, el descanso solo avisa con la app delante. Conviene
              saberlo ANTES de guardarse el móvil en el bolsillo. */}
          {permiso !== "concedido" && (
            <button
              onClick={async () => setPermiso(await pedirPermiso())}
              style={{
                marginTop: 10,
                width: "100%",
                textAlign: "left",
                background: "rgba(255,194,75,.1)",
                border: "1px solid rgba(255,194,75,.3)",
                borderRadius: 12,
                padding: "9px 12px",
                fontSize: 12.5,
                color: "var(--aviso)",
                cursor: permiso === "sin-pedir" ? "pointer" : "default",
              }}
            >
              {permiso === "sin-pedir"
                ? "Toca aquí para permitir avisos: si no, el descanso no suena con el móvil bloqueado."
                : "Avisos bloqueados. El descanso solo sonará con la app abierta."}
            </button>
          )}
        </header>

        {/* ---------- Ejercicios ---------- */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: `14px var(--margen) calc(140px + env(safe-area-inset-bottom))`,
          }}
        >
          <Ejercicios
            ejercicios={ejercicios}
            porEjercicio={porEjercicio}
            anteriores={anteriores}
            sesionId={sesion.id}
            alMarcar={alMarcar}
            alVerHistorial={setVerHistorial}
          />
        </div>

        {/* ---------- Temporizador flotante ---------- */}
        {descanso.activo && (
          <div style={estiloDescanso(descanso.terminado)}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", opacity: 0.7 }}>
                {descanso.terminado ? "DESCANSO TERMINADO" : "DESCANSO"}
              </div>
              <div style={{ fontSize: 25, fontWeight: 800, marginTop: 2 }}>{descanso.texto}</div>
            </div>
            <div className="fila" style={{ gap: 8 }}>
              <button onClick={() => sumarDescanso(30)} style={estiloBotonDescanso}>+30s</button>
              <button onClick={pararDescanso} style={estiloBotonDescanso}>SALTAR</button>
            </div>
          </div>
        )}

        {/* ---------- Historial del ejercicio ---------- */}
        {verHistorial && (
          <HistorialEjercicio
            ejercicio={verHistorial}
            sesionActual={sesion.id}
            alCerrar={() => setVerHistorial(null)}
          />
        )}

        {/* ---------- Prioritario pendiente ---------- */}
        <Hoja
          abierta={Boolean(avisoPrioritario)}
          alCerrar={() => setAvisoPrioritario(null)}
          titulo="Te dejas un prioritario"
          subtitulo={`${avisoPrioritario?.ejercicio.nombre} está marcado como ⭐ y aún no lo has tocado.`}
        >
          <Opciones
            opciones={[
              { id: "seguir", texto: "Seguir igualmente" },
              { id: "volver", texto: "Volver a hacerlo primero" },
            ]}
            alElegir={async (id) => {
              const pendiente = avisoPrioritario;
              setAvisoPrioritario(null);
              if (id === "seguir") {
                const { ejercicio, numeroSerie, datos } = pendiente.seguir;
                await guardarSerie(sesion.id, ejercicio.id, numeroSerie, { ...datos, hecha: true });
                armarDescanso(ejercicio.descanso ?? 120, ejercicio.nombre);
              }
            }}
          />
        </Hoja>

        {/* ---------- Terminar ---------- */}
        <Hoja
          abierta={terminando}
          alCerrar={() => setTerminando(false)}
          titulo="Terminar el entreno"
          subtitulo={
            hechas
              ? `${hechas} series guardadas. Al cerrar, la rotación pasa a la siguiente rutina.`
              : "No has guardado ninguna serie. Si cierras, no se registra nada."
          }
        >
          <Opciones
            opciones={
              hechas
                ? [
                    { id: "terminar", texto: "Terminar y guardar" },
                    { id: "seguir", texto: "Seguir entrenando" },
                  ]
                : [
                    { id: "descartar", texto: "Descartar el entreno" },
                    { id: "seguir", texto: "Seguir entrenando" },
                  ]
            }
            alElegir={async (id) => {
              if (id === "terminar") await terminar();
              else if (id === "descartar") {
                // Sin esto, el despertador seguía armado y avisaba de un
                // descanso de un entreno que ya no existe.
                descanso.parar();
                await cancelarAviso();
                await descartarSesionFuerza(sesion.id);
                setTerminando(false);
              } else setTerminando(false);
            }}
          />
        </Hoja>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/*
 * La lista entera, memorizada.
 *
 * El cronómetro y la cuenta atrás del descanso viven en el estado de la
 * pantalla y cambian cada segundo. Sin esta barrera, cada tic reconciliaba las
 * 8-12 tablas de ejercicios con sus ~5 filas y 6 celdas cada una: es el tirón
 * que se nota al teclear kg mientras corre el descanso.
 */
const Ejercicios = memo(function Ejercicios({
  ejercicios, porEjercicio, anteriores, sesionId, alMarcar, alVerHistorial,
}) {
  return ejercicios.map((ejercicio) => (
    <Ejercicio
      key={ejercicio.id}
      ejercicio={ejercicio}
      guardadas={porEjercicio.get(ejercicio.id) ?? VACIO}
      anterior={anteriores.get(ejercicio.id)}
      alMarcar={alMarcar}
      alDesmarcar={(n) => borrarSerie(sesionId, ejercicio.id, n)}
      alVerHistorial={() => alVerHistorial(ejercicio)}
    />
  ));
});

const VACIO = new Map();

function Ejercicio({ ejercicio, guardadas, anterior, alMarcar, alDesmarcar, alVerHistorial }) {
  const previstas = seriesDeHoy(ejercicio, hoyISO());
  const maxGuardada = Math.max(0, ...guardadas.keys());
  // `filas` son las filas PEDIDAS con "+ Añadir serie", no un incremento: sumar
  // un `extra` hacía que la fila añadida contara dos veces en cuanto se
  // guardaba (ya entraba en `maxGuardada`) y aparecía una fila fantasma nueva
  // con cada serie extra completada.
  const [filas, setFilas] = useState(0);
  const total = Math.max(previstas, maxGuardada, filas);

  return (
    <section style={{ marginBottom: 22 }}>
      <div className="entre" style={{ marginBottom: 2 }}>
        {/* Tocar el nombre abre el historial: es lo que uno mira mentalmente
            antes de decidir con cuánto peso empieza. */}
        <button
          onClick={alVerHistorial}
          style={{
            background: "none", border: "none", padding: 0, cursor: "pointer",
            fontSize: 17, fontWeight: 800, color: "var(--fuerza)", textAlign: "left",
          }}
        >
          {ejercicio.prioritario && <span style={{ marginRight: 5 }}>⭐</span>}
          {ejercicio.nombre}
          <span style={{ color: "var(--texto-tenue)", fontWeight: 400, marginLeft: 6 }}>›</span>
        </button>
        <span style={{ fontSize: 12, color: "var(--texto-tenue)" }}>{dosis(ejercicio)}</span>
      </div>

      <div style={{ fontSize: 12.5, color: "var(--texto-tenue)", marginBottom: 10 }}>
        Descanso: {formatearTiempo(ejercicio.descanso ?? 120)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: COLUMNAS, gap: "0 6px", alignItems: "center" }}>
        <Encabezado>SERIE</Encabezado>
        <Encabezado>ANTERIOR</Encabezado>
        <Encabezado>KG</Encabezado>
        <Encabezado>REPS</Encabezado>
        <Encabezado>RIR</Encabezado>
        <Encabezado>✓</Encabezado>

        {Array.from({ length: total }, (_, i) => (
          <Fila
            key={i + 1}
            numero={i + 1}
            guardada={guardadas.get(i + 1)}
            anterior={anterior?.get(i + 1)}
            esCore={ejercicio.categoria === "core"}
            alMarcar={(datos) => alMarcar(ejercicio, i + 1, datos)}
            alDesmarcar={() => alDesmarcar(i + 1)}
          />
        ))}
      </div>

      <button
        onClick={() => setFilas(total + 1)}
        style={{
          width: "100%",
          marginTop: 8,
          background: "var(--superficie)",
          border: "1px solid var(--borde)",
          borderRadius: 12,
          padding: "11px",
          color: "var(--texto-medio)",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        + Añadir serie
      </button>
    </section>
  );
}

function Fila({ numero, guardada, anterior, esCore, alMarcar, alDesmarcar }) {
  const hecha = Boolean(guardada?.hecha);
  const [kg, setKg] = useState("");
  const [reps, setReps] = useState("");
  const [rir, setRir] = useState("");

  // Al cargar una serie ya guardada (o al volver a la app), los campos se
  // rellenan con lo que hay en la base de datos, no con lo que quedó en React.
  useEffect(() => {
    setKg(guardada?.kg != null ? String(guardada.kg).replace(".", ",") : "");
    setReps(guardada?.reps != null ? String(guardada.reps) : "");
    setRir(guardada?.rir != null ? String(guardada.rir) : "");
  }, [guardada?.kg, guardada?.reps, guardada?.rir]);

  const num = (v) => (v === "" ? null : Number(String(v).replace(",", ".")));
  // El core no lleva peso: con las repeticiones basta para marcarla.
  const puedeMarcar = reps !== "" && (esCore || kg !== "");

  function alternar() {
    if (hecha) {
      alDesmarcar();
      return;
    }
    if (!puedeMarcar) return;
    alMarcar({ kg: num(kg), reps: num(reps), rir: num(rir) });
  }

  // Prerrellenar con lo de la última vez ahorra teclear en cada serie.
  const usarAnterior = () => {
    if (!anterior || hecha) return;
    if (kg === "" && anterior.kg != null) setKg(String(anterior.kg).replace(".", ","));
    if (reps === "" && anterior.reps != null) setReps(String(anterior.reps));
  };

  return (
    <>
      <div style={{ ...celda, fontWeight: 800, color: hecha ? "var(--texto)" : "var(--texto-medio)" }}>
        {numero}
      </div>

      <button
        onClick={usarAnterior}
        title={anterior ? "Usar estos valores" : undefined}
        style={{
          ...celda,
          background: "none",
          border: "none",
          color: "var(--texto-tenue)",
          fontSize: 12.5,
          cursor: anterior ? "pointer" : "default",
          textAlign: "left",
          padding: 0,
        }}
      >
        {anterior ? `${String(anterior.kg ?? "–").replace(".", ",")}kg × ${anterior.reps}` : "—"}
      </button>

      <Entrada valor={kg} alCambiar={setKg} hecha={hecha} decimal desactivada={esCore} />
      <Entrada valor={reps} alCambiar={setReps} hecha={hecha} />
      <Entrada valor={rir} alCambiar={setRir} hecha={hecha} />

      <button
        onClick={alternar}
        aria-label={hecha ? `Desmarcar serie ${numero}` : `Marcar serie ${numero}`}
        aria-pressed={hecha}
        disabled={!hecha && !puedeMarcar}
        style={{
          height: 38,
          borderRadius: 9,
          border: "none",
          cursor: hecha || puedeMarcar ? "pointer" : "default",
          background: hecha ? "var(--fuerza)" : "var(--superficie-3)",
          color: hecha ? "var(--fondo)" : "var(--texto-tenue)",
          fontSize: 15,
          fontWeight: 800,
          opacity: !hecha && !puedeMarcar ? 0.45 : 1,
        }}
      >
        ✓
      </button>
    </>
  );
}

function Entrada({ valor, alCambiar, hecha, decimal, desactivada }) {
  if (desactivada) return <div style={{ ...celda, color: "var(--texto-tenue)" }}>—</div>;
  return (
    <input
      type="text"
      inputMode={decimal ? "decimal" : "numeric"}
      value={valor}
      onChange={(e) => alCambiar(e.target.value)}
      style={{
        height: 38,
        width: "100%",
        textAlign: "center",
        background: hecha ? "rgba(243,255,71,.07)" : "var(--superficie)",
        border: `1px solid ${hecha ? "rgba(243,255,71,.25)" : "var(--borde)"}`,
        borderRadius: 9,
        color: "var(--texto)",
        fontSize: 15,
        fontWeight: 700,
        padding: "0 4px",
      }}
    />
  );
}

function Encabezado({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: "var(--texto-tenue)", paddingBottom: 6, textAlign: "center" }}>
      {children}
    </div>
  );
}

function Contador({ etiqueta, valor }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", color: "var(--texto-tenue)" }}>
        {etiqueta.toUpperCase()}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>{valor}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Lo que hiciste la última vez en cada ejercicio de esta rutina, serie a serie.
 *
 * Se busca la última sesión COMPLETADA con series de ese ejercicio, no la
 * última sesión sin más: si el último día te saltaste el pullover, la
 * referencia útil es la del día que sí lo hiciste.
 *
 * Dos decisiones de rendimiento, que aquí se notan:
 *
 *  · UNA consulta con `anyOf` en vez de una por ejercicio. Eran 8-12 viajes
 *    secuenciales a IndexedDB, 20-100 ms en un móvil normal.
 *  · `useState` + `useEffect`, no `useLiveQuery`. La referencia excluye la
 *    sesión en curso, así que NO cambia mientras entrenas: con liveQuery se
 *    recalculaba entera con cada ✓ que marcabas, para dar el mismo resultado.
 */
function useAnteriores(sesion) {
  const [mapa, setMapa] = useState(() => new Map());

  useEffect(() => {
    let cancelado = false;

    (async () => {
      const ejercicios = await db.ejercicios
        .where("plantillaId")
        .equals(sesion.plantillaId)
        .toArray();

      const series = await db.series
        .where("ejercicioId")
        .anyOf(ejercicios.map((e) => e.id))
        .toArray();

      const porEjercicio = new Map();
      for (const serie of series) {
        if (serie.sesionId === sesion.id) continue;
        if (!porEjercicio.has(serie.ejercicioId)) porEjercicio.set(serie.ejercicioId, []);
        porEjercicio.get(serie.ejercicioId).push(serie);
      }

      const resultado = new Map();
      for (const [ejercicioId, lista] of porEjercicio) {
        const ultimaSesionId = Math.max(...lista.map((s) => s.sesionId));
        const porNumero = new Map();
        for (const s of lista) {
          if (s.sesionId === ultimaSesionId) porNumero.set(s.numeroSerie, s);
        }
        resultado.set(ejercicioId, porNumero);
      }

      if (!cancelado) setMapa(resultado);
    })();

    return () => {
      cancelado = true;
    };
  }, [sesion.id, sesion.plantillaId]);

  return mapa;
}

/*
 * Historial del ejercicio, en vivo.
 *
 * Las últimas sesiones con lo que levantaste y el veredicto de progresión.
 * Excluye la sesión en curso: lo que interesa es contra qué te comparas, no
 * lo que llevas hecho hoy, que ya tienes delante.
 */
function HistorialEjercicio({ ejercicio, sesionActual, alCerrar }) {
  const sesiones = useSesionesDeEjercicio(ejercicio.id);
  const anteriores = sesiones.filter((s) => s.sesionId !== sesionActual && s.estado === "completada");

  const historial = anteriores.map((s) => ({ fecha: s.fecha, series: s.series }));
  const v = historial.length ? veredicto(ejercicio, historial) : null;

  return (
    <Hoja abierta alCerrar={alCerrar} titulo={ejercicio.nombre} subtitulo={dosis(ejercicio)}>
      {v && (
        <div className="tarjeta" style={{ marginBottom: 14 }}>
          <div className="rotulo" style={{ color: v.color }}>{v.texto}</div>
          <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.5 }}>
            {v.motivo}
          </p>
        </div>
      )}

      {anteriores.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--texto-tenue)", lineHeight: 1.55 }}>
          Primera vez con este ejercicio. Busca un peso que te deje en RIR 2 y esa será tu
          referencia a partir de ahora.
        </p>
      ) : (
        <div className="columna" style={{ gap: 12 }}>
          {anteriores.slice(0, 6).map((s) => (
            <div key={s.sesionId}>
              <div style={{ fontSize: 12, color: "var(--texto-tenue)", marginBottom: 4 }}>
                {fechaCorta(s.fecha)}
              </div>
              <div style={{ fontSize: 14 }}>
                {s.series
                  .map((x) => `${x.kg ?? "—"}×${x.reps ?? "—"}${x.rir != null ? ` (${x.rir})` : ""}`)
                  .join("  ·  ")}
              </div>
            </div>
          ))}
        </div>
      )}
    </Hoja>
  );
}

const tieneAlgo = (mapa) => Boolean(mapa && mapa.size);

const COLUMNAS = "28px minmax(58px, 1fr) 1fr 1fr 52px 44px";

const celda = { height: 38, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13.5 };

const estiloBotonDescanso = {
  background: "rgba(0,0,0,.18)",
  border: "none",
  borderRadius: 999,
  padding: "9px 13px",
  fontSize: 12,
  fontWeight: 800,
  color: "inherit",
  cursor: "pointer",
};

function estiloDescanso(terminado) {
  return {
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "var(--ancho)",
    zIndex: 90,
    background: terminado ? "var(--exito)" : "var(--fuerza)",
    color: "var(--fondo)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: `14px var(--margen) calc(16px + env(safe-area-inset-bottom))`,
    borderRadius: "22px 22px 0 0",
  };
}
