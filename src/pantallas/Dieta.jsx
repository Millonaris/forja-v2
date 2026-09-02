/*
 * DIETA (v3).
 *
 * Es la quinta pestaña, y sí, la spec pedía cuatro (§5). Se añade a petición
 * expresa: es lo que más veces al día se mira.
 *
 * Con el plan v3 esta pantalla cambia de naturaleza. Antes era un calendario
 * de kcal escrito día a día; ahora es un panel de control de UN objetivo que
 * solo cambia cuando la tendencia de varias semanas lo justifica. Por eso lo
 * que manda arriba no son las comidas, son las MÉTRICAS: media de 7 días,
 * cintura, adherencia y el gasto que FORJA va deduciendo.
 *
 * Cinco partes, en este orden a propósito (§35: acción primero):
 *
 *   HOY      · qué comes hoy y cómo va la tendencia. El 95 % de los usos.
 *              Aquí aparecen solas la revisión y los avisos de fin de fase.
 *   BLOQUES  · el mapa del cut y las variantes de kcal.
 *   RECETAS  · sus ideas de comidas.
 *   AÑO      · las cuatro fases y las fichas de consulta.
 *   POR QUÉ  · cómo funciona el sistema. Se lee una vez.
 *
 * La comida se registra en Fitia. Aquí solo se copia el total del día.
 */

import { useEffect, useMemo, useState } from "react";

import Volver from "../componentes/Volver.jsx";
import Hoja from "../componentes/Hoja.jsx";
import Recetas from "./Recetas.jsx";
import { db } from "../datos/db.js";
import {
  ADAPTACION, BLOQUES_CUT, NOTA_PREENTRENO, NUNCA, NUTRICION_CFG, ORDEN_FASES, REGLAS,
  TOPE_CUT, VARIANTES_CUT,
  bloqueDe, estadoNutricion, kcalDe, objetivosDe, planEnMarcha, porQueDe,
} from "../datos/planNutricion.js";
import { FICHAS, TEMPORADAS, estadoTemporada } from "../datos/planAnual.js";
import { useAjustes, useCarreras, useDiario, useMediciones, usePesos, useSesionesFuerza } from "../ganchos/useDatos.js";
import {
  aplicarRevision, bloqueDeMantenimiento, cerrarCut, confirmarMantenimiento, empezarGanancia,
  empezarVerano, fijarObjetivo, guardarCierreDia, guardarTdee,
} from "../logica/acciones.js";
import {
  TDEE_ESTIMADO_INICIAL, adherencia, balanceSemanal, estadoTdee, media7, registrosDiarios,
  tendenciaSemanal,
} from "../logica/nutricion.js";
import { proximaRevision, revisar, revisionPendiente, salidaDelCut, semaforo, tendenciaCintura } from "../logica/revision.js";
import { diasEntre, fechaCorta, hoyISO } from "../logica/fechas.js";
import { miles } from "../logica/formato.js";

const SECCIONES = [
  { id: "hoy", texto: "HOY" },
  { id: "bloques", texto: "BLOQUES" },
  // El recetario es lo único de DIETA que es SUYO (no del plan): va en verde
  // para que se distinga de las pestañas de consulta.
  { id: "recetas", texto: "RECETAS", color: "var(--exito)" },
  { id: "ano", texto: "AÑO" },
  { id: "porque", texto: "POR QUÉ" },
];

const COLOR_SEMAFORO = { verde: "var(--exito)", amarillo: "var(--aviso)", rojo: "var(--error, #e5484d)" };

export default function Dieta({ sub, alVolver }) {
  const [activa, setActiva] = useState(sub ?? "hoy");

  return (
    <div style={{ padding: "20px var(--margen) 0" }} className="columna">
      <div className="fila" style={{ gap: 12, paddingTop: 10 }}>
        <Volver alVolver={alVolver} />
        <h1 className="titulo">Dieta</h1>
      </div>

      {/* Con cinco secciones la fila se desplaza, como la de PROGRESO. */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
        {SECCIONES.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiva(s.id)}
            aria-pressed={s.id === activa}
            style={{
              flexShrink: 0, borderRadius: 999, padding: "9px 14px",
              fontSize: 11.5, fontWeight: 800, letterSpacing: ".05em", cursor: "pointer",
              background: s.id === activa ? (s.color ?? "var(--texto)") : "transparent",
              border: `1px solid ${s.id === activa ? (s.color ?? "var(--texto)") : (s.color ?? "var(--borde)")}`,
              color: s.id === activa ? "var(--fondo)" : (s.color ?? "var(--texto-tenue)"),
            }}
          >
            {s.texto}
          </button>
        ))}
      </div>

      {activa === "hoy" && <Hoy />}
      {activa === "bloques" && <Bloques />}
      {activa === "recetas" && <Recetas />}
      {activa === "ano" && <Ano />}
      {activa === "porque" && <PorQue />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* El gancho que reúne TODO lo que la dieta necesita saber             */
/* ------------------------------------------------------------------ */

/*
 * Un solo sitio donde se cruzan báscula, diario, cintura y gimnasio. Si cada
 * tarjeta hiciera sus propias cuentas acabaría habiendo dos versiones de "la
 * media de 7 días" que no coinciden, que es exactamente el fallo que la spec
 * prohíbe (§4: una sola fuente de verdad por dato).
 */
function useNutricion() {
  const hoy = hoyISO();
  const ajustes = useAjustes();
  const pesos = usePesos(180);
  const diario = useDiario(180);
  const mediciones = useMediciones();
  const sesiones = useSesionesFuerza(80);
  const carreras = useCarreras(80);
  const [series, setSeries] = useState([]);

  useEffect(() => {
    if (!sesiones.length) return;
    let vivo = true;
    const ids = sesiones.filter((s) => s.estado === "completada").map((s) => s.id);
    db.series.where("sesionId").anyOf(ids).toArray().then((filas) => { if (vivo) setSeries(filas); });
    return () => { vivo = false; };
  }, [sesiones]);

  return useMemo(() => {
    const aj = ajustes ?? {};
    const estado = estadoNutricion(aj);
    const objetivos = objetivosDe(aj, hoy);
    const registros = registrosDiarios({ pesos, diario, desde: estado.faseDesde, hasta: hoy });
    const diasDesdeCambio = diasEntre(estado.ultimoCambioKcal, hoy);

    const datos = { registros, mediciones, sesiones, series, carreras };

    return {
      hoy,
      ajustes: aj,
      estado,
      objetivos,
      registros,
      diario,
      pesos,
      mediciones,
      datos,
      diasDesdeCambio,
      diasEnFase: diasEntre(estado.faseDesde, hoy),
      tendencia: tendenciaSemanal(registros),
      media7: media7(registros, "weightKg"),
      mediaAnterior: media7(registros, "weightKg", 7),
      pasos7: media7(registros, "steps"),
      adherencia: adherencia(registros, estado.kcal, 14),
      cintura: tendenciaCintura(mediciones, hoy),
      tdee: estadoTdee({ registros, kcalObjetivo: estado.kcal, diasDesdeCambio, ajustes: aj }),
      semaforo: semaforo(datos, aj, hoy),
      balance: balanceSemanal(registros, estado.kcal),
      proximaRevision: proximaRevision(aj),
      pendiente: revisionPendiente(aj, hoy),
      salidas: estado.faseId === "cut" ? salidaDelCut(datos, aj, hoy) : [],
    };
  }, [ajustes, pesos, diario, mediciones, sesiones, series, carreras, hoy]);
}

/* ------------------------------------------------------------------ */
/* HOY                                                                 */
/* ------------------------------------------------------------------ */

function Hoy() {
  const n = useNutricion();

  return (
    <>
      <Banner n={n} />
      <Objetivo n={n} />
      <Metricas n={n} />
      <TarjetaRevision n={n} />
      <TarjetaSalida n={n} />
      <CierreDelDia n={n} />
      <BalanceSemana n={n} />
      <Comidas n={n} />

      <div className="tarjeta">
        <div className="rotulo">Por qué esto es así</div>
        <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.6 }}>
          {porQueDe(n.ajustes, n.hoy)}
        </p>
      </div>

      <Plegable titulo="Reglas de fondo">
        <Lista items={REGLAS} />
      </Plegable>

      <Plegable titulo="Preentreno">
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.55 }}>
          {NOTA_PREENTRENO}
        </p>
      </Plegable>
    </>
  );
}

