/*
 * Nutrición según el CONTEXTO MAESTRO DE SEPTIEMBRE 2026
 * (docs/contexto-maestro-septiembre-2026.md, 26 de agosto), que sustituye al
 * protocolo del plan anual para el tramo 26 ago → 22 sep: el mini-cut de
 * 1.700 kcal queda CANCELADO. El objetivo ya no es pesar lo mínimo el 4–5 de
 * septiembre, sino llegar con algo menos de grasa y el músculo LLENO.
 *
 * OJO: esto es lo ÚNICO de FORJA que va por fecha de verdad… hasta el 22 de
 * septiembre. A partir de ahí el propio plan maestro manda otra cosa: "los
 * datos reales mandan sobre el calendario" y "no fijar hoy las calorías de
 * febrero". Por eso hay dos clases de fases:
 *
 *   · CON FECHA   — déficit moderado, llenado, transición y calibración.
 *     Días contados, kcal escritas.
 *   · DINÁMICAS   — hipertrofia, definición, mantenimiento y recomposición.
 *     Sus kcal no están escritas aquí: se calculan con el mantenimiento REAL
 *     que sale de la calibración (ajustes.mantenimientoReal) más el ajuste
 *     acumulado de las revisiones mensuales (ajustes.ajusteKcal).
 *
 * La hipertrofia empieza sola el 23 de septiembre (la calibración acaba el
 * 22). Las fases siguientes NO cambian solas por fecha: las confirma Jose
 * desde la vista AÑO (ajustes.faseManual) cuando los datos digan que toca.
 *
 * La comida se registra en Fitia. FORJA solo enseña el objetivo del día y las
 * macros por comida: es una chuleta, no un segundo Fitia (§58).
 */

const comida = (hora, nombre, p, hc, g) => ({ hora, nombre, p, hc, g });

/** kcal de un reparto de macros: 4 por gramo de proteína e hidrato, 9 de grasa. */
export function kcalDe({ p, hc, g }) {
  return p * 4 + hc * 4 + g * 9;
}

/** Si la calibración no ha dado todavía un número, esta es la hipótesis del plan. */
export const MANTENIMIENTO_HIPOTESIS = 2600;

/*
 * El mantenimiento NO se conoce todavía: 2.550–2.700 es la horquilla estimada
 * y 2.600 el punto central de trabajo. Hasta que la calibración de septiembre
 * dé el número real, la app dice "estimado", nunca "confirmado".
 */
export const MANTENIMIENTO_ESTIMADO = { min: 2550, medio: 2600, max: 2700 };

/** La referencia de partida del protocolo. No borra históricos: solo es el punto de partida. */
export const PESO_REFERENCIA = { kg: 96.9, fecha: "2026-08-26" };

/* ------------------------------------------------------------------ */
/* Reparto automático de comidas                                       */
/*                                                                     */
/* Las fases dinámicas no pueden traer las comidas escritas a mano     */
/* porque sus kcal dependen del mantenimiento real. El reparto sale    */
/* de las proporciones del plan (§13): proteína en las cuatro comidas, */
/* el grueso del hidrato alrededor del entreno, la grasa en la cena.   */
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

/** Los macros completos de una fase dinámica con el estado actual de ajustes. */
function macrosDinamicos(fase, ajustes = {}) {
  const kcal = (ajustes.mantenimientoReal ?? MANTENIMIENTO_HIPOTESIS) + (ajustes.ajusteKcal ?? 0);
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
     * extra perdida en tan pocos días no compensa. Unas 400–550 kcal por
     * debajo del mantenimiento estimado.
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
     * Después de los días visuales NO se vuelve a un déficit agresivo: se
     * estabiliza glucógeno y rendimiento para llegar limpio al test del 9.
     */
    id: "transicion",
    nombre: "Transición",
    resumen: "Estabilizar después de los días visuales y preparar el test de mantenimiento.",
    desde: "2026-09-06",
    hasta: "2026-09-08",
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
     * Los 14 días que valen un año: comer PLANO a ~2.600 y pesarse cada
     * mañana. La media de los días 1–7 contra la de los 8–14 dice si 2.600 es
     * tu mantenimiento real o hay que corregirlo. Ese número es la base de
     * TODAS las fases que vienen después.
     *
     * Los macros del contexto maestro (190/309/67) suman 2.599 exactas; la
     * kcal de menos es irrelevante y el objetivo se sigue contando como 2.600.
     */
    id: "calibracion",
    nombre: "Calibración",
    resumen: "14 días a ~2.600 kcal clavadas para descubrir tu mantenimiento real.",
    desde: "2026-09-09",
    hasta: "2026-09-22",
    kcal: 2599,
    p: 190,
    hc: 309,
    g: 67,
    comidas: [
      comida("09:00", "Desayuno", 45, 85, 12),
      comida("13:00", "Comida (post-entreno)", 55, 110, 15),
      comida("17:30", "Merienda", 35, 50, 10),
      comida("21:00", "Cena", 55, 64, 30),
    ],
  },
  {
    /*
     * Fase abierta y DINÁMICA: `kcal/hc/comidas` de aquí son la hipótesis de
     * 2.600; lo que se enseña de verdad lo calcula `objetivosDe` con el
     * mantenimiento real + el ajuste de las revisiones mensuales. Proteína
     * ~190 y grasa ~70–75: el hidrato es la variable que ajusta el superávit.
     */
    id: "hipertrofia",
    nombre: "Hipertrofia",
    resumen: "La gran fase de construcción: 4–5 meses ganando músculo con la grasa controlada.",
    desde: "2026-09-23",
    hasta: null,
    dinamica: true,
    kcal: 2600,
    p: 190,
    hc: 298,
    g: 72,
    comidas: repartirComidas(190, 298, 72),
  },
];

