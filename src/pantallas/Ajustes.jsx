/*
 * AJUSTES (§33). Fuera de la barra de pestañas, detrás del engranaje de HOY.
 *
 * Aquí se corrige lo que la app no puede adivinar: por dónde va la rotación,
 * en qué bloque de carrera estás y qué días te vienen bien. Todo editable,
 * porque la vida cambia y forzar a "empezar de cero" para arreglar un dato es
 * exactamente lo que este rediseño quiere evitar.
 */

import { useRef, useState } from "react";

import DialogoNumero from "../componentes/DialogoNumero.jsx";
import Hoja from "../componentes/Hoja.jsx";
import { guardarAjustes } from "../datos/db.js";
import { BLOQUES, describirSesion } from "../datos/planCarrera.js";
import { FASES, ORDEN_FASES, estadoNutricion } from "../datos/planNutricion.js";
import { RUTINAS } from "../datos/rutinas.js";
import { useAjustes, useEstadoCarrera, useEstadoFuerza } from "../ganchos/useDatos.js";
import { confirmarMantenimiento, corregirEstadoCarrera, corregirEstadoFuerza, fijarKcal, volverAFase } from "../logica/acciones.js";
import { miles } from "../logica/formato.js";
import { haceCuanto } from "../logica/fechas.js";
import { estadoPermiso, pedirPermiso } from "../utiles/avisos.js";
import { exportar, importar, inventario } from "../utiles/copiaSeguridad.js";

export default function Ajustes({ abierto, alCerrar }) {
  const ajustes = useAjustes();
  const estadoFuerza = useEstadoFuerza();
  const estadoCarrera = useEstadoCarrera();
  const ficheroRef = useRef(null);
  const [mensaje, setMensaje] = useState(null);

  if (!abierto || !ajustes) return null;

  async function alElegirFichero(e) {
    const fichero = e.target.files?.[0];
    if (!fichero) return;
    try {
      const resultado = await importar(await fichero.text());
      const total = Object.values(resultado.cuentas).reduce((t, n) => t + n, 0);
      const ahora = await inventario();
      setMensaje(
        `Restaurados ${total} registros. Ahora hay ${ahora.sesiones} entrenos, ` +
          `${ahora.series} series, ${ahora.carreras} carreras y ${ahora.pesos} pesos.`,
      );
    } catch (error) {
      setMensaje(`No se pudo restaurar: ${error.message}`);
    }
    e.target.value = "";
  }

  return (
    <Hoja abierta={abierto} alCerrar={alCerrar} titulo="Ajustes">
      <div className="columna" style={{ gap: 22 }}>
        {/* ---------- Plan ---------- */}
        <Seccion titulo="Plan">
          <Selector
            etiqueta="Siguiente rutina"
            valor={estadoFuerza?.indiceSiguiente ?? 0}
            opciones={RUTINAS.map((r) => ({ valor: r.orden, texto: r.nombre }))}
            alCambiar={(v) => corregirEstadoFuerza(Number(v))}
          />

          <Selector
            etiqueta="Bloque de carrera"
            valor={estadoCarrera?.bloque ?? 1}
            opciones={BLOQUES.map((b) => ({
              valor: b.numero,
              texto: `Bloque ${b.numero} · ${describirSesion(b.sesiones[0])}`,
            }))}
            alCambiar={(v) => corregirEstadoCarrera(Number(v))}
          />

          <Selector
            etiqueta="Volumen de la rutina"
            valor={ajustes.rutinaAgresiva ? 1 : 0}
            opciones={[
              { valor: 0, texto: "Conservadora — recomendada" },
              { valor: 1, texto: "Agresiva — una serie más en 6 ejercicios" },
            ]}
            alCambiar={(v) => guardarAjustes({ rutinaAgresiva: v === "1" })}
          />

        </Seccion>

        {/* ---------- Dieta ---------- */}
        <Seccion titulo="Dieta">
          <Nutricion ajustes={ajustes} />
        </Seccion>

        {/* ---------- Avisos ---------- */}
        <Seccion titulo="Avisos">
          <AvisoDeSistema />
          <Interruptor
            etiqueta="Vibración al terminar el descanso"
            puesto={ajustes.vibracion}
            alCambiar={(v) => guardarAjustes({ vibracion: v })}
          />
          <Interruptor
            etiqueta="Sonido"
            puesto={ajustes.sonido}
            alCambiar={(v) => guardarAjustes({ sonido: v })}
          />
        </Seccion>

        {/* ---------- Datos ---------- */}
        <Seccion titulo="Datos">
          <p style={{ margin: 0, fontSize: 13, color: "var(--texto-medio)", lineHeight: 1.5 }}>
            Todo está en este móvil y en ningún sitio más. Si lo pierdes sin copia, se pierden
            los datos.
          </p>
          <div style={{ fontSize: 12.5, color: "var(--texto-tenue)" }}>
            Última copia: {ajustes.ultimaCopia ? haceCuanto(ajustes.ultimaCopia) : "nunca"}
          </div>

          <div className="fila" style={{ gap: 8 }}>
            <button className="boton boton-primario" style={{ flex: 1 }} onClick={() => exportar()}>
              EXPORTAR
            </button>
            <button className="boton" style={{ flex: 1 }} onClick={() => ficheroRef.current?.click()}>
              RESTAURAR
            </button>
          </div>
          <input
            ref={ficheroRef}
            type="file"
            accept="application/json,.json"
            onChange={alElegirFichero}
            style={{ display: "none" }}
          />
        </Seccion>

        {/* ---------- Versión ---------- */}
        <div style={{ fontSize: 12, color: "var(--texto-tenue)", textAlign: "center" }}>
          FORJA {__VERSION_FORJA__} · {__FECHA_FORJA__}
        </div>
      </div>

      <Hoja abierta={Boolean(mensaje)} alCerrar={() => setMensaje(null)} titulo="Copia de seguridad">
        <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--texto-medio)", lineHeight: 1.5 }}>
          {mensaje}
        </p>
        <button className="boton boton-primario" style={{ width: "100%" }} onClick={() => setMensaje(null)}>
          ENTENDIDO
        </button>
      </Hoja>
    </Hoja>
  );
}

