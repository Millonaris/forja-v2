/*
 * Nutrición (§21, §22 y §23 de la spec).
 *
 * OJO: esto es lo ÚNICO de FORJA que va por fecha de verdad. Mover un
 * entrenamiento no desplaza la nutrición (§22, prueba §42): el 2 de septiembre
 * empieza la fase 2 aunque el gimnasio del día 1 se haya ido al día 2.
 *
 * La comida se registra en Fitia. FORJA solo enseña el objetivo del día y las
 * macros por comida: es una chuleta, no un segundo Fitia (§58).
 */

const comida = (hora, nombre, p, hc, g) => ({ hora, nombre, p, hc, g });

export const FASES = [
  {
    id: "minicut-fuerte",
    nombre: "Mini-cut fuerte",
    desde: "2026-08-26",
    hasta: "2026-09-01",
    kcal: 1700,
    p: 195,
    hc: 105,
    g: 55,
    comidas: [
      comida("09:00", "Desayuno", 45, 40, 15),
      comida("13:00", "Comida (post-entreno)", 55, 45, 10),
      comida("17:30", "Merienda", 40, 10, 10),
      comida("21:00", "Cena", 55, 10, 20),
    ],
  },
  {
    id: "minicut-moderado",
    nombre: "Mini-cut moderado",
    desde: "2026-09-02",
    hasta: "2026-09-08",
    kcal: 1850,
    p: 195,
    hc: 130,
    g: 60,
    comidas: [
      comida("09:00", "Desayuno", 45, 45, 15),
      comida("13:00", "Comida (post-entreno)", 55, 60, 10),
      comida("17:30", "Merienda", 40, 10, 10),
      comida("21:00", "Cena", 55, 15, 25),
    ],
  },
  {
    id: "mantenimiento",
    nombre: "Mantenimiento",
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

/** Reglas de fondo. Van plegadas: no compiten con las acciones (§22, §35). */
export const REGLAS = [
  "Creatina: 5 g al día, todos los días.",
  "Agua normal. Nunca cortarla para pesarse mejor.",
  "Sal normal. Nada de deshidratarse.",
  "Lo que manda es la media de 7 días, no el peso de un día suelto.",
  "Cintura y fotos como control, no solo la báscula.",
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

/** ¿Ha empezado ya el plan nutricional en esta fecha? */
export function planEnMarcha(iso) {
  return iso >= FASES[0].desde;
}

/** Los objetivos del día, aplicando el escalón elegido si la fase los tiene. */
export function objetivosDe(iso, escalon = 0) {
  const fase = faseDe(iso);
  const paso = fase.escalones?.[escalon];
  return {
    fase,
    kcal: paso?.kcal ?? fase.kcal,
    p: paso?.p ?? fase.p,
    hc: paso?.hc ?? fase.hc,
    g: paso?.g ?? fase.g,
    comidas: paso?.comidas ?? fase.comidas,
  };
}
