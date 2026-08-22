/*
 * Copia de seguridad (§34).
 *
 * Un único fichero JSON con todo. Los datos viven solo en este móvil: si se
 * pierde el móvil y no hay copia, no hay datos. Por eso importar y exportar no
 * es una función avanzada escondida, sino la red de seguridad de la app.
 *
 * Importar NO borra: fusiona sobre lo que haya. Se puede restaurar en un móvil
 * nuevo sin miedo a machacar lo que ya se hubiera apuntado.
 */

import { db } from "../datos/db.js";
import { hoyISO } from "../logica/fechas.js";

export const VERSION_COPIA = 1;

const TABLAS = [
  "ajustes", "plantillas", "ejercicios",
  "sesionesFuerza", "series", "estadoFuerza",
  "bloquesCarrera", "carreras", "estadoCarrera",
  "pesos", "mediciones", "fotos",
  "postura", "testsPared",
  "fasesNutricion", "protocolos", "agenda", "diario",
];

/** Construye el objeto de copia con todo lo que hay. */
export async function construirCopia() {
  const datos = {};
  for (const tabla of TABLAS) {
    datos[tabla] = await db[tabla].toArray();
  }
  return { app: "FORJA", schemaVersion: VERSION_COPIA, exportado: new Date().toISOString(), datos };
}

/** Descarga la copia como fichero. */
export async function exportar() {
  const copia = await construirCopia();
  const blob = new Blob([JSON.stringify(copia)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `forja-${hoyISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  await db.ajustes.update(1, { ultimaCopia: hoyISO() });
  return copia;
}

/*
 * Tablas con id autonumérico: sus filas exportadas llevan los ids del móvil
 * viejo, y un `bulkPut` a ciegas PISARÍA filas locales que casualmente tengan
 * el mismo número — con `series` apuntando además a la sesión equivocada.
 * Sobre una instalación con datos, estas tablas se insertan con ids nuevos y
 * `series.sesionId` se remapea. Las tablas con clave natural (fecha) sí se
 * fusionan con bulkPut, que ahí es lo correcto.
 */
const TABLAS_AUTONUMERICAS = ["sesionesFuerza", "series", "carreras", "fotos", "agenda"];

/**
 * Restaura una copia sobre lo que haya.
 *
 * Nunca borra: sobre una base vacía es una restauración idéntica (ids
 * incluidos); sobre una base con datos, fusiona sin pisar lo local.
 */
export async function importar(texto) {
  const copia = JSON.parse(texto);
  if (copia.app !== "FORJA" || !copia.datos) {
    throw new Error("Ese fichero no es una copia de FORJA.");
  }

  const cuentas = {};
  await db.transaction("rw", TABLAS.map((t) => db[t]), async () => {
    // Con las tablas autonuméricas vacías se restauran los ids tal cual:
    // restaurar dos veces la misma copia sigue sin duplicar nada.
    const hayLocales = (
      await Promise.all(TABLAS_AUTONUMERICAS.map((t) => db[t].count()))
    ).some((n) => n > 0);

    const mapaSesiones = new Map();

    for (const tabla of TABLAS) {
      const filas = copia.datos[tabla];
      if (!Array.isArray(filas) || !filas.length) continue;
      cuentas[tabla] = filas.length;

      if (!hayLocales || !TABLAS_AUTONUMERICAS.includes(tabla)) {
        await db[tabla].bulkPut(filas);
        continue;
      }

      // Fusión sobre datos existentes: ids nuevos, y las series siguen a su
      // sesión. TABLAS lista sesionesFuerza antes que series a propósito.
      for (const fila of filas) {
        const { id: idViejo, ...resto } = fila;
        if (tabla === "series" && mapaSesiones.has(resto.sesionId)) {
          resto.sesionId = mapaSesiones.get(resto.sesionId);
        }
        const idNuevo = await db[tabla].add(resto);
        if (tabla === "sesionesFuerza") mapaSesiones.set(idViejo, idNuevo);
      }
    }
  });

  return { schemaVersion: copia.schemaVersion, exportado: copia.exportado, cuentas };
}

/** Cuenta lo que hay guardado, para poder validar una restauración a ojo. */
export async function inventario() {
  return {
    sesiones: await db.sesionesFuerza.count(),
    series: await db.series.count(),
    carreras: await db.carreras.count(),
    pesos: await db.pesos.count(),
    postura: await db.postura.count(),
  };
}
