/*
 * Plan de carrera 0 → 20 km, en 30 bloques (§25 de la spec).
 *
 * Se llaman BLOQUES y no semanas a propósito (§14): un bloque avanza cuando
 * se completan sus sesiones, no cuando cambia la semana del calendario. Si un
 * bloque pesa, se repite, y da igual que sea lunes.
 *
 * Tipos de sesión:
 *   caco        · intervalos correr/caminar. No se piden km ni ritmo (§51).
 *   continua    · minutos o km seguidos. Aquí sí: km, minutos y ritmo.
 */

/** Lo que rodea a TODAS las sesiones, sin excepción (§25). */
export const ENVOLTURA = {
  calentamiento: "5–10 min caminando",
  enfriamiento: "5 min caminando",
  rpe: "3–4 / 10",
  test: "Tienes que poder hablar mientras corres.",
};

/** Reglas que no cambian en todo el plan. */
export const REGLAS = [
  "Fácil siempre. Si no puedes hablar, vas demasiado rápido.",
  "Nada de HIIT, series rápidas ni tempo duro.",
  "Evita días consecutivos en esta fase.",
  "Si el bloque pesa, repítelo. Repetir no es retroceder.",
  "Dolor localizado que persiste = no progresar.",
  "Una sesión perdida no se amontona con la siguiente.",
];

const caco = (repeticiones, correr, caminar) => ({
  tipo: "caco",
  repeticiones,
  correr,
  caminar,
});

const minutos = (min, larga = false) => ({ tipo: "continua", minutos: min, larga });
const kms = (km, larga = false) => ({ tipo: "continua", km, larga });

/** Repite la misma sesión `n` veces: en fase 1 las del bloque son idénticas. */
const repetir = (n, sesion) => Array.from({ length: n }, () => ({ ...sesion }));

export const BLOQUES = [
  /* ---- Fase 1 · construir el hábito de correr ---- */
  { numero: 1, fase: 1, sesiones: repetir(2, caco(6, 1, 2)) },
  { numero: 2, fase: 1, sesiones: repetir(2, caco(6, 1.5, 2)) },
  { numero: 3, fase: 1, sesiones: repetir(3, caco(6, 2, 2)) },
  { numero: 4, fase: 1, sesiones: repetir(3, caco(5, 3, 2)) },
  { numero: 5, fase: 1, sesiones: repetir(3, caco(4, 5, 2)) },
  { numero: 6, fase: 1, sesiones: repetir(3, caco(3, 7, 2)) },
  { numero: 7, fase: 1, sesiones: repetir(3, caco(3, 8, 2)) },
  { numero: 8, fase: 1, sesiones: repetir(3, caco(2, 12, 2)) },
  { numero: 9, fase: 1, sesiones: repetir(3, caco(2, 15, 2)) },
  // Primer bloque sin caminar: ya son carreras continuas.
  { numero: 10, fase: 1, sesiones: [minutos(25), minutos(25), minutos(30, true)] },

  /* ---- Fase 2 · minutos continuos ---- */
  { numero: 11, fase: 2, sesiones: [minutos(30), minutos(30), minutos(35, true)] },
  { numero: 12, fase: 2, sesiones: [minutos(30), minutos(35), minutos(40, true)] },
  { numero: 13, fase: 2, sesiones: [minutos(35), minutos(35), minutos(45, true)] },
  { numero: 14, fase: 2, esDescarga: true, sesiones: [minutos(30), minutos(30), minutos(35, true)] },
  { numero: 15, fase: 2, sesiones: [minutos(35), minutos(40), minutos(50, true)] },
  { numero: 16, fase: 2, sesiones: [minutos(35), minutos(40), minutos(55, true)] },
  { numero: 17, fase: 2, sesiones: [minutos(40), minutos(40), minutos(60, true)] },
  { numero: 18, fase: 2, esDescarga: true, sesiones: [minutos(35), minutos(35), minutos(45, true)] },

  /* ---- Fase 3 · kilómetros, hasta los 20 ---- */
  { numero: 19, fase: 3, sesiones: [kms(5), kms(5), kms(8, true)] },
  { numero: 20, fase: 3, sesiones: [kms(5), kms(5), kms(9, true)] },
  { numero: 21, fase: 3, sesiones: [kms(5), kms(6), kms(10, true)] },
  { numero: 22, fase: 3, esDescarga: true, sesiones: [kms(5), kms(5), kms(8, true)] },
  { numero: 23, fase: 3, sesiones: [kms(6), kms(6), kms(11, true)] },
  { numero: 24, fase: 3, sesiones: [kms(6), kms(6), kms(12.5, true)] },
  { numero: 25, fase: 3, sesiones: [kms(6), kms(7), kms(14, true)] },
  { numero: 26, fase: 3, esDescarga: true, sesiones: [kms(5), kms(5), kms(10, true)] },
  { numero: 27, fase: 3, sesiones: [kms(7), kms(7), kms(16, true)] },
  { numero: 28, fase: 3, sesiones: [kms(7), kms(8), kms(18, true)] },
  { numero: 29, fase: 3, esDescarga: true, sesiones: [kms(5), kms(6), kms(12, true)] },
  { numero: 30, fase: 3, sesiones: [kms(6), kms(7), kms(20, true)] },
];

export const NOMBRES_FASE = {
  1: "Correr y caminar",
  2: "Minutos continuos",
  3: "Kilómetros",
};

/** Un bloque por número. */
export function bloque(numero) {
  return BLOQUES.find((b) => b.numero === numero) || null;
}

/** El texto de una sesión: "6 × (2′ correr + 2′ caminar)", "5 km", "30′". */
export function describirSesion(s) {
  if (!s) return "";
  if (s.tipo === "caco") {
    return `${s.repeticiones} × (${min(s.correr)} correr + ${min(s.caminar)} caminar)`;
  }
  return s.km ? `${String(s.km).replace(".", ",")} km` : min(s.minutos);
}

/** Minutos con la comilla de siempre: 1.5 → "1′30″". */
function min(v) {
  if (Number.isInteger(v)) return `${v}′`;
  const enteros = Math.floor(v);
  const segundos = Math.round((v - enteros) * 60);
  return `${enteros}′${String(segundos).padStart(2, "0")}″`;
}

/** El hito siguiente que se puede prometer: la primera tirada larga mayor. */
export function proximoHito(numeroBloque) {
  const actual = bloque(numeroBloque);
  const largaActual = actual?.sesiones.find((s) => s.larga);
  const referencia = largaActual?.km ?? 0;

  for (const b of BLOQUES) {
    if (b.numero <= numeroBloque || b.esDescarga) continue;
    const larga = b.sesiones.find((s) => s.larga);
    if (larga?.km && larga.km > referencia) {
      return { bloque: b.numero, texto: `${String(larga.km).replace(".", ",")} km seguidos` };
    }
    if (!referencia && larga?.minutos) {
      return { bloque: b.numero, texto: `${larga.minutos}′ seguidos` };
    }
  }
  return null;
}