/*
 * Permiso de notificaciones. Es lo único que hace que el descanso avise con la
 * app cerrada o el móvil bloqueado: sin él, el temporizador solo suena si
 * tienes FORJA delante.
 */
function AvisoDeSistema() {
  const [estado, setEstado] = useState(() => estadoPermiso());

  if (estado === "concedido") {
    return (
      <div style={{ fontSize: 13, color: "var(--exito)" }}>
        Avisos activados: el descanso suena aunque tengas el móvil bloqueado.
      </div>
    );
  }

  if (estado === "denegado" || estado === "no-soportado") {
    return (
      <p style={{ margin: 0, fontSize: 13, color: "var(--aviso)", lineHeight: 1.5 }}>
        {estado === "denegado"
          ? "Los avisos están bloqueados para FORJA. Se activan desde los ajustes de notificaciones del móvil, no desde aquí."
          : "Este navegador no puede avisar en segundo plano. Instala FORJA como app para que funcione."}
      </p>
    );
  }

  return (
    <button
      className="boton boton-primario"
      style={{ width: "100%" }}
      onClick={async () => setEstado(await pedirPermiso())}
    >
      ACTIVAR AVISOS DE DESCANSO
    </button>
  );
}

function Seccion({ titulo, children }) {
  return (
    <section className="columna" style={{ gap: 10 }}>
      <div className="rotulo">{titulo}</div>
      {children}
    </section>
  );
}

/*
 * El estado nutricional editable.
 *
 * Normalmente NO se toca desde aquí: el objetivo lo mueve la revisión de 14
 * días y la fase se confirma desde DIETA → AÑO. Esto está para arreglar un
 * despiste —confirmar la fase equivocada, apuntar mal un número— sin tener que
 * empezar de cero, que es justo lo que este rediseño quiere evitar.
 */
