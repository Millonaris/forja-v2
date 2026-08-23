/*
 * Lectura de datos en vivo.
 *
 * Todo sale de IndexedDB con `useLiveQuery`: si algo cambia en cualquier
 * pantalla, las demás se enteran solas. No hay estado global duplicado, que es
 * de donde salen las incoherencias del tipo "en Hoy pone una cosa y en
 * Progreso otra" (§4: una sola fuente de verdad por dato).
 */

import { useLiveQuery } from "dexie-react-hooks";

import { db, leerEstadoCarrera, leerEstadoFuerza } from "../datos/db.js";
import { hoyISO, sumarDias } from "../logica/fechas.js";

/** Ajustes. `undefined` mientras carga, para poder distinguirlo de "no hay". */
export function useAjustes() {
  return useLiveQuery(() => db.ajustes.get(1), []);
}

export function useEstadoFuerza() {
  return useLiveQuery(() => leerEstadoFuerza(), []);
}

export function useEstadoCarrera() {
  return useLiveQuery(() => leerEstadoCarrera(), []);
}

/** Sesiones de fuerza, de la más reciente a la más antigua. */
export function useSesionesFuerza(limite = 60) {
  return useLiveQuery(
    async () => (await db.sesionesFuerza.orderBy("fecha").reverse().limit(limite).toArray()) ?? [],
    [limite],
    [],
  );
}

export function useCarreras(limite = 60) {
  return useLiveQuery(
    async () => (await db.carreras.orderBy("fecha").reverse().limit(limite).toArray()) ?? [],
    [limite],
    [],
  );
}

/** Pesos de los últimos `dias` días, para la media móvil y la gráfica. */
export function usePesos(dias = 120) {
  return useLiveQuery(
    async () => (await db.pesos.where("fecha").above(sumarDias(hoyISO(), -dias)).toArray()) ?? [],
    [dias],
    [],
  );
}

/** El registro postural de hoy. */
export function usePosturaHoy() {
  return useLiveQuery(() => db.postura.get(hoyISO()), []);
}

export function usePostura(dias = 60) {
  return useLiveQuery(
    async () => (await db.postura.where("fecha").above(sumarDias(hoyISO(), -dias)).toArray()) ?? [],
    [dias],
    [],
  );
}

/** Los ejercicios de una rutina, en orden. */
export function useEjercicios(plantillaId) {
  return useLiveQuery(
    async () => {
      if (!plantillaId) return [];
      const lista = await db.ejercicios.where("plantillaId").equals(plantillaId).toArray();
      return lista.sort((a, b) => a.orden - b.orden);
    },
    [plantillaId],
    [],
  );
}

/** Todo el catálogo de ejercicios: lo necesita el cálculo de volumen. */
export function useCatalogoEjercicios() {
  return useLiveQuery(async () => (await db.ejercicios.toArray()) ?? [], [], []);
}

/** Las series de una sesión concreta. */
export function useSeriesDeSesion(sesionId) {
  return useLiveQuery(
    async () => {
      if (!sesionId) return [];
      return db.series.where("sesionId").equals(sesionId).toArray();
    },
    [sesionId],
    [],
  );
}

/** El historial de series de un ejercicio, para saber qué hiciste la última vez. */
export function useHistorialEjercicio(ejercicioId) {
  return useLiveQuery(
    async () => {
      if (!ejercicioId) return [];
      return db.series.where("ejercicioId").equals(ejercicioId).toArray();
    },
    [ejercicioId],
    [],
  );
}

/** Mediciones de cintura, de la más reciente a la más antigua. */
export function useMediciones() {
  return useLiveQuery(
    async () => (await db.mediciones.orderBy("fecha").reverse().toArray()) ?? [],
    [],
    [],
  );
}

/** Fotos de progreso, de la más reciente a la más antigua. */
export function useFotos() {
  return useLiveQuery(
    async () => (await db.fotos.orderBy("fecha").reverse().toArray()) ?? [],
    [],
    [],
  );
}

export function useTestsPared() {
  return useLiveQuery(
    async () => (await db.testsPared.orderBy("fecha").reverse().toArray()) ?? [],
    [],
    [],
  );
}

/** La nota libre de un día. */
export function useNota(fecha) {
  return useLiveQuery(async () => (await db.diario.get(fecha))?.nota ?? "", [fecha], "");
}

export function useDiario(dias = 60) {
  return useLiveQuery(
    async () => (await db.diario.where("fecha").above(sumarDias(hoyISO(), -dias)).toArray()) ?? [],
    [dias],
    [],
  );
}

/** Las series de un ejercicio agrupadas por sesión, para el historial en vivo. */
export function useSesionesDeEjercicio(ejercicioId) {
  return useLiveQuery(
    async () => {
      if (!ejercicioId) return [];
      const series = await db.series.where("ejercicioId").equals(ejercicioId).toArray();
      const sesiones = await db.sesionesFuerza.toArray();
      const fechas = new Map(sesiones.map((s) => [s.id, s]));
      const grupos = new Map();
      for (const serie of series) {
        if (!grupos.has(serie.sesionId)) grupos.set(serie.sesionId, []);
        grupos.get(serie.sesionId).push(serie);
      }
      return [...grupos.entries()]
        .map(([sesionId, lista]) => ({
          sesionId,
          fecha: fechas.get(sesionId)?.fecha ?? "",
          estado: fechas.get(sesionId)?.estado,
          series: lista.sort((a, b) => a.numeroSerie - b.numeroSerie),
        }))
        .sort((a, b) => b.fecha.localeCompare(a.fecha));
    },
    [ejercicioId],
    [],
  );
}

/** Eventos fijados a mano en la agenda. */
export function useAgenda() {
  return useLiveQuery(async () => (await db.agenda.toArray()) ?? [], [], []);
}

/** La sesión de fuerza abierta, si la hay: permite salir de la app y volver. */
export function useSesionAbierta() {
  return useLiveQuery(async () => {
    const abiertas = await db.sesionesFuerza.filter((s) => s.estado === "en-curso").toArray();
    return abiertas[0] ?? null;
  }, []);
}
