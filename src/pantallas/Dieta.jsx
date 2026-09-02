/*
 * DIETA.
 *
 * Es la quinta pestaña, y sí, la spec pedía cuatro (§5). Se añade a petición
 * expresa: hasta el 8 de septiembre la dieta es lo único del plan que tiene
 * fecha límite y lo que más veces al día se mira, así que esconderla dentro de
 * PLAN la dejaba a dos toques de distancia varias veces cada día.
 *
 * Cuatro partes, y en este orden a propósito (§35: acción primero, explicación
 * después):
 *
 *   HOY        · qué comes hoy, comida por comida. Es el 95 % de los usos.
 *                Aquí aparecen solos el test de mantenimiento y la revisión.
 *   CALENDARIO · el tramo con fecha (26 ago → 20 sep), para ver a dónde vas.
 *   AÑO        · el plan maestro anual por temporadas, y las fichas.
 *   POR QUÉ    · la estrategia de la puesta a punto explicada. Se lee una vez.
 *
 * La comida se registra en Fitia. Esto es la chuleta (§58).
 */

import { useEffect, useState } from "react";

import Volver from "../componentes/Volver.jsx";

import Hoja from "../componentes/Hoja.jsx";
import Recetas from "./Recetas.jsx";
import { db } from "../datos/db.js";
import {
  DIAS_ESPECIALES, FASES_MANUALES, MANTENIMIENTO_ESTIMADO, MANTENIMIENTO_HIPOTESIS,
  NOTA_PREENTRENO, REGLAS,
  calendarioDelTramo, faseDe, kcalDe, objetivosDe, planEnMarcha, porQueDe,
} from "../datos/planNutricion.js";
import { FICHAS, TEMPORADAS, estadoTemporada } from "../datos/planAnual.js";
import { useAjustes, useCarreras, useMediciones, usePesos, useSesionesFuerza } from "../ganchos/useDatos.js";
import { aplicarRevision, empezarFase, guardarMantenimiento, quitarFaseManual } from "../logica/acciones.js";
import { estadoCalibracion } from "../logica/calibracion.js";
import { revisar, revisionPendiente } from "../logica/revision.js";
import { diaCorto, fechaCorta, fechaLarga, hoyISO } from "../logica/fechas.js";
import { miles } from "../logica/formato.js";

