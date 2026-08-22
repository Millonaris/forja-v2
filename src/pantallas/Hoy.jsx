/*
 * HOY (§6 de la spec).
 *
 * Tiene que contestar cinco preguntas en dos segundos: ¿he apuntado el peso?,
 * ¿qué fuerza me toca?, ¿qué carrera me toca?, ¿he hecho postura? y ¿cuál es
 * mi objetivo de hoy.
 *
 * Nada de "hoy toca" como mandato. La app dice qué viene después y recomienda
 * cuándo; el usuario decide (§4, §37).
 */

import { useState } from "react";

import DialogoPeso from "../componentes/DialogoPeso.jsx";
import Hoja from "../componentes/Hoja.jsx";
import { objetivosDe, planEnMarcha } from "../datos/planNutricion.js";
import { ejerciciosDeHoy } from "../datos/rutinaPostural.js";
import { protocolosDe } from "../datos/protocolos.js";
import { rampaDe, rirDeHoy } from "../datos/rampa.js";
import {
  useAjustes, useCarreras, useEstadoCarrera, useEstadoFuerza,
  usePesos, usePosturaHoy, useSesionAbierta, useSesionesFuerza,
} from "../ganchos/useDatos.js";
import { fechaLarga, haceCuanto, hoyISO } from "../logica/fechas.js";
import * as motorCarrera from "../logica/motorCarrera.js";
import * as motorFuerza from "../logica/motorFuerza.js";
import { formatear as formatearPeso, faltaHoy, media, pesoDe } from "../logica/peso.js";
import { adherenciaFuerza } from "../logica/volumen.js";

