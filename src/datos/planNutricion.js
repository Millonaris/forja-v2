/*
 * Nutrición según el PLAN MAESTRO ANUAL (23 de agosto de 2026).
 *
 * OJO: esto es lo ÚNICO de FORJA que va por fecha de verdad… hasta el 22 de
 * septiembre. A partir de ahí el propio plan maestro manda otra cosa: "los
 * datos reales mandan sobre el calendario" y "no fijar hoy las calorías de
 * febrero". Por eso hay dos clases de fases:
 *
 *   · CON FECHA   — mini-cut y calibración. Días contados, kcal escritas.
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
    id: "recorte-fuerte",
    nombre: "Recorte fuerte",
    resumen: "Perder grasa y quitar la hinchazón de las vacaciones.",
    desde: "2026-08-26",
    hasta: "2026-09-01",
    kcal: 1700,
    p: 195,
    hc: 104,
    g: 56,
    comidas: [
      comida("09:00", "Desayuno", 45, 40, 15),
      comida("13:00", "Comida (post-entreno)", 55, 44, 10),
      comida("17:30", "Merienda", 40, 10, 10),
      comida("21:00", "Cena", 55, 10, 21),
    ],
  },
  {
    id: "recorte-moderado",
    nombre: "Recorte moderado",
    resumen: "Se devuelve algo de hidrato al músculo sin salir del déficit.",
    desde: "2026-09-02",
    hasta: "2026-09-08",
    kcal: 1850,
    p: 195,
    hc: 137,
    g: 58,
    comidas: [
      comida("09:00", "Desayuno", 45, 45, 15),
      comida("13:00", "Comida (post-entreno)", 55, 62, 10),
      comida("17:30", "Merienda", 40, 10, 10),
      comida("21:00", "Cena", 55, 20, 23),
    ],
  },
  {
    /*
     * Los 14 días que valen un año: comer PLANO a 2.600 y pesarse cada mañana.
     * La media de los días 1–7 contra la de los 8–14 dice si 2.600 es tu
     * mantenimiento real o hay que corregirlo. Ese número es la base de TODAS
     * las fases que vienen después.
     */
    id: "calibracion",
    nombre: "Calibración",
    resumen: "14 días a 2.600 kcal clavadas para descubrir tu mantenimiento real.",
    desde: "2026-09-09",
    hasta: "2026-09-22",
    kcal: 2600,
    p: 190,
    hc: 289,
    g: 76,
    comidas: repartirComidas(190, 289, 76),
  },
  {
    /*
     * Fase abierta y DINÁMICA: `kcal/hc/comidas` de aquí son la hipótesis de
     * 2.600; lo que se enseña de verdad lo calcula `objetivosDe` con el
     * mantenimiento real + el ajuste de las revisiones mensuales.
     */
    id: "hipertrofia",
    nombre: "Hipertrofia",
    resumen: "La gran fase de construcción: 4–5 meses ganando músculo con la grasa controlada.",
    desde: "2026-09-23",
    hasta: null,
    dinamica: true,
    kcal: 2600,
    p: 190,
    hc: 289,
    g: 76,
    comidas: repartirComidas(190, 289, 76),
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
 * Estos dos días se salen de su fase y mandan sobre ella. Son el motivo de
 * todo el mini-cut: sin ellos, el día 4 llegaría seco pero plano.
 */
export const DIAS_ESPECIALES = {
  "2026-09-03": {
    id: "recarga",
    nombre: "Recarga controlada",
    resumen: "Rellenar el glucógeno del músculo. NO es un día libre.",
    kcal: 2200,
    p: 190,
    hc: 225,
    g: 60,
    comidas: [
      comida("09:00", "Desayuno", 45, 70, 15),
      comida("13:00", "Comida (post-entreno)", 50, 80, 15),
      comida("17:30", "Merienda", 40, 45, 10),
      comida("21:00", "Cena", 55, 30, 20),
    ],
    // La subida viene de los hidratos, y de hidratos conocidos: se busca
    // glucógeno muscular, no barriga hinchada.
    si: ["Arroz", "Patata", "Avena", "Pan", "Pasta", "Fruta"],
    no: ["Pizza", "Hamburguesa", "Helado", "Alcohol", "Comida basura"],
    notas: [
      "Agua normal. Sal normal.",
      "Fibra moderada: ese día no hace falta una montaña de verduras.",
      "2.200 kcal siguen estando alrededor o por debajo de tu mantenimiento real: un día así no borra la semana.",
    ],
  },

  "2026-09-04": {
    id: "visual",
    nombre: "Día visual principal",
    resumen: "Llegas con el músculo lleno del día anterior. Hoy se mantiene.",
    kcal: 2050,
    p: 190,
    hc: 192,
    g: 58,
    comidas: [
      comida("09:00", "Desayuno", 45, 65, 14),
      comida("13:00", "Comida (post-entreno)", 55, 75, 12),
      comida("17:30", "Merienda", 35, 35, 8),
      comida("21:00", "Cena", 55, 17, 24),
    ],
    notas: [
      "No cortar agua. No quitar sal.",
      "La merienda de las 17:30 es la que más ayuda si quieres verte bien por la tarde-noche.",
      "Evitar correr antes del momento importante.",
    ],
    // El truco del día: mover hidratos, no añadirlos.
    truco: {
      titulo: "Colocar hidrato antes del momento clave",
      texto:
        "Si quieres verte especialmente bien a una hora concreta, pon 25–35 g de hidratos " +
        "entre 60 y 120 minutos antes. Salen de los 192 g del día, no se suman: por ejemplo, " +
        "55–60 g en la comida en vez de 75, y los 15–20 restantes justo antes.",
    },
    // Con calendario flexible no se puede dar por hecho que ese día toque
    // torso (§23): si toca, sirve de pump; si no, este pump corto aparte.
    pump: [
      "Elevaciones laterales 3×15–20",
      "Pullover o jalón 2×12–15",
      "Press o flexiones 2×12–15",
      "Bíceps 2×12–15",
      "Tríceps 2×12–15",
    ],
    pumpNota: "RIR 2–3. Buena técnica y buena congestión, sin destrozarse ni llegar al fallo.",
  },
};

/* ------------------------------------------------------------------ */

/** Reglas de fondo. Van plegadas: no compiten con las acciones (§22, §35). */
export const REGLAS = [
  "Creatina: 5 g al día, todos los días.",
  "Agua normal. Nunca cortarla para pesarse mejor.",
  "Sal normal. Nada de deshidratarse.",
  "Lo que manda es la media de 7 días, no el peso de un día suelto.",
  "Cintura y fotos como control, no solo la báscula.",
  "Después de la recarga no hay que compensar comiendo 1.300 kcal: se vuelve al plan y ya.",
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
 * mini-cut completo más los 14 días de calibración.
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
      "tocará el primer día: 1.700 kcal con la proteína muy alta."
    );
  }

  const especial = diaEspecialDe(iso);

  if (especial?.id === "recarga") {
    return (
      "Este es el día que hace que el 4 funcione. Los 225 g de hidratos rellenan el glucógeno " +
      "del músculo, que es lo que llena hombros, dorsal, pecho y brazos. Toda la subida viene " +
      "del hidrato: la proteína y la grasa apenas se mueven. Por eso no es un día libre."
    );
  }

  if (especial?.id === "visual") {
    return (
      "El día. Llegas con el músculo lleno de ayer, así que hoy solo hay que mantenerlo: 192 g " +
      "de hidratos repartidos hacia la primera mitad del día. Se entrena buscando congestión, " +
      "sin destrozarse y sin llegar al fallo."
    );
  }

  switch (iso) {
    case "2026-08-26":
      return (
        "Primer día del recorte. Empieza el déficit fuerte con la proteína muy alta, que es lo " +
        "que protege el músculo mientras se va la grasa y la hinchazón de las vacaciones."
      );
    case "2026-08-29":
      return (
        "Día visual de ensayo, no el importante. No se toca nada: mismas kcal, agua y sal " +
        "normales. Sirve para ver cómo respondes con una semana de antelación."
      );
    case "2026-09-01":
      return "Último día a 1.700. A partir de mañana empiezan a subir los hidratos.";
    case "2026-09-02":
      return (
        "Primer escalón hacia arriba: los hidratos pasan de 104 a 137 g y la proteína se queda " +
        "donde estaba. El músculo empieza a recuperar glucógeno, todavía en déficit."
      );
    case "2026-09-05":
      return (
        "Vuelta al mini-cut sin compensar nada. No hay que comer de menos para pagar la recarga " +
        "de anteayer: se retoma el plan y ya está."
      );
    case "2026-09-08":
      return "Último día del mini-cut. Toca medir: peso, cintura y foto de perfil. Mañana, a 2.600.";
    case "2026-09-09":
      return (
        "Empieza la calibración: 14 días comiendo 2.600 kcal clavadas y pesándote cada mañana " +
        "(después del baño, antes de desayunar). Tras el mini-cut, esta primera semana el peso " +
        "puede subir por glucógeno y agua: es normal y no es grasa."
      );
    default:
      break;
  }

  const fase = faseDe(iso, ajustes);

  if (fase.id === "recorte-fuerte") {
    const dia = diasDesde(fase.desde, iso) + 1;
    return (
      `Día ${dia} de 7 de recorte fuerte. Sin cambios respecto a ayer, y es lo correcto: el ` +
      "déficit funciona por acumulación, no por hacer algo distinto cada día."
    );
  }

  if (fase.id === "recorte-moderado") {
    return "Recorte moderado. Mismo reparto que el resto de la fase, con los hidratos a 137 g.";
  }

  if (fase.id === "calibracion") {
    const dia = diasDesde(fase.desde, iso) + 1;
    return (
      `Día ${dia} de 14 de calibración. Lo importante no son las 2.600 de hoy sino que sean ` +
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
  if (iso === "2026-08-29") return "Día visual 1";
  if (iso === "2026-09-01") return "Último día fuerte";
  if (iso === "2026-09-02") return "Subimos hidratos";
  if (iso === "2026-09-05") return "Volver al mini-cut";
  if (iso === "2026-09-08") return "Final del mini-cut";
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
