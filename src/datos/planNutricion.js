/*
 * Nutrición según el CONTEXTO MAESTRO DE DIETA del 2 de septiembre de 2026
 * (docs/contexto-maestro-dieta-02sep2026.md). Sustituye al contexto del 26 de
 * agosto a partir del día 7: el tramo 26 ago → 6 sep (déficit moderado,
 * llenado, días visuales y transición) se queda como estaba, y lo que venía
 * detrás cambia entero.
 *
 * Lo que cambia y por qué: el mantenimiento estimado sube. Con ~12.800 pasos
 * de media (el running YA va dentro de esos pasos) más las sesiones de
 * hipertrofia, la hipótesis honesta ya no es 2.600 sino 2.750–3.000, y el test
 * se hace a ~2.800. Y detrás del test no viene una fase de construcción sino
 * una DEFINICIÓN de seis semanas: primero se mide el mantenimiento, después se
 * resta el déficit.
 *
 * OJO: esto es lo ÚNICO de FORJA que va por fecha de verdad… hasta el 20 de
 * septiembre. A partir de ahí manda la regla maestra del contexto: "las
 * calorías futuras no deben tratarse como cifras fijas". Por eso hay dos
 * clases de fases:
 *
 *   · CON FECHA   — déficit moderado, llenado, transición y el test de
 *     mantenimiento. Días contados, kcal escritas.
 *   · DINÁMICAS   — definición, mantenimiento, ganancia limpia y el cut de
 *     primavera. Sus kcal no están escritas aquí: se calculan con el
 *     mantenimiento MEDIDO (ajustes.mantenimientoReal), el desfase propio de
 *     la fase (`ajusteBase`) y el ajuste acumulado de las revisiones
 *     mensuales (ajustes.ajusteKcal).
 *
 * La definición empieza sola el 21 de septiembre (el test acaba el 20 y ese
 * mismo día se revisa). Las fases siguientes NO cambian solas por fecha: las
 * confirma Jose desde la vista AÑO (ajustes.faseManual) cuando los datos lo
 * pidan.
 *
 * La comida se registra en Fitia. FORJA solo enseña el objetivo del día y las
 * macros por comida: es una chuleta, no un segundo Fitia (§58).
 */

const comida = (hora, nombre, p, hc, g) => ({ hora, nombre, p, hc, g });

/** kcal de un reparto de macros: 4 por gramo de proteína e hidrato, 9 de grasa. */
export function kcalDe({ p, hc, g }) {
  return p * 4 + hc * 4 + g * 9;
}

/** Si el test no ha dado todavía un número, esta es la hipótesis del plan. */
export const MANTENIMIENTO_HIPOTESIS = 2800;

/*
 * El mantenimiento NO se conoce todavía: 2.750–3.000 es la horquilla estimada
 * y 2.800 el punto de trabajo del test. Hasta que los 14 días den el número
 * real, la app dice "estimado", nunca "confirmado".
 *
 * La estimación anterior de ~2.600 queda descartada: la primera semana de
 * vuelta al entrenamiento salió casi plana comiendo 2.100–2.150, pero eso NO
 * demuestra que ese fuera el mantenimiento (coinciden recuperación de
 * glucógeno, agua intramuscular e inflamación después de tres semanas parado).
 */
export const MANTENIMIENTO_ESTIMADO = { min: 2750, medio: 2800, max: 3000 };

/** Horquilla del déficit de la definición sobre el mantenimiento medido. */
export const DEFICIT_DEFINICION = { min: 450, max: 600 };

/** La referencia de partida del protocolo. No borra históricos: solo es el punto de partida. */
export const PESO_REFERENCIA = { kg: 96.9, fecha: "2026-08-26" };

/* ------------------------------------------------------------------ */
/* Reparto automático de comidas                                       */
/*                                                                     */
/* Las fases dinámicas no pueden traer las comidas escritas a mano     */
/* porque sus kcal dependen del mantenimiento medido. El reparto sale  */
/* de las proporciones del plan: proteína en las cuatro comidas, el    */
/* grueso del hidrato alrededor del entreno, la grasa en la cena.      */
/*                                                                     */
/* Son objetivos ORIENTATIVOS (§27 del contexto): mover macros de una  */
/* comida a otra no rompe nada, lo que manda es el total del día.      */
/* ------------------------------------------------------------------ */