/*
 * Fases que NO entran por fecha: las confirma Jose desde la vista AÑO cuando
 * los datos lo pidan (ajustes.faseManual). Todas son dinámicas.
 */
export const FASES_MANUALES = {
  definicion: {
    id: "definicion",
    nombre: "Definición",
    resumen: "Bajar grasa despacio conservando el músculo construido.",
    dinamica: true,
    p: 200,
    g: 68,
    ajusteInicial: -450,
  },
  "mantenimiento-post": {
    id: "mantenimiento-post",
    nombre: "Mantenimiento",
    resumen: "3–6 semanas estabilizando el peso nuevo y recuperando rendimiento.",
    dinamica: true,
    p: 190,
    g: 76,
    ajusteInicial: 0,
  },
  recomp: {
    id: "recomp",
    nombre: "Recomposición",
    resumen: "Mantener el físico magro y seguir progresando, con superávit mínimo o sin él.",
    dinamica: true,
    p: 190,
    g: 76,
    ajusteInicial: 100,
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
  "Creatina: 5 g al día, todos los días.",
  "Agua normal. Nunca cortarla para pesarse mejor. Nada de sauna ni de sudar para bajar peso.",
  "Sal normal y consistente. Nada de protocolos raros de sodio.",
  "Lo que manda es la media de 7 días, no el peso de un día suelto.",
  "Del 3 al 5 el peso puede subir por glucógeno y agua aunque estés perdiendo grasa: no es grasa y no hay que compensar.",
  "Cintura y fotos como control, no solo la báscula.",
  "Después de los días visuales se pasa a la transición de 2.500, no a un déficit agresivo.",
  "Las calorías solo se tocan en la revisión de cada 4 semanas, en bloques de ±100–150.",
  "No hay que clavar los hidratos al gramo: proteína primero, el resto es flexible.",
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
 * se calculan con el mantenimiento real y el ajuste acumulado; en las que
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
    // En dinámicas, sin calibración guardada esto es una hipótesis y se avisa.
    esHipotesis: Boolean(fase.dinamica) && ajustes.mantenimientoReal == null,
    ...macros,
  };
}

/**
 * El calendario día a día del tramo que tiene fecha (26 ago → 22 sep):
 * déficit moderado, llenado con los días visuales, transición y los 14 días
 * de calibración.
 *
 * Se genera, no se escribe a mano: así no puede desincronizarse de las fases y
 * de los días especiales, que es la fuente de verdad.
 */
export function calendarioDelTramo() {
  const dias = [];
  let iso = "2026-08-26";

  while (iso <= "2026-09-22") {
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
        "moderado (unas 400–550 kcal bajo el mantenimiento estimado) con la proteína en 190 g."
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
        "estabilizar glucógeno y rendimiento y preparar el test de mantenimiento del día 9."
      );
    case "2026-09-08":
      return "Último día de transición. Toca medir: peso, cintura y foto de perfil. Mañana empieza el test.";
    case "2026-09-09":
      return (
        "Empieza la calibración: 14 días comiendo ~2.600 kcal clavadas y pesándote cada mañana " +
        "(después del baño, antes de desayunar). Un día suelto de subida o bajada no cambia " +
        "nada: durante el test las calorías no se tocan."
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
      "estable y rendimiento recuperándose para empezar el test de mantenimiento el día 9."
    );
  }

  if (fase.id === "calibracion") {
    const dia = diasDesde(fase.desde, iso) + 1;
    return (
      `Día ${dia} de 14 de calibración. Lo importante no son las ~2.600 de hoy sino que sean ` +
      "LAS MISMAS todos los días y que te peses cada mañana: al final, comparar la media de la " +
      "semana 1 con la de la semana 2 dirá cuál es tu mantenimiento real. FORJA hace esa cuenta sola."
    );
  }

  if (fase.id === "hipertrofia") {
    return ajustes.mantenimientoReal == null
      ? "Hipertrofia con el mantenimiento aún sin calibrar: se usa la hipótesis de 2.600 kcal. " +
          "En cuanto guardes el resultado de la calibración, todos los números se recalculan solos."
      : "La gran fase de construcción. Comes tu mantenimiento real y solo se suben +100–150 kcal " +
          "si la revisión mensual ve el peso plano y la progresión parada. El objetivo es ganar " +
          "como mucho 0,20 kg por semana de media: músculo, no grasa.";
  }

  if (fase.id === "definicion") {
    return (
      "Definición: déficit moderado partiendo de tu mantenimiento real, perdiendo un 0,5–0,75 % " +
      "del peso a la semana. La proteína sube a ~200 g para proteger el músculo y el entreno no " +
      "se ablanda: mismos pesos, misma intención."
    );
  }

  if (fase.id === "mantenimiento-post") {
    return (
      "Mantenimiento después de definir: 3–6 semanas estabilizando el peso nuevo, recuperando " +
      "rendimiento y normalizando el hambre. No hace falta una reverse diet de meses."
    );
  }

  if (fase.id === "recomp") {
    return (
      "Recomposición: mantener el físico magro conseguido y seguir progresando en el gimnasio, " +
      "con el peso estable o subiendo muy despacio. La meta es pasar el año definido y fuerte."
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
  if (iso === "2026-09-06") return "Empieza la transición";
  if (iso === "2026-09-08") return "Medir antes del test";
  if (iso === "2026-09-09") return "Empieza la calibración";
  if (iso === "2026-09-22") return "Última medición";
  return objetivos.fase.nombre;
}

function siguienteDia(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const f = new Date(y, m - 1, d, 12);
  f.setDate(f.getDate() + 1);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}
