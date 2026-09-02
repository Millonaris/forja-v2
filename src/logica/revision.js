/*
 * Las revisiones de cada fase (§45, §48, §50 del v3) y el semáforo (§38).
 *
 * La regla maestra del plan, antes de tocar una sola caloría (§54):
 *
 *   1. ¿Han pasado ≥14 días desde el último cambio?
 *   2. ¿La adherencia es suficiente?
 *   3. ¿La actividad es comparable?
 *   4. ¿Qué dice la media de peso?
 *   5. ¿Qué dice la cintura?
 *   6. ¿Qué dice el rendimiento?
 *
 * Si no hay respuesta clara: MANTENER. Ese "mantener" no es pereza, es la
 * decisión correcta la mayoría de las veces: si cambias 2.400 → 2.300 → 2.500
 * → 2.200 cada pocos días, nunca sabes qué estaba funcionando.
 *
 * Ninguna de estas funciones escribe nada: devuelven una propuesta con su
 * motivo y Jose decide con un toque.
 */

import { NUTRICION_CFG } from "../datos/planNutricion.js";
import { adherencia, pasosComparables, tendenciaMensual, tendenciaSemanal } from "./nutricion.js";
import { pesoDeTrabajo, repsTotales } from "./progresion.js";
import { diasEntre, hoyISO, sumarDias } from "./fechas.js";

/* ------------------------------------------------------------------ */
/* ¿Toca revisar?                                                      */
/* ------------------------------------------------------------------ */

/**
 * La revisión aparece cuando han pasado 14 días desde el último cambio de
 * calorías Y desde la última vez que se miró. No hay calendario fijo: el reloj
 * lo marca el último cambio, que es lo que de verdad importa.
 */
export function revisionPendiente(ajustes = {}, hoy = hoyISO()) {
  const base = ajustes.ultimaRevisionVista ?? ajustes.ultimoCambioKcal ?? ajustes.faseDesde;
  if (!base) return false;
  return diasEntre(base, hoy) >= NUTRICION_CFG.diasMinimosEntreCambios;
}

/** La fecha de la próxima revisión, para poder anunciarla (§37). */
export function proximaRevision(ajustes = {}) {
  const base = ajustes.ultimaRevisionVista ?? ajustes.ultimoCambioKcal ?? ajustes.faseDesde;
  return base ? sumarDias(base, NUTRICION_CFG.diasMinimosEntreCambios) : null;
}

/* ------------------------------------------------------------------ */
/* Contexto: lo que la revisión necesita saber                         */
/* ------------------------------------------------------------------ */

/** Cambio de cintura entre la última medición y la de hace ~2–4 semanas. */
export function tendenciaCintura(mediciones = [], hoy = hoyISO(), semanas = 2) {
  const conCintura = mediciones.filter((m) => m.cintura != null).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const ultima = conCintura.at(-1);
  if (!ultima || diasEntre(ultima.fecha, hoy) > 10) return null;

  const objetivo = sumarDias(hoy, -7 * semanas);
  const previas = conCintura.filter((m) => m.fecha < sumarDias(ultima.fecha, -7));
  if (!previas.length) return null;

  const referencia = previas.reduce((mejor, m) =>
    Math.abs(diasEntre(m.fecha, objetivo)) < Math.abs(diasEntre(mejor.fecha, objetivo)) ? m : mejor);

  return { delta: ultima.cintura - referencia.cintura, ultima, referencia };
}

/**
 * ¿Progresa el gimnasio? Por ejercicio con al menos dos sesiones en la
 * ventana: mejora si subió el peso de trabajo, o si con el mismo peso subieron
 * las repeticiones totales. Es el mismo criterio del motor de doble progresión.
 */
export function progresionFuerza(sesiones = [], series = [], hoy = hoyISO(), dias = 28) {
  const desde = sumarDias(hoy, -(dias - 1));
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
  let empeoran = 0;
  for (const porSesionId of porEjercicio.values()) {
    if (porSesionId.size < 2) continue;
    const ordenadas = [...porSesionId.entries()].sort((a, b) => validas.get(a[0]).localeCompare(validas.get(b[0])));
    const primera = ordenadas[0][1];
    const ultima = ordenadas.at(-1)[1];
    total += 1;
    const antes = pesoDeTrabajo(primera);
    const ahora = pesoDeTrabajo(ultima);
    if (ahora > antes || (ahora === antes && repsTotales(ultima) > repsTotales(primera))) mejoran += 1;
    else if (ahora < antes || repsTotales(ultima) < repsTotales(primera)) empeoran += 1;
  }

  return { total, mejoran, empeoran, progresa: total > 0 && mejoran / total >= 0.4, cae: empeoran >= 2 };
}