const COMIDAS_BASE = [
  { hora: "09:00", nombre: "Desayuno" },
  { hora: "13:00", nombre: "Comida (post-entreno)" },
  { hora: "17:30", nombre: "Merienda" },
  { hora: "21:00", nombre: "Cena" },
];

const FRACCIONES = {
  p: [0.24, 0.29, 0.21, 0.26],
  hc: [0.26, 0.38, 0.15, 0.21],
  g: [0.2, 0.24, 0.16, 0.4],
};

/** Reparte un total en partes enteras según fracciones, sin perder gramos. */
function repartir(total, fracciones) {
  const partes = fracciones.map((f) => Math.round(total * f));
  const resto = total - partes.reduce((t, x) => t + x, 0);
  // La diferencia del redondeo se corrige en la parte mayor, donde menos se nota.
  partes[fracciones.indexOf(Math.max(...fracciones))] += resto;
  return partes;
}

/** Las cuatro comidas de un día a partir de sus macros totales. */
export function repartirComidas(p, hc, g) {
  const ps = repartir(p, FRACCIONES.p);
  const hcs = repartir(hc, FRACCIONES.hc);
  const gs = repartir(g, FRACCIONES.g);
  return COMIDAS_BASE.map((c, i) => comida(c.hora, c.nombre, ps[i], hcs[i], gs[i]));
}

/**
 * Los macros completos de una fase dinámica con el estado actual de ajustes.
 *
 * Orden de prioridad del contexto (§26): calorías totales primero, luego
 * proteína, luego grasa mínima suficiente, y el hidrato se lleva el resto.
 * Por eso el hidrato es lo único que se calcula: es la variable de ajuste.
 */
function macrosDinamicos(fase, ajustes = {}) {
  const kcal =
    (ajustes.mantenimientoReal ?? MANTENIMIENTO_HIPOTESIS) + (fase.ajusteBase ?? 0) + (ajustes.ajusteKcal ?? 0);
  const hc = Math.max(0, Math.round((kcal - fase.p * 4 - fase.g * 9) / 4));
  return { kcal: fase.p * 4 + hc * 4 + fase.g * 9, p: fase.p, hc, g: fase.g, comidas: repartirComidas(fase.p, hc, fase.g) };
}

/* ------------------------------------------------------------------ */
/* Fases con rango de fechas                                           */
/* ------------------------------------------------------------------ */