/** El banner de la fase (§56): lo primero que se lee, y siempre el mismo aviso. */
function Banner({ n }) {
  const color = COLOR_SEMAFORO[n.semaforo.estado] ?? "var(--texto-medio)";
  return (
    <div
      className="tarjeta columna"
      style={{ gap: 8, borderColor: color, background: "var(--superficie)" }}
    >
      <div className="fila" style={{ gap: 9, alignItems: "center" }}>
        <span style={{ width: 9, height: 9, borderRadius: 999, background: color, flexShrink: 0 }} />
        <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: ".04em", lineHeight: 1.35 }}>
          {n.objetivos.banner}
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--texto-medio)", lineHeight: 1.5 }}>
        {n.semaforo.texto}
        {n.proximaRevision && !n.pendiente && ` Próxima revisión: ${fechaCorta(n.proximaRevision)}.`}
      </p>
    </div>
  );
}

/** El objetivo del día: fase, kcal y macros. Lo que se mira de un vistazo. */
function Objetivo({ n }) {
  const o = n.objetivos;
  return (
    <div className="tarjeta columna" style={{ gap: 10 }}>
      <div className="entre" style={{ alignItems: "flex-start" }}>
        <div>
          <div className="rotulo">Fase</div>
          <div style={{ fontSize: 21, fontWeight: 800, marginTop: 5 }}>{o.nombre}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{miles(o.kcal)}</div>
          <div style={{ fontSize: 11, color: "var(--texto-tenue)", marginTop: 3 }}>kcal / día</div>
        </div>
      </div>

      <div className="fila" style={{ gap: 8 }}>
        <Macro etiqueta="Proteína" valor={o.p} color="var(--fuerza)" />
        <Macro etiqueta="Hidratos" valor={o.hc} color="var(--carrera)" />
        <Macro etiqueta="Grasas" valor={o.g} color="var(--postura)" />
      </div>

      {!planEnMarcha(n.hoy) && (
        <div style={{ fontSize: 12.5, color: "var(--aviso)" }}>
          La definición empieza el 2 de septiembre. Esto es lo que tocará entonces.
        </div>
      )}

      <p style={{ margin: 0, fontSize: 12, color: "var(--texto-tenue)", lineHeight: 1.5 }}>
        Mismas kcal todos los días: entrenes pierna, torso, corras o descanses. Los hidratos sí se
        pueden mover entre comidas.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Métricas (§37)                                                      */
/* ------------------------------------------------------------------ */

function Metricas({ n }) {
  const [abierto, setAbierto] = useState(false);
  const delta = n.media7 != null && n.mediaAnterior != null ? n.media7 - n.mediaAnterior : null;

  return (
    <>
      <div className="tarjeta columna" style={{ gap: 12 }}>
        <div className="entre">
          <div className="rotulo">Cómo va</div>
          <button className="boton-texto" onClick={() => setAbierto(true)}>Qué significa</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          <Cifrita etiqueta="Media 7 días" valor={n.media7 != null ? `${kg(n.media7)} kg` : "—"} />
          <Cifrita
            etiqueta="vs semana anterior"
            valor={delta != null ? `${delta > 0 ? "+" : "−"}${kg(Math.abs(delta))} kg` : "—"}
            color={delta == null ? undefined : COLOR_SEMAFORO[n.semaforo.estado]}
          />
          <Cifrita
            etiqueta="Cintura"
            valor={n.cintura ? `${kg(n.cintura.ultima.cintura)} cm` : "—"}
          />
          <Cifrita
            etiqueta="Cintura 2 sem."
            valor={n.cintura ? `${n.cintura.delta > 0 ? "+" : "−"}${kg(Math.abs(n.cintura.delta))} cm` : "—"}
            color={n.cintura && n.cintura.delta < 0 ? "var(--exito)" : undefined}
          />
          <Cifrita etiqueta="Pasos 7 días" valor={n.pasos7 ? miles(Math.round(n.pasos7)) : "—"} />
          <Cifrita
            etiqueta="Adherencia"
            valor={n.adherencia == null ? "—" : `${Math.round(n.adherencia * 100)} %`}
            color={n.adherencia != null && n.adherencia < NUTRICION_CFG.adherencia.min ? "var(--aviso)" : undefined}
          />
        </div>

        {/* El gasto, con su etiqueta honesta: es el número que manda el año. */}
        <div style={{ background: "var(--superficie-3)", borderRadius: 12, padding: "12px 14px" }}>
          <div className="entre" style={{ alignItems: "baseline" }}>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".08em", color: "var(--texto-tenue)" }}>
                TU GASTO (TDEE)
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 3 }}>
                {miles(n.tdee.valor)}
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--texto-tenue)" }}> kcal</span>
              </div>
            </div>
            <span
              className="chip"
              style={{
                borderColor: n.tdee.etiqueta === "ESTIMADO" ? "var(--borde-fuerte)" : "rgba(113,217,139,.4)",
                color: n.tdee.etiqueta === "ESTIMADO" ? "var(--texto-tenue)" : "var(--exito)",
              }}
            >
              {n.tdee.etiqueta}
            </span>
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--texto-tenue)", lineHeight: 1.5 }}>
            {n.tdee.etiqueta === "ESTIMADO"
              ? `Horquilla ${miles(TDEE_ESTIMADO_INICIAL.min)}–${miles(TDEE_ESTIMADO_INICIAL.max)} por fórmula. ${n.tdee.motivo ?? ""}`
              : n.tdee.etiqueta === "DEDUCIDO"
                ? `Sale de tus datos reales${n.tdee.muestras > 1 ? `, suavizado con las ${n.tdee.muestras} últimas estimaciones` : ""}: lo que comes y cómo se mueve tu peso medio.`
                : `Medido y confirmado con confianza ${n.tdee.confianza === "high" ? "alta" : "media"}.`}
          </p>
          {n.tdee.etiqueta === "DEDUCIDO" && n.tdee.ultimo != null && n.ajustes.tdeeDeducido !== n.tdee.ultimo && (
            <button
              className="boton-texto"
              style={{ marginTop: 8 }}
              onClick={() => guardarTdee(n.tdee.ultimo)}
            >
              Guardar {miles(n.tdee.ultimo)} como gasto deducido
            </button>
          )}
        </div>
      </div>

      <Hoja abierta={abierto} alCerrar={() => setAbierto(false)} titulo="Qué significa cada número">
        <div className="columna">
          <Explica titulo="Media de 7 días">
            El peso de un día no dice nada: puede moverse 400 g por agua, sal o lo que tengas dentro.
            La media de siete días sí. Es el número que se mira, siempre.
          </Explica>
          <Explica titulo="vs semana anterior">
            La media de esta semana menos la de la anterior. Eso ES tu velocidad en kg por semana.
            En definición se busca 0,4–0,8 kg de bajada.
          </Explica>
          <Explica titulo="Cintura">
            Cuando la báscula se atasca, la cintura es la que dice si hay progreso. Una vez por
            semana, en ayunas, relajado, a la altura del ombligo, al final de una espiración normal.
          </Explica>
          <Explica titulo="Pasos">
            No sirven para convertir cada paso en calorías: sirven para saber si esta semana te has
            movido parecido a la anterior. Si la actividad cambia mucho, los números no son comparables.
          </Explica>
          <Explica titulo="Adherencia">
            Días dentro de ±150 kcal del objetivo. No mide virtud, mide si los datos SIRVEN: por
            debajo del 85 % es imposible saber si el plan funciona o si lo que falla es el registro.
          </Explica>
          <Explica titulo="TDEE (tu gasto)">
            ESTIMADO es una fórmula. DEDUCIDO sale de semanas de datos tuyos: si comes 2.400 y bajas
            0,55 kg/semana, gastabas unas 3.005. CONFIRMADO es el que se ha medido y validado en la
            fase de mantenimiento, y es el que habilita la ganancia muscular.
          </Explica>
        </div>
      </Hoja>
    </>
  );
}

