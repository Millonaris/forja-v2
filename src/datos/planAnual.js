/*
 * El plan del año contado como fases, según el SOURCE OF TRUTH v3 de DIETA
 * (docs/dieta-v3-source-of-truth.md, §8 y §57).
 *
 * Esto es CONTENIDO, no motor: las kcal vigentes viven en `ajustes` y las
 * calcula `planNutricion.js`. Aquí está lo que Jose lee en la vista AÑO: qué
 * es cada fase, por qué existe, cuándo se entra y cuándo se sale.
 *
 * Ninguna fase entra sola por fecha. Ni una. "Las fases terminan por datos +
 * criterios, no solo por calendario": FORJA enseña los criterios de salida y
 * la decisión la confirma Jose. Lo único con fecha en todo el módulo es el
 * arranque del cut (2 de septiembre) y su semana de adaptación.
 */

import { ORDEN_FASES } from "./planNutricion.js";

export const TEMPORADAS = [
  {
    id: "cut",
    nombre: "Definición",
    rango: "Desde el 2 de septiembre · hasta ~14 semanas",
    kcalTexto: "Arranque 2.400 kcal",
    objetivo: "Perder grasa, conservar el máximo músculo y recuperar el rendimiento de antes de vacaciones.",
    empiezaCuando: ["Ya está en marcha desde el 2 de septiembre de 2026."],
    detalle: [
      "2.400 kcal con 185 P / 246 C / 75 G. No es la cifra perfecta, es un punto razonable para empezar a observar: si tu gasto real fuese 2.900, el déficit sería de 500; si fuese 2.700, de 300; si fuese 3.000, de 600. Los tres son razonables.",
      "Ritmo objetivo: 0,5–0,7 % del peso a la semana (~0,5–0,65 kg con 97 kg). Se acepta menos si la cintura y las fotos mejoran y el gimnasio aguanta. Ganar algo de músculo puede pasar, pero no se promete durante un déficit.",
      "Del 2 al 8 de septiembre es ADAPTACIÓN: vienes de 2.100–2.150 y el peso puede subir 0,3–0,8 kg por hidratos, glucógeno, agua y contenido intestinal. Esos días no se evalúan y no se toca nada.",
      "Mismas calorías todos los días, entrenes pierna, torso, corras o descanses. Los hidratos se pueden mover entre comidas; el total no.",
      "Bloques orientativos: adaptación (2–8 sep), bloque 1 (9–29 sep), bloque 2 (30 sep–20 oct), bloque 3 (21 oct–10 nov) y un bloque 4 opcional (11 nov–1 dic). Tope ~14 semanas, sin ninguna obligación de agotarlo.",
      "Se cierra por lo primero que llegue: te ves suficientemente definido y la cintura ha bajado claro; la recuperación se deteriora dos semanas seguidas; se cumplen las ~14 semanas; o el peso se para en la zona de 2.150 kcal, donde FORJA para en vez de seguir bajando.",
    ],
  },
  {
    id: "mantenimiento",
    nombre: "Mantenimiento post-cut",
    rango: "2–3 semanas o más",
    kcalTexto: "El último TDEE deducido válido",
    objetivo: "Estabilizar el peso nuevo, recuperar hambre y energía, y CONFIRMAR tu gasto real.",
    empiezaCuando: [
      "El cut se ha cerrado por cualquiera de sus criterios de salida.",
      "Hay un TDEE deducido válido con el que arrancar.",
    ],
    detalle: [
      "Se entra en el último TDEE deducido válido, redondeado a 50. NO se le restan 100 kcal: ese número ya se calculó con tu peso y tu actividad del final del cut, así que restarle algo sería inventarse un ajuste.",
      "Si el salto desde las kcal del cut pasa de ~400, se puede hacer en dos pasos durante una semana. Solo para reducir el ruido de agua y glucógeno, no porque subir a mantenimiento engorde.",
      "Primera semana: ADAPTACIÓN. El peso puede subir 0,5–1 kg por glucógeno, agua y contenido intestinal. No se etiqueta como grasa y no se evalúa.",
      "Después hacen falta ~14 días más. Confirmación fuerte: tendencia dentro de ±0,10 kg/semana con la cintura estable. Provisional: hasta ±0,20. No perseguimos falsa precisión.",
      "Si sigues perdiendo claramente, +100 kcal. Si subes claramente y la cintura sube, −100.",
      "Macros: ~175 g de proteína, ~80 g de grasa, el resto hidratos.",
    ],
  },
  {
    id: "ganancia",
    nombre: "Ganancia muscular limpia",
    rango: "Meses. Es la fase larga del año",
    kcalTexto: "Mantenimiento confirmado +150–200",
    objetivo: "Construir músculo —hombros, dorsales, espalda y glúteos— con el mínimo de grasa innecesaria.",
    empiezaCuando: [
      "Existe un mantenimiento CONFIRMADO. Sin ese número, la fase no arranca.",
      "El peso está estable y el hambre y la energía se han normalizado.",
    ],
    detalle: [
      "Se empieza en mantenimiento confirmado + 150–200 kcal. Con 2.750 confirmadas, 2.900–2.950. No 3.400: meter 700 kcal extra no hace cuatro veces más músculo, solo mucha más grasa que después habría que quitar durante meses.",
      "Objetivo: 0,25–0,45 kg AL MES, no por semana. En seis meses, 1,5–2,5 kg de subida total sería razonable.",
      "Si el peso apenas sube pero la fuerza progresa y la cintura está quieta, NO se añaden calorías: eso probablemente es recomposición y es justo lo que se busca.",
      "Revisión cada 4 semanas. Demasiado rápido (>0,6 kg/mes o cintura >1 cm/mes): −100 kcal. Demasiado lento se juzga con ~8 semanas de peso plano y fuerza estancada: +100 kcal. Nunca por un solo mes.",
      "Si la cintura sube 2 cm desde el inicio de la fase: volver 2–3 semanas a mantenimiento y reevaluar. NO se empieza un mini-cut automáticamente.",
      "Según crezca el running, el mantenimiento cambia: no se congela para siempre el número confirmado meses antes. Tiradas de 75–120 min pueden llevar +30–50 g de hidratos ese día; por encima de 90 min, 30–60 g/hora durante la sesión. Es disponibilidad de carbohidrato, no devolver calorías quemadas.",
      "Macros: ~175 g de proteína, ~80–85 g de grasa, el resto hidratos.",
    ],
  },
  {
    id: "verano",
    nombre: "Verano · mini-cut si hace falta",
    rango: "Verano 2027",
    kcalTexto: "Mantenimiento, o −400/500 si procede",
    objetivo: "Llegar al verano bien, sin ciclos agresivos ni decisiones de calendario.",
    empiezaCuando: [
      "Ha terminado la fase larga de ganancia.",
      "Se ha mirado cintura, fotos, peso, definición y rendimiento. No porque sea junio.",
    ],
    detalle: [
      "Si te sigues viendo suficientemente definido: mantenimiento y a seguir.",
      "Si has acumulado más grasa de la que quieres: mini-cut de 4–6 semanas a mantenimiento actual − 400–500 kcal, con la proteína en 180–185 g.",
      "Después, revisión anual: qué ha funcionado, cuánto músculo hay de verdad y qué toca el año siguiente.",
      "El objetivo del año nunca fue un número de báscula: menos grasa, más músculo, mejor rendimiento y un sistema sostenible que aprende de ti.",
    ],
  },
];