export const FASES = [
  {
    /*
     * Déficit moderado, NO el mini-cut de 1.700 que había antes: con tan poco
     * hidrato se llega más ligero pero plano y entrenando peor, y la grasa
     * extra perdida en tan pocos días no compensa.
     */
    id: "deficit-moderado",
    nombre: "Déficit moderado",
    resumen: "Perder algo de grasa sin vaciar el músculo antes de los días visuales.",
    desde: "2026-08-26",
    hasta: "2026-09-01",
    kcal: 2150,
    p: 190,
    hc: 208,
    g: 62,
    comidas: [
      comida("09:00", "Desayuno", 45, 60, 12),
      comida("13:00", "Comida (post-entreno)", 55, 70, 15),
      comida("17:30", "Merienda", 35, 35, 10),
      comida("21:00", "Cena", 55, 43, 25),
    ],
  },
  {
    /*
     * El llenado hacia los días visuales: la proteína se queda en 190 y TODO
     * lo que sube es hidrato. Los días 3, 4 y 5 mandan sobre esta base con su
     * reparto propio (DIAS_ESPECIALES).
     */
    id: "llenado",
    nombre: "Llenado",
    resumen: "Suben los hidratos con las calorías controladas para recuperar plenitud muscular.",
    desde: "2026-09-02",
    hasta: "2026-09-05",
    kcal: 2300,
    p: 190,
    hc: 250,
    g: 60,
    comidas: [
      comida("09:00", "Desayuno", 45, 70, 10),
      comida("13:00", "Comida (post-entreno)", 55, 90, 12),
      comida("17:30", "Merienda", 35, 40, 10),
      comida("21:00", "Cena", 55, 50, 28),
    ],
  },
  {
    /*
     * Un solo día de transición: después de los días visuales NO se vuelve a
     * un déficit agresivo, se estabiliza y mañana ya empieza el test.
     */
    id: "transicion",
    nombre: "Transición",
    resumen: "Estabilizar después de los días visuales y entrar en el test de mantenimiento.",
    desde: "2026-09-06",
    hasta: "2026-09-06",
    kcal: 2500,
    p: 190,
    hc: 300,
    g: 60,
    comidas: [
      comida("09:00", "Desayuno", 45, 85, 10),
      comida("13:00", "Comida (post-entreno)", 55, 110, 12),
      comida("17:30", "Merienda", 35, 50, 10),
      comida("21:00", "Cena", 55, 55, 28),
    ],
  },
  {
    /*
     * Los 14 días que valen un año: comer PLANO a ~2.800 y pesarse cada
     * mañana. La media del 7–13 contra la del 14–20 dice si 2.800 es el
     * mantenimiento real o hay que corregirlo. Ese número es la base de TODAS
     * las fases que vienen después, empezando por el déficit de seis semanas.
     *
     * La proteína BAJA de 190 a 180: los 190 de la semana visual eran parte de
     * aquel protocolo, no una obligación permanente (§25 del contexto).
     *
     * Los macros del contexto (180/351/75) suman 2.799 exactas; la kcal de
     * menos es irrelevante y el objetivo se sigue contando como 2.800.
     */
    id: "calibracion",
    nombre: "Test de mantenimiento",
    resumen: "14 días a ~2.800 kcal clavadas para medir tu mantenimiento real.",
    desde: "2026-09-07",
    hasta: "2026-09-20",
    kcal: 2799,
    p: 180,
    hc: 351,
    g: 75,
    comidas: [
      comida("09:00", "Desayuno", 40, 95, 15),
      comida("13:00", "Comida (post-entreno)", 55, 130, 15),
      comida("17:30", "Merienda", 35, 55, 10),
      comida("21:00", "Cena", 50, 71, 35),
    ],
  },
  {
    /*
     * Fase abierta y DINÁMICA: `kcal/hc/comidas` de aquí son la hipótesis
     * sobre 2.800; lo que se enseña de verdad lo calcula `objetivosDe` con el
     * mantenimiento medido en el test.
     *
     * El déficit arranca en −500 (centro de la horquilla 450–600 del §16) y
     * lo mueve la revisión mensual. Proteína 185 y grasa 65: el hidrato se
     * lleva el resto y se mantiene alto para sostener hipertrofia y CaCo.
     *
     * Seis semanas previstas (21 sep → ~1 nov), pero el final no es una fecha
     * dura: al terminarlas Jose confirma el mantenimiento desde la vista AÑO.
     */
    id: "definicion",
    nombre: "Definición",
    resumen: "Seis semanas de déficit sobre el mantenimiento medido, perdiendo 0,5–0,7 % a la semana.",
    desde: "2026-09-21",
    hasta: null,
    hastaPrevisto: "2026-11-01",
    dinamica: true,
    ajusteBase: -500,
    kcal: 2301,
    p: 185,
    hc: 244,
    g: 65,
    comidas: repartirComidas(185, 244, 65),
  },
];

/*
 * Fases que NO entran por fecha: las confirma Jose desde la vista AÑO cuando
 * los datos lo pidan (ajustes.faseManual). Todas son dinámicas.
 *
 * `ajusteInicial` es dónde arranca la fase respecto al mantenimiento que él
 * confirma en ese momento; a partir de ahí lo mueven las revisiones.
 */
export const FASES_MANUALES = {
  "mantenimiento-post": {
    id: "mantenimiento-post",
    nombre: "Mantenimiento",
    resumen: "2–3 semanas estabilizando el peso nuevo y recuperando rendimiento.",
    dinamica: true,
    p: 180,
    g: 75,
    ajusteInicial: 0,
  },
  ganancia: {
    id: "ganancia",
    nombre: "Ganancia muscular limpia",
    resumen: "Construir músculo con un superávit pequeño, nunca con uno grande.",
    dinamica: true,
    p: 180,
    g: 75,
    ajusteInicial: 125,
  },
  "definicion-primavera": {
    id: "definicion-primavera",
    nombre: "Definición de primavera",
    resumen: "Cut corto de primavera 2027, solo si la cintura y las fotos lo piden.",
    dinamica: true,
    p: 185,
    g: 70,
    ajusteInicial: -450,
  },
  "mantenimiento-verano": {
    id: "mantenimiento-verano",
    nombre: "Mantenimiento de verano",
    resumen: "Verano 2027 comiendo el mantenimiento real de ese momento.",
    dinamica: true,
    p: 180,
    g: 75,
    ajusteInicial: 0,
  },
};

