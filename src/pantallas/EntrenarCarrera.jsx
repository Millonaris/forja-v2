/*
 * ENTRENAR > CARRERA (§13, §14, §15).
 *
 * La carrera se corre con el Garmin. Aquí la app dice cuál toca, deja
 * programarla y registra que se ha hecho — nada más, y a propósito.
 *
 * Al completar la última sesión del bloque NO avanza sola: pregunta qué tal
 * fue y deja elegir entre avanzar, repetir o revisar (§14).
 */

import { useState } from "react";

import Hoja, { Opciones } from "../componentes/Hoja.jsx";
import { ENVOLTURA, NOMBRES_FASE, proximoHito } from "../datos/planCarrera.js";
import { useCarreras, useEstadoCarrera } from "../ganchos/useDatos.js";
import { cerrarBloqueCarrera, marcarCarreraHecha, omitirCarrera } from "../logica/acciones.js";
import { haceCuanto } from "../logica/fechas.js";
import * as motor from "../logica/motorCarrera.js";

export default function EntrenarCarrera() {
  const estado = useEstadoCarrera();
  const carreras = useCarreras();

  const [registrando, setRegistrando] = useState(false);
  const [omitiendo, setOmitiendo] = useState(false);
  const [aviso, setAviso] = useState(null);

  if (!estado) return null;

  // El bloque está cerrado y falta contestar qué tal fue. Hasta entonces no se
  // ofrece ninguna sesión: la última ya se hizo y volver a marcarla la
  // duplicaría.
  const cerrandoBloque = estado.esperandoCierre ?? null;

  const proxima = motor.siguiente(estado);
  if (!proxima) {
    return <p className="dato">Has terminado los 30 bloques. 20 km. Enhorabuena.</p>;
  }

  const hechas = carreras.filter((c) => c.estado === "completada");
  const ultima = hechas[0] ?? null;
  const avisoConsecutivo = motor.avisoConsecutivo(ultima);
  const progreso = motor.progresoDeBloque(estado);
  const hito = proximoHito(estado.bloque);
  const esCaco = proxima.sesion.tipo === "caco";

  async function registrar(datos) {
    await marcarCarreraHecha(datos);
    setRegistrando(false);
  }

  if (cerrandoBloque) {
    return (
      <div className="tarjeta columna" style={{ gap: 14 }}>
        <div>
          <div className="rotulo" style={{ color: "var(--exito)" }}>Bloque completado</div>
          <div style={{ fontSize: 24, fontWeight: 800, margin: "8px 0 6px" }}>
            Bloque {cerrandoBloque}
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "var(--texto-medio)" }}>
            {motor.CIERRE_BLOQUE.pregunta}
          </p>
        </div>

        <Opciones
          opciones={motor.CIERRE_BLOQUE.respuestas.map((r) => ({ id: r.id, texto: r.texto }))}
          alElegir={(id) =>
            cerrarBloqueCarrera(motor.CIERRE_BLOQUE.respuestas.find((r) => r.id === id)?.accion)
          }
        />

        <p style={{ margin: 0, fontSize: 12.5, color: "var(--texto-tenue)", lineHeight: 1.5 }}>
          Repetir un bloque no es retroceder: es lo que hace que el siguiente salga.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ---------- Próxima sesión ---------- */}
      <div className="tarjeta columna" style={{ gap: 14 }}>
        <div>
          <div className="rotulo" style={{ color: "var(--carrera)" }}>Próxima sesión</div>
          <div style={{ fontSize: 24, fontWeight: 800, margin: "8px 0 6px" }}>{proxima.texto}</div>
          <div className="dato" style={{ fontSize: 13.5 }}>
            Bloque {proxima.bloque.numero} · sesión {proxima.numeroSesion} de {proxima.totalSesiones}
            {proxima.bloque.esDescarga ? " · descarga" : ""}
          </div>
          <div className="dato" style={{ fontSize: 13.5, marginTop: 3 }}>
            Fase {proxima.bloque.fase} · {NOMBRES_FASE[proxima.bloque.fase]}
            {ultima ? ` · última carrera ${haceCuanto(ultima.fecha)}` : ""}
          </div>
        </div>

        {/* Barra de sesiones del bloque: dónde estás sin tener que contar. */}
        <div className="fila" style={{ gap: 5 }}>
          {Array.from({ length: progreso.total }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 999,
                background: i < progreso.hechas ? "var(--carrera)" : "var(--borde-fuerte)",
              }}
            />
          ))}
        </div>

        {avisoConsecutivo && (
          <div style={estiloAviso}>
            {avisoConsecutivo} Puedes correr igualmente.
          </div>
        )}

        <div className="acciones">
          <button
            className="boton boton-primario"
            style={{ background: "var(--carrera)" }}
            onClick={() => (avisoConsecutivo ? setAviso(avisoConsecutivo) : setRegistrando(true))}
          >
            MARCAR HECHA
          </button>
          <button className="boton" onClick={() => setOmitiendo(true)}>OMITIR</button>
        </div>
      </div>

      {/* ---------- Cómo se hace ---------- */}
      <div className="tarjeta columna" style={{ gap: 10 }}>
        <div className="rotulo">Cómo se hace</div>
        <Linea etiqueta="Calentamiento" valor={ENVOLTURA.calentamiento} />
        <Linea etiqueta="Sesión" valor={proxima.texto} />
        <Linea etiqueta="Enfriamiento" valor={ENVOLTURA.enfriamiento} />
        <Linea etiqueta="Esfuerzo" valor={`RPE ${ENVOLTURA.rpe}`} />
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--carrera)" }}>{ENVOLTURA.test}</p>
      </div>

      {hito && (
        <div className="tarjeta">
          <div className="rotulo">Próximo hito</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginTop: 6 }}>{hito.texto}</div>
          <div className="dato" style={{ fontSize: 13, marginTop: 3 }}>
            en el bloque {hito.bloque}
          </div>
        </div>
      )}

      {/* ---------- Registro ---------- */}
      <RegistroCarrera
        abierto={registrando}
        alCerrar={() => setRegistrando(false)}
        proxima={proxima}
        esCaco={esCaco}
        alGuardar={registrar}
      />

      {/* ---------- Aviso de días consecutivos: informa, no impide ---------- */}
      <Hoja abierta={Boolean(aviso)} alCerrar={() => setAviso(null)} titulo="Corriste hace poco" subtitulo={aviso}>
        <Opciones
          opciones={[
            { id: "seguir", texto: "Marcarla igualmente" },
            { id: "cancelar", texto: "Dejarlo" },
          ]}
          alElegir={(id) => {
            setAviso(null);
            if (id === "seguir") setRegistrando(true);
          }}
        />
      </Hoja>

      {/* ---------- Omitir ---------- */}
      <Hoja
        abierta={omitiendo}
        alCerrar={() => setOmitiendo(false)}
        titulo="Omitir esta carrera"
        subtitulo="No se acumula con la siguiente. Se queda como omitida y ya está."
      >
        <Opciones
          opciones={[
            { id: "avanzar", texto: "Omitir y pasar a la siguiente" },
            { id: "pendiente", texto: "Omitir y mantenerla pendiente" },
            { id: "cancelar", texto: "Cancelar" },
          ]}
          alElegir={async (id) => {
            if (id !== "cancelar") await omitirCarrera({ avanzar: id === "avanzar" });
            setOmitiendo(false);
          }}
        />
      </Hoja>
    </>
  );
}

