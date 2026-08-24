/*
 * Informe de revisión (§53).
 *
 * Genera un Markdown con todo lo que ha pasado en un periodo, listo para
 * pegárselo a un entrenador o a una IA y que te ajusten el plan. Es la función
 * que cierra el círculo: la app registra, y esto convierte el registro en algo
 * que otra persona puede leer y usar.
 *
 * Es una función PURA: recibe los datos ya leídos y devuelve texto. Así se
 * puede probar sin base de datos, y probarla importa — un informe con números
 * mal es peor que no tener informe.
 */

import { NOMBRES_FASE, bloque as bloquePorNumero } from "../datos/planCarrera.js";
import { objetivosDe } from "../datos/planNutricion.js";
import { nombreDe } from "../datos/rutinas.js";
import { diasEntre, fechaCorta, hoyISO, sumarDias } from "./fechas.js";
import { formatear as formatearPeso, media } from "./peso.js";
import { porSesion, veredicto } from "./progresion.js";
import { adherenciaFuerza, volumenPorMusculo } from "./volumen.js";

export const PERIODOS = [
  { dias: 7, texto: "7 días" },
  { dias: 14, texto: "14 días" },
  { dias: 30, texto: "30 días" },
];

/**
 * Construye el informe.
 *
 * `datos` trae las tablas ya leídas: pesos, mediciones, sesiones, series,
 * ejercicios, carreras, postura, testsPared, diario, estados y ajustes.
 */
