/*
 * Revisión de cada 4 semanas (§65–66 del plan maestro) y semáforo de peso.
 *
 * El algoritmo mensual del plan, tal cual, con los datos que la app ya
 * guarda: peso diario, cintura, sesiones completadas y las series del
 * gimnasio. Jose no rellena nada: FORJA hace las cuentas y propone
 * MANTENER, SUBIR 100–150 o BAJAR 100–150. Él decide con un toque.
 *
 * Todo son medias y ventanas, nunca un día suelto: regla nº 6 del plan
 * ("no reaccionar al peso de un solo día") aplicada a rajatabla.
 */

import { pesoDeTrabajo, repsTotales } from "./progresion.js";
import { diasEntre, hoyISO, sumarDias } from "./fechas.js";

/** La primera revisión cuenta desde el arranque de la definición. */
export const INICIO_REVISIONES = "2026-09-21";
const CADA_DIAS = 28;

/* Fases en las que la revisión tiene sentido (las que tienen kcal ajustables). */
const FASES_CON_REVISION = new Set([
  "definicion",
  "mantenimiento-post",
  "ganancia",
  "definicion-primavera",
  "mantenimiento-verano",
]);

/* Las dos fases de déficit se juzgan igual, y las dos de mantenimiento también. */
const EN_DEFICIT = new Set(["definicion", "definicion-primavera"]);
const ESTABLES = new Set(["mantenimiento-post", "mantenimiento-verano"]);

/** ¿Toca ya la revisión mensual? */
export function revisionPendiente(faseId, ajustes = {}, hoy = hoyISO()) {
  if (!FASES_CON_REVISION.has(faseId)) return false;
  const base = ajustes.ultimaRevision ?? INICIO_REVISIONES;
  return hoy >= sumarDias(base, CADA_DIAS);
}

/* ------------------------------------------------------------------ */
/* Medidas sobre ventanas                                              */
/* ------------------------------------------------------------------ */

function mediaPesos(pesos, desde, hasta) {
  const kgs = pesos.filter((p) => p.fecha >= desde && p.fecha <= hasta && p.kg != null);
  if (kgs.length < 3) return null;
  return kgs.reduce((t, p) => t + p.kg, 0) / kgs.length;
}

/**
 * Velocidad del peso en kg/semana: media de los últimos 7 días contra la de
 * hace 3–4 semanas. Los centros de las ventanas quedan a ~3 semanas, así que
 * la diferencia se divide entre 3. Null si falta báscula en alguna ventana.
 */
export function velocidadPeso(pesos, hoy = hoyISO()) {
  const reciente = mediaPesos(pesos, sumarDias(hoy, -6), hoy);
  const antigua = mediaPesos(pesos, sumarDias(hoy, -27), sumarDias(hoy, -21));
  if (reciente == null || antigua == null) return null;
  return { porSemana: (reciente - antigua) / 3, reciente, antigua };
}

/** Cambio de cintura: última medición contra la de hace ~4 semanas. */
function cambioCintura(mediciones, hoy) {
  const conCintura = mediciones.filter((m) => m.cintura != null).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const ultima = conCintura.at(-1);
  if (!ultima || ultima.fecha < sumarDias(hoy, -14)) return null;
  // La referencia: la medición más cercana a 28 días atrás (entre 3 y 6 semanas).
  const objetivo = sumarDias(hoy, -28);
  const previas = conCintura.filter((m) => m.fecha >= sumarDias(hoy, -42) && m.fecha <= sumarDias(hoy, -21));
  if (!previas.length) return null;
  const referencia = previas.reduce((mejor, m) =>
    Math.abs(diasEntre(m.fecha, objetivo)) < Math.abs(diasEntre(mejor.fecha, objetivo)) ? m : mejor);
  return { delta: ultima.cintura - referencia.cintura, ultima, referencia };
}