/*
 * Registro. En CaCo no se piden km ni ritmo (§51): una sesión de intervalos
 * solo se marca como hecha, con nota si acaso. En continua sí, porque ahí el
 * ritmo significa algo.
 */
function RegistroCarrera({ abierto, alCerrar, proxima, esCaco, alGuardar }) {
  const [km, setKm] = useState("");
  const [minutos, setMinutos] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);
    await alGuardar({
      km: km ? Number(km.replace(",", ".")) : null,
      minutos: minutos ? Number(minutos) : null,
      notas,
    });
    setKm(""); setMinutos(""); setNotas(""); setGuardando(false);
  }

  return (
    <Hoja abierta={abierto} alCerrar={alCerrar} titulo="Carrera hecha" subtitulo={proxima.texto}>
      <div className="columna" style={{ gap: 14 }}>
        {esCaco ? (
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--texto-medio)" }}>
            En una sesión de correr y caminar no hacen falta ni kilómetros ni ritmo.
            Con marcarla basta.
          </p>
        ) : (
          <div className="fila" style={{ gap: 10 }}>
            <Campo etiqueta="km" valor={km} alCambiar={setKm} marcador={String(proxima.sesion.km ?? "")} />
            <Campo etiqueta="minutos" valor={minutos} alCambiar={setMinutos} marcador={String(proxima.sesion.minutos ?? "")} />
          </div>
        )}

        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Nota (opcional): cómo te has encontrado, molestias…"
          rows={2}
          style={{
            background: "var(--superficie)", border: "1px solid var(--borde)",
            borderRadius: 14, padding: "12px 14px", color: "var(--texto)",
            fontSize: 14, resize: "none",
          }}
        />

        <button className="boton boton-primario" style={{ background: "var(--carrera)" }} disabled={guardando} onClick={guardar}>
          GUARDAR
        </button>
      </div>
    </Hoja>
  );
}

function Campo({ etiqueta, valor, alCambiar, marcador }) {
  return (
    <label style={{ flex: 1 }}>
      <span className="rotulo" style={{ display: "block", marginBottom: 6 }}>{etiqueta}</span>
      <input
        type="text"
        inputMode="decimal"
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        placeholder={marcador}
        style={{
          width: "100%", background: "var(--superficie)", border: "1px solid var(--borde)",
          borderRadius: 14, padding: "14px 16px", color: "var(--texto)",
          fontSize: 20, fontWeight: 700,
        }}
      />
    </label>
  );
}

function Linea({ etiqueta, valor }) {
  return (
    <div className="entre" style={{ fontSize: 13.5 }}>
      <span style={{ color: "var(--texto-tenue)" }}>{etiqueta}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>{valor}</span>
    </div>
  );
}

const estiloAviso = {
  background: "rgba(255,194,75,.1)",
  border: "1px solid rgba(255,194,75,.3)",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 13,
  color: "var(--aviso)",
};
