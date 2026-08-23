/*
 * Agenda recomendada (§27) y motor de recomendaciones (§38).
 *
 * TODO lo que sale de aquí es una sugerencia. Nada de lo que hay en este
 * fichero puede impedir nada ni marcar nada como fallado: la agenda propone y
 * el usuario dispone (§4, §6).
 *
 * Estados visuales de un evento (§56):
 *   realizado  · pasó de verdad. Sólido.
 *   sugerido   · lo propone la app. Contorno ligero.
 *   programado · lo puso el usuario a mano. Intermedio, con icono de calendario.
 *   omitido    · gris. NUNCA rojo: saltarse un día no es un error (§36).
 *   pendiente  · sigue ahí, sin drama.
 */

import { aFecha, diaCorto, hoyISO, sumarDias } from "./fechas.js";
import { siguiente as siguienteFuerza } from "./motorFuerza.js";
import { siguiente as siguienteCarrera } from "./motorCarrera.js";

export const ESTADOS = ["realizado", "programado", "sugerido", "pendiente", "omitido"];

/**
 * Los próximos 7 días con lo que la app propone.
 *
 * Reglas de §38, por orden: ~3 sesiones de fuerza cada 7 días, 2–3 de carrera
 * según el bloque, evitar carrera en días consecutivos, y en caso de choque la
 * fuerza tiene prioridad.
 */
export function proximos7Dias({
  ajustes,
  estadoFuerza,
  estadoCarrera,
  eventos = [],
  // La última carrera REALMENTE hecha: sin ella, la regla de no correr dos
  // días seguidos solo veía las carreras que la propia agenda proponía, y
  // sugería correr hoy aunque hubieras corrido ayer (o esta misma mañana).
  ultimaCarreraHecha = null,
}) {
  const desde = hoyISO();
  const diasFuerza = new Set(ajustes?.diasFuerza ?? [1, 3, 5]);
  const diasCarrera = new Set(ajustes?.diasCarrera ?? [2, 4, 0]);

  const puestos = new Map(eventos.map((e) => [`${e.fecha}:${e.tipo}`, e]));
  const bloque = siguienteCarrera(estadoCarrera);
  const cupoCarrera = bloque?.totalSesiones ?? 3;
  // ~3 sesiones de fuerza cada 7 días (§38).
  const cupoFuerza = 3;

  /*
   * Lo que el usuario ha fijado a mano CONSUME cupo. Sin esto, mover Torso B
   * al jueves dejaba la sugerencia del lunes intacta y la misma sesión salía
   * dos veces en la misma semana.
   */
  const dentroDeLaSemana = (e) => e.fecha >= desde && e.fecha <= sumarDias(desde, 6);
  const fijados = eventos.filter((e) => dentroDeLaSemana(e) && e.estado !== "omitido");
  const fuerzaFijada = fijados.filter((e) => e.tipo === "fuerza").length;
  const carreraFijada = fijados.filter((e) => e.tipo === "carrera").length;
  // Las rutinas ya colocadas a mano no se vuelven a proponer: si mueves Torso B
  // al jueves, el lunes pasa a proponer la siguiente de la rotación, no otra
  // vez la misma sesión.
  const yaColocadas = new Set(fijados.filter((e) => e.tipo === "fuerza").map((e) => e.titulo));

  let rotacion = { indiceSiguiente: 0, ...estadoFuerza };
  let fuerzasPuestas = 0;
  let carrerasPuestas = 0;
  let ultimaCarrera = ultimaCarreraHecha;

  return Array.from({ length: 7 }, (_, i) => {
    const fecha = sumarDias(desde, i);
    const diaSemana = aFecha(fecha).getDay();
    const entradas = [];

    /* --- Fuerza --- */
    const yaPuesta = puestos.get(`${fecha}:fuerza`);
    if (yaPuesta) {
      entradas.push(yaPuesta);
      if (yaPuesta.estado !== "omitido") fuerzasPuestas++;
    } else if (diasFuerza.has(diaSemana) && fuerzasPuestas < cupoFuerza - fuerzaFijada) {
      // Salta las rutinas que ya están fijadas en otro día de la semana.
      let rutina = siguienteFuerza(rotacion);
      for (let vuelta = 0; vuelta < 4 && yaColocadas.has(rutina.nombre); vuelta++) {
        rotacion = { ...rotacion, indiceSiguiente: (rotacion.indiceSiguiente + 1) % 4 };
        rutina = siguienteFuerza(rotacion);
      }

      entradas.push({ fecha, tipo: "fuerza", titulo: rutina.nombre, estado: "sugerido" });
      fuerzasPuestas++;
      // La agenda simula la rotación hacia delante para no proponer la misma
      // sesión tres veces: es una previsión, no una reserva.
      rotacion = { ...rotacion, indiceSiguiente: (rotacion.indiceSiguiente + 1) % 4 };
    }

    /* --- Carrera --- */
    const carreraPuesta = puestos.get(`${fecha}:carrera`);
    if (carreraPuesta) {
      entradas.push(carreraPuesta);
      if (carreraPuesta.estado !== "omitido") {
        ultimaCarrera = fecha;
        carrerasPuestas++;
      }
    } else if (
      diasCarrera.has(diaSemana) &&
      carrerasPuestas < cupoCarrera - carreraFijada &&
      // Nunca dos días seguidos en esta fase (§15), y nunca proponer una
      // carrera en un día en el que ya se corrió.
      ultimaCarrera !== sumarDias(fecha, -1) &&
      (ultimaCarrera == null || fecha > ultimaCarrera)
    ) {
      entradas.push({
        fecha,
        tipo: "carrera",
        titulo: bloque ? bloque.texto : "Carrera",
        estado: "sugerido",
      });
      ultimaCarrera = fecha;
      carrerasPuestas++;
    }

    return {
      fecha,
      dia: diaCorto(fecha),
      esHoy: fecha === desde,
      entradas,
      // Un día sin nada es descanso, no un hueco que rellenar.
      descanso: entradas.length === 0,
    };
  });
}

/**
 * Choque entre fuerza y carrera el mismo día (§16).
 *
 * La prioridad actual es FUERZA > RUNNING, así que se propone mover la
 * carrera. Pero se ofrecen las cuatro salidas y ninguna se aplica sola.
 */
export function conflicto(fecha, entradas) {
  const tieneFuerza = entradas.some((e) => e.tipo === "fuerza");
  const tieneCarrera = entradas.some((e) => e.tipo === "carrera");
  if (!tieneFuerza || !tieneCarrera) return null;

  return {
    fecha,
    mensaje: "Ese día tienes carrera sugerida. Lo normal es mantener la fuerza y mover la carrera.",
    opciones: [
      { id: "mover-carrera", texto: "Mover la carrera" },
      { id: "omitir-carrera", texto: "Omitir la carrera" },
      { id: "ambos", texto: "Hacer las dos" },
      { id: "cancelar", texto: "Cancelar" },
    ],
  };
}

/** El estilo de cada estado. El color nunca es la única señal (§55). */
export const ESTILO_ESTADO = {
  realizado: { borde: "solido", opacidad: 1, icono: "" },
  programado: { borde: "solido", opacidad: 0.9, icono: "🗓" },
  sugerido: { borde: "punteado", opacidad: 0.65, icono: "" },
  pendiente: { borde: "punteado", opacidad: 0.5, icono: "·" },
  omitido: { borde: "punteado", opacidad: 0.35, icono: "—" },
};

/** Etiqueta visible de un evento futuro. Todos los futuros son sugerencias. */
export function etiqueta(evento) {
  return evento.estado === "sugerido" ? "SUGERIDO" : null;
}