/**
 * El estado de una fase: pasada, actual o futura.
 *
 * Ya no hay fechas que comparar: manda el orden del año y en qué fase estás.
 */
export function estadoTemporada(temporada, _hoy, ajustes = {}) {
  const actual = ajustes.faseNutricion ?? "cut";
  if (temporada.id === actual) return "actual";
  const orden = ORDEN_FASES;
  return orden.indexOf(temporada.id) < orden.indexOf(actual) ? "pasada" : "futura";
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
    titulo: "Diet break (opcional, en definición)",
    resumen: "5–7 días alrededor del mantenimiento deducido.",
    puntos: [
      "Cuándo: la adherencia empeora, el hambre y la fatiga son altas, el cut se alarga, o simplemente encaja socialmente.",
      "Cómo: 5–7 días comiendo alrededor del TDEE deducido. NO son atracones ni días libres.",
      "Objetivo: descanso práctico y mental. No es un \"reset metabólico\": eso no existe.",
      "Después se retoma el déficit donde estaba, si todavía tiene sentido.",
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
    titulo: "Día visual puntual (evento, playa, foto)",
    resumen: "Cómo verte bien un día concreto sin trucos absurdos.",
    puntos: [
      "24 h antes: agua normal, sal normal, comidas conocidas, hidratos suficientes. Evitar atracones, alcohol y lo que a ti te hincha.",
      "Pump opcional 1–3 h antes: laterales 2–3×15–20, jalón o pullover 2×12–15, press ligero 2×12–15, curl y tríceps 1–2×12–15. RIR 2–3, sin agotarse.",
      "Nunca: deshidratarse, sauna para pesar menos, quitar el sodio, laxantes ni ayunos extremos.",
      "Esto es una herramienta suelta, no una fase: no cambia el objetivo del día ni interrumpe la definición.",
    ],
  },
  {
    id: "comida-libre",
    titulo: "Comida libre y cómo NO compensarla",
    resumen: "No existe la comida gratis, pero tampoco el castigo.",
    puntos: [
      "Si el objetivo son 2.400, la semana son 16.800 kcal. Un sábado de 3.000 son +600 sobre el objetivo semanal: ni destruyen la semana ni desaparecen.",
      "Opción A: no compensar. Esa semana pierdes algo menos y ya está.",
      "Opción B: repartir suave, por ejemplo −100 kcal durante 6 días.",
      "Nunca: ayuno al día siguiente, entreno de castigo ni fingir que esas calorías no existieron.",
      "El alcohol cuenta como kcal, y además empeora sueño, recuperación y adherencia.",
    ],
  },
  {
    id: "registro",
    titulo: "Registrar bien (antes de culpar al metabolismo)",
    resumen: "Lo que más se escapa en Fitia.",
    puntos: [
      "Aceite: 10 g son ~90 kcal. Poner 30 pensando que son 10 son ~180 kcal de diferencia CADA día.",
      "Salsas, frutos secos, picoteos y bebidas: lo que menos se apunta y más pesa.",
      "Crudo o cocinado no es lo mismo: elige un criterio y mantenlo.",
      "Si no hay progreso, primero se audita el registro. No es una acusación: es que sin datos limpios cualquier ajuste sería a ciegas.",
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