/* ------------------------------------------------------------------ */
/* La revisión                                                         */
/* ------------------------------------------------------------------ */

/**
 * La revisión de la fase actual.
 *
 * `datos` trae los registros diarios ya cruzados (peso + kcal + pasos), las
 * mediciones de cintura, las sesiones y las series. Devuelve
 * {accion, kcal?, motivo} donde accion ∈ hold | decrease | increase | audit |
 * confirm | maintenanceBlock.
 */
export function revisar({ registros = [], mediciones = [], sesiones = [], series = [] }, ajustes = {}, hoy = hoyISO()) {
  const faseId = ajustes.faseNutricion ?? "cut";
  const kcalObjetivo = ajustes.kcalObjetivo ?? NUTRICION_CFG.cut.kcalInicio;
  const diasDesdeCambio = ajustes.ultimoCambioKcal ? diasEntre(ajustes.ultimoCambioKcal, hoy) : null;
  const diasEnFase = ajustes.faseDesde ? diasEntre(ajustes.faseDesde, hoy) : null;

  const contexto = {
    tendencia: tendenciaSemanal(registros),
    tendenciaMes: tendenciaMensual(registros),
    adherencia: adherencia(registros, kcalObjetivo, 14),
    pasosComparables: pasosComparables(registros),
    cintura: tendenciaCintura(mediciones, hoy),
    progresion: progresionFuerza(sesiones, series, hoy),
    diasDesdeCambio,
    diasEnFase,
  };

  if (faseId === "mantenimiento") return { ...contexto, ...revisarMantenimiento(contexto, kcalObjetivo) };
  if (faseId === "ganancia") return { ...contexto, ...revisarGanancia(contexto, ajustes) };
  return { ...contexto, ...revisarCut(contexto) };
}

/** Definición (§45). Perder 0,4–0,8 kg/semana con el gimnasio en pie. */
function revisarCut(c) {
  if (c.diasDesdeCambio != null && c.diasDesdeCambio < NUTRICION_CFG.diasMinimosEntreCambios) {
    return {
      accion: "hold",
      motivo: `Solo ${c.diasDesdeCambio} días desde el último cambio. Nunca se ajusta antes de 14: el peso tiene ruido y cambiando cada semana nunca sabrías qué funcionaba.`,
    };
  }

  if (c.tendencia == null) {
    return {
      accion: "hold",
      motivo: "Faltan pesadas para tener dos medias de 7 días que comparar. Pésate cada mañana y la próxima revisión tendrá números.",
    };
  }

  if (c.adherencia == null || c.adherencia < NUTRICION_CFG.adherencia.min) {
    return {
      accion: "audit",
      motivo:
        `Adherencia del ${c.adherencia == null ? "—" : Math.round(c.adherencia * 100) + " %"}: por debajo del 85 % no se puede juzgar si el plan funciona. ` +
        "Antes de tocar calorías, revisa el registro: aceite, salsas, frutos secos, picoteos y bebidas son lo que más se escapa. Esto no es una acusación, es que sin datos limpios cualquier ajuste sería a ciegas.",
    };
  }

  const perdida = -c.tendencia;
  const [lentoMin, lentoMax] = NUTRICION_CFG.cut.perdidaLentaAceptable;
  const [buenoMin, buenoMax] = NUTRICION_CFG.cut.perdidaSemanalPreferida;

  if (perdida >= buenoMin && perdida <= buenoMax) {
    return { accion: "hold", motivo: `Pierdes ${vel(perdida)} de media, justo en el rango objetivo. Si funciona, no se toca.` };
  }

  if (perdida >= lentoMin && perdida < lentoMax && c.cintura && c.cintura.delta < 0) {
    return {
      accion: "hold",
      motivo: `Pierdes ${vel(perdida)}, algo lento, PERO la cintura ha bajado ${cm(-c.cintura.delta)}. Hay progreso real: no hace falta tocar nada.`,
    };
  }

  if (perdida < lentoMin && (!c.cintura || c.cintura.delta >= 0) && c.pasosComparables) {
    return {
      accion: "decrease",
      kcal: 100,
      motivo:
        "El peso medio está prácticamente plano, la cintura no baja, la adherencia es buena y te has movido parecido. " +
        "Ese es el único caso en que se profundiza el déficit: −100 kcal, principalmente de hidratos, y otras dos semanas mirando.",
    };
  }

  if (perdida > NUTRICION_CFG.cut.perdidaDemasiadoRapida) {
    return {
      accion: "increase",
      kcal: 100,
      motivo:
        `Pierdes ${vel(perdida)}, por encima del ritmo sano. ` +
        (c.progresion.cae
          ? "Además el gimnasio está cayendo. "
          : "Si además tienes hambre fuerte, duermes mal o notas que las cargas bajan, ") +
        "el déficit es demasiado grande: +100 kcal. Si te encuentras bien, se puede dejar como está.",
    };
  }

  return { accion: "hold", motivo: "Sin señal suficientemente clara en una dirección. Cuando dudamos, mantenemos." };
}

