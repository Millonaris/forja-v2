/*
 * El plan maestro anual (23 ago 2026 → ago 2027) contado como temporadas.
 *
 * Esto es CONTENIDO, no motor: las kcal reales de cada fase viven en
 * planNutricion.js y en los ajustes. Aquí está lo que Jose lee en la vista
 * AÑO: qué es cada temporada, por qué existe, sus reglas y cuándo cambiar.
 *
 * Las fechas posteriores a septiembre son orientativas a propósito: el plan
 * maestro dice "los datos reales mandan sobre el calendario". Por eso las
 * temporadas manuales no entran solas: las confirma Jose desde su ficha.
 */

export const TEMPORADAS = [
  {
    id: "preparacion",
    nombre: "Preparación",
    rango: "23 – 25 agosto",
    desde: "2026-08-23",
    hasta: "2026-08-25",
    kcalTexto: "Comer normal",
    objetivo: "Volver a la estructura después de vacaciones.",
    detalle: [
      "Normalizar comidas, hidratación y sueño. Preparar alimentos, volver a registrar el peso y tener FORJA y Fitia listos.",
      "No compensar las vacaciones con cardio o hambre extrema. Los cambios rápidos de peso de estos días son agua, glucógeno, sodio y contenido intestinal: no interpretarlos todavía como grasa.",
    ],
  },
  {
    id: "mini-cut",
    nombre: "Mini-cut",
    rango: "26 agosto – 8 septiembre",
    desde: "2026-08-26",
    hasta: "2026-09-08",
    kcalTexto: "1.700 → 1.850",
    objetivo: "Bajar algo de grasa y retención en dos semanas, con recarga y día visual.",
    detalle: [
      "Fase corta y deliberadamente dura: no se pretende mantener estas calorías durante meses.",
      "Incluye la recarga controlada del 3 (2.200 kcal de hidratos conocidos) y el día visual del 4 (2.050 kcal). El día a día completo está en las pestañas HOY y CALENDARIO.",
      "En el gimnasio, rampa de vuelta: hasta el 1 de septiembre ~75–80 % del volumen con RIR 3; del 2 al 8, 90–100 % con RIR 2. Nada de fallo ni de récords.",
    ],
  },
  {
    id: "calibracion",
    nombre: "Calibración",
    rango: "9 – 22 septiembre",
    desde: "2026-09-09",
    hasta: "2026-09-22",
    kcalTexto: "2.600 fijas",
    objetivo: "Descubrir tu mantenimiento REAL en 14 días. El número más importante del año.",
    detalle: [
      "El mantenimiento no se da por sabido: 2.600 kcal es una hipótesis, no una verdad. Durante 14 días se come prácticamente lo mismo cada día, se registra con precisión en Fitia y te pesas todas las mañanas (después del baño, antes de desayunar).",
      "Al final se compara la media de peso de los días 1–7 con la de los días 8–14. Si el peso está estable, 2.600 ES tu mantenimiento. Si sube o baja con claridad, se corrige. FORJA hace la cuenta sola con tus pesos y te propone el número.",
      "No hace falta precisión de 20 kcal: hace falta un valor suficientemente bueno para tomar decisiones. Si la tendencia no queda clara, se amplía una semana.",
      "Desde el 9 de septiembre se entrena ya a volumen completo con el RIR habitual 1–2.",
    ],
  },
  {
    id: "hipertrofia",
    nombre: "Hipertrofia",
    rango: "23 septiembre – ~enero",
    desde: "2026-09-23",
    hasta: null,
    kcalTexto: "Mantenimiento real, +100–150 solo si hace falta",
    objetivo: "La gran fase del año: 4–5 meses construyendo músculo con la grasa controlada.",
    detalle: [
      "Se empieza comiendo el mantenimiento real. Si con eso suben cargas, repeticiones y medidas con la cintura estable, no hay obligación de añadir calorías: todavía puede haber recomposición.",
      "Solo si durante 3–4 semanas el peso está completamente plano, el entreno bien hecho y la progresión parada, se añaden +100–150 kcal. Y no se vuelve a subir hasta observar otras 3–4 semanas. La revisión mensual de FORJA aplica exactamente esta regla.",
      "Velocidad objetivo: 0–0,20 kg/semana DE MEDIA, evaluada en bloques de 4–6 semanas. Una semana suelta no significa nada.",
      "Macros: 185–195 g de proteína, 70–80 g de grasa, el resto hidratos. La fase puede ser excelente aunque la báscula solo suba 1–3 kg: lo que se busca es hombro, dorsal, espalda alta y glúteo.",
    ],
  },
  {
    id: "definicion",
    nombre: "Definición",
    rango: "~febrero – mayo 2027",
    desde: null,
    hasta: null,
    manual: true,
    kcalTexto: "Mantenimiento −400/500, ajustando",
    objetivo: "Hacer visible el músculo construido, perdiendo grasa despacio y sin destruirte.",
    empiezaCuando: [
      "Varios meses buenos de hipertrofia a la espalda.",
      "Aumento claro de fuerza y de medidas.",
      "La cintura empieza a subir demasiado.",
      "Ganas reales de bajar grasa y tiempo para perderla despacio.",
    ],
    detalle: [
      "No es el mini-cut de agosto estirado durante meses: una definición larga tiene que ser sostenible. Se parte del mantenimiento real DE ESE MOMENTO (por eso no se fijan hoy las calorías de febrero) con un déficit moderado.",
      "Ritmo objetivo: perder ~0,5–0,75 % del peso corporal a la semana, y usar el extremo lento a medida que baja la grasa.",
      "Proteína a 195–205 g, grasas 60–75 g, y suficientes hidratos para defender las cargas. El entrenamiento NO cambia a poco peso y muchas repeticiones: mismos ejercicios, misma intensidad, mismo RIR.",
      "El running ya cuenta como cardio: no se añade HIIT ni cardio interminable. Primero se ajusta la comida.",
      "Si el cut se hace largo y aparecen fatiga alta, hambre persistente y rendimiento deteriorado: diet break de 7–14 días alrededor de mantenimiento, sin convertirlo en atracones.",
    ],
  },
  {
    id: "mantenimiento-post",
    nombre: "Mantenimiento",
    rango: "~mayo – junio 2027 · 3–6 semanas",
    desde: null,
    hasta: null,
    manual: true,
    kcalTexto: "Mantenimiento nuevo",
    objetivo: "Estabilizar el peso conseguido, recuperar rendimiento y normalizar el hambre.",
    empiezaCuando: [
      "Nivel de grasa satisfactorio tras la definición.",
      "Ganas de asentar el resultado antes de decidir el siguiente paso.",
    ],
    detalle: [
      "3–6 semanas comiendo alrededor del mantenimiento nuevo (que habrá bajado con el peso).",
      "No hace falta una reverse diet de meses: se sube a una estimación razonable de mantenimiento y se observa 2–3 semanas.",
      "Objetivos: peso estable, rendimiento recuperándose, hambre normalizada… y disfrutar del físico conseguido.",
    ],
  },
  {
    id: "recomp",
    nombre: "Recomposición",
    rango: "hasta agosto 2027",
    desde: null,
    hasta: null,
    manual: true,
    kcalTexto: "Mantenimiento o +100",
    objetivo: "Pasar el año relativamente definido, entrenando fuerte y sin ciclos agresivos.",
    empiezaCuando: [
      "El mantenimiento post-definición está asentado.",
      "Decidido el camino: mantener, recomponer o ganar muy lento.",
    ],
    detalle: [
      "Tres opciones según el espejo: mantener tal cual, recomposición (mismo peso, seguir progresando) o una nueva ganancia MUY lenta con superávit mínimo.",
      "La meta a largo plazo del plan: poder decir \"tengo bastante más músculo que hace un año y ahora se ve\", y tener un sistema sostenible para seguir años.",
    ],
  },
];

