/*
 * Nutrición (§21, §22 y §23 de la spec, con el plan revisado del 22 de agosto).
 *
 * OJO: esto es lo ÚNICO de FORJA que va por fecha de verdad. Mover un
 * entrenamiento no desplaza la nutrición (§22, prueba §42): el 3 de septiembre
 * toca recarga aunque el gimnasio se haya ido a otro día.
 *
 * La estrategia hasta el 4 de septiembre, en una línea:
 *
 *   7 días de recorte fuerte → 1 día moderado → 1 día de recarga controlada
 *   → día visual con bastante hidrato → volver al recorte moderado.
 *
 * La idea es llegar al día 4 más seco pero SIN verse vacío: los tres días
 * previos devuelven glucógeno al músculo, que es lo que llena hombros, dorsal
 * y brazos. Hacer 1.700 kcal seguidas del 26 al 4 secaría igual, pero llegaría
 * plano.
 *
 * La comida se registra en Fitia. FORJA solo enseña el objetivo del día y las
 * macros por comida: es una chuleta, no un segundo Fitia (§58).
 */

const comida = (hora, nombre, p, hc, g) => ({ hora, nombre, p, hc, g });

/** kcal de un reparto de macros: 4 por gramo de proteína e hidrato, 9 de grasa. */
export function kcalDe({ p, hc, g }) {
  return p * 4 + hc * 4 + g * 9;
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
    id: "mantenimiento",
    nombre: "Mantenimiento",
    resumen: "Salir del déficit antes de empezar a construir.",
    desde: "2026-09-09",
    hasta: "2026-09-15",
    kcal: 2400,
    p: 185,
    hc: 258,
    g: 70,
    comidas: [
      comida("09:00", "Desayuno", 45, 70, 15),
      comida("13:00", "Comida (post-entreno)", 55, 100, 15),
      comida("17:30", "Merienda", 40, 35, 10),
      comida("21:00", "Cena", 45, 53, 30),
    ],
  },
  {
    // Fase abierta: sin `hasta`. Los ajustes van en bloques de ±100 kcal, así
    // que el volumen tiene dos escalones en vez de un número suelto.
    id: "volumen",
    nombre: "Volumen limpio",
    resumen: "Construir músculo sin acumular grasa a lo tonto.",
    desde: "2026-09-16",
    hasta: null,
    kcal: 2500,
    p: 185,
    hc: 283,
    g: 70,
    comidas: [
      comida("09:00", "Desayuno", 45, 75, 15),
      comida("13:00", "Comida (post-entreno)", 55, 110, 15),
      comida("17:30", "Merienda", 40, 40, 10),
      comida("21:00", "Cena", 45, 58, 30),
    ],
    escalones: [
      {
        kcal: 2500,
        p: 185,
        hc: 283,
        g: 70,
        comidas: [
          comida("09:00", "Desayuno", 45, 75, 15),
          comida("13:00", "Comida (post-entreno)", 55, 110, 15),
          comida("17:30", "Merienda", 40, 40, 10),
          comida("21:00", "Cena", 45, 58, 30),
        ],
      },
      {
        kcal: 2550,
        p: 185,
        hc: 295,
        g: 70,
        comidas: [
          comida("09:00", "Desayuno", 45, 80, 15),
          comida("13:00", "Comida (post-entreno)", 55, 115, 15),
          comida("17:30", "Merienda", 40, 40, 10),
          comida("21:00", "Cena", 45, 60, 30),
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Días con reparto propio                                             */
/* ------------------------------------------------------------------ */

/*
 * Estos dos días se salen de su fase y mandan sobre ella. Son el motivo de
 * todo el plan: sin ellos, el día 4 llegaría seco pero plano.
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
  "En volumen, ajustar en bloques de ±100 kcal y esperar.",
];

/*
 * Preentreno (§59). Desayuno a las 09:00, gimnasio sobre las 12:00, comida
 * después: no hay quinta comida y la app no debe inventarla.
 */
export const NOTA_PREENTRENO =
  "No hay comida preentreno separada. Si algún día hay hambre o falta de energía, " +
  "se redistribuye parte de los macros del día a un preentreno pequeño, sin subir las kcal totales.";

/** La fase que corresponde a una fecha. */
export function faseDe(iso) {
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
 * Orden de prioridad: día especial > escalón de la fase > fase. El día
 * especial manda porque es la excepción con fecha y nombre propios.
 */
export function objetivosDe(iso, escalon = 0) {
  const fase = faseDe(iso);
  const especial = diaEspecialDe(iso);

  if (especial) {
    return { fase, especial, ...especial, nombre: especial.nombre };
  }

  const paso = fase.escalones?.[escalon];
  return {
    fase,
    especial: null,
    nombre: fase.nombre,
    resumen: fase.resumen,
    kcal: paso?.kcal ?? fase.kcal,
    p: paso?.p ?? fase.p,
    hc: paso?.hc ?? fase.hc,
    g: paso?.g ?? fase.g,
    comidas: paso?.comidas ?? fase.comidas,
  };
}

/**
 * El calendario día a día del tramo que tiene fecha límite (26 ago → 8 sep).
 *
 * Se genera, no se escribe a mano: así no puede desincronizarse de las fases y
 * de los días especiales, que es la fuente de verdad.
 */
export function calendarioDelTramo() {
  const dias = [];
  let iso = "2026-08-26";

  while (iso <= "2026-09-08") {
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

/** La etiqueta corta de la columna "Objetivo" del calendario. */
function objetivoDelDia(iso, objetivos) {
  if (objetivos.especial) return objetivos.especial.nombre;
  if (iso === "2026-08-29") return "Día visual 1";
  if (iso === "2026-09-01") return "Último día fuerte";
  if (iso === "2026-09-02") return "Subimos hidratos";
  if (iso === "2026-09-08") return "Final del mini-cut";
  if (iso === "2026-09-05") return "Volver al mini-cut";
  return objetivos.fase.nombre;
}

function siguienteDia(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const f = new Date(y, m - 1, d, 12);
  f.setDate(f.getDate() + 1);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}