function Explica({ titulo, children }) {
  return (
    <div>
      <div style={{ fontSize: 13.5, fontWeight: 700 }}>{titulo}</div>
      <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--texto-medio)", lineHeight: 1.55 }}>{children}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cierre del día                                                      */
/* ------------------------------------------------------------------ */

/*
 * Dos números copiados de Fitia y del Garmin. Sin esto no hay adherencia ni
 * gasto deducido, y sin gasto deducido el año entero va a ciegas.
 */
function CierreDelDia({ n }) {
  const deHoy = n.diario.find((d) => d.fecha === n.hoy) ?? null;
  const [abierto, setAbierto] = useState(false);
  const puesto = deHoy?.kcal != null;

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="tarjeta entre"
        style={{
          width: "100%", textAlign: "left", cursor: "pointer",
          borderColor: puesto ? undefined : "var(--aviso)",
        }}
      >
        <div>
          <div className="rotulo" style={{ color: puesto ? undefined : "var(--aviso)" }}>
            Cierre del día
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>
            {puesto
              ? `${miles(deHoy.kcal)} kcal${deHoy.p != null ? ` · ${deHoy.p} P` : ""}${deHoy.pasos != null ? ` · ${miles(deHoy.pasos)} pasos` : ""}`
              : "Apunta lo comido y los pasos"}
          </div>
          {!puesto && (
            <div style={{ fontSize: 12, color: "var(--texto-tenue)", marginTop: 3 }}>
              El total de Fitia y los pasos del Garmin. Nada más.
            </div>
          )}
        </div>
        <span style={{ color: "var(--texto-tenue)" }}>›</span>
      </button>

      <HojaCierre abierta={abierto} alCerrar={() => setAbierto(false)} dia={deHoy} objetivo={n.objetivos} />
    </>
  );
}

