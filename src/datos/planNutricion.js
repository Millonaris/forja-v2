/*
 * Nutrición según FORJA · DIETA — SOURCE OF TRUTH v3 (2 de septiembre de 2026,
 * docs/dieta-v3-source-of-truth.md). Sustituye a TODAS las versiones
 * anteriores del módulo: el protocolo visual del 4–5, el llenado y el test de
 * mantenimiento de ~2.800 quedan cancelados.
 *
 * El cambio de fondo: la dieta deja de ir por fechas y pasa a ir por DATOS.
 * Antes había un calendario de kcal escrito día a día; ahora hay UN objetivo
 * vigente que solo cambia cuando la tendencia de varias semanas lo justifica.
 *
 * Tres niveles de dato (§0), y el orden importa:
 *
 *   · MEDIDO    — peso, cintura, pasos, kcal registradas, entrenamiento.
 *   · ESTIMADO  — una fórmula. Tiene error individual y no manda.
 *   · DEDUCIDO  — lo que sale de semanas de ingesta + tendencia de peso.
 *
 * Cuando hay un DEDUCIDO estable, manda sobre el ESTIMADO. Ese es el motor de
 * todo el año: FORJA aprende cuánto gasta Jose de verdad en vez de creerse una
 * cuenta hecha el primer día.
 *
 * Lo único que sigue teniendo fecha aquí es el arranque del cut (2 de
 * septiembre), su semana de adaptación y el calendario ORIENTATIVO de bloques.
 * Todo lo demás sale de `ajustes` (el estado) y del registro.
 *
 * La comida se registra en Fitia. FORJA guarda una sola línea al día —kcal,
 * macros y pasos— porque sin eso no puede calcular adherencia ni gasto real.
 * Sigue sin ser un segundo Fitia: son dos números copiados, no un diario.
 */

/* ------------------------------------------------------------------ */
/* Configuración (§40)                                                 */
/* ------------------------------------------------------------------ */

export const NUTRICION_CFG = {
  // Simplificación útil, no una ley: 1 kg de tejido ≈ 7.700 kcal.
  kcalPorKg: 7700,

  adherencia: {
    min: 0.85,
    toleranciaKcal: 150,
  },

  tdee: {
    diasMinimos: 21,
    diasMinimosTrasCambio: 21,
    varianzaPasosMax: 0.2,
  },

  cut: {
    kcalInicio: 2400,
    perdidaSemanalPreferida: [0.4, 0.8],
    perdidaLentaAceptable: [0.2, 0.4],
    perdidaDemasiadoRapida: 0.9,
    ajusteKcal: [100, 150],
    zonaRevisionKcal: 2150,
    semanasMax: 14,
  },

  mantenimiento: {
    tendenciaConfirmacionFuerte: 0.1,
    tendenciaProvisional: 0.2,
    ajusteKcal: 100,
  },

  ganancia: {
    kgPorMesObjetivo: [0.25, 0.45],
    kgPorMesExcesivo: 0.6,
    ajusteKcal: 100,
    cinturaMaxCm: 2,
  },

  // Nunca se toca nada antes de 14 días desde el último cambio (§18, §54).
  diasMinimosEntreCambios: 14,
};

/* ------------------------------------------------------------------ */
/* Fechas: lo poquísimo que sigue yendo por calendario                 */
/* ------------------------------------------------------------------ */

/** El día que arranca la definición. Antes de esto la app no juzga nada. */
export const INICIO_CUT = "2026-09-02";

/**
 * Semana de adaptación (§14). Se sube de 2.100–2.150 a 2.400 y el peso puede
 * subir 0,3–0,8 kg por glucógeno, agua y contenido intestinal. No es grasa y
 * no se evalúa: cualquier conclusión sacada de estos días sería ruido.
 */
export const ADAPTACION = { desde: "2026-09-02", hasta: "2026-09-08" };

/**
 * Los bloques del cut (§15). Son ORIENTATIVOS: sirven para saber cuándo toca
 * mirar los datos con calma, no para obligar a nada. El bloque 4 es opcional
 * y el tope de ~14 semanas no hay ninguna obligación de agotarlo.
 */