/** Mantenimiento (§48). Aquí el éxito es que la báscula no se mueva. */
function revisarMantenimiento(c, kcalObjetivo) {
  if (c.diasEnFase != null && c.diasEnFase < 21) {
    return {
      accion: "hold",
      motivo:
        `Llevas ${c.diasEnFase} días de mantenimiento. La primera semana es adaptación (glucógeno y agua) y hacen falta ` +
        "unos 14 días más para confirmar nada. No se confirma un mantenimiento con una sola semana.",
    };
  }

  if (c.tendencia == null) return { accion: "hold", motivo: "Faltan pesadas para la tendencia." };

  const abs = Math.abs(c.tendencia);
  const cinturaQuieta = !c.cintura || Math.abs(c.cintura.delta) <= 0.3;

  if (abs <= NUTRICION_CFG.mantenimiento.tendenciaConfirmacionFuerte && cinturaQuieta) {
    return {
      accion: "confirm",
      confianza: "high",
      kcal: kcalObjetivo,
      motivo: `Peso y cintura estables durante estas semanas comiendo ${kcalObjetivo} kcal. Ese ES tu mantenimiento, y con confianza alta.`,
    };
  }

  if (abs <= NUTRICION_CFG.mantenimiento.tendenciaProvisional && cinturaQuieta) {
    return {
      accion: "confirm",
      confianza: "medium",
      kcal: kcalObjetivo,
      motivo: `El peso se mueve poquísimo (${vel(abs)}) con la cintura estable. ${kcalObjetivo} kcal es un mantenimiento razonable. No perseguimos falsa precisión.`,
    };
  }

  if (c.tendencia < -NUTRICION_CFG.mantenimiento.tendenciaProvisional) {
    return {
      accion: "increase",
      kcal: NUTRICION_CFG.mantenimiento.ajusteKcal,
      motivo: `Sigues perdiendo ${vel(-c.tendencia)} en mantenimiento: tu gasto real es mayor de lo que estamos comiendo. +100 kcal.`,
    };
  }

  if (c.tendencia > NUTRICION_CFG.mantenimiento.tendenciaProvisional && c.cintura && c.cintura.delta > 0) {
    return {
      accion: "decrease",
      kcal: NUTRICION_CFG.mantenimiento.ajusteKcal,
      motivo: `El peso sube ${vel(c.tendencia)} y la cintura también: nos hemos pasado un poco. −100 kcal.`,
    };
  }

  return { accion: "hold", motivo: "Datos ambiguos. Mantener y volver a mirar." };
}