function HojaCierre({ abierta, alCerrar, dia, objetivo }) {
  const [v, setV] = useState({});

  useEffect(() => {
    if (!abierta) return;
    setV({
      kcal: dia?.kcal != null ? String(dia.kcal) : "",
      p: dia?.p != null ? String(dia.p) : "",
      hc: dia?.hc != null ? String(dia.hc) : "",
      g: dia?.g != null ? String(dia.g) : "",
      pasos: dia?.pasos != null ? String(dia.pasos) : "",
    });
  }, [abierta, dia?.kcal, dia?.p, dia?.hc, dia?.g, dia?.pasos]);

  async function guardar(e) {
    e.preventDefault();
    await guardarCierreDia(v);
    alCerrar();
  }

  const campos = [
    { id: "kcal", etiqueta: "Calorías", marcador: String(objetivo.kcal), ancho: 2 },
    { id: "pasos", etiqueta: "Pasos", marcador: "12800", ancho: 2 },
    { id: "p", etiqueta: "Proteína (g)", marcador: String(objetivo.p) },
    { id: "hc", etiqueta: "Hidratos (g)", marcador: String(objetivo.hc) },
    { id: "g", etiqueta: "Grasas (g)", marcador: String(objetivo.g) },
  ];

  return (
    <Hoja abierta={abierta} alCerrar={alCerrar} titulo="Cierre del día">
      <form onSubmit={guardar} className="columna">
        <p style={{ margin: 0, fontSize: 13, color: "var(--texto-medio)", lineHeight: 1.55 }}>
          Copia el total del día de Fitia y los pasos del Garmin. Las calorías y los pasos son los
          que de verdad hacen falta; los macros, si te apetece. No hace falta clavar nada.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {campos.map((c) => (
            <label key={c.id} style={{ display: "block", gridColumn: c.ancho === 2 ? "span 2" : undefined }}>
              <span style={{ display: "block", fontSize: 12, color: "var(--texto-medio)", marginBottom: 5 }}>
                {c.etiqueta}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={v[c.id] ?? ""}
                placeholder={c.marcador}
                onChange={(e) => setV({ ...v, [c.id]: e.target.value.replace(/[^0-9]/g, "") })}
                style={{
                  width: "100%", padding: "12px 14px", fontSize: 17, fontWeight: 700,
                  background: "var(--superficie-3)", border: "1px solid var(--borde-fuerte)",
                  borderRadius: 12, color: "var(--texto)",
                }}
              />
            </label>
          ))}
        </div>

        <button className="boton boton-primario" type="submit">GUARDAR</button>
        <p style={{ margin: 0, fontSize: 12, color: "var(--texto-tenue)", lineHeight: 1.5 }}>
          Un día suelto no cambia nada, pero catorce seguidos son los que dejan a FORJA deducir
          cuánto gastas de verdad. Los días que dejes en blanco cuentan como no adherentes: si no
          fuera así, bastaría con no apuntar los días malos.
        </p>
      </form>
    </Hoja>
  );
}

/* ------------------------------------------------------------------ */
/* Balance de la semana (§35, §53)                                     */
/* ------------------------------------------------------------------ */

function BalanceSemana({ n }) {
  const b = n.balance;
  if (!b || b.dias < 3 || Math.abs(b.diferencia) < 200) return null;

  const pasado = b.diferencia > 0;
  return (
    <div className="tarjeta columna" style={{ gap: 8 }}>
      <div className="rotulo">La semana</div>
      <div style={{ fontSize: 16, fontWeight: 800 }}>
        {pasado ? "+" : "−"}{miles(Math.abs(b.diferencia))} kcal sobre el objetivo
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--texto-tenue)" }}> · {b.dias} días apuntados</span>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "var(--texto-medio)", lineHeight: 1.55 }}>
        {pasado
          ? `Ni destruye la semana ni desaparece. Dos opciones válidas: aceptarlo (esa semana pierdes algo menos) o repartir unas ${Math.abs(b.repartoSugerido)} kcal menos durante seis días. Lo que NO se hace es ayunar mañana ni castigarse con cardio.`
          : "Vas por debajo del objetivo. Si no era buscado, come: un déficit accidental más grande no acelera nada y sí se lleva por delante fuerza y recuperación."}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Revisión                                                            */
/* ------------------------------------------------------------------ */

function TarjetaRevision({ n }) {
  const [abierta, setAbierta] = useState(false);
  if (!n.pendiente) return null;

  const r = revisar(n.datos, n.ajustes, n.hoy);

  const ACCIONES = {
    hold: { titulo: "Mantener las calorías", color: "var(--exito)" },
    audit: { titulo: "Revisar el registro antes de tocar nada", color: "var(--aviso)" },
    decrease: { titulo: `Bajar ${r.kcal ?? 100} kcal`, color: "var(--aviso)" },
    increase: { titulo: `Subir ${r.kcal ?? 100} kcal`, color: "var(--aviso)" },
    confirm: { titulo: "Confirmar tu mantenimiento", color: "var(--exito)" },
    maintenanceBlock: { titulo: "Volver a mantenimiento 2–3 semanas", color: "var(--aviso)" },
  };
  const info = ACCIONES[r.accion] ?? ACCIONES.hold;

  return (
    <div className="tarjeta columna" style={{ gap: 10, borderColor: info.color }}>
      <div className="entre">
        <div className="rotulo" style={{ color: info.color }}>Revisión</div>
        <span className="chip">{n.diasDesdeCambio} DÍAS SIN TOCAR NADA</span>
      </div>

      <div style={{ fontSize: 16, fontWeight: 800, color: info.color }}>{info.titulo}</div>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.6 }}>{r.motivo}</p>

      {(r.accion === "decrease" || r.accion === "increase") && (
        <div className="fila" style={{ gap: 8 }}>
          {NUTRICION_CFG.cut.ajusteKcal.map((k) => {
            const delta = r.accion === "increase" ? k : -k;
            return (
              <button
                key={k}
                className="boton boton-primario"
                style={{ flex: 1 }}
                onClick={() => aplicarRevision(delta)}
              >
                {delta > 0 ? "+" : "−"}{k} → {miles(n.estado.kcal + delta)}
              </button>
            );
          })}
        </div>
      )}

      {r.accion === "confirm" && (
        <button
          className="boton boton-primario"
          onClick={() => confirmarMantenimiento(r.kcal, r.confianza)}
        >
          CONFIRMAR {miles(r.kcal)} KCAL COMO MANTENIMIENTO
        </button>
      )}

      {r.accion === "maintenanceBlock" && (
        <button className="boton boton-primario" onClick={() => bloqueDeMantenimiento()}>
          PASAR A MANTENIMIENTO 2–3 SEMANAS
        </button>
      )}

      <button
        onClick={() => aplicarRevision(0)}
        style={{
          background: r.accion === "hold" ? "var(--texto)" : "none",
          color: r.accion === "hold" ? "var(--fondo)" : "var(--texto-tenue)",
          border: "1px solid var(--borde-fuerte)", borderRadius: 12,
          padding: "12px", fontSize: 13, fontWeight: 800, cursor: "pointer",
        }}
      >
        {r.accion === "hold" ? "VISTO · SEGUIR IGUAL" : "PREFIERO MANTENER"}
      </button>

      <button className="boton-texto" onClick={() => setAbierta(true)}>Ver los números</button>

      <Hoja abierta={abierta} alCerrar={() => setAbierta(false)} titulo="Los números de la revisión">
        <div className="columna">
          <Lista
            items={[
              `Tendencia del peso: ${r.tendencia == null ? "sin datos" : `${r.tendencia > 0 ? "+" : "−"}${kg(Math.abs(r.tendencia))} kg/semana`}.`,
              `Adherencia: ${r.adherencia == null ? "sin datos" : `${Math.round(r.adherencia * 100)} %`} (hace falta 85 %).`,
              `Actividad comparable con la semana anterior: ${r.pasosComparables ? "sí" : "no"}.`,
              `Cintura: ${r.cintura ? `${r.cintura.delta > 0 ? "+" : "−"}${kg(Math.abs(r.cintura.delta))} cm` : "sin medición reciente"}.`,
              `Gimnasio: ${r.progresion.total ? `${r.progresion.mejoran} de ${r.progresion.total} ejercicios mejoran` : "sin datos suficientes"}.`,
              `Días desde el último cambio de calorías: ${r.diasDesdeCambio ?? "—"}.`,
            ]}
          />
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--texto-tenue)", lineHeight: 1.55 }}>
            Cuando estas seis respuestas no apuntan claramente en la misma dirección, la decisión
            correcta es mantener.
          </p>
        </div>
      </Hoja>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fin de fase                                                         */