export const BLOQUES_CUT = [
  { id: "adaptacion", nombre: "Adaptación", desde: "2026-09-02", hasta: "2026-09-08", noEvaluar: true },
  { id: "bloque-1", nombre: "Bloque 1", desde: "2026-09-09", hasta: "2026-09-29" },
  { id: "bloque-2", nombre: "Bloque 2", desde: "2026-09-30", hasta: "2026-10-20" },
  { id: "bloque-3", nombre: "Bloque 3", desde: "2026-10-21", hasta: "2026-11-10" },
  { id: "bloque-4", nombre: "Bloque 4 (opcional)", desde: "2026-11-11", hasta: "2026-12-01", opcional: true },
];

/** El tope orientativo de ~14 semanas desde el arranque (§20 C). */
export const TOPE_CUT = "2026-12-09";

/* ------------------------------------------------------------------ */
/* Objetivo de arranque y variantes                                    */
/* ------------------------------------------------------------------ */

/*
 * 2.400 kcal no es "la cifra perfecta": es un punto razonable para empezar a
 * observar. Si el gasto real fuese 2.900, el déficit sería de 500; si fuese
 * 2.700, de 300; si fuese 3.000, de 600. Los tres son razonables, y por eso
 * se empieza aquí y se corrige con datos en vez de afinar sobre el papel.
 */
export const OBJETIVO_INICIAL = { kcal: 2400, p: 185, hc: 246, g: 75 };

/*
 * Las variantes del cut (§13). Los ajustes van principalmente a hidratos.
 *
 * 2.150 es ZONA DE REVISIÓN, no una ley fisiológica: si se llega ahí sin
 * progreso, FORJA para y avisa en vez de seguir bajando.
 */
export const VARIANTES_CUT = [
  { kcal: 2550, p: 185, hc: 277, g: 78 },
  { kcal: 2400, p: 185, hc: 246, g: 75 },
  { kcal: 2250, p: 185, hc: 220, g: 70 },
  { kcal: 2150, p: 185, hc: 206, g: 65, zonaRevision: true },
];

/* ------------------------------------------------------------------ */
/* Las cuatro fases del año (§8)                                       */
/* ------------------------------------------------------------------ */

/*
 * Las fases terminan por datos + criterios, nunca solo por calendario. Ni una
 * sola de ellas entra sola por fecha: las confirma Jose desde DIETA → AÑO
 * cuando la app ve que se cumplen los criterios de salida.
 */
export const FASES = {
  cut: {
    id: "cut",
    nombre: "Definición",
    resumen: "Perder grasa conservando el máximo músculo y recuperando rendimiento.",
    p: 185,
    g: 75,
    gRango: [65, 75],
    banner: "DEFINICIÓN — Las pesadas sueltas no cuentan.",
    bannerAdaptacion: "ADAPTACIÓN — Agua y glucógeno pueden mover la báscula. No ajustar.",
  },
  mantenimiento: {
    id: "mantenimiento",
    nombre: "Mantenimiento",
    resumen: "Estabilizar el peso nuevo y confirmar cuánto gastas de verdad.",
    p: 175,
    g: 80,
    gRango: [75, 85],
    banner: "MANTENIMIENTO — Confirmando tu gasto real con el peso nuevo.",
    bannerAdaptacion: "ADAPTACIÓN A MANTENIMIENTO — La subida inicial puede ser agua y glucógeno.",
  },
  ganancia: {
    id: "ganancia",
    nombre: "Ganancia limpia",
    resumen: "Construir músculo con un superávit pequeño, sin volver a taparlo de grasa.",
    p: 175,
    g: 85,
    gRango: [80, 90],
    banner: "GANANCIA LIMPIA — Objetivo +0,25–0,45 kg/mes. Manda también la cintura.",
    bannerAdaptacion: null,
  },
  verano: {
    id: "verano",
    nombre: "Verano · mini-cut",
    resumen: "Mini-cut corto de 4–6 semanas, solo si la cintura y las fotos lo justifican.",
    p: 182,
    g: 70,
    gRango: [65, 75],
    banner: "VERANO — Mantener. Mini-cut solo si los datos y el objetivo visual lo justifican.",
    bannerAdaptacion: null,
  },
};

/** El orden en que se recorren las fases del año. */
export const ORDEN_FASES = ["cut", "mantenimiento", "ganancia", "verano"];

/* ------------------------------------------------------------------ */
/* Macros                                                              */
/* ------------------------------------------------------------------ */

/** kcal de un reparto de macros: 4 por gramo de proteína e hidrato, 9 de grasa. */
export function kcalDe({ p, hc, g }) {
  return p * 4 + hc * 4 + g * 9;
}