const SECCIONES = [
  { id: "hoy", texto: "HOY" },
  { id: "calendario", texto: "CALENDARIO" },
  // El recetario es lo único de DIETA que es SUYO (no del plan): va en verde
  // para que se distinga de las pestañas de consulta.
  { id: "recetas", texto: "RECETAS", color: "var(--exito)" },
  { id: "ano", texto: "AÑO" },
  { id: "porque", texto: "POR QUÉ" },
];

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
      {activa === "calendario" && <Calendario />}
      {activa === "recetas" && <Recetas />}
      {activa === "ano" && <Ano />}
      {activa === "porque" && <PorQue />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HOY                                                                 */
/* ------------------------------------------------------------------ */

function Hoy() {
  return (
    <>
      <TarjetaCalibracion />
      <TarjetaRevision />
      <DetalleDia fecha={hoyISO()} />

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

/* ------------------------------------------------------------------ */
/* Detalle de un día                                                   */
/* ------------------------------------------------------------------ */

/*
 * Lo mismo sirve para HOY y para cualquier día que abras desde el calendario:
 * un solo componente, así no puede haber dos versiones de la misma tabla que
 * se desincronicen.
 */
function DetalleDia({ fecha }) {
  const ajustes = useAjustes();
  const o = objetivosDe(fecha, ajustes ?? {});
  const esHoy = fecha === hoyISO();

  return (
    <>
      {/* Objetivo del día */}
      <div
        className="tarjeta columna"
        style={{ gap: 10, borderColor: o.especial ? "var(--aviso)" : undefined }}
      >
        <div className="entre" style={{ alignItems: "flex-start" }}>
          <div>
            <div className="rotulo" style={{ color: o.especial ? "var(--aviso)" : undefined }}>
              {esHoy ? "Hoy" : o.especial ? `Excepción dentro de ${o.fase.nombre}` : "Objetivo del día"}
            </div>
            <div style={{ fontSize: 21, fontWeight: 800, marginTop: 5 }}>{o.nombre}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{miles(o.kcal)}</div>
            <div style={{ fontSize: 11, color: "var(--texto-tenue)", marginTop: 3 }}>kcal</div>
          </div>
        </div>

        <div className="fila" style={{ gap: 8 }}>
          <Macro etiqueta="Proteína" valor={o.p} color="var(--fuerza)" />
          <Macro etiqueta="Hidratos" valor={o.hc} color="var(--carrera)" />
          <Macro etiqueta="Grasas" valor={o.g} color="var(--postura)" />
        </div>

        {!planEnMarcha(fecha) && (
          <div style={{ fontSize: 12.5, color: "var(--aviso)" }}>
            El plan empieza el 26 de agosto. Esto es lo que tocará entonces.
          </div>
        )}

        {o.esHipotesis && (
          <div style={{ fontSize: 12.5, color: "var(--aviso)" }}>
            Mantenimiento ESTIMADO, no medido: estos números parten de {miles(MANTENIMIENTO_HIPOTESIS)} kcal
            (horquilla {miles(MANTENIMIENTO_ESTIMADO.min)}–{miles(MANTENIMIENTO_ESTIMADO.max)}). Al guardar el
            resultado del test se recalculan solos.
          </div>
        )}
      </div>

      {/* Por qué este día es como es */}
      <div className="tarjeta">
        <div className="rotulo" style={{ color: o.especial ? "var(--aviso)" : undefined }}>
          Por qué este día
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.6 }}>
          {porQueDe(fecha, ajustes ?? {})}
        </p>
      </div>

      {/* Comidas */}
      <div className="tarjeta">
        <div className="rotulo" style={{ marginBottom: 12 }}>Comida por comida</div>
        <div className="columna" style={{ gap: 0 }}>
          {o.comidas.map((c, i) => (
            <div
              key={c.nombre}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 4,
                padding: "12px 0",
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
            <span style={{ whiteSpace: "nowrap" }}>
              {o.p}P · {o.hc}HC · {o.g}G
            </span>
          </div>
        </div>

        <p style={{ margin: "14px 0 0", fontSize: 12, color: "var(--texto-tenue)", lineHeight: 1.5 }}>
          Fitia puede enseñar pequeñas diferencias por redondeos y fibra. Es normal.
        </p>
      </div>

      {/* Lo específico de un día especial */}
      {o.especial && <DetalleEspecial dia={o.especial} />}
    </>
  );
}

/** Lo que solo aplica a la recarga o al día visual. */
function DetalleEspecial({ dia }) {
  return (
    <>
      {dia.si && (
        <div className="tarjeta columna" style={{ gap: 12 }}>
          <div className="rotulo" style={{ color: "var(--aviso)" }}>De dónde salen los hidratos</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--exito)", marginBottom: 7 }}>
              SÍ
            </div>
            <div className="fila" style={{ gap: 6, flexWrap: "wrap" }}>
              {dia.si.map((x) => (
                <span key={x} className="chip" style={{ borderColor: "rgba(113,217,139,.4)", color: "var(--exito)" }}>
                  {x}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--texto-tenue)", marginBottom: 7 }}>
              NO
            </div>
            <div className="fila" style={{ gap: 6, flexWrap: "wrap" }}>
              {dia.no.map((x) => (
                <span
                  key={x}
                  className="chip"
                  style={{ color: "var(--texto-tenue)", textDecoration: "line-through" }}
                >
                  {x}
                </span>
              ))}
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--texto-medio)", lineHeight: 1.5 }}>
            Queremos glucógeno muscular, no barriga hinchada.
          </p>
        </div>
      )}

      {dia.truco && (
        <div className="tarjeta">
          <div className="rotulo" style={{ color: "var(--carrera)" }}>{dia.truco.titulo}</div>
          <p style={{ margin: "9px 0 0", fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.55 }}>
            {dia.truco.texto}
          </p>
        </div>
      )}

      {dia.pump && (
        <div className="tarjeta columna" style={{ gap: 8 }}>
          <div className="rotulo" style={{ color: "var(--fuerza)" }}>Pump corto</div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--texto-medio)", lineHeight: 1.5 }}>
            Si según la rotación te toca torso, haces torso. Si no, esto:
          </p>
          <Lista items={dia.pump} />
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--texto-tenue)" }}>{dia.pumpNota}</p>
        </div>
      )}

      {dia.notas && (
        <div className="tarjeta">
          <div className="rotulo">A tener en cuenta</div>
          <div style={{ marginTop: 10 }}>
            <Lista items={dia.notas} />
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* CALENDARIO                                                          */
/* ------------------------------------------------------------------ */

function Calendario() {
  const [abierto, setAbierto] = useState(null);
  const dias = calendarioDelTramo();
  const hoy = hoyISO();
  const maxKcal = Math.max(...dias.map((d) => d.kcal));

  return (
    <>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.55 }}>
        Del 26 de agosto al 20 de septiembre: déficit moderado, llenado con los días visuales
        del 4 y 5, transición y los 14 días del test de mantenimiento. Toca cualquier día para
        ver sus comidas y por qué es así. Esto va por fecha: mover un entreno no lo desplaza.
      </p>

      <div className="tarjeta columna" style={{ gap: 2 }}>
        {dias.map((d) => {
          const esHoy = d.fecha === hoy;
          const pasado = d.fecha < hoy;
          return (
            <button
              key={d.fecha}
              onClick={() => setAbierto(d.fecha)}
              aria-label={`Ver el ${d.fecha}`}
              style={{
                display: "block",
                width: "calc(100% + 20px)",
                textAlign: "left",
                border: "none",
                cursor: "pointer",
                color: "var(--texto)",
                padding: "9px 10px",
                margin: "0 -10px",
                borderRadius: 10,
                opacity: pasado ? 0.4 : 1,
                background: esHoy
                  ? "rgba(244,244,239,.07)"
                  : d.especial
                    ? "rgba(255,194,75,.08)"
                    : "transparent",
              }}
            >
              <div className="entre" style={{ gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: esHoy || d.especial ? 800 : 600 }}>
                    {diaCorto(d.fecha)} {fechaCorta(d.fecha)}
                    {esHoy && <span style={{ color: "var(--texto-tenue)", fontWeight: 400 }}> · hoy</span>}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      marginTop: 2,
                      color: d.especial ? "var(--aviso)" : "var(--texto-tenue)",
                    }}
                  >
                    {d.objetivo}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>
                    {miles(d.kcal)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--texto-tenue)", marginTop: 2, whiteSpace: "nowrap" }}>
                    {d.p}P · {d.hc}HC · {d.g}G
                  </div>
                </div>
                <span style={{ color: "var(--texto-tenue)", fontSize: 15, flexShrink: 0 }}>›</span>
              </div>

              {/* Barra proporcional: la forma del plan se ve de un vistazo, sin
                  tener que comparar catorce números a mano. */}
              <div
                style={{
                  marginTop: 7,
                  height: 4,
                  borderRadius: 999,
                  background: "var(--borde-fuerte)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(d.kcal / maxKcal) * 100}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: d.especial ? "var(--aviso)" : "var(--texto-medio)",
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <p style={{ margin: 0, fontSize: 12.5, color: "var(--texto-tenue)", lineHeight: 1.55 }}>
        El 21 de septiembre se lee el test y empieza la definición de seis semanas sobre tu
        mantenimiento medido: a partir de ahí ya no hay calendario de kcal escrito, porque las
        calorías futuras no son cifras fijas. Lo cuenta la pestaña AÑO.
      </p>

      <Hoja
        abierta={Boolean(abierto)}
        alCerrar={() => setAbierto(null)}
        titulo={abierto ? fechaLarga(abierto) : ""}
      >
        <div className="columna">{abierto && <DetalleDia fecha={abierto} />}</div>
      </Hoja>
    </>
  );
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
          Llegar al 4 y 5 de septiembre con algo menos de grasa pero con el músculo LLENO:
          grande, musculado y relativamente definido con camiseta.
        </p>
        <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.6 }}>
          Por eso se cancela el mini-cut de 1.700: con tan poco hidrato perderías glucógeno y agua
          intramuscular, entrenarías peor y llegarías plano y vacío dentro de la camiseta. La
          grasa extra que se pierde en tan pocos días no compensa esa peor apariencia. El objetivo
          NO es pesar lo mínimo. Referencia de partida: 96,9 kg (26 de agosto).
        </p>
      </div>

      <div className="tarjeta columna" style={{ gap: 0 }}>
        <div className="rotulo" style={{ marginBottom: 12 }}>Las siete etapas</div>
        {[
          { dias: "26 ago – 1 sep", que: "Déficit moderado · 2.150", por: "Perder algo de grasa entrenando bien, sin vaciar el músculo." },
          { dias: "2 sep", que: "Empieza el llenado · 2.300", por: "Suben los hidratos a 250 g. Última sesión completa recomendable." },
          { dias: "3 sep", que: "Recarga + descanso · 2.500", por: "Rellenar el glucógeno muscular sin sesión dura. La subida es de hidratos, no de grasa." },
          { dias: "4 – 5 sep", que: "Días visuales · ~2.450", por: "Mantener la plenitud: hidrato alto, agua y sal normales, pump corto opcional." },
          { dias: "6 sep", que: "Transición · 2.500", por: "Nada de volver a un déficit agresivo: estabilizar y medir peso, cintura y foto." },
          { dias: "7 – 20 sep", que: "Test de mantenimiento · ~2.800", por: "Medir el mantenimiento real: 14 días planos y báscula cada mañana. Nada de ajustar por una pesada." },
          { dias: "21 sep – ~1 nov", que: "Definición · 6 semanas", por: "Mantenimiento medido − 450/600 kcal, perdiendo 0,5–0,7 % del peso a la semana." },
        ].map((e, i) => (
          <div
            key={e.dias}
            className="fila"
            style={{ gap: 12, alignItems: "flex-start", padding: "12px 0", borderTop: i === 0 ? "none" : "1px solid var(--borde)" }}
          >
            <span
              style={{
                width: 22, height: 22, borderRadius: 999, flexShrink: 0,
                display: "grid", placeItems: "center",
                background: "var(--superficie-3)", color: "var(--texto-medio)",
                fontSize: 11, fontWeight: 800,
              }}
            >
              {i + 1}
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 14.5, fontWeight: 700 }}>{e.que}</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--texto-tenue)", margin: "2px 0 5px", letterSpacing: ".04em" }}>
                {e.dias.toUpperCase()}
              </span>
              <span style={{ display: "block", fontSize: 13, color: "var(--texto-medio)", lineHeight: 1.5 }}>
                {e.por}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="tarjeta">
        <div className="rotulo" style={{ color: "var(--exito)" }}>Qué se busca ver el 4 y el 5</div>
        <div className="fila" style={{ gap: 6, flexWrap: "wrap", marginTop: 12 }}>
          {["Hombro lateral lleno", "Dorsal y espalda llenos", "Brazos llenos", "Pecho con volumen", "Cintura limpia", "Sin hinchazón abdominal"].map((x) => (
            <span key={x} className="chip" style={{ borderColor: "rgba(113,217,139,.35)", color: "var(--exito)" }}>
              {x}
            </span>
          ))}
        </div>
      </div>

      <div className="tarjeta">
        <div className="rotulo" style={{ color: "var(--aviso)" }}>Tres malentendidos habituales</div>
        <div style={{ marginTop: 12 }} className="columna">
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>La recarga no es un día libre.</div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--texto-medio)", lineHeight: 1.5 }}>
              Las 2.500 kcal del día 3 vienen de arroz, patata, avena, pan, pasta y fruta. Con
              pizza y alcohol conseguirías lo contrario de lo que buscas.
            </p>
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>Si el peso sube del 3 al 5, no es grasa.</div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--texto-medio)", lineHeight: 1.5 }}>
              Al subir los hidratos sube el glucógeno y el agua que lo acompaña. Puedes estar
              perdiendo grasa toda la semana y aun así pesar algo más el 4 que el 2: es normal
              y buscado. La báscula de 24–48 horas no juzga nada.
            </p>
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>La grasa no se elige de dónde sale.</div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--texto-medio)", lineHeight: 1.5 }}>
              Esta estrategia baja la grasa global y mejora hombros, dorsal, brazos y cintura,
              pero nadie puede prometer cuántos gramos salen de una zona concreta como el pecho.
            </p>
          </div>
        </div>
      </div>

      <div className="tarjeta">
        <div className="rotulo">Los días clave</div>
        <div className="columna" style={{ gap: 10, marginTop: 12 }}>
          {Object.entries(DIAS_ESPECIALES).map(([fecha, dia]) => (
            <div key={fecha} className="entre" style={{ fontSize: 13.5 }}>
              <span>{dia.nombre}</span>
              <span style={{ color: "var(--aviso)", fontWeight: 700 }}>
                {fechaCorta(fecha)} · {miles(dia.kcal)} kcal
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* AÑO — el plan maestro por temporadas                                */
/* ------------------------------------------------------------------ */

/*
 * La línea del año entero. Las fases con fecha (hasta la hipertrofia) entran
 * solas; definición, mantenimiento y recomposición las confirma Jose desde su
 * ficha, porque el plan maestro manda: los datos reales deciden, no febrero.
 */
function Ano() {
  const ajustes = useAjustes();
  const [abierta, setAbierta] = useState(null);
  const [ficha, setFicha] = useState(null);
  const hoy = hoyISO();

  const fase = faseDe(hoy, ajustes ?? {});
  const o = objetivosDe(hoy, ajustes ?? {});
  const temporada = abierta ? TEMPORADAS.find((t) => t.id === abierta) : null;

  return (
    <>
      {/* Dónde estás ahora mismo */}
      <div className="tarjeta">
        <div className="rotulo">Ahora mismo</div>
        <div className="entre" style={{ marginTop: 8, alignItems: "baseline" }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{fase.nombre}</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            {miles(o.kcal)} <span style={{ fontSize: 12, fontWeight: 600, color: "var(--texto-tenue)" }}>kcal</span>
          </div>
        </div>
        {fase.dinamica && (
          <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--texto-tenue)", lineHeight: 1.5 }}>
            {ajustes?.mantenimientoReal == null
              ? `Sobre el mantenimiento ESTIMADO de ${miles(MANTENIMIENTO_HIPOTESIS)} kcal (${miles(MANTENIMIENTO_ESTIMADO.min)}–${miles(MANTENIMIENTO_ESTIMADO.max)}), hasta que el test del 7 al 20 de septiembre diga el real.`
              : `Mantenimiento real ${miles(ajustes.mantenimientoReal)} kcal${(ajustes.ajusteKcal ?? 0) !== 0 ? ` ${ajustes.ajusteKcal > 0 ? "+" : "−"} ${Math.abs(ajustes.ajusteKcal)} de las revisiones` : ""}.`}
          </p>
        )}
      </div>

      {/* Las siete temporadas */}
      <div className="tarjeta columna" style={{ gap: 0 }}>
        <div className="rotulo" style={{ marginBottom: 10 }}>Agosto 2026 → agosto 2027</div>
        {TEMPORADAS.map((t, i) => {
          const estado = estadoTemporada(t, hoy, ajustes ?? {});
          const actual = estado === "actual";
          return (
            <button
              key={t.id}
              onClick={() => setAbierta(t.id)}
              aria-label={`Ver la temporada ${t.nombre}`}
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
      </div>

      {/* Fichas de consulta */}
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
              color: "var(--texto)", padding: "11px 10px", borderRadius: 10,
              background: "transparent",
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
        {temporada && <DetalleTemporada temporada={temporada} ajustes={ajustes ?? {}} alCerrar={() => setAbierta(null)} />}
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

/** La ficha completa de una temporada, con el botón de confirmarla si toca. */
function DetalleTemporada({ temporada, ajustes, alCerrar }) {
  const hoy = hoyISO();
  const estado = estadoTemporada(temporada, hoy, ajustes);
  const faseActual = faseDe(hoy, ajustes);

  // Solo se ofrece empezar la fase manual SIGUIENTE a la actual.
  const siguienteDe = {
    definicion: "mantenimiento-post",
    "mantenimiento-post": "ganancia",
    ganancia: "definicion-primavera",
    "definicion-primavera": "mantenimiento-verano",
  };
  const puedeEmpezar = temporada.manual && estado === "futura" && siguienteDe[faseActual.id] === temporada.id;
  const esActualManual = temporada.manual && estado === "actual";

  const [confirmando, setConfirmando] = useState(false);
  const sugerido = (ajustes.mantenimientoReal ?? MANTENIMIENTO_HIPOTESIS) + (ajustes.ajusteKcal ?? 0);
  const [mantenimiento, setMantenimiento] = useState(String(sugerido));

  async function confirmar() {
    const kcal = Number(mantenimiento.replace(",", "."));
    if (Number.isNaN(kcal) || kcal < 1500 || kcal > 4000) return;
    await empezarFase(temporada.id, {
      mantenimiento: kcal,
      ajusteInicial: FASES_MANUALES[temporada.id]?.ajusteInicial ?? 0,
    });
    alCerrar();
  }

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

      {puedeEmpezar && !confirmando && (
        <button className="boton boton-primario" onClick={() => setConfirmando(true)}>
          EMPEZAR {temporada.nombre.toUpperCase()}
        </button>
      )}

      {puedeEmpezar && confirmando && (
        <div className="columna" style={{ gap: 10 }}>
          <label style={{ fontSize: 13, color: "var(--texto-medio)" }}>
            Tu mantenimiento estimado AHORA (kcal/día):
            <input
              type="text"
              inputMode="numeric"
              value={mantenimiento}
              onChange={(e) => setMantenimiento(e.target.value)}
              style={{
                width: "100%", marginTop: 6, padding: "12px 14px", fontSize: 18, fontWeight: 700,
                background: "var(--superficie-3)", border: "1px solid var(--borde-fuerte)",
                borderRadius: 12, color: "var(--texto)",
              }}
            />
          </label>
          {FASES_MANUALES[temporada.id]?.ajusteInicial !== 0 && (
            <p style={{ margin: 0, fontSize: 12.5, color: "var(--texto-tenue)", lineHeight: 1.5 }}>
              La fase arranca en {miles(Number(mantenimiento.replace(",", ".")) + (FASES_MANUALES[temporada.id]?.ajusteInicial ?? 0) || 0)} kcal
              ({FASES_MANUALES[temporada.id].ajusteInicial > 0 ? "+" : "−"}{Math.abs(FASES_MANUALES[temporada.id].ajusteInicial)} sobre ese mantenimiento),
              y la revisión mensual la irá ajustando.
            </p>
          )}
          <button className="boton boton-primario" onClick={confirmar}>CONFIRMAR</button>
        </div>
      )}

      {esActualManual && (
        <button
          onClick={async () => { await quitarFaseManual(); alCerrar(); }}
          style={{
            background: "none", border: "1px solid var(--borde-fuerte)", borderRadius: 12,
            color: "var(--texto-tenue)", padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}
        >
          DESHACER · VOLVER AL PLAN POR FECHAS
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tarjeta del test de mantenimiento (7–20 sep)                        */
/* ------------------------------------------------------------------ */

function TarjetaCalibracion() {
  const ajustes = useAjustes();
  const pesos = usePesos(60);
  const estado = estadoCalibracion(pesos, ajustes ?? {}, hoyISO());

  if (estado.fase === "antes" || estado.fase === "guardada") return null;

  return (
    <div className="tarjeta columna" style={{ gap: 10, borderColor: "var(--carrera)" }}>
      <div className="entre">
        <div className="rotulo" style={{ color: "var(--carrera)" }}>
          Test de mantenimiento
        </div>
        {estado.fase === "en-curso" && (
          <span className="chip">DÍA {Math.min(estado.dia, 14)} DE 14</span>
        )}
      </div>

      {estado.fase === "en-curso" && (
        <>
          <div className="fila" style={{ gap: 8 }}>
            <Cifrita etiqueta="Pesajes sem. 1" valor={`${estado.dias1}/7`} />
            <Cifrita etiqueta="Pesajes sem. 2" valor={`${estado.dias2}/7`} />
            <Cifrita
              etiqueta="Media sem. 1"
              valor={estado.media1 != null ? `${estado.media1.toFixed(1).replace(".", ",")} kg` : "—"}
            />
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--texto-medio)", lineHeight: 1.55 }}>
            NO AJUSTAR POR PESADAS AISLADAS. Come las ~2.800 planas los 14 días, con la misma
            proteína y unos pasos parecidos, y pésate cada mañana (después del baño, antes de
            desayunar). Al acabar, FORJA compara las dos semanas y te propone tu mantenimiento real.
          </p>
        </>
      )}

      {(estado.fase === "lista" || estado.fase === "incompleta") && (
        <>
          {estado.fase === "lista" ? (
            <>
              <div className="fila" style={{ gap: 8 }}>
                <Cifrita etiqueta="Media sem. 1" valor={`${estado.media1.toFixed(1).replace(".", ",")} kg`} />
                <Cifrita etiqueta="Media sem. 2" valor={`${estado.media2.toFixed(1).replace(".", ",")} kg`} />
                <Cifrita
                  etiqueta="Tendencia"
                  valor={`${estado.porSemana > 0 ? "+" : ""}${estado.porSemana.toFixed(2).replace(".", ",")} kg/sem`}
                />
              </div>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.6 }}>
                {estado.ajuste === 0
                  ? `El peso se mantuvo estable comiendo ${miles(MANTENIMIENTO_HIPOTESIS)}: ese ES tu mantenimiento real.`
                  : `Comiendo ${miles(MANTENIMIENTO_HIPOTESIS)} el peso ${estado.porSemana > 0 ? "subió" : "bajó"}: tu mantenimiento real está ` +
                    `alrededor de ${miles(estado.mantenimiento)} kcal.`}
                {estado.recortado &&
                  " (La corrección se limita a ±250 kcal: parte del cambio en dos semanas es agua y glucógeno, no comida.)"}
              </p>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.6 }}>
              El test terminó pero faltan pesajes ({estado.dias1}/7 y {estado.dias2}/7) para una
              media fiable. Puedes seguir pesándote una semana más, o usar la hipótesis de
              {" "}{miles(MANTENIMIENTO_HIPOTESIS)} y afinarla con las revisiones mensuales.
            </p>
          )}

          <button className="boton boton-primario" onClick={() => guardarMantenimiento(estado.mantenimiento)}>
            GUARDAR {miles(estado.mantenimiento)} KCAL COMO MANTENIMIENTO
          </button>
          <p style={{ margin: 0, fontSize: 12, color: "var(--texto-tenue)" }}>
            Desde ese momento todas las fases calculan sus kcal sobre este número, empezando por
            la definición: mantenimiento − 450/600. Se puede corregir en Ajustes.
          </p>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tarjeta de revisión mensual (§65–66)                                */
/* ------------------------------------------------------------------ */

function TarjetaRevision() {
  const ajustes = useAjustes();
  const pesos = usePesos(60);
  const mediciones = useMediciones();
  const sesiones = useSesionesFuerza(80);
  const carreras = useCarreras(80);
  const hoy = hoyISO();

  const fase = faseDe(hoy, ajustes ?? {});
  const pendiente = revisionPendiente(fase.id, ajustes ?? {}, hoy);

  // Las series de las sesiones del mes solo se cargan si la revisión toca.
  const [series, setSeries] = useState(null);
  useEffect(() => {
    if (!pendiente || !sesiones.length) return;
    let vivo = true;
    const ids = sesiones.filter((s) => s.estado === "completada").map((s) => s.id);
    db.series.where("sesionId").anyOf(ids).toArray().then((filas) => {
      if (vivo) setSeries(filas);
    });
    return () => { vivo = false; };
  }, [pendiente, sesiones]);

  if (!pendiente || series == null) return null;

  const r = revisar({ pesos, mediciones, sesiones, carreras, series }, fase.id, hoy);
  const kcalAhora = (ajustes?.mantenimientoReal ?? MANTENIMIENTO_HIPOTESIS) + (ajustes?.ajusteKcal ?? 0);

  const ACCIONES = {
    cumplir: { titulo: "Sin cambios", color: "var(--texto-medio)" },
    mantener: { titulo: "Mantener las kcal", color: "var(--exito)" },
    subir: { titulo: "Subir 100–150 kcal", color: "var(--aviso)" },
    bajar: { titulo: "Bajar 100–150 kcal", color: "var(--aviso)" },
  };

  return (
    <div className="tarjeta columna" style={{ gap: 10, borderColor: "var(--aviso)" }}>
      <div className="rotulo" style={{ color: "var(--aviso)" }}>Revisión de las 4 semanas</div>

      <div className="fila" style={{ gap: 8, flexWrap: "wrap" }}>
        <Cifrita
          etiqueta="Peso"
          valor={r.peso ? `${r.peso.porSemana > 0 ? "+" : ""}${r.peso.porSemana.toFixed(2).replace(".", ",")} kg/sem` : "—"}
        />
        <Cifrita
          etiqueta="Cintura"
          valor={r.cintura ? `${r.cintura.delta > 0 ? "+" : ""}${r.cintura.delta.toFixed(1).replace(".", ",")} cm` : "—"}
        />
        <Cifrita etiqueta="Sesiones" valor={`${r.cumplido.hechas}/${r.cumplido.objetivo}`} />
        <Cifrita
          etiqueta="Progresan"
          valor={r.progresion.total ? `${r.progresion.mejoran}/${r.progresion.total}` : "—"}
        />
      </div>

      <div style={{ fontSize: 16, fontWeight: 800, color: ACCIONES[r.accion].color }}>
        {ACCIONES[r.accion].titulo}
      </div>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.6 }}>{r.motivo}</p>

      {(r.accion === "subir" || r.accion === "bajar") && (
        <div className="fila" style={{ gap: 8 }}>
          {[100, 150].map((n) => (
            <button
              key={n}
              className="boton boton-primario"
              style={{ flex: 1 }}
              onClick={() => aplicarRevision(r.accion === "subir" ? n : -n)}
            >
              {r.accion === "subir" ? "+" : "−"}{n} → {miles(kcalAhora + (r.accion === "subir" ? n : -n))}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => aplicarRevision(0)}
        style={{
          background: r.accion === "mantener" || r.accion === "cumplir" ? "var(--texto)" : "none",
          color: r.accion === "mantener" || r.accion === "cumplir" ? "var(--fondo)" : "var(--texto-tenue)",
          border: "1px solid var(--borde-fuerte)", borderRadius: 12,
          padding: "12px", fontSize: 13, fontWeight: 800, cursor: "pointer",
        }}
      >
        {r.accion === "subir" || r.accion === "bajar" ? "PREFIERO MANTENER" : "VISTO · SEGUIR IGUAL"}
      </button>
      <p style={{ margin: 0, fontSize: 12, color: "var(--texto-tenue)" }}>
        La próxima revisión aparecerá sola dentro de 4 semanas.
      </p>
    </div>
  );
}

function Cifrita({ etiqueta, valor }) {
  return (
    <div style={{ flex: 1, minWidth: 70, background: "var(--superficie-3)", borderRadius: 10, padding: "8px 10px" }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".08em", color: "var(--texto-tenue)" }}>
        {etiqueta.toUpperCase()}
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2, whiteSpace: "nowrap" }}>{valor}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Macro({ etiqueta, valor, color }) {
  return (
    <div
      style={{
        flex: 1,
        background: "var(--superficie-3)",
        borderRadius: 12,
        padding: "10px 12px",
      }}
    >
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