/* ------------------------------------------------------------------ */

function TarjetaSalida({ n }) {
  const [abierta, setAbierta] = useState(false);
  if (n.estado.faseId !== "cut" || !n.salidas.length) return null;

  const tdeeValido = n.tdee.etiqueta !== "ESTIMADO" ? n.tdee.valor : null;

  return (
    <>
      <div className="tarjeta columna" style={{ gap: 10, borderColor: "var(--aviso)" }}>
        <div className="rotulo" style={{ color: "var(--aviso)" }}>¿Cerramos la definición?</div>
        <Lista items={n.salidas.map((s) => s.texto)} />
        <button className="boton boton-primario" onClick={() => setAbierta(true)}>
          VER CÓMO PASAR A MANTENIMIENTO
        </button>
      </div>

      <Hoja abierta={abierta} alCerrar={() => setAbierta(false)} titulo="Cerrar la definición">
        <div className="columna">
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.6 }}>
            Al mantenimiento se entra con tu último gasto deducido válido, redondeado a 50. NO se le
            restan 100 kcal: ese número ya se calculó con tu peso y tu actividad de AHORA, así que
            quitarle algo sería inventarse un ajuste.
          </p>
          {tdeeValido ? (
            <>
              <div className="tarjeta" style={{ margin: 0 }}>
                <div className="rotulo">Entrarías en</div>
                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>
                  {miles(Math.round(tdeeValido / 50) * 50)} kcal
                </div>
                <div style={{ fontSize: 12.5, color: "var(--texto-tenue)", marginTop: 4 }}>
                  175 g de proteína, 80 g de grasa y el resto hidratos.
                </div>
              </div>
              {Math.abs(tdeeValido - n.estado.kcal) > 400 && (
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--aviso)", lineHeight: 1.55 }}>
                  El salto pasa de 400 kcal. Puedes subir en dos pasos durante una semana para
                  reducir el ruido de agua y glucógeno, pero no es obligatorio: subir a mantenimiento
                  no produce grasa automáticamente.
                </p>
              )}
              <button className="boton boton-primario" onClick={() => cerrarCut(tdeeValido)}>
                CERRAR EL CUT Y PASAR A MANTENIMIENTO
              </button>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--aviso)", lineHeight: 1.6 }}>
              Todavía no hay un gasto deducido válido con el que entrar. {n.tdee.motivo} Apunta kcal
              y pasos unos días más y la app propondrá el número sola.
            </p>
          )}
        </div>
      </Hoja>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Comidas                                                             */
/* ------------------------------------------------------------------ */

function Comidas({ n }) {
  const o = n.objetivos;
  return (
    <div className="tarjeta">
      <div className="rotulo" style={{ marginBottom: 12 }}>Comida por comida</div>
      <div className="columna" style={{ gap: 0 }}>
        {o.comidas.map((c, i) => (
          <div
            key={c.nombre}
            style={{
              display: "grid", gridTemplateColumns: "1fr auto", gap: 4, padding: "12px 0",
              borderTop: i === 0 ? "none" : "1px solid var(--borde)",
            }}
          >
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 700 }}>{c.nombre}</div>
              <div style={{ fontSize: 12, color: "var(--texto-tenue)", marginTop: 2 }}>{c.hora}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>
                <span style={{ color: "var(--fuerza)" }}>{c.p}P</span>
                {" · "}
                <span style={{ color: "var(--carrera)" }}>{c.hc}HC</span>
                {" · "}
                <span style={{ color: "var(--postura)" }}>{c.g}G</span>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--texto-tenue)", marginTop: 3 }}>
                ≈ {kcalDe(c)} kcal
              </div>
            </div>
          </div>
        ))}

        <div
          className="entre"
          style={{ paddingTop: 12, borderTop: "1px solid var(--borde-fuerte)", fontSize: 14, fontWeight: 800 }}
        >
          <span>TOTAL</span>
          <span style={{ whiteSpace: "nowrap" }}>{o.p}P · {o.hc}HC · {o.g}G</span>
        </div>
      </div>

      <p style={{ margin: "14px 0 0", fontSize: 12, color: "var(--texto-tenue)", lineHeight: 1.5 }}>
        Los macros por comida son guía: si desayunas 55 de hidratos en vez de 70, súmalos a la
        comida. Lo que manda es el total del día. Fitia puede enseñar pequeñas diferencias por
        redondeos y fibra: es normal.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* BLOQUES                                                             */
/* ------------------------------------------------------------------ */

function Bloques() {
  const n = useNutricion();
  const bloqueHoy = bloqueDe(n.hoy);

  return (
    <>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.55 }}>
        Ya no hay un calendario de calorías escrito día a día: hay UN objetivo que solo cambia
        cuando la tendencia lo justifica. Los bloques son el mapa del cut — sirven para saber
        cuándo toca mirar los datos con calma, no para obligar a nada.
      </p>

      <div className="tarjeta columna" style={{ gap: 0 }}>
        <div className="rotulo" style={{ marginBottom: 10 }}>Los bloques de la definición</div>
        {BLOQUES_CUT.map((b, i) => {
          const pasado = n.hoy > b.hasta;
          const actual = bloqueHoy?.id === b.id;
          return (
            <div
              key={b.id}
              className="entre"
              style={{
                gap: 10, padding: "11px 10px", margin: "0 -10px", borderRadius: 10,
                borderTop: i === 0 ? "none" : "1px solid var(--borde)",
                background: actual ? "rgba(244,244,239,.07)" : "transparent",
                opacity: pasado ? 0.45 : 1,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: actual ? 800 : 700 }}>
                  {b.nombre}
                  {actual && <span style={{ color: "var(--exito)", fontWeight: 700 }}> · ahora</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--texto-tenue)", marginTop: 2 }}>
                  {fechaCorta(b.desde)} – {fechaCorta(b.hasta)}
                  {b.noEvaluar && " · no se evalúa"}
                  {b.opcional && " · opcional"}
                </div>
              </div>
            </div>
          );
        })}
        <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "var(--texto-tenue)", lineHeight: 1.55 }}>
          Tope orientativo: ~14 semanas, hasta el {fechaCorta(TOPE_CUT)}. No hay ninguna obligación
          de agotarlo, y tampoco existe un peso final obligatorio.
        </p>
      </div>

      <VariantesCut n={n} />

      <div className="tarjeta">
        <div className="rotulo">La semana de adaptación</div>
        <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.6 }}>
          Del {fechaCorta(ADAPTACION.desde)} al {fechaCorta(ADAPTACION.hasta)}. Vienes de 2.100–2.150 y
          subes a 2.400: el peso puede subir 0,3–0,8 kg por hidratos, glucógeno, el agua que los
          acompaña y el contenido del intestino. Podrías pasar de 96,8 a 97,2 y pensar «estoy
          engordando». No lo estás. Estos días no se evalúan y no se toca nada.
        </p>
      </div>
    </>
  );
}

