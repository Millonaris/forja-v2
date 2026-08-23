/*
 * PLAN (§20). Solo consulta: fuerza, carrera, postura y agenda.
 *
 * Aquí no se ejecuta nada — para eso está ENTRENAR. Y la agenda de esta
 * pantalla es lo único que queda del calendario de la v1: siete días de
 * sugerencias movibles, no un contrato (§27).
 */

import { useState } from "react";

import Volver from "../componentes/Volver.jsx";

import { BLOQUES, ENVOLTURA, NOMBRES_FASE, REGLAS as REGLAS_CARRERA, describirSesion, proximoHito } from "../datos/planCarrera.js";
import { REGLAS_DESCANSO, REGLAS_PROGRESION, RUTINAS, descansoTexto, dosis } from "../datos/rutinas.js";
import { EJERCICIOS as POSTURALES, EXTRAS, FRASE, SEGUIMIENTO } from "../datos/rutinaPostural.js";
import Hoja, { Opciones } from "../componentes/Hoja.jsx";
import {
  useAgenda, useAjustes, useCarreras, useEstadoCarrera, useEstadoFuerza,
} from "../ganchos/useDatos.js";
import { fijarEnAgenda, moverEnAgenda, omitirEnAgenda, quitarDeAgenda } from "../logica/acciones.js";
import { diaCorto, fechaCorta, hoyISO, sumarDias } from "../logica/fechas.js";
import { conflicto, proximos7Dias } from "../logica/agenda.js";

/*
 * Nutrición NO está aquí: vive en su propia pestaña, DIETA. Tenerla en los dos
 * sitios sería exactamente el duplicado que el rediseño quiere quitar (§60-C:
 * se elimina la copia y se enlaza a la fuente única).
 */
const SECCIONES = [
  { id: "fuerza", texto: "FUERZA" },
  { id: "carrera", texto: "0→20 KM" },
  { id: "postura", texto: "POSTURA" },
  { id: "agenda", texto: "AGENDA" },
];