/** Ganancia limpia (§50). Se juzga por MES, no por semana. */
function revisarGanancia(c, ajustes) {
  const porMes = c.tendenciaMes;
  const cinturaDesdeInicio =
    ajustes.cinturaInicioFase != null && c.cintura ? c.cintura.ultima.cintura - ajustes.cinturaInicioFase : null;

  if (cinturaDesdeInicio != null && cinturaDesdeInicio >= NUTRICION_CFG.ganancia.cinturaMaxCm) {
    return {
      accion: "maintenanceBlock",
      semanas: 2,
      motivo:
        `La cintura ha subido ${cm(cinturaDesdeInicio)} desde que empezó la ganancia. Eso NO significa hacer un cut: ` +
        "significa volver 2–3 semanas a mantenimiento, ver si se estabiliza y decidir con calma si merece la pena seguir creciendo.",
    };
  }

  if (porMes == null) {
    return { accion: "hold", motivo: "Hacen falta cuatro semanas de báscula para juzgar una fase que se mide por meses." };
  }

  const [min, max] = NUTRICION_CFG.ganancia.kgPorMesObjetivo;
  const cinturaMes = c.cintura?.delta ?? 0;

  if (porMes >= min && porMes <= max && cinturaMes <= 0.5 && c.progresion.progresa) {
    return { accion: "hold", motivo: `Subes ${kgMes(porMes)} con la cintura quieta y la fuerza progresando. Ganancia limpia dentro de objetivo: no se toca nada.` };
  }

  if (porMes > NUTRICION_CFG.ganancia.kgPorMesExcesivo || cinturaMes > 1) {
    return {
      accion: "decrease",
      kcal: NUTRICION_CFG.ganancia.ajusteKcal,
      motivo: `Subes ${kgMes(porMes)}${cinturaMes > 1 ? ` y la cintura ${cm(cinturaMes)} en un mes` : ""}. Demasiado rápido: eso ya es grasa. −100 kcal.`,
    };
  }

  if (c.semanasPlano >= 8 && !c.progresion.progresa) {
    return { accion: "increase", kcal: NUTRICION_CFG.ganancia.ajusteKcal, motivo: "Ocho semanas con el peso plano y la fuerza estancada: +100 kcal." };
  }

  if (porMes < min && c.progresion.progresa) {
    return {
      accion: "hold",
      motivo:
        "El peso apenas sube, pero la fuerza SÍ progresa. No hay ninguna prisa por añadir calorías: puede estar " +
        "ocurriendo una recomposición muy buena. No se ajusta por un solo mes.",
    };
  }

  return { accion: "hold", motivo: "No hay motivo claro para ajustar." };
}

/* ------------------------------------------------------------------ */
/* Semáforo (§38)                                                      */
/* ------------------------------------------------------------------ */

/**
 * El color del momento. Verde: va bien. Amarillo: todavía no sabemos.
 * Rojo: hay un problema repetido que toca mirar.
 *
 * El semáforo NO modifica calorías por sí solo. Es un aviso, no un motor.
 */
