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
    id: "puesta-a-punto",
    nombre: "Puesta a punto",
    rango: "26 agosto – 6 septiembre",
    desde: "2026-08-26",
    hasta: "2026-09-06",
    kcalTexto: "2.150 → 2.500",
    objetivo: "Perder algo de grasa y llegar al 4–5 de septiembre grande, lleno y relativamente definido.",
    detalle: [
      "Se cancela el mini-cut de 1.700: con tan poco hidrato llegarías algo más ligero pero plano, vacío y entrenando peor. Nueva referencia de partida: 96,9 kg (26 de agosto).",
      "Del 26 al 1: déficit moderado de 2.150 kcal con la proteína en 190 g. Del 2 al 5, llenado: 2.300 → 2.500 subiendo solo hidratos, con la recarga y descanso del 3 y los dos días visuales del 4 y 5 a ~2.450. El 6, transición a 2.500 y mediciones: al día siguiente empieza el test. El día a día completo está en HOY y CALENDARIO.",
      "En el gimnasio, rampa de vuelta: hasta el 1 de septiembre ~75–80 % del volumen con RIR 3; después 90–100 % con RIR 2, sin fallo ni récords. La última sesión completa recomendable es el 2; el 3 no hay sesión dura y el 4–5 solo pump corto opcional.",
    ],
  },
  {
    id: "calibracion",
    nombre: "Test de mantenimiento",
    rango: "7 – 20 septiembre",
    desde: "2026-09-07",
    hasta: "2026-09-20",
    kcalTexto: "~2.800 fijas",
    objetivo: "Medir tu mantenimiento REAL en 14 días. El número más importante del año.",
    detalle: [
      "El mantenimiento no se da por sabido. La estimación de ~2.600 queda descartada: con ~12.800 pasos de media (el running YA va dentro de esos pasos) más las sesiones de hipertrofia, la horquilla probable es 2.750–3.000 y el punto de prueba, 2.800.",
      "Que la primera semana de vuelta al entrenamiento saliera casi plana comiendo 2.100–2.150 NO demuestra que eso fuera el mantenimiento: coinciden la vuelta después de tres semanas parado, la recuperación de glucógeno, más agua intramuscular e inflamación. El peso puede estar tapando pérdida de grasa.",
      "Durante 14 días: mismas calorías, misma proteína, pasos parecidos, báscula cada mañana (después del baño, antes de desayunar) y cintura al menos una vez por semana. No se compensa una subida puntual comiendo menos.",
      "Al final se compara la media del 7–13 con la del 14–20. Medias parecidas: el mantenimiento ronda las 2.800. Si la segunda baja, está por encima; si sube, por debajo. FORJA hace la cuenta sola con tus pesos y te propone el número.",
      "Los primeros días la báscula puede subir después de las 2.300–2.500 con hidrato alto: eso es glucógeno, agua, contenido intestinal y sodio, no grasa. Por eso el test dura 14 días y usa medias.",
      "En el gimnasio, desde el 9 de septiembre ya se entrena a volumen completo con el RIR habitual 1–2.",
    ],
  },
  {
    id: "definicion",
    nombre: "Definición",
    rango: "21 septiembre – ~1 noviembre · 6 semanas",
    desde: "2026-09-21",
    hasta: null,
    kcalTexto: "Mantenimiento medido −450/600",
    objetivo: "Bajar grasa a buen ritmo con el músculo y el rendimiento intactos.",
    detalle: [
      "La cifra exacta NO se fija hasta leer el test: definición = mantenimiento medido − 450–600 kcal. Con 2.800 medidas serían ~2.250–2.350; con 2.900, ~2.350–2.450; con 3.000, ~2.450–2.500.",
      "Ritmo objetivo: perder 0,5–0,7 % del peso corporal por semana. Con ~97 kg son unos 0,5–0,7 kg a la semana.",
      "Macros: proteína 180–185 g, grasa 60–70 g y el resto hidratos, que se mantienen relativamente altos para sostener hipertrofia, CaCo, rendimiento y glucógeno.",
      "Ajustes: no tocar nada mientras el peso medio y la cintura bajen a ritmo razonable. −100 kcal solo si durante ~2 semanas ambos siguen planos con buena adherencia y actividad comparable. +100 si la pérdida va demasiado rápida y empeoran rendimiento, recuperación, hambre o fatiga.",
      "Seis semanas previstas (fin aproximado el 1 de noviembre), pero la fecha se mueve según el resultado del test. No hay un peso final obligatorio.",
    ],
  },
  {
    id: "mantenimiento-post",
    nombre: "Mantenimiento",
    rango: "~noviembre · 2–3 semanas",
    desde: null,
    hasta: null,
    manual: true,
    kcalTexto: "Mantenimiento nuevo (recalculado)",
    objetivo: "Estabilizar el peso conseguido, recuperar rendimiento y normalizar el hambre.",
    empiezaCuando: [
      "Terminadas las seis semanas de definición.",
      "Ganas de asentar el resultado antes de decidir el siguiente paso.",
    ],
    detalle: [
      "NO se vuelve automáticamente a las 2.800: el mantenimiento habrá cambiado con el peso corporal, la actividad, el running y la masa muscular. Se recalcula con los datos reales de ese momento.",
      "Proteína 175–180 g, grasas 70–80 g, hidratos el resto.",
      "Objetivos: peso estable, rendimiento recuperándose, hambre normalizada… y disfrutar del físico conseguido.",
    ],
  },
  {
    id: "ganancia",
    nombre: "Ganancia muscular limpia",
    rango: "~diciembre 2026 – marzo 2027",
    desde: null,
    hasta: null,
    manual: true,
    kcalTexto: "Mantenimiento real +100/150",
    objetivo: "Construir músculo con un superávit pequeño, sin volver a taparlo de grasa.",
    empiezaCuando: [
      "El mantenimiento post-definición está asentado.",
      "Peso estable y rendimiento recuperado.",
    ],
    detalle: [
      "La regla es corta: mantenimiento real + 100–150 kcal. Nada de superávits grandes: lo que sobra por encima de eso es grasa, y deshacerla cuesta otra definición.",
      "Proteína 175–180 g, grasas 70–80 g, hidratos el resto.",
      "Velocidad objetivo: 0–0,20 kg/semana DE MEDIA, evaluada en bloques de 4–6 semanas. Una semana suelta no significa nada, y la fase puede ser excelente aunque la báscula suba solo 1–3 kg: lo que se busca es hombro, dorsal, espalda alta y glúteo.",
      "Solo si durante 3–4 semanas el peso está completamente plano, el entreno bien hecho y la progresión parada se añaden +100–150 kcal. La revisión mensual de FORJA aplica exactamente esta regla.",
    ],
  },
  {
    id: "definicion-primavera",
    nombre: "Definición de primavera",
    rango: "~abril – mayo 2027 · si procede",
    desde: null,
    hasta: null,
    manual: true,
    kcalTexto: "Mantenimiento del momento −400/500",
    objetivo: "Un cut corto para llegar al verano definido, solo si hace falta.",
    empiezaCuando: [
      "Varios meses buenos de ganancia a la espalda.",
      "La cintura sube y las fotos dicen que te estás tapando.",
      "Si sigues relativamente definido, esta fase NO se hace: se continúa creciendo.",
    ],
    detalle: [
      "No entra por calendario: la decisión depende de cintura, fotos, peso, nivel de definición y grasa acumulada.",
      "Mantenimiento de ese momento − 400–500 kcal. Proteína 180–185 g, grasas 65–75 g, hidratos el resto.",
      "El entrenamiento NO cambia a poco peso y muchas repeticiones: mismos ejercicios, misma intensidad, mismo RIR. El running ya cuenta como cardio: no se añade HIIT ni cardio interminable.",
      "Si el cut se hace largo y aparecen fatiga alta, hambre persistente y rendimiento deteriorado: diet break de 7–14 días alrededor de mantenimiento, sin convertirlo en atracones.",
    ],
  },
  {
    id: "mantenimiento-verano",
    nombre: "Mantenimiento de verano",
    rango: "~junio – agosto 2027",
    desde: null,
    hasta: null,
    manual: true,
    kcalTexto: "Mantenimiento real del momento",
    objetivo: "Pasar el verano definido, entrenando fuerte y sin ciclos agresivos.",
    empiezaCuando: [
      "Terminado el cut de primavera, o llegado el verano ya en un buen punto.",
    ],
    detalle: [
      "Mantenimiento real de ese momento, otra vez recalculado con datos reales, no con la cifra de un año antes.",
      "Proteína 175–180 g, grasas 70–80 g, hidratos el resto.",
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
    const orden = ["mantenimiento-post", "ganancia", "definicion-primavera", "mantenimiento-verano"];
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