function Nutricion({ ajustes }) {
  const e = estadoNutricion(ajustes);
  const [editando, setEditando] = useState(null);

  return (
    <>
      <Selector
        etiqueta="Fase"
        valor={e.faseId}
        opciones={ORDEN_FASES.map((id) => ({ valor: id, texto: FASES[id].nombre }))}
        alCambiar={(v) => { if (v !== e.faseId) volverAFase(v); }}
      />

      <FilaAjuste
        etiqueta="Objetivo de calorías"
        valor={`${miles(e.kcal)} kcal`}
        alPulsar={() => setEditando("kcal")}
      />

      <FilaAjuste
        etiqueta="Mantenimiento confirmado"
        valor={
          e.mantenimientoConfirmado == null
            ? "Sin confirmar"
            : `${miles(e.mantenimientoConfirmado)} kcal · ${e.confianzaMantenimiento === "medium" ? "provisional" : "alta"}`
        }
        alPulsar={() => setEditando("mantenimiento")}
      />

      <p style={{ margin: 0, fontSize: 12, color: "var(--texto-tenue)", lineHeight: 1.5 }}>
        Cambiar las calorías aquí reinicia el reloj de 14 días, igual que hacerlo desde la revisión.
        El gasto deducido lo calcula la app sola con tu peso y lo que apuntas cada día.
      </p>

      <DialogoNumero
        abierto={editando === "kcal"}
        alCerrar={() => setEditando(null)}
        titulo="Objetivo de calorías"
        subtitulo="Lo que comes cada día en esta fase. La proteína y la grasa se quedan donde están; el hidrato se lleva la diferencia."
        unidad="kcal"
        marcador="2400"
        valorInicial={{ valor: e.kcal }}
        min={1200}
        max={4500}
        alGuardar={({ valor: v }) => fijarKcal(v)}
      />

      <DialogoNumero
        abierto={editando === "mantenimiento"}
        alCerrar={() => setEditando(null)}
        titulo="Mantenimiento confirmado"
        subtitulo="Las kcal con las que tu peso se queda quieto. Normalmente lo confirma sola la fase de mantenimiento; corrígelo solo si sabes lo que haces."
        unidad="kcal"
        marcador="2750"
        valorInicial={{ valor: e.mantenimientoConfirmado ?? e.kcal }}
        min={1500}
        max={4500}
        alGuardar={({ valor: v }) => confirmarMantenimiento(v, "medium")}
      />
    </>
  );
}

function FilaAjuste({ etiqueta, valor, alPulsar }) {
  return (
    <button
      onClick={alPulsar}
      className="entre"
      style={{
        width: "100%", background: "var(--superficie)", border: "1px solid var(--borde)",
        borderRadius: 12, padding: "12px 14px", color: "var(--texto)", fontSize: 14, cursor: "pointer",
      }}
    >
      <span style={{ color: "var(--texto-medio)", fontSize: 13 }}>{etiqueta}</span>
      <span style={{ fontWeight: 700 }}>{valor}</span>
    </button>
  );
}

function Selector({ etiqueta, valor, opciones, alCambiar }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 13, color: "var(--texto-medio)", marginBottom: 6 }}>
        {etiqueta}
      </span>
      <select
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        style={{
          width: "100%", background: "var(--superficie)", border: "1px solid var(--borde)",
          borderRadius: 12, padding: "12px 14px", color: "var(--texto)", fontSize: 14,
        }}
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>{o.texto}</option>
        ))}
      </select>
    </label>
  );
}

function Interruptor({ etiqueta, puesto, alCambiar }) {
  return (
    <button
      onClick={() => alCambiar(!puesto)}
      role="switch"
      aria-checked={puesto}
      className="entre"
      style={{
        width: "100%", background: "var(--superficie)", border: "1px solid var(--borde)",
        borderRadius: 12, padding: "12px 14px", color: "var(--texto)", fontSize: 14,
        cursor: "pointer", textAlign: "left",
      }}
    >
      <span>{etiqueta}</span>
      <span
        style={{
          width: 42, height: 25, borderRadius: 999, flexShrink: 0,
          background: puesto ? "var(--fuerza)" : "var(--borde-fuerte)",
          display: "flex", alignItems: "center",
          justifyContent: puesto ? "flex-end" : "flex-start",
          padding: 3,
        }}
      >
        <span style={{ width: 19, height: 19, borderRadius: 999, background: puesto ? "var(--fondo)" : "var(--texto-tenue)" }} />
      </span>
    </button>
  );
}