/** Las variantes de kcal del cut (§13), con la zona de revisión bien marcada. */
function VariantesCut({ n }) {
  return (
    <div className="tarjeta columna" style={{ gap: 0 }}>
      <div className="rotulo" style={{ marginBottom: 10 }}>Variantes del cut</div>
      {VARIANTES_CUT.map((v, i) => {
        const actual = v.kcal === n.estado.kcal;
        return (
          <button
            key={v.kcal}
            onClick={() => fijarObjetivo(v)}
            aria-label={`Fijar ${v.kcal} kcal`}
            style={{
              display: "block", width: "calc(100% + 20px)", margin: "0 -10px", textAlign: "left",
              border: "none", cursor: "pointer", color: "var(--texto)", padding: "11px 10px",
              borderRadius: 10, background: actual ? "rgba(244,244,239,.07)" : "transparent",
              borderTop: i === 0 ? "none" : "1px solid var(--borde)",
            }}
          >
            <div className="entre" style={{ gap: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: actual ? 800 : 700 }}>
                  {miles(v.kcal)} kcal
                  {actual && <span style={{ color: "var(--exito)", fontWeight: 700 }}> · actual</span>}
                </div>
                <div style={{ fontSize: 12, color: v.zonaRevision ? "var(--aviso)" : "var(--texto-tenue)", marginTop: 2 }}>
                  {v.p}P · {v.hc}HC · {v.g}G{v.zonaRevision && " · zona de revisión"}
                </div>
              </div>
              <span style={{ color: "var(--texto-tenue)", fontSize: 15 }}>›</span>
            </div>
          </button>
        );
      })}
      <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "var(--texto-tenue)", lineHeight: 1.55 }}>
        Los ajustes van principalmente a hidratos. Las 2.150 son ZONA DE REVISIÓN, no una ley: si
        llegas ahí sin progreso, FORJA para y avisa en vez de seguir bajando. Y ojo, cambiar de aquí
        a mano reinicia el reloj de 14 días.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AÑO                                                                 */
/* ------------------------------------------------------------------ */

function Ano() {
  const n = useNutricion();
  const [abierta, setAbierta] = useState(null);
  const [ficha, setFicha] = useState(null);

  const temporada = abierta ? TEMPORADAS.find((t) => t.id === abierta) : null;

  return (
    <>
      <div className="tarjeta">
        <div className="rotulo">Ahora mismo</div>
        <div className="entre" style={{ marginTop: 8, alignItems: "baseline" }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{n.objetivos.nombre}</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            {miles(n.objetivos.kcal)} <span style={{ fontSize: 12, fontWeight: 600, color: "var(--texto-tenue)" }}>kcal</span>
          </div>
        </div>
        <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--texto-tenue)", lineHeight: 1.5 }}>
          Día {n.diasEnFase + 1} de la fase. Tu gasto: {miles(n.tdee.valor)} kcal ({n.tdee.etiqueta.toLowerCase()}).
        </p>
      </div>

      <div className="tarjeta columna" style={{ gap: 0 }}>
        <div className="rotulo" style={{ marginBottom: 10 }}>Septiembre 2026 → septiembre 2027</div>
        {TEMPORADAS.map((t, i) => {
          const estado = estadoTemporada(t, n.hoy, n.ajustes);
          const actual = estado === "actual";
          return (
            <button
              key={t.id}
              onClick={() => setAbierta(t.id)}
              aria-label={`Ver la fase ${t.nombre}`}
              style={{
                display: "block", width: "calc(100% + 20px)", margin: "0 -10px",
                textAlign: "left", border: "none", cursor: "pointer",
                color: "var(--texto)", padding: "11px 10px", borderRadius: 10,
                background: actual ? "rgba(244,244,239,.07)" : "transparent",
                opacity: estado === "pasada" ? 0.45 : 1,
                borderTop: i === 0 ? "none" : "1px solid var(--borde)",
              }}
            >
              <div className="entre" style={{ gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: actual ? 800 : 700 }}>
                    {i + 1}. {t.nombre}
                    {actual && <span style={{ color: "var(--exito)", fontWeight: 700 }}> · ahora</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--texto-tenue)", marginTop: 2 }}>
                    {t.rango} · {t.kcalTexto}
                  </div>
                </div>
                <span style={{ color: "var(--texto-tenue)", fontSize: 15, flexShrink: 0 }}>›</span>
              </div>
            </button>
          );
        })}
        <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "var(--texto-tenue)", lineHeight: 1.55 }}>
          Ninguna fase entra sola por fecha. Terminan por datos y criterios, y las confirmas tú.
        </p>
      </div>

      <div className="tarjeta columna" style={{ gap: 0 }}>
        <div className="rotulo" style={{ marginBottom: 10 }}>Fichas</div>
        {FICHAS.map((f, i) => (
          <button
            key={f.id}
            onClick={() => setFicha(f.id)}
            aria-label={`Ver la ficha ${f.titulo}`}
            style={{
              display: "block", width: "calc(100% + 20px)", margin: "0 -10px",
              textAlign: "left", border: "none", cursor: "pointer",
              color: "var(--texto)", padding: "11px 10px", borderRadius: 10, background: "transparent",
              borderTop: i === 0 ? "none" : "1px solid var(--borde)",
            }}
          >
            <div className="entre" style={{ gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{f.titulo}</div>
                <div style={{ fontSize: 12, color: "var(--texto-tenue)", marginTop: 2 }}>{f.resumen}</div>
              </div>
              <span style={{ color: "var(--texto-tenue)", fontSize: 15, flexShrink: 0 }}>›</span>
            </div>
          </button>
        ))}
      </div>

      <Hoja abierta={Boolean(temporada)} alCerrar={() => setAbierta(null)} titulo={temporada?.nombre ?? ""}>
        {temporada && <DetalleFase temporada={temporada} n={n} alCerrar={() => setAbierta(null)} />}
      </Hoja>

      <Hoja
        abierta={Boolean(ficha)}
        alCerrar={() => setFicha(null)}
        titulo={FICHAS.find((f) => f.id === ficha)?.titulo ?? ""}
      >
        <div className="columna">
          <Lista items={FICHAS.find((f) => f.id === ficha)?.puntos ?? []} />
        </div>
      </Hoja>
    </>
  );
}