export default function Hoy({ irA, alAbrirAjustes, alRetomarEntreno }) {
  const hoy = hoyISO();
  const ajustes = useAjustes();
  const pesos = usePesos();
  const sesiones = useSesionesFuerza();
  const carreras = useCarreras();
  const estadoFuerza = useEstadoFuerza();
  const estadoCarrera = useEstadoCarrera();
  const posturaHoy = usePosturaHoy();
  const sesionAbierta = useSesionAbierta();

  const [pidiendoPeso, setPidiendoPeso] = useState(false);
  const [protocoloAbierto, setProtocoloAbierto] = useState(null);

  const rutina = estadoFuerza ? motorFuerza.siguiente(estadoFuerza) : null;
  const proximaCarrera = estadoCarrera ? motorCarrera.siguiente(estadoCarrera) : null;

  const ultimaFuerza = motorFuerza.ultimaSesion(sesiones.filter((s) => s.estado === "completada"));
  const ultimaCarrera = carreras.filter((c) => c.estado === "completada")[0] ?? null;

  const recFuerza = motorFuerza.recomendacion(ultimaFuerza, adherenciaFuerza(sesiones).hechas);
  const recCarrera = motorCarrera.recomendacion(ultimaCarrera);

  const ejPostura = ejerciciosDeHoy(0);
  const hechosPostura = posturaHoy?.hechos?.length ?? 0;

  const objetivos = objetivosDe(hoy, ajustes?.escalonVolumen ?? 0);
  const rampa = rampaDe(hoy);
  const protocolos = protocolosDe(hoy);

  return (
    <div style={{ padding: "20px var(--margen) 0" }} className="columna">
      {/* ---------- Cabecera ---------- */}
      <div className="entre" style={{ alignItems: "flex-start", paddingTop: 10 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".22em", color: "var(--fuerza)" }}>
            FORJA
          </div>
          <h1 className="titulo" style={{ marginTop: 6 }}>{fechaLarga(hoy)}</h1>
        </div>
        <button onClick={alAbrirAjustes} aria-label="Ajustes" style={estiloEngranaje}>
          ⚙
        </button>
      </div>

      <div className="fila" style={{ flexWrap: "wrap", gap: 8 }}>
        {planEnMarcha(hoy) && <span className="chip">{objetivos.fase.nombre.toUpperCase()}</span>}
        {proximaCarrera && <span className="chip">BLOQUE {proximaCarrera.bloque.numero}</span>}
        <span className="chip">RIR {rirDeHoy(hoy)}</span>
      </div>

      {/* ---------- Peso ---------- */}
      <div className="tarjeta entre">
        {faltaHoy(pesos) ? (
          <>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Peso pendiente</div>
              <div style={{ fontSize: 13, color: "var(--texto-tenue)", marginTop: 2 }}>
                {pesos.length
                  ? `Última vez: ${formatearPeso(pesos[pesos.length - 1].kg)} kg`
                  : "Aún no has apuntado ninguno"}
              </div>
            </div>
            <button className="boton boton-primario" onClick={() => setPidiendoPeso(true)}>
              APUNTAR
            </button>
          </>
        ) : (
          <>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>
                {formatearPeso(pesoDe(pesos, hoy))} kg
              </div>
              <div style={{ fontSize: 13, color: "var(--texto-tenue)", marginTop: 2 }}>
                Media 7 días: {formatearPeso(media(pesos))} kg
              </div>
            </div>
            <button className="boton-texto" onClick={() => setPidiendoPeso(true)}>
              Corregir
            </button>
          </>
        )}
      </div>

      {/* ---------- Protocolo del día ---------- */}
      {protocolos.map((p) => (
        <button
          key={p.id}
          onClick={() => setProtocoloAbierto(p)}
          className="tarjeta entre"
          style={{ width: "100%", textAlign: "left", cursor: "pointer", borderColor: "var(--aviso)" }}
        >
          <div>
            <div className="rotulo" style={{ color: "var(--aviso)" }}>Hoy</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{p.titulo}</div>
          </div>
          <span style={{ color: "var(--texto-tenue)" }}>›</span>
        </button>
      ))}

      {/* ---------- Acciones ---------- */}
      <h2 style={{ fontSize: 20, marginTop: 4 }}>¿Qué quieres hacer hoy?</h2>

      <div className="columna" style={{ gap: 10 }}>
        <Accion
          letra="F"
          color="var(--fuerza)"
          tinte="var(--fuerza-tinte)"
          titulo="FUERZA"
          detalle={rutina ? `Próximo: ${rutina.nombre}` : "…"}
          alPulsar={() => irA("entrenar", "fuerza")}
        />
        <Accion
          letra="C"
          color="var(--carrera)"
          tinte="var(--carrera-tinte)"
          titulo="CORRER"
          detalle={proximaCarrera ? `Próxima: ${proximaCarrera.texto}` : "…"}
          alPulsar={() => irA("entrenar", "carrera")}
        />
        <Accion
          letra="P"
          color="var(--postura)"
          tinte="var(--postura-tinte)"
          titulo="POSTURA"
          detalle={`${hechosPostura}/${ejPostura.length} hoy`}
          alPulsar={() => irA("entrenar", "postura")}
        />
      </div>

      {/* ---------- Próxima fuerza ---------- */}
      {rutina && (
        <div className="tarjeta columna" style={{ gap: 12 }}>
          <div>
            <div className="rotulo" style={{ color: sesionAbierta ? "var(--fuerza)" : undefined }}>
              {sesionAbierta ? "Entreno en curso" : "Próxima fuerza"}
            </div>
            <div style={{ fontSize: 25, fontWeight: 800, marginTop: 6 }}>
              {sesionAbierta ? nombreDe(sesionAbierta.plantillaId) : rutina.nombre}
            </div>
            <div className="dato" style={{ fontSize: 13.5, marginTop: 6 }}>
              {ultimaFuerza
                ? `Último gym: ${nombreDe(ultimaFuerza.plantillaId)} · ${haceCuanto(ultimaFuerza.fecha)}`
                : "Sin entrenos todavía"}
            </div>
            <div style={{ fontSize: 13.5, marginTop: 3, color: colorTono(recFuerza.tono) }}>
              Recomendación: {recFuerza.texto}
            </div>
            {rampa && (
              <div style={{ fontSize: 13, marginTop: 6, color: "var(--aviso)" }}>
                {rampa.etiqueta} · series recortadas, RIR {rampa.rir}
              </div>
            )}
          </div>
          <div className="acciones">
            <button
              className="boton boton-primario"
              onClick={() => (sesionAbierta ? alRetomarEntreno?.() : irA("entrenar", "fuerza"))}
            >
              {sesionAbierta ? "CONTINUAR" : "EMPEZAR"}
            </button>
            <button className="boton" onClick={() => irA("plan", "fuerza")}>VER</button>
          </div>
        </div>
      )}

      {/* ---------- Próxima carrera ---------- */}
      {proximaCarrera && (
        <div className="tarjeta columna" style={{ gap: 12 }}>
          <div>
            <div className="rotulo">Próxima carrera</div>
            <div style={{ fontSize: 21, fontWeight: 800, marginTop: 6 }}>{proximaCarrera.texto}</div>
            <div className="dato" style={{ fontSize: 13.5, marginTop: 6 }}>
              Bloque {proximaCarrera.bloque.numero} · sesión {proximaCarrera.numeroSesion} de{" "}
              {proximaCarrera.totalSesiones}
              {ultimaCarrera ? ` · última ${haceCuanto(ultimaCarrera.fecha)}` : ""}
            </div>
            <div style={{ fontSize: 13.5, marginTop: 3, color: colorTono(recCarrera.tono) }}>
              Recomendación: {recCarrera.texto}
            </div>
          </div>
          <div className="acciones">
            <button className="boton boton-primario" onClick={() => irA("entrenar", "carrera")}>
              CORRER HOY
            </button>
            <button className="boton" onClick={() => irA("plan", "carrera")}>VER</button>
          </div>
        </div>
      )}

      {/* ---------- Postura ---------- */}
      <button
        onClick={() => irA("entrenar", "postura")}
        className="tarjeta entre"
        style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
      >
        <div>
          <div className="rotulo" style={{ color: "var(--postura)" }}>Postura</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>
            {hechosPostura}/{ejPostura.length} · 8–10 min
          </div>
        </div>
        <span className="boton boton-primario" style={{ background: "var(--postura)" }}>
          {hechosPostura ? "SEGUIR" : "EMPEZAR"}
        </span>
      </button>

      {/* ---------- Nutrición ---------- */}
      <button
        onClick={() => irA("plan", "nutricion")}
        className="tarjeta entre"
        style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
      >
        <div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>
            {objetivos.kcal.toLocaleString("es-ES")} kcal
          </div>
          <div className="dato" style={{ fontSize: 13.5, marginTop: 3 }}>
            {objetivos.p}P · {objetivos.hc}HC · {objetivos.g}G
          </div>
        </div>
        <span style={{ color: "var(--texto-tenue)", fontSize: 12, fontWeight: 700 }}>VER PLAN ›</span>
      </button>

      <DialogoPeso
        abierto={pidiendoPeso}
        alCerrar={() => setPidiendoPeso(false)}
        pesoActual={pesoDe(pesos, hoy)}
        ultimo={pesos.length ? pesos[pesos.length - 1].kg : null}
      />

      <Hoja
        abierta={Boolean(protocoloAbierto)}
        alCerrar={() => setProtocoloAbierto(null)}
        titulo={protocoloAbierto?.titulo}
      >
        <ul style={{ margin: 0, paddingLeft: 18, color: "var(--texto-medio)", lineHeight: 1.7 }}>
          {protocoloAbierto?.instrucciones.map((t) => <li key={t}>{t}</li>)}
        </ul>
        {protocoloAbierto?.pump && (
          <>
            <div className="rotulo" style={{ margin: "18px 0 8px" }}>Pump corto</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: "var(--texto-medio)", lineHeight: 1.7 }}>
              {protocoloAbierto.pump.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </>
        )}
      </Hoja>
    </div>
  );
}