/** El estado de una temporada para pintarla: pasada, actual o futura. */
export function estadoTemporada(temporada, hoy, ajustes = {}) {
  const manualActiva = ajustes.faseManual ?? null;

  if (temporada.manual) {
    if (manualActiva === temporada.id) return "actual";
    // Una manual anterior a la activa se da por pasada (definición < mantenimiento < recomp).
    const orden = ["definicion", "mantenimiento-post", "recomp"];
    if (manualActiva && orden.indexOf(temporada.id) < orden.indexOf(manualActiva)) return "pasada";
    return "futura";
  }

  // Con una fase manual activa, todas las de fecha quedan atrás.
  if (manualActiva) return "pasada";
  if (temporada.hasta && hoy > temporada.hasta) return "pasada";
  if (hoy < temporada.desde) return "futura";
  return "actual";
}

/* ------------------------------------------------------------------ */
/* Fichas de referencia                                                */
/*                                                                     */
/* Lo del plan maestro que no es una fase sino una herramienta: se     */
/* consulta cuando toca y no ocupa sitio el resto del tiempo.          */
/* ------------------------------------------------------------------ */

export const FICHAS = [
  {
    id: "progresion",
    titulo: "Cuándo subir peso (doble progresión)",
    resumen: "La regla que usa el entrenador de la app.",
    puntos: [
      "Con un 3×8–12: mismo peso hasta llenar el rango (12/12/12) cumpliendo el RIR; entonces se sube el incremento mínimo y se vuelve a construir (quizá 9/8/8).",
      "No es obligatorio mejorar cada sesión: se evalúa la tendencia de varias exposiciones.",
      "Si la fuerza se estanca, antes de tocar nada revisar por orden: técnica, RIR real, descansos, sueño, running, adherencia y estrés.",
      "Si un grupo prioritario no crece tras 8–12 semanas cumpliendo: añadir 1–2 series por rotación a ESE grupo. Nunca cinco ejercicios nuevos.",
    ],
  },
  {
    id: "deload",
    titulo: "Deload (descarga)",
    resumen: "No va programado: se usa cuando el cuerpo lo pide.",
    puntos: [
      "Señales: fatiga que se acumula, rendimiento cayendo varias sesiones, molestias que no se van, motivación por los suelos.",
      "Cómo: una semana al 50–70 % del volumen, RIR 3–4, mismos movimientos, cargas algo menores si hace falta.",
      "No hace falta cada 4 semanas por calendario. Se usa cuando aparece, y se vuelve a lo normal.",
    ],
  },
  {
    id: "diet-break",
    titulo: "Diet break (solo en definición)",
    resumen: "7–14 días a mantenimiento si el cut largo pasa factura.",
    puntos: [
      "Cuándo: fatiga alta, hambre persistente, rendimiento deteriorado y adherencia cada vez peor.",
      "Cómo: 7–14 días alrededor de mantenimiento. NO son atracones ni días libres.",
      "Después se retoma el déficit donde estaba.",
    ],
  },
  {
    id: "calentamiento",
    titulo: "Calentamiento",
    resumen: "Series de aproximación, no una sesión aparte.",
    puntos: [
      "General: 3–5 min de actividad ligera si ayuda.",
      "Específico: aproximaciones — ligera ×10–12, intermedia ×6–8, cercana ×3–5, y a las series efectivas.",
      "Hack y prensa pueden necesitar alguna aproximación más.",
      "Movilidad de hombro/codo suave y breve. No fatigarse con bandas antes de empezar.",
    ],
  },
  {
    id: "semaforo-correr",
    titulo: "Semáforo de molestias al correr",
    resumen: "Verde sigue, amarillo repite, rojo para.",
    puntos: [
      "VERDE: molestia 0–2/10, transitoria, no cambia la zancada y al día siguiente está normal → continuar.",
      "AMARILLO: localizada, persiste o reaparece → no aumentar; repetir o reducir la sesión.",
      "ROJO: altera la forma de correr, inflamación, dolor al caminar o dolor focal creciente → parar el running y valorar.",
      "Y siempre: la fuerza tiene prioridad. Evitar carrera exigente en las 24 h previas a pierna si se puede.",
    ],
  },
  {
    id: "dia-visual",
    titulo: "Día visual futuro (evento, playa, foto)",
    resumen: "Cómo verte bien un día concreto sin trucos absurdos.",
    puntos: [
      "24 h antes: agua normal, sal normal, comidas conocidas, hidratos suficientes. Evitar atracones, alcohol y lo que a ti te hincha.",
      "Pump opcional 1–3 h antes: laterales 2–3×15–20, jalón o pullover 2×12–15, press ligero 2×12–15, curl y tríceps 1–2×12–15. RIR 2–3, sin agotarse.",
      "Nunca: deshidratarse, sauna para pesar menos, quitar el sodio, laxantes ni ayunos extremos.",
    ],
  },
  {
    id: "tecnicas",
    titulo: "Técnicas avanzadas",
    resumen: "Drop sets, myo-reps, rest-pause… todavía no.",
    puntos: [
      "No forman parte de la base: drop sets, rest-pause, myo-reps, fallo absoluto repetido, repeticiones forzadas.",
      "Podrán usarse en el futuro, pero no son necesarias para maximizar el progreso actual.",
      "\"Darle caña\" significa: cumplir, entrenar cerca del fallo, progresar, comer suficiente, dormir y repetir durante meses.",
    ],
  },
  {
    id: "cambiar-ejercicio",
    titulo: "Cuándo cambiar un ejercicio",
    resumen: "Casi nunca. Estas son las excepciones.",
    puntos: [
      "Solo si: molesta repetidamente, no deja progresar, la máquina encaja mal, desaparece del gimnasio o hay una alternativa claramente superior por adherencia.",
      "No cambiar cada pocas semanas por novedad: la progresión necesita meses en el mismo movimiento.",
      "Cada ejercicio tiene sus alternativas equivalentes en la ficha del entreno (tocando su nombre).",
    ],
  },
];