/** Sesiones de fuerza y carreras completadas en los últimos 28 días. */
function cumplimiento(sesiones, carreras, hoy) {
  const desde = sumarDias(hoy, -27);
  const fuerza = sesiones.filter((s) => s.estado === "completada" && s.fecha >= desde && s.fecha <= hoy).length;
  const carrera = carreras.filter((c) => c.estado === "completada" && c.fecha >= desde && c.fecha <= hoy).length;
  // Objetivo del plan: 3 fuerza + 3 carrera por semana.
  return { fuerza, carrera, hechas: fuerza + carrera, objetivo: 24, pct: (fuerza + carrera) / 24 };
}

/**
 * ¿Progresa el gimnasio? Por ejercicio con al menos dos sesiones en 28 días:
 * mejora si el peso de trabajo subió, o con el mismo peso subieron las
 * repeticiones totales. Es el mismo criterio del motor de doble progresión.
 */
function progresionFuerza(sesiones, series, hoy) {
  const desde = sumarDias(hoy, -27);
  const validas = new Map(
    sesiones
      .filter((s) => s.estado === "completada" && s.fecha >= desde && s.fecha <= hoy)
      .map((s) => [s.id, s.fecha]),
  );

  const porEjercicio = new Map();
  for (const s of series) {
    if (!s.hecha || !validas.has(s.sesionId)) continue;
    if (!porEjercicio.has(s.ejercicioId)) porEjercicio.set(s.ejercicioId, new Map());
    const porSesionId = porEjercicio.get(s.ejercicioId);
    if (!porSesionId.has(s.sesionId)) porSesionId.set(s.sesionId, []);
    porSesionId.get(s.sesionId).push(s);
  }

  let total = 0;
  let mejoran = 0;
  for (const porSesionId of porEjercicio.values()) {
    if (porSesionId.size < 2) continue;
    const ordenadas = [...porSesionId.entries()].sort((a, b) => validas.get(a[0]).localeCompare(validas.get(b[0])));
    const primera = ordenadas[0][1];
    const ultima = ordenadas.at(-1)[1];
    total += 1;
    const pesoAntes = pesoDeTrabajo(primera);
    const pesoAhora = pesoDeTrabajo(ultima);
    if (pesoAhora > pesoAntes || (pesoAhora === pesoAntes && repsTotales(ultima) > repsTotales(primera))) {
      mejoran += 1;
    }
  }

  return { total, mejoran, progresa: total > 0 && mejoran / total >= 0.4 };
}

/* ------------------------------------------------------------------ */
/* La revisión completa                                                */
/* ------------------------------------------------------------------ */

/**
 * El algoritmo mensual (§66) con los datos del móvil. Devuelve los datos
 * medidos y una recomendación: {accion: "cumplir"|"mantener"|"subir"|"bajar",
 * motivo}. "cumplir" = no tocar nada porque el cumplimiento fue bajo.
 */
export function revisar({ pesos = [], mediciones = [], sesiones = [], carreras = [], series = [] }, faseId, hoy = hoyISO()) {
  const peso = velocidadPeso(pesos, hoy);
  const cintura = cambioCintura(mediciones, hoy);
  const cumplido = cumplimiento(sesiones, carreras, hoy);
  const progresion = progresionFuerza(sesiones, series, hoy);

  const datos = { peso, cintura, cumplido, progresion };

  // Paso 1 del algoritmo: sin cumplimiento no se juzga el plan.
  if (cumplido.pct < 0.85) {
    return {
      ...datos,
      accion: "cumplir",
      motivo:
        `Estas 4 semanas se hicieron ${cumplido.hechas} de ~${cumplido.objetivo} sesiones (fuerza + carrera). ` +
        "Con un cumplimiento por debajo del 85 % el plan no se toca: primero cumplirlo, luego juzgarlo.",
    };
  }

  if (EN_DEFICIT.has(faseId)) return { ...datos, ...revisarDefinicion(peso, progresion) };
  if (faseId === "ganancia") return { ...datos, ...revisarGanancia(peso, cintura, progresion) };
  return { ...datos, ...revisarEstable(peso) };
}

