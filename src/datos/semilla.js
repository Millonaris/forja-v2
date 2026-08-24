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
import { CLAVES_ANTIGUAS, RUTINAS } from "./rutinas.js";
import { BLOQUES } from "./planCarrera.js";
import { FASES } from "./planNutricion.js";
import { PROTOCOLOS } from "./protocolos.js";
import { hoyISO } from "../logica/fechas.js";

export const VERSION_PLAN = 6;

export async function sembrar() {
  const ajustes = await db.ajustes.get(1);
  if (ajustes?.versionPlan === VERSION_PLAN) return ajustes;

  await db.transaction(
    "rw",
    [db.ajustes, db.plantillas, db.ejercicios, db.series, db.bloquesCarrera, db.fasesNutricion, db.protocolos],
    async () => {
      /* --- Rutinas de fuerza --- */
      for (const rutina of RUTINAS) {
        await db.plantillas.put({
          id: rutina.id,
          nombre: rutina.nombre,
          orden: rutina.orden,
        });

        /*
         * Id estable: plantilla + clave. NO lleva la posición ni el nombre
         * visible, así que reordenar la rutina o renombrar un ejercicio ya no
         * parte su historial en dos.
         *
         * El plan del código MANDA sobre lo guardado: la app no tiene todavía
         * ninguna pantalla para editar series o descansos, así que "conservar
         * lo del usuario" no protegía nada y en cambio impedía que una
         * corrección del plan llegara al móvil.
         */
        for (const [i, ej] of rutina.ejercicios.entries()) {
          await db.ejercicios.put({
            ...ej,
            id: `${rutina.id}:${ej.clave}`,
            plantillaId: rutina.id,
            orden: i,
          });
        }

        await migrarEjercicios(rutina);
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
        /*
         * Plan anual (versión 6). El mantenimiento real lo pone la
         * calibración de septiembre; hasta entonces las fases dinámicas usan
         * la hipótesis de 2.600. `ajusteKcal` acumula los ±100–150 de las
         * revisiones mensuales, y `faseManual` es la fase confirmada a mano
         * (definición, mantenimiento post, recomposición) o null.
         */
        mantenimientoReal: previo.mantenimientoReal ?? null,
        ajusteKcal: previo.ajusteKcal ?? 0,
        faseManual: previo.faseManual ?? null,
        faseManualDesde: previo.faseManualDesde ?? null,
        ultimaRevision: previo.ultimaRevision ?? null,
        // Variante agresiva de la rutina: una serie más en seis ejercicios.
        // Se empieza SIEMPRE en la conservadora (§ del informe).
        rutinaAgresiva: previo.rutinaAgresiva ?? false,
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

/*
 * Limpia los ejercicios de una versión anterior de la rutina.
 *
 * Sin esto, al cambiar la rutina las filas viejas se quedarían en la tabla con
 * el mismo `plantillaId` y la pantalla del entreno enseñaría los ejercicios
 * DUPLICADOS, los de antes y los de ahora.
 *
 * Las series de un ejercicio que sigue existiendo se reenganchan a su id
 * nuevo; las de uno que ha desaparecido del plan (el core del gimnasio, el
 * gemelo de Pierna B) se conservan tal cual: son entrenamientos que pasaron de
 * verdad y no se borran, solo dejan de aparecer en la rutina.
 */
async function migrarEjercicios(rutina) {
  const validos = new Set(rutina.ejercicios.map((e) => `${rutina.id}:${e.clave}`));
  const guardados = await db.ejercicios.where("plantillaId").equals(rutina.id).toArray();

  for (const viejo of guardados) {
    if (validos.has(viejo.id)) continue;

    // Los ids antiguos eran `plantilla:indice:nombre-normalizado`.
    const trozos = viejo.id.split(":");
    const nombreViejo = trozos.length >= 3 ? trozos.slice(2).join(":") : null;
    const clave = CLAVES_ANTIGUAS[nombreViejo];
    const idNuevo = clave ? `${rutina.id}:${clave}` : null;

    if (idNuevo && validos.has(idNuevo)) {
      await db.series.where("ejercicioId").equals(viejo.id).modify({ ejercicioId: idNuevo });
    }
    await db.ejercicios.delete(viejo.id);
  }
}
