/*
 * Progresión por ejercicio (§12 y §24 de la spec).
 *
 * Doble progresión: se llena el rango de repeticiones con el RIR objetivo y
 * SOLO entonces se sube el peso. No se exige récord en cada sesión — esa es
 * justo la manera de acabar estancado y frustrado.
 *
 * Cuatro estados, y ninguno es un reproche:
 *   SUBE PESO   · rango lleno con el esfuerzo correcto
 *   LLENA RANGO · aún queda margen de repeticiones con este peso
 *   MANTÉN      · vas avanzando, sigue igual
 *   REVISAR     · varias sesiones sin moverse o yendo a menos
 */

export const ESTADOS = {
  SUBE: { id: "sube", texto: "Sube peso", color: "var(--exito)" },
  LLENA: { id: "llena", texto: "Llena el rango", color: "var(--fuerza)" },
  MANTEN: { id: "manten", texto: "Mantén", color: "var(--texto-medio)" },
  REVISAR: { id: "revisar", texto: "Revisar", color: "var(--aviso)" },
};

/** Agrupa las series de un ejercicio por sesión, de la más nueva a la más vieja. */
export function porSesion(series, sesiones) {
  const fecha = new Map(sesiones.map((s) => [s.id, s.fecha]));
  const grupos = new Map();

  for (const serie of series) {
    if (!grupos.has(serie.sesionId)) grupos.set(serie.sesionId, []);
    grupos.get(serie.sesionId).push(serie);
  }

  return [...grupos.entries()]
    .map(([sesionId, lista]) => ({
      sesionId,
      fecha: fecha.get(sesionId) ?? "",
      series: [...lista].sort((a, b) => a.numeroSerie - b.numeroSerie),
    }))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/** El peso de trabajo de una sesión: el más repetido, no el máximo. */
export function pesoDeTrabajo(series) {
  const cuenta = new Map();
  for (const s of series) {
    if (s.kg == null) continue;
    cuenta.set(s.kg, (cuenta.get(s.kg) ?? 0) + 1);
  }
  if (!cuenta.size) return null;
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
}

/** Repeticiones totales de una sesión: la medida que mejor resume el avance. */
export function repsTotales(series) {
  return series.reduce((t, s) => t + (s.reps ?? 0), 0);
}

/**
 * Veredicto de un ejercicio a partir de su historial.
 *
 * `historial` es lo que devuelve `porSesion`, de la más nueva a la más vieja.
 *
 * El razonamiento, en el orden en que se comprueba — el mismo que seguiría un
 * entrenador leyendo tu cuaderno:
 *
 *  1. ¿Rampa de vuelta? Consolidar; no se buscan récords hasta el 100 %.
 *  2. ¿Primera vez? Establecer referencia con el RIR objetivo del ejercicio.
 *  3. ¿Peso pasado? (por debajo del suelo del rango) → bajar o reconstruir.
 *  4. ¿Acabas de subir de peso? Reconstruir desde abajo; caer reps es normal.
 *  5. ¿Techo del rango en TODAS con RIR ≥ 1? → subir el incremento mínimo.
 *     ¿Techo pero rozando el fallo (RIR 0)? → consolidar antes de subir.
 *  6. Ni lleno ni pasado: comparar reps totales contra la última vez al MISMO
 *     peso, con objetivo concreto para la próxima. Tres sesiones sin mejorar
 *     → revisar (descanso, sueño, técnica, o -5 % y reconstruir).
 */
export function veredicto(ejercicio, historial, { enRampa = false } = {}) {
  const rirObjetivo = ejercicio.rir ?? "1–2";

  // 1 · Rampa de vuelta: series recortadas y RIR alto A PROPÓSITO. Pedir
  // récords aquí sería contradecir el propio plan.
  if (enRampa) {
    return {
      ...ESTADOS.MANTEN,
      motivo:
        "Rampa de vuelta: series recortadas y RIR alto a propósito. Consolida técnica y pesos; " +
        "la progresión al 100 % se retoma el 9 de septiembre.",
    };
  }

  // 2 · Sin historial: primero se establece la referencia.
  const ultima = historial[0];
  if (!ultima) {
    return {
      ...ESTADOS.LLENA,
      motivo:
        `Primera vez: busca un peso que te deje en RIR ${rirObjetivo} dentro de ` +
        `${ejercicio.repMin}–${ejercicio.repMax}. Esa será tu referencia.`,
    };
  }

  const series = ultima.series.filter((s) => s.reps != null);
  if (!series.length) {
    return { ...ESTADOS.LLENA, motivo: "La última sesión no tiene repeticiones apuntadas." };
  }

  const peso = pesoDeTrabajo(series);
  const total = repsTotales(series);
  const rangoLleno = series.every((s) => (s.reps ?? 0) >= ejercicio.repMax);
  const bajoElRango = series.every((s) => (s.reps ?? 0) < ejercicio.repMin);

  // ¿Se subió de peso en la última sesión? Entonces se está reconstruyendo.
  const pesoAnterior = historial[1] ? pesoDeTrabajo(historial[1].series) : null;
  const pesoRecienSubido = peso != null && pesoAnterior != null && peso > pesoAnterior;

  // 3 · Peso pasado: ni una serie llega al suelo del rango.
  if (bajoElRango) {
    return {
      ...ESTADOS.REVISAR,
      motivo: pesoRecienSubido
        ? `El salto a ${formatearPeso(peso)} fue grande: te quedas por debajo de ` +
          `${ejercicio.repMin}. Vuelve a ${formatearPeso(pesoAnterior)} o usa un incremento menor.`
        : `Por debajo de ${ejercicio.repMin} reps en todas las series a ${formatearPeso(peso)}. ` +
          "Baja el incremento mínimo y reconstruye desde ahí.",
    };
  }

  // 5 · Techo del rango en todas las series.
  if (rangoLleno) {
    const rires = series.map((s) => s.rir).filter((r) => r != null);
    const todasConRir = rires.length === series.length;

    if (todasConRir && rires.every((r) => r >= 1)) {
      return {
        ...ESTADOS.SUBE,
        motivo:
          `Techo del rango (${ejercicio.repMax}) en todas las series a ${formatearPeso(peso)} ` +
          `con RIR correcto. Sube el incremento MÍNIMO de la máquina y vuelve a ` +
          `${ejercicio.repMin}–${ejercicio.repMin + 2}: caer reps con el peso nuevo es lo esperado.`,
      };
    }

    if (todasConRir) {
      // Alguna serie a RIR 0: llegó al techo, pero al fallo. El plan pide el
      // techo CON el RIR objetivo antes de subir.
      return {
        ...ESTADOS.MANTEN,
        motivo:
          `Llegaste a ${ejercicio.repMax} pero rozando el fallo. Repite ${formatearPeso(peso)} ` +
          `buscando el techo con RIR ${rirObjetivo}, y entonces sube.`,
      };
    }

    return {
      ...ESTADOS.SUBE,
      motivo:
        `Techo del rango a ${formatearPeso(peso)}. Si el esfuerzo fue RIR ${rirObjetivo}, sube ` +
        "el incremento mínimo. Apunta el RIR y esta recomendación afinará sola.",
    };
  }

  // 4 · Peso recién subido y aún sin llenar: reconstrucción normal.
  if (pesoRecienSubido) {
    return {
      ...ESTADOS.LLENA,
      motivo:
        `Peso nuevo (${formatearPeso(pesoAnterior)} → ${formatearPeso(peso)}): reconstruye ` +
        `hacia ${ejercicio.repMax} en todas. Caer a ${ejercicio.repMin}/${ejercicio.repMin}/` +
        `${Math.max(ejercicio.repMin - 1, 1)} aquí es progreso, no retroceso.`,
    };
  }

  // 6 · Comparación con la última sesión al MISMO peso: cambiar de peso y de
  // repeticiones a la vez no dice nada útil.
  const previa = historial.slice(1).find((h) => pesoDeTrabajo(h.series) === peso);
  if (previa) {
    const antes = repsTotales(previa.series);

    if (total > antes) {
      return {
        ...ESTADOS.MANTEN,
        motivo:
          `+${total - antes} reps (${antes} → ${total}) a ${formatearPeso(peso)}. Va perfecto: ` +
          `objetivo de la próxima, ${total + 1} totales o más.`,
      };
    }

    const estancado = sesionesSinMejorar(historial, peso) >= 3;
    if (estancado) {
      return {
        ...ESTADOS.REVISAR,
        motivo:
          `Tres sesiones sin pasar de ${total} reps a ${formatearPeso(peso)}. Antes de tocar el ` +
          "peso: ¿descansos completos, sueño, técnica igual? Si todo está bien, prueba -5 % y " +
          "reconstruye con carrerilla.",
      };
    }

    if (total < antes) {
      return {
        ...ESTADOS.MANTEN,
        motivo:
          `Día flojo (${antes} → ${total} reps). Una sesión no es tendencia: repite ` +
          `${formatearPeso(peso)} y recupera las ${antes}.`,
      };
    }

    return {
      ...ESTADOS.LLENA,
      motivo:
        `Clavado en ${total} reps a ${formatearPeso(peso)}. Objetivo concreto: +1 rep en la ` +
        "primera serie, que es donde más fresco estás.",
    };
  }

  return {
    ...ESTADOS.LLENA,
    motivo:
      `${total} reps a ${formatearPeso(peso)}. Sigue con este peso hasta ${ejercicio.repMax} ` +
      `en todas las series con RIR ${rirObjetivo}.`,
  };
}

/**
 * El reto de HOY para un ejercicio, a partir de su última sesión.
 *
 * Es la línea que un entrenador te diría al acercarte a la máquina. Corta a
 * propósito: en el gimnasio se lee de un vistazo o no se lee.
 */
export function objetivoDeHoy(ejercicio, seriesAnteriores) {
  if (!seriesAnteriores?.length) return null;

  const series = seriesAnteriores.filter((s) => s.reps != null);
  if (!series.length) return null;

  const peso = pesoDeTrabajo(series);
  const total = repsTotales(series);
  const rangoLleno = series.every((s) => (s.reps ?? 0) >= ejercicio.repMax);
  const bajoElRango = series.every((s) => (s.reps ?? 0) < ejercicio.repMin);
  const rires = series.map((s) => s.rir).filter((r) => r != null);
  const sinFallo = rires.length === series.length && rires.every((r) => r >= 1);

  if (bajoElRango) return `Hoy: baja un punto desde ${formatearPeso(peso)} y llena el rango.`;
  if (rangoLleno && sinFallo) {
    return `Hoy: SUBE el mínimo desde ${formatearPeso(peso)} y apunta a ${ejercicio.repMin}–${ejercicio.repMin + 2}.`;
  }
  if (rangoLleno) return `Hoy: repite ${formatearPeso(peso)} buscando el techo con RIR ${ejercicio.rir ?? "1–2"}.`;
  return `Hoy: ${formatearPeso(peso)} · batir ${total} reps totales.`;
}

/** Cuántas sesiones seguidas sin mejorar las reps totales a ese peso. */
function sesionesSinMejorar(historial, peso) {
  const mismas = historial.filter((h) => pesoDeTrabajo(h.series) === peso);
  let cuenta = 0;
  for (let i = 0; i < mismas.length - 1; i++) {
    if (repsTotales(mismas[i].series) > repsTotales(mismas[i + 1].series)) break;
    cuenta++;
  }
  return cuenta;
}

/** "70 kg", "72,5 kg", o "peso corporal" si no hay dato. */
export function formatearPeso(kg) {
  if (kg == null) return "peso corporal";
  return `${String(kg).replace(".", ",")} kg`;
}

/** "70 kg · 10/10/9 · RIR 2" — la línea de referencia antes de la primera serie (§9). */
export function resumirSesion(series) {
  if (!series?.length) return null;
  const peso = formatearPeso(pesoDeTrabajo(series));
  const reps = series.map((s) => s.reps ?? "–").join("/");
  const rires = series.map((s) => s.rir).filter((r) => r != null);
  const rir = rires.length ? ` · RIR ${Math.min(...rires)}` : "";
  return `${peso} · ${reps}${rir}`;
}