/* ------------------------------------------------------------------ */
/* Días con reparto propio                                             */
/* ------------------------------------------------------------------ */

/*
 * Estos tres días se salen de su fase y mandan sobre ella. Son el motivo de
 * toda la puesta a punto: sin ellos, el 4 y el 5 llegarían secos pero planos.
 */

// El pump de los días visuales: congestión visual en 10–15 min, NO una sesión
// de hipertrofia. Con calendario flexible no se puede dar por hecho que ese
// día toque torso: si toca, sirve de pump; si no, este pump corto aparte.
const PUMP_VISUAL = [
  "Elevaciones laterales 2–3×15–20",
  "Pullover o jalón ligero 2×12–15",
  "Press ligero o flexiones 2×12–15",
  "Bíceps 1–2×12–15",
  "Tríceps 1–2×12–15",
];
const PUMP_NOTA =
  "20–60 min antes de vestirse. RIR 2–3, unos 10–15 min: buena congestión sin destrozarse ni llegar al fallo.";

// Los dos días visuales comparten reparto: 190 P / 288 C / 60 G ≈ 2.450 kcal.
const COMIDAS_VISUAL = [
  comida("09:00", "Desayuno", 45, 80, 10),
  comida("13:00", "Comida", 55, 100, 12),
  comida("17:30", "Merienda (previa al momento)", 35, 55, 10),
  comida("21:00", "Cena", 55, 53, 28),
];

export const DIAS_ESPECIALES = {
  "2026-09-03": {
    id: "recarga",
    nombre: "Recarga + descanso",
    resumen: "Rellenar glucógeno y llegar fresco al 4–5. NO es un día libre.",
    kcal: 2500,
    p: 190,
    hc: 300,
    g: 60,
    comidas: [
      comida("09:00", "Desayuno", 45, 85, 10),
      comida("13:00", "Comida", 55, 110, 12),
      comida("17:30", "Merienda", 35, 50, 10),
      comida("21:00", "Cena", 55, 55, 28),
    ],
    // La subida viene de los hidratos, y de hidratos conocidos: se busca
    // glucógeno muscular, no barriga hinchada.
    si: ["Arroz", "Patata", "Avena", "Pan", "Pasta", "Fruta"],
    no: ["Pizza", "Hamburguesa", "Helado", "Alcohol", "Comida basura"],
    notas: [
      "Hoy NO hay sesión dura de gimnasio: interesa reducir fatiga, evitar agujetas y dejar que el hidrato rellene el músculo.",
      "Sí: caminar normal, movilidad, postura, core suave. No: HIIT, carrera intensa, pierna dura o torso al fallo.",
      "Agua normal. Sal normal.",
      "Fibra moderada, nada de atracones y nada de alimentos nuevos: glucógeno alto con el abdomen cómodo.",
    ],
  },

  "2026-09-04": {
    id: "visual-1",
    nombre: "Día visual 1",
    resumen: "Llegas con el músculo lleno de ayer. Hoy se mantiene la plenitud.",
    kcal: 2452,
    p: 190,
    hc: 288,
    g: 60,
    comidas: COMIDAS_VISUAL,
    notas: [
      "No cortar agua. No quitar sal: el agua intramuscular es parte del aspecto lleno.",
      "Comidas conocidas y de digestión fácil. Nada de atracones ni de alimentos nuevos.",
      "Evitar el entrenamiento duro y el cardio intenso antes del momento importante.",
    ],
    // El truco del día: mover hidratos, no añadirlos.
    truco: {
      titulo: "Colocar hidrato antes del momento clave",
      texto:
        "Si el momento importante es por la tarde-noche, reserva 50–70 g de hidratos para las " +
        "2–3 horas anteriores. Salen de los 288 g del día, no se suman. En esa comida: poca " +
        "grasa, proteína moderada, sal normal y nada enorme.",
    },
    pump: PUMP_VISUAL,
    pumpNota: PUMP_NOTA,
  },

  "2026-09-05": {
    id: "visual-2",
    nombre: "Día visual 2",
    resumen: "Segundo día importante: mismo reparto que ayer si funcionó bien.",
    kcal: 2452,
    p: 190,
    hc: 288,
    g: 60,
    comidas: COMIDAS_VISUAL,
    notas: [
      "NO volver a las 2.150 esta mañana: hoy también toca hidrato alto.",
      "Agua y sal normales, comidas conocidas.",
      "El pump es opcional: si ya te ves lleno, no hace falta. Sin fallo y sin acumular fatiga.",
      "Después del momento importante, vuelta a la rotación normal de fuerza.",
    ],
    pump: PUMP_VISUAL,
    pumpNota: PUMP_NOTA,
  },
};