/** La ficha completa de una fase, con el botón de empezarla si toca. */
function DetalleFase({ temporada, n, alCerrar }) {
  const estado = estadoTemporada(temporada, n.hoy, n.ajustes);
  const actualId = n.estado.faseId;
  const siguiente = ORDEN_FASES[ORDEN_FASES.indexOf(actualId) + 1];
  const esSiguiente = temporada.id === siguiente;

  const cinturaAhora = n.cintura?.ultima.cintura ?? null;
  const tdeeValido = n.tdee.etiqueta !== "ESTIMADO" ? n.tdee.valor : null;

  return (
    <div className="columna">
      <div>
        <div style={{ fontSize: 12, color: "var(--texto-tenue)", letterSpacing: ".05em" }}>
          {temporada.rango.toUpperCase()} · {temporada.kcalTexto.toUpperCase()}
        </div>
        <p style={{ margin: "8px 0 0", fontSize: 15, fontWeight: 600, lineHeight: 1.5 }}>{temporada.objetivo}</p>
      </div>

      {temporada.detalle.map((p) => (
        <p key={p} style={{ margin: 0, fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.6 }}>{p}</p>
      ))}

      {temporada.empiezaCuando && (
        <div>
          <div className="rotulo" style={{ marginBottom: 8 }}>Se empieza cuando…</div>
          <Lista items={temporada.empiezaCuando} />
        </div>
      )}

      {esSiguiente && estado === "futura" && (
        <BotonEmpezar temporada={temporada} n={n} cintura={cinturaAhora} tdee={tdeeValido} alCerrar={alCerrar} />
      )}
    </div>
  );
}