export function generarInforme(datos, { dias = 14, hasta = hoyISO() } = {}) {
  const desde = sumarDias(hasta, -dias + 1);
  const dentro = (fecha) => fecha >= desde && fecha <= hasta;

  const lineas = [];
  const escribir = (...textos) => lineas.push(...textos);

  escribir(
    `# FORJA · Revisión de ${dias} días`,
    "",
    `**Periodo:** ${fechaCorta(desde)} → ${fechaCorta(hasta)}`,
    "",
  );

  escribir(...seccionResumen(datos, { desde, hasta, dentro }));
  escribir(...seccionFuerza(datos, { desde, hasta, dentro, dias }));
  escribir(...seccionCarrera(datos, { dentro }));
  escribir(...seccionPostura(datos, { dentro, dias }));
  escribir(...seccionCuerpo(datos, { dentro }));
  escribir(...seccionNotas(datos, { dentro }));

  return lineas.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/* ------------------------------------------------------------------ */

function seccionResumen({ pesos, estadoCarrera, estadoFuerza, ajustes }, { hasta }) {
  const objetivos = objetivosDe(hasta, ajustes ?? {});
  const bloque = bloquePorNumero(estadoCarrera?.bloque ?? 1);
  const actual = pesos.filter((p) => p.fecha <= hasta).at(-1) ?? null;

  return [
    "## Resumen",
    "",
    `- **Peso actual:** ${actual ? `${formatearPeso(actual.kg)} kg (${fechaCorta(actual.fecha)})` : "sin datos"}`,
    `- **Media 7 días:** ${formatearPeso(media(pesos, 7, hasta))} kg`,
    `- **Fase nutricional:** ${objetivos.nombre} · ${objetivos.kcal} kcal · ${objetivos.p}P/${objetivos.hc}HC/${objetivos.g}G`,
    `- **Bloque de carrera:** ${estadoCarrera?.bloque ?? 1} (fase ${bloque?.fase} · ${NOMBRES_FASE[bloque?.fase] ?? "—"}), sesión ${estadoCarrera?.sesion ?? 1} de ${bloque?.sesiones.length ?? "—"}`,
    `- **Próxima fuerza:** ${nombreDe(["torso-a", "pierna-a", "torso-b", "pierna-b"][estadoFuerza?.indiceSiguiente ?? 0])}`,
    "",
  ];
}

function seccionFuerza({ sesiones, series, ejercicios }, { dentro, dias }) {
  const completadas = sesiones.filter((s) => s.estado === "completada");
  const delPeriodo = completadas.filter((s) => dentro(s.fecha));
  const adherencia = adherenciaFuerza(completadas, dias, Math.round((dias / 7) * 3));

  const lineas = [
    "## Fuerza",
    "",
    `**Sesiones en el periodo:** ${delPeriodo.length} (objetivo ~${adherencia.objetivo})`,
    "",
  ];

  if (!delPeriodo.length) {
    return [...lineas, "_Sin entrenos registrados en este periodo._", ""];
  }

  /* --- Sesión a sesión, con las series tal cual --- */
  const idsPeriodo = new Set(delPeriodo.map((s) => s.id));
  const porEjercicio = new Map(ejercicios.map((e) => [e.id, e]));

  for (const sesion of [...delPeriodo].sort((a, b) => a.fecha.localeCompare(b.fecha))) {
    lineas.push(
      `### ${fechaCorta(sesion.fecha)} · ${nombreDe(sesion.plantillaId)}` +
        (sesion.duracion ? ` (${Math.round(sesion.duracion / 60)} min)` : ""),
      "",
    );

    const suyas = series.filter((s) => s.sesionId === sesion.id && s.hecha);
    const agrupadas = new Map();
    for (const serie of suyas) {
      if (!agrupadas.has(serie.ejercicioId)) agrupadas.set(serie.ejercicioId, []);
      agrupadas.get(serie.ejercicioId).push(serie);
    }

    for (const [ejercicioId, lista] of agrupadas) {
      const nombre = porEjercicio.get(ejercicioId)?.nombre ?? ejercicioId;
      const detalle = lista
        .sort((a, b) => a.numeroSerie - b.numeroSerie)
        .map((s) => `${s.kg ?? "—"}×${s.reps ?? "—"}${s.rir != null ? ` (RIR ${s.rir})` : ""}`)
        .join(", ");
      lineas.push(`- **${nombre}:** ${detalle}`);
    }
    lineas.push("");
  }

  /* --- Veredictos y estancamientos --- */
  const veredictos = [];
  for (const ejercicio of ejercicios) {
    const suyas = series.filter((s) => s.ejercicioId === ejercicio.id && s.hecha);
    if (!suyas.length) continue;
    if (!suyas.some((s) => idsPeriodo.has(s.sesionId))) continue;
    veredictos.push({ ejercicio, v: veredicto(ejercicio, porSesion(suyas, completadas)) });
  }

  if (veredictos.length) {
    lineas.push("### Progresión por ejercicio", "");
    for (const { ejercicio, v } of veredictos) {
      lineas.push(`- **${ejercicio.nombre}** — ${v.texto}: ${v.motivo}`);
    }
    lineas.push("");

    const estancados = veredictos.filter(({ v }) => v.id === "revisar");
    if (estancados.length) {
      lineas.push(
        "### Estancados",
        "",
        ...estancados.map(({ ejercicio }) => `- ${ejercicio.nombre}`),
        "",
      );
    }
  }

  /* --- Volumen --- */
  const volumen = volumenPorMusculo(completadas, series, ejercicios, dias);
  if (volumen.length) {
    lineas.push(
      `### Volumen por músculo (${dias} días)`,
      "",
      ...volumen.map((m) => `- ${m.musculo}: ${m.series} series`),
      "",
    );
  }

  return lineas;
}

function seccionCarrera({ carreras, estadoCarrera }, { dentro }) {
  const delPeriodo = carreras.filter((c) => dentro(c.fecha));
  const hechas = delPeriodo.filter((c) => c.estado === "completada");
  const omitidas = delPeriodo.filter((c) => c.estado === "omitida");

  const lineas = ["## Carrera", "", `**Sesiones hechas:** ${hechas.length}`];
  if (omitidas.length) lineas.push(`**Omitidas:** ${omitidas.length}`);
  lineas.push("");

  if (!hechas.length) return [...lineas, "_Sin carreras en este periodo._", ""];

  const continuas = hechas.filter((c) => c.km);
  if (continuas.length) {
    const km = continuas.reduce((t, c) => t + c.km, 0);
    lineas.push(
      `**Kilómetros:** ${km.toFixed(1).replace(".", ",")}`,
      `**Tirada más larga:** ${Math.max(...continuas.map((c) => c.km))} km`,
      "",
    );
  }

  lineas.push(
    ...[...hechas]
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((c) => {
        // En CaCo no hay ritmo que enseñar y no se inventa (§51).
        const detalle = c.km
          ? ` · ${String(c.km).replace(".", ",")} km${c.minutos ? ` en ${c.minutos} min` : ""}`
          : "";
        const nota = c.notas ? ` — ${c.notas}` : "";
        return `- ${fechaCorta(c.fecha)} · bloque ${c.bloque}: ${c.descripcion}${detalle}${nota}`;
      }),
    "",
  );

  if (estadoCarrera?.bloquesRepetidos?.length) {
    lineas.push(`**Bloques repetidos:** ${estadoCarrera.bloquesRepetidos.join(", ")}`, "");
  }

  return lineas;
}

function seccionPostura({ postura, testsPared }, { dentro, dias }) {
  const completos = postura.filter((p) => p.completada && dentro(p.fecha));
  const ultimo = testsPared[0] ?? null;
  const anterior = testsPared[1] ?? null;

  const lineas = [
    "## Postura",
    "",
    `**Días completos:** ${completos.length} de ${dias}`,
  ];

  if (ultimo) {
    const cambio = anterior ? ultimo.resultado - anterior.resultado : null;
    lineas.push(
      `**Test de la pared:** ${formatearPeso(ultimo.resultado)} cm (${fechaCorta(ultimo.fecha)})` +
        (cambio != null ? ` · ${cambio > 0 ? "+" : ""}${formatearPeso(cambio)} cm desde el anterior` : ""),
    );
    if (ultimo.notas) lineas.push(`> ${ultimo.notas}`);
  } else {
    lineas.push("**Test de la pared:** sin hacer");
  }

  return [...lineas, ""];
}

function seccionCuerpo({ pesos, mediciones, fotos }, { dentro }) {
  const delPeriodo = pesos.filter((p) => dentro(p.fecha));
  const lineas = ["## Cuerpo", ""];

  if (delPeriodo.length >= 2) {
    const primero = delPeriodo[0];
    const ultimo = delPeriodo.at(-1);
    const dif = ultimo.kg - primero.kg;
    lineas.push(
      `**Peso:** ${formatearPeso(primero.kg)} → ${formatearPeso(ultimo.kg)} kg ` +
        `(${dif > 0 ? "+" : ""}${formatearPeso(dif)} kg en ${diasEntre(primero.fecha, ultimo.fecha)} días)`,
    );
  } else if (delPeriodo.length === 1) {
    lineas.push(`**Peso:** ${formatearPeso(delPeriodo[0].kg)} kg (un solo registro)`);
  } else {
    lineas.push("**Peso:** sin registros en el periodo");
  }

  const cinturas = mediciones.filter((m) => dentro(m.fecha) && m.cintura != null);
  if (cinturas.length) {
    const orden = [...cinturas].sort((a, b) => a.fecha.localeCompare(b.fecha));
    const dif = orden.at(-1).cintura - orden[0].cintura;
    lineas.push(
      `**Cintura:** ${formatearPeso(orden.at(-1).cintura)} cm` +
        (orden.length > 1 ? ` (${dif > 0 ? "+" : ""}${formatearPeso(dif)} cm en el periodo)` : ""),
    );
  }

  const delPeriodoFotos = (fotos ?? []).filter((f) => dentro(f.fecha));
  if (delPeriodoFotos.length) {
    lineas.push(`**Fotos:** ${delPeriodoFotos.length} en el periodo (no se incluyen aquí)`);
  }

  return [...lineas, ""];
}

function seccionNotas({ diario, carreras }, { dentro }) {
  const notas = (diario ?? [])
    .filter((d) => dentro(d.fecha) && d.nota)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  // Las notas de carrera también son notas: separarlas obligaría a leer dos
  // sitios para enterarse de que algo molestaba.
  const deCarrera = carreras
    .filter((c) => dentro(c.fecha) && c.notas && c.estado === "completada")
    .map((c) => ({ fecha: c.fecha, nota: `(carrera) ${c.notas}` }));

  const todas = [...notas, ...deCarrera].sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (!todas.length) return [];

  return ["## Notas", "", ...todas.map((n) => `- **${fechaCorta(n.fecha)}:** ${n.nota}`), ""];
}
