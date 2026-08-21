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
 */
export function veredicto(ejercicio, historial) {
  const ultima = historial[0];
  if (!ultima) {
    return { ...ESTADOS.LLENA, motivo: "Primera vez: busca un peso que te deje en RIR 2." };
  }

  const series = ultima.series;
  const peso = pesoDeTrabajo(series);
  const rangoLleno = series.every((s) => (s.reps ?? 0) >= ejercicio.repMax);
  // RIR sin dato no cuenta como esfuerzo suficiente: mejor no subir a ciegas.
  const esfuerzoCorrecto = series.every((s) => s.rir != null && s.rir >= 1);

  if (rangoLleno && esfuerzoCorrecto) {
    return {
      ...ESTADOS.SUBE,
      motivo: `Rango lleno a ${formatearPeso(peso)}. Sube el incremento más pequeño.`,
    };
  }

  if (rangoLleno) {
    return {
      ...ESTADOS.SUBE,
      motivo: "Rango lleno. Si el RIR fue el correcto, sube peso.",
    };
  }

  // Comparación con la última sesión al MISMO peso: cambiar de peso y de
  // repeticiones a la vez no dice nada útil.
  const previa = historial.slice(1).find((h) => pesoDeTrabajo(h.series) === peso);
  if (previa) {
    const ahora = repsTotales(series);
    const antes = repsTotales(previa.series);

    if (ahora > antes) {
      return { ...ESTADOS.MANTEN, motivo: `+${ahora - antes} reps respecto a la vez anterior.` };
    }
    if (ahora < antes) {
      const estancado = sesionesSinMejorar(historial, peso) >= 3;
      return estancado
        ? { ...ESTADOS.REVISAR, motivo: "Tres sesiones sin mejorar. Revisa descanso, sueño o técnica." }
        : { ...ESTADOS.MANTEN, motivo: "Día flojo. Repite el mismo peso." };
    }
    if (sesionesSinMejorar(historial, peso) >= 3) {
      return { ...ESTADOS.REVISAR, motivo: "Tres sesiones clavado en las mismas reps." };
    }
  }

  return {
    ...ESTADOS.LLENA,
    motivo: `Sigue a ${formatearPeso(peso)} hasta llegar a ${ejercicio.repMax} en todas las series.`,
  };
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