function BotonEmpezar({ temporada, n, cintura, tdee, alCerrar }) {
  const [error, setError] = useState(null);

  if (temporada.id === "mantenimiento") {
    if (!tdee) {
      return (
        <p style={{ margin: 0, fontSize: 13, color: "var(--aviso)", lineHeight: 1.55 }}>
          Para entrar en mantenimiento hace falta un gasto deducido válido. {n.tdee.motivo}
        </p>
      );
    }
    return (
      <button className="boton boton-primario" onClick={async () => { await cerrarCut(tdee); alCerrar(); }}>
        EMPEZAR MANTENIMIENTO EN {miles(Math.round(tdee / 50) * 50)} KCAL
      </button>
    );
  }

  if (temporada.id === "ganancia") {
    if (n.ajustes.mantenimientoConfirmado == null) {
      return (
        <p style={{ margin: 0, fontSize: 13, color: "var(--aviso)", lineHeight: 1.55 }}>
          La ganancia no arranca sin un mantenimiento CONFIRMADO. Sigue en mantenimiento hasta que
          la tendencia esté cerca de cero y la cintura estable: la app lo propondrá sola.
        </p>
      );
    }
    return (
      <>
        <button
          className="boton boton-primario"
          onClick={async () => {
            try {
              await empezarGanancia({ cintura });
              alCerrar();
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          EMPEZAR GANANCIA EN {miles(n.ajustes.mantenimientoConfirmado + 175)} KCAL
        </button>
        {error && <p style={{ margin: 0, fontSize: 12.5, color: "var(--aviso)" }}>{error}</p>}
      </>
    );
  }

  if (temporada.id === "verano") {
    return (
      <div className="columna" style={{ gap: 8 }}>
        <button className="boton boton-primario" onClick={async () => { await empezarVerano({ miniCut: false, cintura }); alCerrar(); }}>
          MANTENIMIENTO · ME VEO BIEN
        </button>
        <button
          onClick={async () => { await empezarVerano({ miniCut: true, cintura }); alCerrar(); }}
          style={{
            background: "none", border: "1px solid var(--borde-fuerte)", borderRadius: 12,
            color: "var(--texto-tenue)", padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}
        >
          MINI-CUT 4–6 SEMANAS
        </button>
      </div>
    );
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* POR QUÉ                                                             */
/* ------------------------------------------------------------------ */

function PorQue() {
  return (
    <>
      <div className="tarjeta">
        <div className="rotulo">La idea</div>
        <p style={{ margin: "10px 0 0", fontSize: 15, fontWeight: 600, lineHeight: 1.55 }}>
          Tu cuerpo no es una calculadora. Nadie puede decir «mides 1,87, pesas 96,8 y haces tantos
          pasos, luego gastas 2.900». Lo que sí se puede hacer es esto:
        </p>
        <p style={{ margin: "10px 0 0", fontSize: 15, fontWeight: 700, lineHeight: 1.55, color: "var(--exito)" }}>
          medir → esperar → comparar → cambiar poco → volver a medir.
        </p>
        <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.6 }}>
          Por eso FORJA no trata ninguna cifra inicial como una verdad eterna. Empiezas en 2.400,
          observas unas semanas y el propio plan se corrige con TUS datos.
        </p>
      </div>

      <div className="tarjeta columna" style={{ gap: 0 }}>
        <div className="rotulo" style={{ marginBottom: 12 }}>Medido, estimado y deducido</div>
        {[
          {
            que: "MEDIDO",
            por: "Lo que realmente apuntas: 96,8 kg, 12.300 pasos, 2.410 kcal. No son perfectos —una báscula varía, un reloj se equivoca—, pero son datos reales de tu día.",
          },
          {
            que: "ESTIMADO",
            por: "Lo que calcula una fórmula: «por tu edad, altura, peso y actividad, podrías gastar unas 2.900». No significa que gastes 2.900. Significa que es una buena cifra para empezar.",
          },
          {
            que: "DEDUCIDO",
            por: "El número que de verdad importa. Si comes 2.400 de media y pierdes 0,55 kg por semana, eso son ~4.235 kcal de déficit semanal, unas 605 al día: gastabas alrededor de 3.005. Vale mucho más que cualquier fórmula.",
          },
        ].map((e, i) => (
          <div
            key={e.que}
            className="fila"
            style={{ gap: 12, alignItems: "flex-start", padding: "12px 0", borderTop: i === 0 ? "none" : "1px solid var(--borde)" }}
          >
            <span
              style={{
                width: 22, height: 22, borderRadius: 999, flexShrink: 0, display: "grid",
                placeItems: "center", background: "var(--superficie-3)", color: "var(--texto-medio)",
                fontSize: 11, fontWeight: 800,
              }}
            >
              {i + 1}
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 800, letterSpacing: ".06em" }}>{e.que}</span>
              <span style={{ display: "block", fontSize: 13, color: "var(--texto-medio)", lineHeight: 1.55, marginTop: 4 }}>
                {e.por}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="tarjeta">
        <div className="rotulo" style={{ color: "var(--aviso)" }}>Por qué tu primera semana no valía</div>
        <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.6 }}>
          Empezaste en 96,9 kg y una semana después estabas en 96,8 comiendo 2.100–2.150. Parece
          «no he bajado». Pero venías de tres semanas sin gimnasio, y tu cuerpo estaba haciendo
          varias cosas a la vez: perder grasa, recuperar glucógeno, recuperar el agua que el
          glucógeno arrastra e inflamarse por volver a entrenar.
        </p>
        <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.6 }}>
          Puede haber pasado esto: grasa −500 g, agua +500 g, báscula igual. No sabemos si fue
          exactamente así. Sí sabemos que <strong>una semana no basta para concluir que 2.150 es tu
          mantenimiento</strong> — ni tampoco que registraras mal.
        </p>
      </div>

      <div className="tarjeta">
        <div className="rotulo">Por qué 2.400 y no otra cifra</div>
        <div className="columna" style={{ gap: 10, marginTop: 12 }}>
          {[
            ["Si tu gasto real fuese 2.900", "déficit de 500 kcal. Moderado."],
            ["Si fuese 2.700", "déficit de 300. Perderías más despacio."],
            ["Si fuese 3.000", "déficit de 600. Sigue siendo razonable."],
          ].map(([a, b]) => (
            <div key={a} className="entre" style={{ fontSize: 13.5, gap: 12 }}>
              <span style={{ color: "var(--texto-medio)" }}>{a}</span>
              <span style={{ fontWeight: 700, textAlign: "right" }}>{b}</span>
            </div>
          ))}
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--texto-medio)", lineHeight: 1.55 }}>
          En los tres casos el punto de partida funciona. Por eso se empieza aquí y se ajusta con
          datos, en vez de afinar sobre el papel un número que nadie conoce todavía.
        </p>
      </div>

      <div className="tarjeta">
        <div className="rotulo">Por qué el running NO se suma aparte</div>
        <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.6 }}>
          Si en una sesión de CaCo haces 4.000 pasos, esos pasos ya están dentro de los pasos
          totales del día. Sumar «las calorías de 12.800 pasos + las calorías completas de correr»
          sería contar lo mismo dos veces. Y tus 12.800 pasos tampoco son 10 km de caminata
          seguida: son desplazamientos cortos por el taller todo el día. Sirven para saber si esta
          semana te has movido parecido a la anterior, no para convertir cada paso en calorías.
        </p>
      </div>

      <div className="tarjeta">
        <div className="rotulo">Por qué no hacemos un volumen grande ahora</div>
        <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.6 }}>
          Con un mantenimiento de 2.800 podríamos darte 3.400. Subirías rápido, sí, pero no
          fabricarías cuatro veces más músculo: sería algo de músculo y bastante grasa, y luego
          meses quitándola. Primero se baja grasa. Cuando llegue el momento de crecer, se come solo
          un poco por encima de mantenimiento.
        </p>
      </div>

      <div className="tarjeta">
        <div className="rotulo" style={{ color: "var(--aviso)" }}>Lo que FORJA nunca hará</div>
        <div style={{ marginTop: 12 }}>
          <Lista items={NUNCA} />
        </div>
      </div>

      <div className="tarjeta">
        <div className="rotulo" style={{ color: "var(--exito)" }}>El plan entero en una frase</div>
        <p style={{ margin: "10px 0 0", fontSize: 14.5, fontWeight: 600, lineHeight: 1.6 }}>
          Ahora pierdes grasa con un déficit moderado; FORJA aprende cuánto gastas de verdad; cuando
          estés suficientemente definido pasas a mantenimiento; cuando el mantenimiento esté claro
          empiezas a ganar músculo muy lentamente; y solo vuelves a definir si la cintura y el
          aspecto lo justifican.
        </p>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Piezas sueltas                                                      */
/* ------------------------------------------------------------------ */

function Cifrita({ etiqueta, valor, color }) {
  return (
    <div style={{ background: "var(--superficie-3)", borderRadius: 10, padding: "8px 10px" }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".08em", color: "var(--texto-tenue)" }}>
        {etiqueta.toUpperCase()}
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2, whiteSpace: "nowrap", color }}>{valor}</div>
    </div>
  );
}

function Macro({ etiqueta, valor, color }) {
  return (
    <div style={{ flex: 1, background: "var(--superficie-3)", borderRadius: 12, padding: "10px 12px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: "var(--texto-tenue)" }}>
        {etiqueta.toUpperCase()}
      </div>
      <div style={{ fontSize: 19, fontWeight: 800, marginTop: 3, color }}>
        {valor}
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--texto-tenue)" }}> g</span>
      </div>
    </div>
  );
}

function Plegable({ titulo, children }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="tarjeta">
      <button
        onClick={() => setAbierto(!abierto)}
        className="entre"
        style={{ width: "100%", background: "none", border: "none", color: "var(--texto)", cursor: "pointer", padding: 0 }}
      >
        <span className="rotulo">{titulo}</span>
        <span style={{ color: "var(--texto-tenue)" }}>{abierto ? "−" : "+"}</span>
      </button>
      {abierto && <div style={{ marginTop: 14 }}>{children}</div>}
    </div>
  );
}

function Lista({ items }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 18, color: "var(--texto-medio)", fontSize: 13.5, lineHeight: 1.7 }}>
      {items.map((t) => <li key={t}>{t}</li>)}
    </ul>
  );
}

function kg(v) {
  return v.toFixed(v >= 10 ? 1 : 2).replace(".", ",");
}