/**
 * Los macros de un objetivo calórico (§46).
 *
 * Prioridad del §32: primero las kcal, después la proteína, después una grasa
 * suficiente, y el hidrato se lleva TODO el resto. El hidrato es la variable
 * de ajuste porque es lo que sostiene el gimnasio, el CaCo y el glucógeno.
 */
export function macrosDesdeKcal(kcal, p, g) {
  const hc = Math.max(0, Math.round((kcal - p * 4 - g * 9) / 4));
  // `kcal` es el OBJETIVO que se enseña (2.400); `kcalMacros` es lo que suman
  // los gramos redondeados (2.399). El plan lo dice así de claro: "FORJA
  // muestra 2.400 kcal". Perseguir la kcal suelta sería falsa precisión.
  return { kcal, kcalMacros: p * 4 + hc * 4 + g * 9, p, hc, g };
}

/*
 * Reparto en las cuatro comidas.
 *
 * Las fracciones están calcadas de la tabla del §11 (a 2.400 dan exactamente
 * 45/70/12 · 55/90/15 · 40/40/18 · 45/46/30) y siguen siendo razonables en
 * mantenimiento y ganancia.
 *
 * Son GUÍA (§27): mover hidratos de una comida a otra no rompe nada. Lo que
 * manda es el total del día.
 */
const COMIDAS_BASE = [
  { hora: "09:00", nombre: "Desayuno (pre-gym)" },
  { hora: "13:00", nombre: "Comida (post-gym)" },
  { hora: "17:30", nombre: "Merienda" },
  { hora: "21:00", nombre: "Cena" },
];

const FRACCIONES = {
  p: [0.2432, 0.2973, 0.2162, 0.2432],
  hc: [0.2846, 0.3659, 0.1626, 0.1869],
  g: [0.16, 0.2, 0.24, 0.4],
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
  return COMIDAS_BASE.map((c, i) => ({ hora: c.hora, nombre: c.nombre, p: ps[i], hc: hcs[i], g: gs[i] }));
}

/* ------------------------------------------------------------------ */
/* El estado nutricional                                               */
/* ------------------------------------------------------------------ */

/**
 * El estado vigente a partir de los ajustes guardados, con los valores por
 * defecto del arranque. Todo lo que la app enseña sale de aquí.
 */
export function estadoNutricion(ajustes = {}) {
  return {
    faseId: ajustes.faseNutricion ?? "cut",
    faseDesde: ajustes.faseDesde ?? INICIO_CUT,
    ultimoCambioKcal: ajustes.ultimoCambioKcal ?? INICIO_CUT,
    kcal: ajustes.kcalObjetivo ?? OBJETIVO_INICIAL.kcal,
    p: ajustes.proteinaObjetivo ?? OBJETIVO_INICIAL.p,
    g: ajustes.grasaObjetivo ?? OBJETIVO_INICIAL.g,
    tdeeDeducido: ajustes.tdeeDeducido ?? null,
    mantenimientoConfirmado: ajustes.mantenimientoConfirmado ?? null,
    confianzaMantenimiento: ajustes.confianzaMantenimiento ?? null,
    cinturaInicioFase: ajustes.cinturaInicioFase ?? null,
  };
}

/** La fase vigente. */
export function faseDe(ajustes = {}) {
  return FASES[estadoNutricion(ajustes).faseId] ?? FASES.cut;
}

/** ¿Ha empezado ya el plan nutricional en esta fecha? */
export function planEnMarcha(iso) {
  return iso >= INICIO_CUT;
}

/**
 * ¿Estamos en la semana de adaptación de la fase actual?
 *
 * En el cut es la ventana escrita del 2 al 8 de septiembre; en las fases que
 * se confirman a mano, los 7 primeros días desde que empiezan (§24).
 */
export function enAdaptacion(ajustes = {}, hoy) {
  const e = estadoNutricion(ajustes);
  if (e.faseId === "cut") return hoy >= ADAPTACION.desde && hoy <= ADAPTACION.hasta;
  return diasDesde(e.faseDesde, hoy) < 7;
}

/**
 * Los objetivos vigentes: kcal, macros y el reparto por comidas.
 *
 * Ya no dependen de la fecha: dependen del estado. Un día de descanso come lo
 * mismo que un día de pierna (§12) — se pueden mover hidratos entre comidas,
 * pero el total no baja porque hoy no toque gimnasio.
 */
