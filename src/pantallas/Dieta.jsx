/*
 * DIETA.
 *
 * Es la quinta pestaña, y sí, la spec pedía cuatro (§5). Se añade a petición
 * expresa: hasta el 8 de septiembre la dieta es lo único del plan que tiene
 * fecha límite y lo que más veces al día se mira, así que esconderla dentro de
 * PLAN la dejaba a dos toques de distancia varias veces cada día.
 *
 * Tres partes, y en este orden a propósito (§35: acción primero, explicación
 * después):
 *
 *   HOY        · qué comes hoy, comida por comida. Es el 95 % de los usos.
 *   CALENDARIO · el tramo 26 ago → 8 sep entero, para ver a dónde vas.
 *   POR QUÉ    · la estrategia explicada. Se lee una vez y no se toca más.
 *
 * La comida se registra en Fitia. Esto es la chuleta (§58).
 */

import { useState } from "react";

import {
  DIAS_ESPECIALES, NOTA_PREENTRENO, REGLAS,
  calendarioDelTramo, kcalDe, objetivosDe, planEnMarcha,
} from "../datos/planNutricion.js";
import { useAjustes } from "../ganchos/useDatos.js";
import { diaCorto, fechaCorta, fechaLarga, hoyISO } from "../logica/fechas.js";
import { miles } from "../logica/formato.js";

const SECCIONES = [
  { id: "hoy", texto: "HOY" },
  { id: "calendario", texto: "CALENDARIO" },
  { id: "porque", texto: "POR QUÉ" },
];

export default function Dieta({ sub }) {
  const [activa, setActiva] = useState(sub ?? "hoy");

  return (
    <div style={{ padding: "20px var(--margen) 0" }} className="columna">
      <h1 className="titulo" style={{ paddingTop: 10 }}>Dieta</h1>

      <div className="fila" style={{ gap: 6 }}>
        {SECCIONES.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiva(s.id)}
            aria-pressed={s.id === activa}
            style={{
              flex: 1, borderRadius: 999, padding: "10px 6px",
              fontSize: 11.5, fontWeight: 800, letterSpacing: ".05em", cursor: "pointer",
              background: s.id === activa ? "var(--texto)" : "transparent",
              border: `1px solid ${s.id === activa ? "var(--texto)" : "var(--borde)"}`,
              color: s.id === activa ? "var(--fondo)" : "var(--texto-tenue)",
            }}
          >
            {s.texto}
          </button>
        ))}
      </div>

      {activa === "hoy" && <Hoy />}
      {activa === "calendario" && <Calendario alVerDia={() => setActiva("hoy")} />}
      {activa === "porque" && <PorQue />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HOY                                                                 */
/* ------------------------------------------------------------------ */

function Hoy() {
  const ajustes = useAjustes();
  const [fecha, setFecha] = useState(hoyISO());
  const o = objetivosDe(fecha, ajustes?.escalonVolumen ?? 0);
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
              {esHoy ? "Hoy" : fechaLarga(fecha)}
            </div>
            <div style={{ fontSize: 21, fontWeight: 800, marginTop: 5 }}>{o.nombre}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>
              {miles(o.kcal)}
            </div>
            <div style={{ fontSize: 11, color: "var(--texto-tenue)", marginTop: 3 }}>kcal</div>
          </div>
        </div>

        {o.resumen && (
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.5 }}>
            {o.resumen}
          </p>
        )}

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

      {/* Saltar a los días clave sin tener que esperar a que lleguen */}
      <div className="tarjeta columna" style={{ gap: 10 }}>
        <div className="rotulo">Ver otro día</div>
        <div className="fila" style={{ gap: 8, flexWrap: "wrap" }}>
          {[hoyISO(), "2026-09-03", "2026-09-04"].map((f) => (
            <button
              key={f}
              onClick={() => setFecha(f)}
              className="chip"
              style={{
                cursor: "pointer",
                background: fecha === f ? "var(--texto)" : "var(--superficie-3)",
                color: fecha === f ? "var(--fondo)" : undefined,
                borderColor: fecha === f ? "var(--texto)" : undefined,
              }}
            >
              {f === hoyISO() ? "HOY" : fechaCorta(f).toUpperCase()}
            </button>
          ))}
        </div>
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
  const dias = calendarioDelTramo();
  const hoy = hoyISO();
  const maxKcal = Math.max(...dias.map((d) => d.kcal));

  return (
    <>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.55 }}>
        Del 26 de agosto al 8 de septiembre. Esto va por fecha: mover un entreno no lo desplaza.
      </p>

      <div className="tarjeta columna" style={{ gap: 2 }}>
        {dias.map((d) => {
          const esHoy = d.fecha === hoy;
          const pasado = d.fecha < hoy;
          return (
            <div
              key={d.fecha}
              style={{
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
            </div>
          );
        })}
      </div>

      <p style={{ margin: 0, fontSize: 12.5, color: "var(--texto-tenue)", lineHeight: 1.55 }}>
        Después del 8 de septiembre: mantenimiento hasta el 15, y volumen limpio desde el 16.
      </p>
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
          Llegar al 4 de septiembre más seco pero sin verte vacío.
        </p>
        <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "var(--texto-medio)", lineHeight: 1.6 }}>
          Hacer 1.700 kcal seguidas del 26 al 4 te secaría igual, pero llegarías plano. Por eso
          los tres días previos devuelven hidrato al músculo: es lo que llena hombros, dorsal,
          pecho y brazos.
        </p>
      </div>

      <div className="tarjeta columna" style={{ gap: 0 }}>
        <div className="rotulo" style={{ marginBottom: 12 }}>Las cinco etapas</div>
        {[
          { dias: "26 ago – 1 sep", que: "Recorte fuerte", por: "Perder grasa y quitar la hinchazón de las vacaciones." },
          { dias: "2 sep", que: "Subimos hidratos", por: "Empezar a devolver algo de hidrato al músculo." },
          { dias: "3 sep", que: "Recarga controlada", por: "Rellenar el glucógeno muscular. La subida es de hidratos, no de grasa." },
          { dias: "4 sep", que: "Día visual", por: "Mantener el hidrato alto y entrenar buscando congestión." },
          { dias: "5 – 8 sep", que: "Vuelta al mini-cut", por: "Seguir con el recorte moderado hasta cerrar la fase." },
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
        <div className="rotulo" style={{ color: "var(--exito)" }}>Qué se busca ver el día 4</div>
        <div className="fila" style={{ gap: 6, flexWrap: "wrap", marginTop: 12 }}>
          {["Menos cintura", "Menos hinchazón", "Hombros más llenos", "Dorsal más lleno", "Pecho y brazos con volumen"].map((x) => (
            <span key={x} className="chip" style={{ borderColor: "rgba(113,217,139,.35)", color: "var(--exito)" }}>
              {x}
            </span>
          ))}
        </div>
      </div>

      <div className="tarjeta">
        <div className="rotulo" style={{ color: "var(--aviso)" }}>Dos malentendidos habituales</div>
        <div style={{ marginTop: 12 }} className="columna">
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>La recarga no es un día libre.</div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--texto-medio)", lineHeight: 1.5 }}>
              Las 2.200 kcal del día 3 vienen de arroz, patata, avena, pan, pasta y fruta. Con
              pizza y alcohol conseguirías lo contrario de lo que buscas.
            </p>
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>No hay que compensar al día siguiente.</div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--texto-medio)", lineHeight: 1.5 }}>
              El día 5 se vuelve a las 1.850 y ya está. Las 2.200 del día 3 seguramente estén
              alrededor o por debajo de tu mantenimiento real: un día así no borra la semana.
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