/** Ganancia limpia: subir 0–0,20 kg/semana con la cintura quieta. */
function revisarGanancia(peso, cintura, progresion) {
  if (peso == null) {
    return {
      accion: "mantener",
      motivo:
        "Faltan pesajes para calcular la tendencia (hace falta báscula esta semana y hace ~4 semanas). " +
        "Sin tendencia fiable no se toca nada: pésate a diario y la próxima revisión tendrá números.",
    };
  }

  if (peso.porSemana > 0.35) {
    return {
      accion: "bajar",
      motivo:
        `El peso sube ${vel(peso.porSemana)} de media, bastante más que el objetivo (0–0,20 kg/semana). ` +
        "A ese ritmo lo que sobra es grasa: −100–150 kcal y a observar otras 4 semanas.",
    };
  }

  if (cintura && cintura.delta >= 2) {
    return {
      accion: "bajar",
      motivo:
        `La cintura ha subido ${cintura.delta.toFixed(1).replace(".", ",")} cm en un mes. Aunque el gimnasio vaya bien, ` +
        "esa subida no la justifica: −100–150 kcal y vigilar la cintura por encima de la báscula.",
    };
  }

  if (progresion.progresa) {
    return {
      accion: "mantener",
      motivo:
        `El gimnasio progresa (${progresion.mejoran} de ${progresion.total} ejercicios mejoran) con el peso ` +
        `${peso.porSemana < 0.05 ? "estable" : `subiendo ${vel(peso.porSemana)}`}. Exactamente lo que busca la fase: no se toca nada.`,
    };
  }

  if (peso.porSemana < 0.05) {
    return {
      accion: "subir",
      motivo:
        "Peso completamente plano y progresión parada durante estas semanas, con el entreno cumplido: es el " +
        "caso exacto del plan para añadir +100–150 kcal. Después, otras 3–4 semanas de observación sin tocar nada.",
    };
  }

  return {
    accion: "mantener",
    motivo:
      `El peso sube ${vel(peso.porSemana)}, dentro del objetivo. La progresión aún no se ve clara en los números, ` +
      "pero con el peso moviéndose no toca añadir: dale otras 4 semanas al mismo plan.",
  };
}

/** Definición: perder ~0,5–0,7 % del peso a la semana (§16 del contexto). */
function revisarDefinicion(peso, progresion) {
  if (peso == null) {
    return {
      accion: "mantener",
      motivo: "Faltan pesajes para calcular la tendencia. En definición la báscula diaria es la brújula: sin ella no se ajusta nada.",
    };
  }

  const pct = (peso.porSemana / peso.reciente) * 100;

  if (pct <= -0.85) {
    return {
      accion: "subir",
      motivo:
        `Pierdes ${vel(-peso.porSemana)} (${pctTexto(-pct)} del peso corporal), más rápido que el objetivo de 0,5–0,7 %. ` +
        "Demasiado déficit se come músculo y rendimiento: +100–150 kcal.",
    };
  }

  if (pct >= -0.15) {
    return {
      accion: "bajar",
      motivo:
        "El peso medio y la cintura llevan semanas planos con el plan cumplido y la actividad parecida. " +
        "Ese es el único caso en que se profundiza el déficit: −100 kcal.",
    };
  }

  return {
    accion: "mantener",
    motivo:
      `Pierdes ${vel(-peso.porSemana)} (${pctTexto(-pct)}/semana), dentro del rango objetivo${progresion.progresa ? " y el gimnasio aguanta" : ""}. ` +
      "Justo lo que pide el plan: no se toca nada.",
  };
}

/** Mantenimiento y recomposición: el peso quieto es el éxito. */
function revisarEstable(peso) {
  if (peso == null) {
    return { accion: "mantener", motivo: "Faltan pesajes para la tendencia. Báscula a diario y se revisa el mes que viene." };
  }
  if (peso.porSemana > 0.25) {
    return {
      accion: "bajar",
      motivo: `El peso sube ${vel(peso.porSemana)} y en esta fase debería estar quieto: −100–150 kcal.`,
    };
  }
  if (peso.porSemana < -0.25) {
    return {
      accion: "subir",
      motivo: `El peso baja ${vel(-peso.porSemana)} sin buscarlo: +100–150 kcal para volver a mantenimiento.`,
    };
  }
  return { accion: "mantener", motivo: `Peso estable (${vel(peso.porSemana)}). Es exactamente el objetivo de la fase.` };
}

