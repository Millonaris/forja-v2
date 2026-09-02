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
import { FASES, INICIO_CUT, OBJETIVO_INICIAL } from "./planNutricion.js";
import { PROTOCOLOS } from "./protocolos.js";
import { hoyISO } from "../logica/fechas.js";

/*
 * v7: entra el contexto maestro de septiembre 2026 — se cancela el mini-cut
 * de 1.700 y el tramo 26 ago → 22 sep pasa a déficit moderado (2.150),
 * llenado (2.300–2.500), dos días visuales a ~2.450 y transición (2.500).
 * v8: las primeras recetas de Jose entran en el recetario (una sola vez).
 * v10: entra el SOURCE OF TRUTH v3 de DIETA. La nutrición deja de ir por
 * fechas y pasa a ir por datos: definición desde el 2 de septiembre a 2.400
 * kcal, y FORJA aprende el gasto real con peso + ingesta + actividad. Se
 * cancelan el protocolo visual, el llenado y el test de ~2.800.
 */
export const VERSION_PLAN = 10;

/*
 * Las comidas que Jose pidió tener de partida en DIETA → RECETAS. Solo el
 * nombre: los ingredientes y la preparación los rellena él desde EDITAR.
 */
const RECETAS_INICIALES = [
  "Contramuslo estofado con verduras",
  "Ensalada de patata",
  "Ensaladilla de atún",
  "Macarrones con tomate y pollo",
  "Espaguetis con leche evaporada y pollo",
  "Pollo desmenuzado BBQ",
];

export async function sembrar() {
  const ajustes = await db.ajustes.get(1);
  if (ajustes?.versionPlan === VERSION_PLAN) return ajustes;

  await db.transaction(
    "rw",
    [db.ajustes, db.plantillas, db.ejercicios, db.series, db.bloquesCarrera, db.fasesNutricion, db.protocolos, db.recetas],
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
      // Son PLAN, no registro: se limpian antes de resembrar para que las
      // fases de una versión anterior (p. ej. el mini-cut cancelado) no se
      // queden como filas fantasma en la base y en las copias de seguridad.
      await db.fasesNutricion.clear();
      await db.protocolos.clear();
      for (const f of Object.values(FASES)) await db.fasesNutricion.put(f);
      for (const p of PROTOCOLOS) await db.protocolos.put(p);

      /* --- Recetario: las primeras recetas (v8) --- */
      // A diferencia del plan, las recetas son contenido de Jose: se siembran
      // UNA sola vez (flag en ajustes). Si edita o borra una, ninguna
      // resiembra posterior la resucita.
      //
      // El flag se relee DENTRO de la transacción: `sembrar` puede entrar dos
      // veces a la vez (StrictMode monta doble en desarrollo) y la lectura de
      // fuera es vieja en la segunda — con `add` eso duplicaba las recetas.
      const dentro = await db.ajustes.get(1);
      if (!dentro?.recetasSembradas) {
        for (const nombre of RECETAS_INICIALES) {
          await db.recetas.add({ nombre, tipo: "comida", ingredientes: "", pasos: "", creada: hoyISO() });
        }
      }

      /* --- Ajustes --- */
      // Lo que ya hubiera manda; los `??` solo rellenan lo que falta. Así una
      // resiembra por versión de plan nueva no pisa las preferencias.
      const previo = ajustes ?? {};
      await db.ajustes.put({
        ...previo,
        id: 1,
        versionPlan: VERSION_PLAN,
        recetasSembradas: true,
        creada: previo.creada ?? hoyISO(),
        // El onboarding de instalación limpia (§54) aún no se ha hecho.
        calibrada: previo.calibrada ?? false,
        /*
         * Estado nutricional v3 (§39 del source of truth).
         *
         * La fase NO se deduce de la fecha: se guarda. `kcalObjetivo` es lo
         * único que Jose ve cada día, y solo cambia cuando la revisión de 14
         * días lo justifica. `tdeeDeducido` lo aprende la app sola con el peso
         * y las kcal apuntadas; `mantenimientoConfirmado` es el número que
         * habilita la fase de ganancia, y hasta que exista no se empieza.
         */
        faseNutricion: previo.faseNutricion ?? "cut",
        faseDesde: previo.faseDesde ?? INICIO_CUT,
        ultimoCambioKcal: previo.ultimoCambioKcal ?? INICIO_CUT,
        ultimaRevisionVista: previo.ultimaRevisionVista ?? null,
        kcalObjetivo: previo.kcalObjetivo ?? OBJETIVO_INICIAL.kcal,
        proteinaObjetivo: previo.proteinaObjetivo ?? OBJETIVO_INICIAL.p,
        grasaObjetivo: previo.grasaObjetivo ?? OBJETIVO_INICIAL.g,
        tdeeDeducido: previo.tdeeDeducido ?? null,
        tdeeHistorico: previo.tdeeHistorico ?? [],
        mantenimientoConfirmado: previo.mantenimientoConfirmado ?? null,
        confianzaMantenimiento: previo.confianzaMantenimiento ?? null,
        mantenimientoBase: previo.mantenimientoBase ?? null,
        cinturaInicioFase: previo.cinturaInicioFase ?? null,
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