/* ------------------------------------------------------------------ */

/** Reglas de fondo. Van plegadas: no compiten con las acciones (§22, §35). */
export const REGLAS = [
  "Las decisiones se toman con la media de 7 días + cintura + adherencia + actividad. Nunca con una pesada, ni con dos, ni con tres.",
  "Creatina: 5 g al día, todos los días.",
  "Agua: unos 2–2,5 litros al día más lo que pidan el calor y el entreno. Nunca cortarla para pesarse mejor, nada de sauna ni de cargas extremas.",
  "Sal normal y constante. Ni cortarla ni protocolos raros de sodio.",
  "Del 3 al 5 el peso puede subir por glucógeno y agua aunque estés perdiendo grasa: no es grasa y no hay que compensar.",
  "Durante el test de mantenimiento no se ajusta nada por una pesada suelta: se come lo mismo los 14 días y punto.",
  "Cintura y fotos como control, no solo la báscula. Cintura al menos una vez por semana.",
  "Las calorías solo se tocan en la revisión de cada 4 semanas, en bloques de ±100–150.",
  "Prioridad de macros: calorías totales, proteína, grasa suficiente y el hidrato con el resto. No hay que clavar los hidratos al gramo.",
  "Los macros por comida son orientativos: moverlos entre comidas no rompe nada, lo que manda es el total del día.",
];

/*
 * Preentreno (§59). Desayuno a las 09:00, gimnasio sobre las 12:00, comida
 * después: no hay quinta comida y la app no debe inventarla.
 */
export const NOTA_PREENTRENO =
  "No hay comida preentreno separada. Un desayuno unas 3 horas antes suele bastar. Si algún día " +
  "hay hambre o falta de energía, se redistribuye parte de los macros del día a un preentreno " +
  "pequeño, sin subir las kcal totales.";

/** La fase que corresponde a una fecha, contando la fase manual confirmada. */
export function faseDe(iso, ajustes = {}) {
  // Una fase confirmada a mano manda desde su fecha de inicio.
  if (ajustes.faseManual && iso >= (ajustes.faseManualDesde ?? "9999-12-31")) {
    const manual = FASES_MANUALES[ajustes.faseManual];
    if (manual) return manual;
  }

  return (
    FASES.find((f) => iso >= f.desde && (!f.hasta || iso <= f.hasta)) ||
    // Antes de que empiece el plan, la referencia es la primera fase.
    (iso < FASES[0].desde ? FASES[0] : FASES[FASES.length - 1])
  );
}

/** El día especial de una fecha, si lo tiene. */
export function diaEspecialDe(iso) {
  return DIAS_ESPECIALES[iso] ?? null;
}

/** ¿Ha empezado ya el plan nutricional en esta fecha? */
export function planEnMarcha(iso) {
  return iso >= FASES[0].desde;
}

/**
 * Los objetivos de un día concreto.
 *
 * Orden de prioridad: día especial > fase. En las fases dinámicas los números
 * se calculan con el mantenimiento medido y el ajuste acumulado; en las que
 * tienen fecha, salen escritos del plan.
 */
export function objetivosDe(iso, ajustes = {}) {
  const fase = faseDe(iso, ajustes);
  const especial = diaEspecialDe(iso);

  if (especial) {
    return { fase, especial, ...especial, nombre: especial.nombre };
  }

  const macros = fase.dinamica
    ? macrosDinamicos(fase, ajustes)
    : { kcal: fase.kcal, p: fase.p, hc: fase.hc, g: fase.g, comidas: fase.comidas };

  return {
    fase,
    especial: null,
    nombre: fase.nombre,
    resumen: fase.resumen,
    // En dinámicas, sin el test guardado esto es una hipótesis y se avisa.
    esHipotesis: Boolean(fase.dinamica) && ajustes.mantenimientoReal == null,
    ...macros,
  };
}