export function semaforo({ registros = [], mediciones = [], sesiones = [], series = [] }, ajustes = {}, hoy = hoyISO()) {
  const faseId = ajustes.faseNutricion ?? "cut";
  const kcalObjetivo = ajustes.kcalObjetivo ?? NUTRICION_CFG.cut.kcalInicio;
  const diasDesdeCambio = ajustes.ultimoCambioKcal ? diasEntre(ajustes.ultimoCambioKcal, hoy) : null;

  const tendencia = tendenciaSemanal(registros);
  const a = adherencia(registros, kcalObjetivo, 14);
  const cintura = tendenciaCintura(mediciones, hoy);
  const progresion = progresionFuerza(sesiones, series, hoy);

  if (tendencia == null) {
    return { estado: "amarillo", texto: "Todavía no hay dos semanas de báscula que comparar. No sabemos nada aún, y eso está bien." };
  }
  if (diasDesdeCambio != null && diasDesdeCambio < 14) {
    return { estado: "amarillo", porSemana: tendencia, texto: `Solo ${diasDesdeCambio} días desde el último cambio: demasiado pronto para juzgarlo.` };
  }
  if (a != null && a < NUTRICION_CFG.adherencia.min) {
    return { estado: "amarillo", porSemana: tendencia, texto: `Adherencia del ${Math.round(a * 100)} %: con estos datos no se puede concluir nada.` };
  }
  if (!pasosComparables(registros)) {
    return { estado: "amarillo", porSemana: tendencia, texto: "La actividad ha cambiado bastante respecto a la semana anterior: los números no son comparables." };
  }

  if (faseId === "cut") {
    const perdida = -tendencia;
    if (perdida > NUTRICION_CFG.cut.perdidaDemasiadoRapida && progresion.cae) {
      return { estado: "rojo", porSemana: tendencia, texto: `Pierdes ${vel(perdida)} y el gimnasio está cayendo. Toca revisar.` };
    }
    if (perdida >= NUTRICION_CFG.cut.perdidaSemanalPreferida[0]) {
      return { estado: "verde", porSemana: tendencia, texto: `Pierdes ${vel(perdida)}: ritmo adecuado.` };
    }
    if (perdida >= NUTRICION_CFG.cut.perdidaLentaAceptable[0] && cintura && cintura.delta < 0) {
      return { estado: "verde", porSemana: tendencia, texto: "Lento en la báscula pero la cintura baja: hay progreso." };
    }
    if (perdida < NUTRICION_CFG.cut.perdidaLentaAceptable[0]) {
      return { estado: "rojo", porSemana: tendencia, texto: "Varias semanas sin bajar peso ni cintura con buena adherencia: la revisión propondrá ajustar." };
    }
    return { estado: "amarillo", porSemana: tendencia, texto: "Baja despacio. Un par de semanas más y se verá claro." };
  }

  if (faseId === "mantenimiento") {
    if (Math.abs(tendencia) <= NUTRICION_CFG.mantenimiento.tendenciaProvisional) {
      return { estado: "verde", porSemana: tendencia, texto: "Peso estable: exactamente el objetivo de la fase." };
    }
    return { estado: "amarillo", porSemana: tendencia, texto: tendencia > 0 ? "Sube más de lo que pide la fase." : "Sigues bajando: probablemente el mantenimiento sea más alto." };
  }

  // Ganancia y verano se juzgan por mes.
  const porMes = tendenciaMensual(registros);
  if (porMes == null) return { estado: "amarillo", porSemana: tendencia, texto: "Esta fase se mide por meses: aún no hay cuatro semanas." };
  if (porMes > NUTRICION_CFG.ganancia.kgPorMesExcesivo) {
    return { estado: "rojo", porSemana: tendencia, texto: `Subes ${kgMes(porMes)}: demasiado rápido para una ganancia limpia.` };
  }
  const [min, max] = NUTRICION_CFG.ganancia.kgPorMesObjetivo;
  if (porMes >= min && porMes <= max) return { estado: "verde", porSemana: tendencia, texto: `Subes ${kgMes(porMes)}: en el objetivo.` };
  return { estado: "amarillo", porSemana: tendencia, texto: "Fuera del rango objetivo del mes, pero no se ajusta por un solo mes." };
}

/* ------------------------------------------------------------------ */
/* Criterios de salida de fase (§20, §25, §31)                         */
/* ------------------------------------------------------------------ */

/**
 * ¿Hay motivos para cerrar el cut? No devuelve una orden: devuelve los avisos
 * que Jose debe mirar. No existe un peso final obligatorio.
 */
export function salidaDelCut({ registros = [], sesiones = [], series = [] }, ajustes = {}, hoy = hoyISO()) {
  const motivos = [];
  const semanas = ajustes.faseDesde ? Math.floor(diasEntre(ajustes.faseDesde, hoy) / 7) : 0;
  const progresion = progresionFuerza(sesiones, series, hoy, 14);

  if (semanas >= NUTRICION_CFG.cut.semanasMax) {
    motivos.push({
      id: "tiempo",
      texto: `Llevas ${semanas} semanas de definición, el tope orientativo del plan. Toca pasar a mantenimiento aunque no hayas llegado a ningún peso concreto.`,
    });
  }

  if (progresion.cae) {
    motivos.push({
      id: "rendimiento",
      texto: "Las cargas están cayendo en varios ejercicios. Si además duermes mal y tienes hambre alta, el cut ya ha durado bastante.",
    });
  }

  const kcal = ajustes.kcalObjetivo ?? NUTRICION_CFG.cut.kcalInicio;
  const tendencia = tendenciaSemanal(registros);
  if (kcal <= NUTRICION_CFG.cut.zonaRevisionKcal && tendencia != null && Math.abs(tendencia) < 0.2) {
    motivos.push({
      id: "zona-baja",
      texto: `Estás en ${kcal} kcal, la zona de revisión, y el peso no se mueve. Aquí FORJA PARA: no se sigue bajando automáticamente. Toca revisar el registro o cerrar el cut.`,
    });
  }

  return motivos;
}

/* ------------------------------------------------------------------ */

function vel(v) {
  return `${Math.abs(v).toFixed(2).replace(".", ",")} kg/semana`;
}

function kgMes(v) {
  return `${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(2).replace(".", ",")} kg/mes`;
}

function cm(v) {
  return `${Math.abs(v).toFixed(1).replace(".", ",")} cm`;
}