export function objetivosDe(ajustes = {}, hoy = null) {
  const e = estadoNutricion(ajustes);
  const fase = FASES[e.faseId] ?? FASES.cut;
  const macros = macrosDesdeKcal(e.kcal, e.p, e.g);
  const adaptando = hoy ? enAdaptacion(ajustes, hoy) : false;

  return {
    fase,
    nombre: fase.nombre,
    resumen: fase.resumen,
    ...macros,
    comidas: repartirComidas(macros.p, macros.hc, macros.g),
    adaptando,
    banner: adaptando && fase.bannerAdaptacion ? fase.bannerAdaptacion : fase.banner,
  };
}

/** El bloque del cut al que pertenece una fecha, o null. */
export function bloqueDe(iso) {
  return BLOQUES_CUT.find((b) => iso >= b.desde && iso <= b.hasta) ?? null;
}

/* ------------------------------------------------------------------ */
/* Reglas y explicaciones                                              */
/* ------------------------------------------------------------------ */

/** Reglas de fondo. Van plegadas: no compiten con las acciones (§22, §35). */
export const REGLAS = [
  "Un día no importa. Una semana puede engañar. Varias semanas de tendencia cuentan la verdad.",
  "Las calorías no se tocan antes de 14 días desde el último cambio, y se mueven de 100 en 100.",
  "Mismas kcal todos los días: entrenes pierna, torso, corras o descanses. Los hidratos sí se pueden mover entre comidas.",
  "Creatina: 5 g al día, todo el año. No hace falta ciclarla.",
  "Agua: ~2,5–3 L al día ajustando por calor y ejercicio. Venías de 1–1,5 L, que es poco para tu tamaño.",
  "Sal normal y constante. Nada de manipular agua ni sodio.",
  "El running YA está dentro de tus pasos: no se suman aparte las calorías de correr.",
  "No existe la comida gratis, pero tampoco el castigo: se mira el promedio de la semana, nunca se ayuna al día siguiente.",
  "El alcohol cuenta como kcal y además empeora sueño y recuperación. En definición, poco.",
  "Registra aceite, salsas, frutos secos y picoteos: son lo que más se olvida y lo que más mueve el déficit.",
  "La proteína no hay que clavarla al gramo: 178 o 188 están perfectamente bien.",
];

/*
 * Preentreno (§5, §16 de la guía). Desayuno a las 09:00, gimnasio sobre las
 * 12:00, comida después: el desayuno YA es el preentreno y no hace falta una
 * quinta comida. La merienda NO se etiqueta automáticamente como preentreno.
 */
export const NOTA_PREENTRENO =
  "Como entrenas sobre las 12:00 y desayunas a las 09:00, el desayuno ya es tu comida preentreno: " +
  "unas 3 horas antes es de sobra. No hace falta otra comida a las 11. Si algún día hay hambre o " +
  "falta de energía, se redistribuyen macros del propio día, sin subir el total.";

