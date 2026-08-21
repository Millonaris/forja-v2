/*
 * Siembra: mete el PLAN en la base de datos la primera vez.
 *
 * Solo plan, nunca registro. Las rutinas, los 30 bloques de carrera y las
 * fases nutricionales se guardan en tablas para poder editarlos más adelante
 * (§47: el contenido actual se conserva y queda configurable), pero el
 * historial nace vacío y lo llena el usuario entrenando.
 *
 * Es idempotente: se puede llamar en cada arranque sin duplicar nada ni pisar
 * cambios hechos a mano.
 */

import { db } from "./db.js";
import { RUTINAS } from "./rutinas.js";
import { BLOQUES } from "./planCarrera.js";
import { FASES } from "./planNutricion.js";
import { PROTOCOLOS } from "./protocolos.js";
import { hoyISO } from "../logica/fechas.js";

export const VERSION_PLAN = 1;

export async function sembrar() {
  const ajustes = await db.ajustes.get(1);
  if (ajustes?.versionPlan === VERSION_PLAN) return ajustes;

  await db.transaction(
    "rw",
    [db.ajustes, db.plantillas, db.ejercicios, db.bloquesCarrera, db.fasesNutricion, db.protocolos],
    async () => {
      /* --- Rutinas de fuerza --- */
      for (const rutina of RUTINAS) {
        await db.plantillas.put({
          id: rutina.id,
          nombre: rutina.nombre,
          orden: rutina.orden,
        });

        for (const [i, ej] of rutina.ejercicios.entries()) {
          // Id estable y legible: si mañana se reordena la rutina, el
          // historial de series sigue apuntando al ejercicio correcto.
          const id = `${rutina.id}:${i}:${normalizar(ej.nombre)}`;
          const previo = await db.ejercicios.get(id);
          await db.ejercicios.put({
            ...ej,
            id,
            plantillaId: rutina.id,
            orden: i,
            // Si el usuario ya lo tocó, se respeta lo suyo.
            ...(previo ? { series: previo.series, descanso: previo.descanso } : null),
          });
        }
      }

      /* --- Plan de carrera --- */
      for (const b of BLOQUES) {
        await db.bloquesCarrera.put({ ...b, esDescarga: Boolean(b.esDescarga) });
      }

      /* --- Nutrición y protocolos con fecha --- */
      for (const f of FASES) await db.fasesNutricion.put(f);
      for (const p of PROTOCOLOS) await db.protocolos.put(p);

      /* --- Ajustes --- */
      // Lo que ya hubiera manda; los `??` solo rellenan lo que falta. Así una
      // resiembra por versión de plan nueva no pisa las preferencias.
      const previo = ajustes ?? {};
      await db.ajustes.put({
        ...previo,
        id: 1,
        versionPlan: VERSION_PLAN,
        creada: previo.creada ?? hoyISO(),
        // El onboarding de instalación limpia (§54) aún no se ha hecho.
        calibrada: previo.calibrada ?? false,
        // Escalón de volumen: 0 = ~2500 kcal, 1 = ~2550.
        escalonVolumen: previo.escalonVolumen ?? 0,
        // Preferencias de aviso (§55).
        vibracion: previo.vibracion ?? true,
        sonido: previo.sonido ?? false,
        // Días preferidos: SOLO recomendaciones, nunca obligaciones (§33).
        diasFuerza: previo.diasFuerza ?? [1, 3, 5],
        diasCarrera: previo.diasCarrera ?? [2, 4, 0],
      });
    },
  );

  return db.ajustes.get(1);
}

/** "Elevaciones laterales" → "elevaciones-laterales". */
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