/**
 * El calendario día a día del tramo que tiene fecha (26 ago → 20 sep):
 * déficit moderado, llenado con los días visuales, transición y los 14 días
 * del test de mantenimiento.
 *
 * Se genera, no se escribe a mano: así no puede desincronizarse de las fases y
 * de los días especiales, que es la fuente de verdad.
 */
export const TRAMO_CON_FECHA = { desde: "2026-08-26", hasta: "2026-09-20" };

export function calendarioDelTramo() {
  const dias = [];
  let iso = TRAMO_CON_FECHA.desde;

  while (iso <= TRAMO_CON_FECHA.hasta) {
    const o = objetivosDe(iso);
    dias.push({
      fecha: iso,
      kcal: o.kcal,
      p: o.p,
      hc: o.hc,
      g: o.g,
      objetivo: objetivoDelDia(iso, o),
      especial: Boolean(o.especial),
    });
    iso = siguienteDia(iso);
  }

  return dias;
}

/**
 * Por qué este día es como es.
 *
 * Dos o tres frases, no un tratado: es lo que lees al abrir un día del
 * calendario para entender qué pinta ahí, y si no cabe de un vistazo no se
 * lee (§35).
 */
export function porQueDe(iso, ajustes = {}) {
  // Antes del 26 de agosto no hay "día N de 7" que contar: el plan todavía no
  // ha empezado y decir "día -3" sería absurdo.
  if (!planEnMarcha(iso)) {
    return (
      "El plan arranca el 26 de agosto. Hasta entonces esto es solo la referencia de lo que " +
      "tocará el primer día: 2.150 kcal de déficit moderado con la proteína en 190 g."
    );
  }

  const especial = diaEspecialDe(iso);

  if (especial?.id === "recarga") {
    return (
      "Este es el día que hace que el 4 y el 5 funcionen. Los 300 g de hidratos rellenan el " +
      "glucógeno del músculo, que es lo que llena hombros, dorsal, pecho y brazos, y por eso " +
      "hoy NO hay sesión dura: reducir fatiga y llegar fresco vale más que otro entreno. " +
      "Toda la subida viene del hidrato. No es un día libre."
    );
  }

  if (especial?.id === "visual-1") {
    return (
      "El primer día importante. Llegas con el músculo lleno de ayer y hoy se mantiene: hidrato " +
      "alto (~288 g), agua y sal normales, y 50–70 g de hidratos reservados para 2–3 horas antes " +
      "del momento clave. Pump corto opcional para la congestión: nada de entrenar al fallo."
    );
  }

  if (especial?.id === "visual-2") {
    return (
      "El segundo día importante. Se repite el reparto de ayer si funcionó bien: nada de volver " +
      "a las 2.150 esta mañana. El pump es opcional (solo si te ves menos lleno) y después del " +
      "momento importante se vuelve a la rotación normal de fuerza."
    );
  }

  switch (iso) {
    case "2026-08-26":
      return (
        "Primer día del plan, con nueva referencia de partida: 96,9 kg. Se cancela el mini-cut " +
        "de 1.700: un déficit tan grande te dejaría plano y entrenando peor. En su lugar, déficit " +
        "moderado con la proteína en 190 g."
      );
    case "2026-09-01":
      return "Último día a 2.150. A partir de mañana empieza el llenado: suben los hidratos.";
    case "2026-09-02":
      return (
        "Empieza el llenado: los hidratos pasan de 208 a 250 g con la proteína quieta. Además es " +
        "el último día recomendable para una sesión completa de gimnasio antes de los días " +
        "visuales: la que toque por rotación, con buena técnica y RIR ~2, sin fallo ni récords."
      );
    case "2026-09-06":
      return (
        "Pasaron los días visuales y NO se vuelve a un déficit agresivo: 2.500 kcal para " +
        "estabilizar glucógeno y rendimiento. Hoy toca medir peso, cintura y foto de perfil: " +
        "mañana empieza el test de mantenimiento."
      );
    case "2026-09-07":
      return (
        "Empieza el test: 14 días comiendo ~2.800 kcal clavadas y pesándote cada mañana " +
        "(después del baño, antes de desayunar). Estos días la báscula puede subir por glucógeno " +
        "y agua después de las 2.300–2.500 con hidrato alto: eso NO es grasa. Durante el test " +
        "las calorías no se tocan pase lo que pase."
      );
    case "2026-09-20":
      return (
        "Último día del test. Mañana FORJA compara la media del 7–13 con la del 14–20 y sale tu " +
        "mantenimiento real: solo entonces se fijan las calorías de la definición."
      );
    default:
      break;
  }

  const fase = faseDe(iso, ajustes);

  if (fase.id === "deficit-moderado") {
    const dia = diasDesde(fase.desde, iso) + 1;
    return (
      `Día ${dia} de 7 de déficit moderado. Sin cambios respecto a ayer, y es lo correcto: el ` +
      "déficit funciona por acumulación, no por hacer algo distinto cada día. El objetivo no es " +
      "pesar lo mínimo el día 4: es perder algo de grasa sin vaciar el músculo."
    );
  }

  if (fase.id === "llenado") {
    return (
      "Días de llenado: hidrato alto con las calorías controladas para recuperar plenitud " +
      "muscular sin atracones. El peso puede subir por glucógeno y agua: no es grasa."
    );
  }

  if (fase.id === "transicion") {
    return (
      "Transición a 2.500: mismo reparto que la recarga del 3. Entrenamiento normal, glucógeno " +
      "estable y rendimiento recuperándose para empezar el test de mantenimiento mañana."
    );
  }

  if (fase.id === "calibracion") {
    const dia = diasDesde(fase.desde, iso) + 1;
    return (
      `Día ${dia} de 14 del test de mantenimiento. Lo importante no son las ~2.800 de hoy sino ` +
      "que sean LAS MISMAS todos los días, con la misma proteína y unos pasos parecidos, y que " +
      "te peses cada mañana. Al final se compara la media de la semana 1 con la de la semana 2 " +
      "y sale tu mantenimiento real. No se ajusta nada por una pesada suelta."
    );
  }

  if (fase.id === "definicion") {
    const semana = Math.floor(diasDesde(fase.desde, iso) / 7) + 1;
    const cabecera = semana <= 6 ? `Semana ${semana} de 6 de definición. ` : "Definición (ya pasadas las seis semanas previstas). ";
    return ajustes.mantenimientoReal == null
      ? cabecera +
          "Todavía no hay mantenimiento guardado, así que estos números salen de la hipótesis de " +
          "2.800 menos el déficit. En cuanto guardes el resultado del test se recalculan solos."
      : cabecera +
          "Comes tu mantenimiento medido menos el déficit, buscando perder 0,5–0,7 % del peso a " +
          "la semana (unos 0,5–0,7 kg). Las calorías no se tocan mientras el peso medio y la " +
          "cintura bajen a ritmo razonable: solo la revisión de cada 4 semanas decide.";
  }

  if (fase.id === "mantenimiento-post" || fase.id === "mantenimiento-verano") {
    return (
      "Mantenimiento: se come alrededor del mantenimiento real DE AHORA, que no es el de antes " +
      "del cut (ha cambiado con el peso, la actividad y el running). Peso estable, rendimiento " +
      "recuperándose y hambre normalizada es el éxito de la fase."
    );
  }

  if (fase.id === "ganancia") {
    return (
      "Ganancia muscular limpia: mantenimiento real + 100–150 kcal, nunca un superávit grande. " +
      "La proteína se queda en 175–180 g y el hidrato alto sostiene el gimnasio y el running."
    );
  }

  if (fase.id === "definicion-primavera") {
    return (
      "Cut corto de primavera: mantenimiento del momento menos 400–500 kcal. No entra por " +
      "calendario, entra porque la cintura, las fotos y el nivel de definición lo piden."
    );
  }

  return fase.resumen;
}

function diasDesde(a, b) {
  const fecha = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d, 12);
  };
  return Math.round((fecha(b) - fecha(a)) / 86400000);
}

/** La etiqueta corta de la columna "Objetivo" del calendario. */
function objetivoDelDia(iso, objetivos) {
  if (objetivos.especial) return objetivos.especial.nombre;
  if (iso === "2026-09-01") return "Último día a 2.150";
  if (iso === "2026-09-02") return "Empieza el llenado";
  if (iso === "2026-09-06") return "Transición · medir antes del test";
  if (iso === "2026-09-07") return "Empieza el test";
  if (iso === "2026-09-20") return "Última pesada del test";
  return objetivos.fase.nombre;
}

function siguienteDia(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const f = new Date(y, m - 1, d, 12);
  f.setDate(f.getDate() + 1);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}