function Accion({ letra, color, tinte, titulo, detalle, alPulsar }) {
  return (
    <button onClick={alPulsar} className="tarjeta entre" style={{ width: "100%", cursor: "pointer", textAlign: "left" }}>
      <div className="fila" style={{ gap: 14 }}>
        <span
          style={{
            width: 42, height: 42, borderRadius: 12, background: tinte, color,
            display: "grid", placeItems: "center", fontWeight: 800, fontSize: 16,
          }}
        >
          {letra}
        </span>
        <span>
          <span style={{ display: "block", fontSize: 15, fontWeight: 800, letterSpacing: ".05em" }}>
            {titulo}
          </span>
          <span style={{ display: "block", fontSize: 13, color: "var(--texto-tenue)", marginTop: 2 }}>
            {detalle}
          </span>
        </span>
      </div>
      <span style={{ color: "var(--texto-tenue)" }}>›</span>
    </button>
  );
}

const NOMBRES = {
  "torso-a": "Torso A", "pierna-a": "Pierna A",
  "torso-b": "Torso B", "pierna-b": "Pierna B",
};
const nombreDe = (id) => NOMBRES[id] ?? id;

function colorTono(tono) {
  if (tono === "bien") return "var(--exito)";
  if (tono === "aviso") return "var(--aviso)";
  return "var(--texto-tenue)";
}

const estiloEngranaje = {
  width: 42, height: 42, borderRadius: 999,
  background: "var(--superficie-3)", border: "1px solid var(--borde)",
  color: "var(--texto-medio)", fontSize: 16, cursor: "pointer",
};