/** Por qué el plan está donde está, según la fase y el momento. */
export function porQueDe(ajustes = {}, hoy) {
  const e = estadoNutricion(ajustes);

  if (hoy < INICIO_CUT) {
    return (
      "La definición arranca el 2 de septiembre con 2.400 kcal. Hasta entonces esto es solo la " +
      "referencia de lo que tocará el primer día."
    );
  }

  if (e.faseId === "cut") {
    if (enAdaptacion(ajustes, hoy)) {
      const dia = diasDesde(ADAPTACION.desde, hoy) + 1;
      return (
        `Día ${dia} de 7 de adaptación. Vienes de 2.100–2.150 y subes a 2.400: es normal que la ` +
        "báscula suba 0,3–0,8 kg estos días por hidratos, glucógeno, el agua que los acompaña y " +
        "el contenido del intestino. Eso NO es grasa. Estos días no se evalúan y no se toca nada: " +
        "la primera información útil llega con varias semanas comparables."
      );
    }

    const bloque = bloqueDe(hoy);
    const cabecera = bloque ? `${bloque.nombre} de la definición. ` : "Definición. ";
    return (
      cabecera +
      `Comes ${e.kcal} kcal buscando perder 0,5–0,7 % del peso a la semana (unos 0,5–0,65 kg con ` +
      "97 kg). Se acepta menos si la cintura y las fotos mejoran y el gimnasio aguanta. Las " +
      "calorías no se tocan por una pesada ni por dos: solo cuando la media de 7 días, la cintura " +
      "y la adherencia digan lo mismo durante un par de semanas."
    );
  }

  if (e.faseId === "mantenimiento") {
    if (enAdaptacion(ajustes, hoy)) {
      return (
        "Primera semana de mantenimiento: adaptación. Al subir las calorías el peso puede subir " +
        "0,5–1 kg por glucógeno, agua y contenido intestinal. No se etiqueta como grasa y no se " +
        "evalúa nada todavía."
      );
    }
    return (
      "Mantenimiento: aquí no se busca perder ni ganar, se busca CONFIRMAR cuánto gastas con el " +
      "peso nuevo. Hacen falta unos 14 días con la tendencia cerca de cero y la cintura estable " +
      "para dar el número por bueno. Sin mantenimiento confirmado no se empieza a ganar músculo."
    );
  }

  if (e.faseId === "ganancia") {
    return (
      "Ganancia limpia: mantenimiento confirmado + 150–200 kcal. El objetivo es subir 0,25–0,45 kg " +
      "AL MES, no por semana: en seis meses, 1,5–2,5 kg está bien. Si el peso apenas sube pero la " +
      "fuerza progresa y la cintura está quieta, no se añaden calorías: eso es exactamente lo que " +
      "se busca."
    );
  }

  return (
    "Verano: se decide mirando cintura, fotos, peso, definición y rendimiento. Si te sigues viendo " +
    "bien, mantenimiento. Si has acumulado grasa que quieres quitar, mini-cut de 4–6 semanas a " +
    "mantenimiento − 400–500 kcal. Nunca un mini-cut porque el calendario diga junio."
  );
}

/* ------------------------------------------------------------------ */
/* Nutrición del running (§30, §51)                                    */
/* ------------------------------------------------------------------ */

/**
 * Qué hacer con los hidratos en una tirada larga.
 *
 * Es DISPONIBILIDAD de carbohidrato para rendir y recuperarse, no "devolver
 * las calorías quemadas". Las carreras de ahora (CaCo, ~30 min) no necesitan
 * nada: ni geles, ni bebidas especiales, ni subir 300 kcal.
 */
export function nutricionCarrera(minutos) {
  if (!minutos || minutos < 75) return { extraHc: 0, durante: null };
  if (minutos <= 120) {
    return { extraHc: 40, durante: minutos > 90 ? "30–60 g/h según tolerancia" : null };
  }
  return { extraHc: 50, durante: "30–60 g/h según tolerancia" };
}

/** La semana del 20K (§30). No tiene fecha: se activa cuando llega. */
export const SEMANA_20K = [
  "No recortar kcal esa semana.",
  "Priorizar hidratos y usar el rango alto de ingesta.",
  "Los 2 días previos, mayor disponibilidad de carbohidrato.",
  "Comida previa conocida y baja en fibra si hace falta.",
  "Después, una semana aproximadamente en mantenimiento antes de retomar el superávit.",
];

/* ------------------------------------------------------------------ */
/* Lo que FORJA nunca debe hacer (§55)                                 */
/* ------------------------------------------------------------------ */

export const NUNCA = [
  "Cambiar kcal por una pesada, ni por dos o tres días.",
  "Interpretar automáticamente agua y glucógeno como grasa.",
  "Contar dos veces el running (los pasos ya lo incluyen).",
  "Calcular el mantenimiento solo con una fórmula.",
  "Dar por hecho que 2.150 es tu mantenimiento por una semana plana.",
  "Acusarte de registrar mal cuando algo no cuadra.",
  "Bajar kcal por dolor de rodilla, tibia o Aquiles.",
  "Hacer un mini-cut porque toca junio.",
  "Subir mucho peso a propósito en volumen.",
  "Tratar una comida libre como si no hubiera existido, o castigarla con ayuno.",
  "Cambiar dieta y entrenamiento a la vez sin necesidad.",
  "Prometer ganancia muscular durante un déficit.",
  "Fijar un peso final obligatorio.",
];

/* ------------------------------------------------------------------ */

function diasDesde(a, b) {
  const fecha = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d, 12);
  };
  return Math.round((fecha(b) - fecha(a)) / 86400000);
}