/* ------------------------------------------------------------------ */
/* Semáforo de velocidad del peso (para la gráfica de PROGRESO)        */
/* ------------------------------------------------------------------ */

/**
 * El veredicto de la tendencia según la fase: qué significa la velocidad
 * actual del peso. Devuelve null si la fase no tiene objetivo de báscula
 * (preparación) o faltan datos para una media honesta.
 */
export function semaforoPeso(pesos, faseId, hoy = hoyISO()) {
  const peso = velocidadPeso(pesos, hoy);
  if (peso == null) return null;
  const v = peso.porSemana;

  if (faseId === "deficit-moderado") {
    if (v < -1.2) return rojo(v, "Muy rápido incluso para este déficit: vigila fuerza y descanso.");
    if (v < 0) return verde(v, "Bajando, que es lo que toca en el déficit moderado.");
    return ambar(v, "El déficit aún no se nota en la media. Paciencia: la media manda.");
  }

  if (faseId === "llenado" || faseId === "transicion") {
    // Días de más hidrato: el peso puede subir por glucógeno y agua aunque se
    // esté perdiendo grasa. Aquí no se emiten alertas de grasa (§31 del contexto).
    return info(v, "Con más hidratos el peso puede subir por glucógeno y agua: no es grasa. Nada que juzgar estos días.");
  }

  if (faseId === "calibracion") {
    return info(v, "TEST DE MANTENIMIENTO: semanas de medir, no de juzgar. Come las ~2.800 planas y deja que la media hable.");
  }

  if (EN_DEFICIT.has(faseId)) {
    const pct = (v / peso.reciente) * 100;
    if (pct <= -0.85) return ambar(v, "Más rápido que el 0,5–0,7 % semanal objetivo: cuidado con el músculo.");
    if (pct <= -0.4) return verde(v, "Dentro del ritmo objetivo (0,5–0,7 %/semana).");
    if (pct <= -0.15) return ambar(v, "Baja despacio. Si sigue así dos semanas, la revisión propondrá ajustar.");
    return rojo(v, "El peso no baja. La revisión mensual dirá si toca −100 kcal.");
  }

  if (ESTABLES.has(faseId)) {
    if (Math.abs(v) <= 0.2) return verde(v, "Peso estable: el objetivo de la fase.");
    return ambar(v, v > 0 ? "Sube más de lo que pide la fase." : "Baja sin buscarlo.");
  }

  // Ganancia limpia: 0–0,20 kg/semana de media, evaluado en bloques largos.
  if (v > 0.35) return rojo(v, "Demasiado rápido: a este ritmo se acumula grasa. La revisión propondrá bajar.");
  if (v > 0.2) return ambar(v, "Algo por encima del objetivo (0–0,20 kg/semana). Vigilar cintura.");
  if (v >= -0.1) return verde(v, "En el objetivo: 0–0,20 kg/semana. Construyendo sin engordar.");
  return info(v, "El peso baja. Si el gimnasio progresa, es recomposición y va bien; si no, la revisión propondrá subir.");
}

const verde = (v, texto) => ({ estado: "verde", porSemana: v, texto });
const ambar = (v, texto) => ({ estado: "ambar", porSemana: v, texto });
const rojo = (v, texto) => ({ estado: "rojo", porSemana: v, texto });
const info = (v, texto) => ({ estado: "info", porSemana: v, texto });

function vel(v) {
  const abs = Math.abs(v);
  return `${abs.toFixed(2).replace(".", ",")} kg/semana`;
}

function pctTexto(p) {
  return `${p.toFixed(2).replace(".", ",")} %`;
}