export default function Plan({ sub, alVolver }) {
  const [activa, setActiva] = useState(sub ?? "fuerza");

  return (
    <div style={{ padding: "20px var(--margen) 0" }} className="columna">
      <div className="fila" style={{ gap: 12, paddingTop: 10 }}>
        <Volver alVolver={alVolver} />
        <h1 className="titulo">Plan</h1>
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

      {activa === "fuerza" && <Fuerza />}
      {activa === "carrera" && <Carrera />}
      {activa === "postura" && <Postura />}
      {activa === "agenda" && <Agenda />}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Fuerza() {
  const estado = useEstadoFuerza();
  const siguienteId = estado ? RUTINAS[(estado.indiceSiguiente ?? 0) % 4].id : null;

  return (
    <>
      {RUTINAS.map((rutina) => (
        <div key={rutina.id} className="tarjeta columna" style={{ gap: 9 }}>
          <div className="entre">
            <div className="rotulo" style={{ color: rutina.id === siguienteId ? "var(--fuerza)" : undefined }}>
              {rutina.nombre}
            </div>
            {rutina.id === siguienteId && (
              <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--fuerza)", letterSpacing: ".1em" }}>
                SIGUIENTE
              </span>
            )}
          </div>
          {rutina.ejercicios.map((e) => (
            <div key={e.nombre} className="entre" style={{ fontSize: 13.5 }}>
              <span>
                {e.prioritario && <span style={{ marginRight: 5 }}>⭐</span>}
                {e.nombre}
              </span>
              <span style={{ color: "var(--texto-tenue)", whiteSpace: "nowrap" }}>
                {dosis(e)}
                <span style={{ marginLeft: 8, color: "var(--carrera)" }}>
                  {descansoTexto(e.descanso)}
                </span>
              </span>
            </div>
          ))}
        </div>
      ))}

      <Plegable titulo="Descansos">
        <Lista items={REGLAS_DESCANSO} />
      </Plegable>

      <Plegable titulo="Doble progresión">
        <Lista items={REGLAS_PROGRESION} numerada />
        <p style={{ fontSize: 12.5, color: "var(--texto-tenue)", marginTop: 10, marginBottom: 0 }}>
          No hace falta batir un récord cada sesión.
        </p>
      </Plegable>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Carrera() {
  const estado = useEstadoCarrera();
  const [todos, setTodos] = useState(false);
  if (!estado) return null;

  const bloque = BLOQUES.find((b) => b.numero === estado.bloque);
  const hito = proximoHito(estado.bloque);

  return (
    <>
      <div className="tarjeta">
        <div className="rotulo" style={{ color: "var(--carrera)" }}>Ahora</div>
        <div style={{ fontSize: 22, fontWeight: 800, margin: "6px 0 4px" }}>Bloque {estado.bloque}</div>
        <div className="dato" style={{ fontSize: 13.5 }}>
          Fase {bloque?.fase} · {NOMBRES_FASE[bloque?.fase]}
        </div>
        {hito && (
          <div style={{ fontSize: 13.5, marginTop: 8, color: "var(--carrera)" }}>
            Próximo hito: {hito.texto} (bloque {hito.bloque})
          </div>
        )}
      </div>

      <div className="tarjeta columna" style={{ gap: 8 }}>
        <div className="rotulo">Siempre</div>
        <Lista items={[
          `Antes: ${ENVOLTURA.calentamiento}`,
          `Después: ${ENVOLTURA.enfriamiento}`,
          `Esfuerzo: RPE ${ENVOLTURA.rpe}`,
          ENVOLTURA.test,
        ]} />
      </div>

      <button className="boton" onClick={() => setTodos(!todos)} style={{ width: "100%" }}>
        {todos ? "OCULTAR" : "VER LOS 30 BLOQUES"}
      </button>

      {todos && (
        <div className="tarjeta columna" style={{ gap: 2 }}>
          {BLOQUES.map((b, i) => {
            const actual = b.numero === estado.bloque;
            const cambiaFase = i === 0 || BLOQUES[i - 1].fase !== b.fase;
            return (
              <div key={b.numero}>
                {cambiaFase && (
                  <div className="rotulo" style={{ margin: i === 0 ? "0 0 10px" : "16px 0 10px" }}>
                    Fase {b.fase} · {NOMBRES_FASE[b.fase]}
                  </div>
                )}
                <div
                  className="fila"
                  style={{
                    gap: 10,
                    alignItems: "baseline",
                    padding: "7px 9px",
                    margin: "0 -9px",
                    borderRadius: 10,
                    background: actual ? "rgba(123,223,255,.09)" : "transparent",
                    opacity: b.numero < estado.bloque ? 0.4 : 1,
                  }}
                >
                  <span
                    style={{
                      width: 24, flexShrink: 0, fontSize: 12, fontWeight: 800, textAlign: "right",
                      color: actual ? "var(--carrera)" : "var(--texto-tenue)",
                    }}
                  >
                    {b.numero}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: actual ? 700 : 400 }}>
                    {resumirBloque(b)}
                  </span>
                  {b.esDescarga && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--aviso)", flexShrink: 0 }}>
                      DESCARGA
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Plegable titulo="Reglas">
        <Lista items={REGLAS_CARRERA} />
      </Plegable>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Postura() {
  return (
    <>
      <div className="tarjeta columna" style={{ gap: 9 }}>
        <div className="rotulo" style={{ color: "var(--postura)" }}>Rutina diaria</div>
        {POSTURALES.map((e) => (
          <div key={e.id} className="entre" style={{ fontSize: 13.5 }}>
            <span>{e.nombre}</span>
            <span style={{ color: "var(--texto-tenue)" }}>{e.dosis}</span>
          </div>
        ))}
      </div>

      <div className="tarjeta">
        <div className="rotulo" style={{ color: "var(--postura)" }}>De pie</div>
        <p style={{ margin: "8px 0 0", fontSize: 14.5, lineHeight: 1.5 }}>{FRASE}</p>
      </div>

      <div className="tarjeta columna" style={{ gap: 8 }}>
        <div className="rotulo">Extras</div>
        {EXTRAS.map((x) => (
          <div key={x.nombre} className="entre" style={{ fontSize: 13.5 }}>
            <span>{x.nombre}</span>
            <span style={{ color: "var(--texto-tenue)", textAlign: "right" }}>{x.dosis} · {x.cuando}</span>
          </div>
        ))}
      </div>

      <div className="tarjeta columna" style={{ gap: 8 }}>
        <div className="rotulo">Seguimiento</div>
        {SEGUIMIENTO.map((s) => (
          <div key={s.id} className="entre" style={{ fontSize: 13.5 }}>
            <span>{s.titulo}</span>
            <span style={{ color: "var(--texto-tenue)" }}>cada {s.cada / 7} semanas</span>
          </div>
        ))}
        <p style={{ fontSize: 12.5, color: "var(--texto-tenue)", margin: "4px 0 0" }}>
          Son recordatorios, no obligaciones atadas a un día concreto.
        </p>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Agenda() {
  const ajustes = useAjustes();
  const estadoFuerza = useEstadoFuerza();
  const estadoCarrera = useEstadoCarrera();
  const carreras = useCarreras();
  const eventos = useAgenda();

  const [tocando, setTocando] = useState(null);
  const [aviso, setAviso] = useState(null);

  if (!ajustes || !estadoFuerza || !estadoCarrera) return null;

  const dias = proximos7Dias({
    ajustes,
    estadoFuerza,
    estadoCarrera,
    eventos,
    ultimaCarreraHecha: carreras.find((c) => c.estado === "completada")?.fecha ?? null,
  });

  /*
   * Fijar o mover un evento. Si al soltarlo coinciden fuerza y carrera el
   * mismo día, se avisa y se ofrecen las salidas de §16 — pero la decisión es
   * del usuario y ninguna se aplica sola.
   */
  async function moverA(evento, fecha) {
    const destino = dias.find((d) => d.fecha === fecha);
    const choque = conflicto(fecha, [...(destino?.entradas ?? []), { tipo: evento.tipo }]);

    if (evento.id != null) await moverEnAgenda(evento.id, fecha);
    else await fijarEnAgenda({ fecha, tipo: evento.tipo, titulo: evento.titulo });

    setTocando(null);
    if (choque) setAviso({ ...choque, movido: { ...evento, fecha } });
  }

  return (
    <>
      <div className="tarjeta columna" style={{ gap: 12 }}>
        <div className="rotulo">Próximos 7 días</div>
        {dias.map((d) => (
          <div key={d.fecha} className="fila" style={{ gap: 12, alignItems: "flex-start" }}>
            <span
              style={{
                width: 40, flexShrink: 0, fontSize: 12.5, fontWeight: 700,
                color: d.esHoy ? "var(--fuerza)" : "var(--texto-tenue)",
              }}
            >
              {d.dia}
            </span>
            <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {d.descanso ? (
                <span style={{ fontSize: 13, color: "var(--texto-tenue)" }}>Descanso</span>
              ) : (
                d.entradas.map((e, i) => (
                  <Evento key={i} evento={e} alTocar={() => setTocando({ ...e, fecha: d.fecha })} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <p style={{ margin: 0, fontSize: 12.5, color: "var(--texto-tenue)", lineHeight: 1.55 }}>
        Toca cualquier sesión para moverla de día. Lo que propone la app va con contorno
        punteado; lo que fijas tú, con línea sólida y 🗓. Mover aquí no adelanta la rotación ni
        el bloque: eso solo avanza cuando completas.
      </p>

      {/* ---------- Mover una sesión ---------- */}
      <Hoja
        abierta={Boolean(tocando)}
        alCerrar={() => setTocando(null)}
        titulo={tocando?.titulo}
        subtitulo={tocando ? `Ahora, el ${diaCorto(tocando.fecha)} ${fechaCorta(tocando.fecha)}` : ""}
      >
        <div className="columna" style={{ gap: 14 }}>
          <div className="rotulo">Moverla a</div>
          <div className="fila" style={{ gap: 6, flexWrap: "wrap" }}>
            {Array.from({ length: 7 }, (_, i) => sumarDias(hoyISO(), i)).map((f) => (
              <button
                key={f}
                onClick={() => moverA(tocando, f)}
                disabled={f === tocando?.fecha}
                className="chip"
                style={{
                  cursor: f === tocando?.fecha ? "default" : "pointer",
                  opacity: f === tocando?.fecha ? 0.35 : 1,
                }}
              >
                {diaCorto(f)} {fechaCorta(f)}
              </button>
            ))}
          </div>

          {tocando?.id != null && (
            <div className="fila" style={{ gap: 8 }}>
              <button
                className="boton"
                style={{ flex: 1 }}
                onClick={async () => {
                  await omitirEnAgenda(tocando.id);
                  setTocando(null);
                }}
              >
                OMITIR
              </button>
              <button
                className="boton"
                style={{ flex: 1 }}
                onClick={async () => {
                  await quitarDeAgenda(tocando.id);
                  setTocando(null);
                }}
              >
                DEJAR SUGERIDA
              </button>
            </div>
          )}
        </div>
      </Hoja>

      {/* ---------- Choque fuerza / carrera (§16) ---------- */}
      <Hoja
        abierta={Boolean(aviso)}
        alCerrar={() => setAviso(null)}
        titulo="Ese día ya tienes algo"
        subtitulo={aviso?.mensaje}
      >
        <Opciones
          opciones={(aviso?.opciones ?? []).filter((o) => o.id !== "cancelar")}
          alElegir={async (id) => {
            const carreraDelDia = dias
              .find((d) => d.fecha === aviso.movido.fecha)
              ?.entradas.find((e) => e.tipo === "carrera");

            if (id === "mover-carrera" && carreraDelDia) {
              // Al primer día libre, que es lo que se haría a mano.
              const libre = Array.from({ length: 7 }, (_, i) => sumarDias(aviso.movido.fecha, i + 1))
                .find((f) => !dias.find((d) => d.fecha === f)?.entradas.length);
              if (libre) {
                if (carreraDelDia.id != null) await moverEnAgenda(carreraDelDia.id, libre);
                else await fijarEnAgenda({ fecha: libre, tipo: "carrera", titulo: carreraDelDia.titulo });
              }
            } else if (id === "omitir-carrera" && carreraDelDia?.id != null) {
              await omitirEnAgenda(carreraDelDia.id);
            }
            setAviso(null);
          }}
        />
        <p style={{ fontSize: 12.5, color: "var(--texto-tenue)", marginTop: 14, marginBottom: 0 }}>
          Hacer las dos también vale: esto es un aviso, no una prohibición.
        </p>
      </Hoja>
    </>
  );
}

/** Un evento de la agenda. La forma distingue el estado, no solo el color (§55, §56). */
function Evento({ evento, alTocar }) {
  const color = evento.tipo === "fuerza" ? "var(--fuerza)" : "var(--carrera)";
  const omitido = evento.estado === "omitido";
  const fijado = evento.estado === "programado";

  return (
    <button
      onClick={alTocar}
      style={{
        fontSize: 12,
        padding: "5px 10px",
        borderRadius: 999,
        cursor: "pointer",
        background: "transparent",
        border: `1px ${fijado ? "solid" : "dashed"} ${omitido ? "var(--borde)" : color}`,
        color: omitido ? "var(--texto-tenue)" : color,
        opacity: omitido ? 0.5 : fijado ? 1 : 0.75,
        textDecoration: omitido ? "line-through" : "none",
      }}
    >
      {fijado && <span style={{ marginRight: 4 }}>🗓</span>}
      {evento.titulo}
    </button>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Resume un bloque en una línea.
 *
 * En fase 1 las tres sesiones son idénticas, así que repetirlas tres veces
 * solo ocupa sitio: se escribe "3 × 6 × (2′ correr + 2′ caminar)". En fases 2
 * y 3 cada sesión es distinta y sí se listan las tres.
 */
function resumirBloque(bloque) {
  const textos = bloque.sesiones.map(describirSesion);
  const todasIguales = textos.every((t) => t === textos[0]);
  return todasIguales ? `${textos.length} × ${textos[0]}` : textos.join(" · ");
}

/** Texto largo plegado: no puede competir con las acciones (§35). */
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

function Lista({ items, numerada }) {
  const Etiqueta = numerada ? "ol" : "ul";
  return (
    <Etiqueta style={{ margin: 0, paddingLeft: 18, color: "var(--texto-medio)", fontSize: 13.5, lineHeight: 1.7 }}>
      {items.map((t) => <li key={t}>{t}</li>)}
    </Etiqueta>
  );
}
