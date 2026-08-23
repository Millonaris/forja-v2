/*
 * Rutina postural (§17 y §26 de la spec). 8–10 min, todos los días.
 *
 * Cada ejercicio lleva UNA instrucción y UN error, no un párrafo: en vivo hay
 * que poder leerlo de un vistazo mientras lo haces (§35).
 */

/** La frase que resume la postura de pie. Se repite en Plan y en vivo. */
export const FRASE = "Rodillas suaves → costillas sobre pelvis → cuello largo.";

export const EJERCICIOS = [
  {
    id: "basculacion",
    nombre: "Basculación pélvica",
    dosis: "1×8",
    // Solo las primeras 4 semanas (§26): después el patrón ya está aprendido.
    soloPrimerasSemanas: 4,
    instruccion: "Tumbado, lleva la pelvis hacia atrás y pega la zona lumbar al suelo.",
    error: "Empujar con las piernas en vez de mover la pelvis.",
  },
  {
    id: "extension-toracica",
    nombre: "Extensión torácica",
    dosis: "1×8",
    instruccion: "Sobre el rodillo a la altura de las costillas, abre el pecho hacia atrás.",
    error: "Arquear la lumbar en lugar de la zona alta de la espalda.",
  },
  {
    id: "chin-tuck",
    nombre: "Chin tuck",
    dosis: "2×8 · 5 s",
    segundos: 5,
    instruccion: "Lleva la cabeza hacia atrás, como haciendo papada, y aguanta.",
    error: "Bajar la barbilla hacia el pecho en vez de llevar la cabeza atrás.",
  },
  {
    id: "wall-slide",
    nombre: "Wall slide",
    dosis: "2×8–10",
    instruccion: "Antebrazos en la pared, sube los brazos sin despegarlos.",
    error: "Separar las costillas de la pared para llegar más arriba.",
  },
  {
    id: "cobra",
    nombre: "Cobra baja",
    dosis: "2×20–30 s",
    segundos: 25,
    instruccion: "Boca abajo, despega el pecho poco a poco con los glúteos activos.",
    error: "Tirar del cuello hacia arriba para ganar altura.",
  },
  {
    id: "stacking",
    nombre: "Stacking",
    dosis: "3×20 s",
    segundos: 20,
    instruccion: FRASE,
    error: "Sacar pecho y meter lumbar creyendo que eso es buena postura.",
  },
];

/** Extras: no son de todos los días y no cuentan para el 0/6 (§26). */
export const EXTRAS = [
  { nombre: "Estiramiento de pectoral", dosis: "30 s/lado", cuando: "3 veces por semana" },
  { nombre: "Flexor de cadera", dosis: "30 s/lado", cuando: "solo si notas tirantez" },
  { nombre: "Mini-reset de pie", dosis: "10 s", cuando: "3–5 veces al día" },
];

/*
 * Core, en casa (§14 de la rutina del 23 de agosto).
 *
 * Sale del gimnasio a propósito: mantenía las sesiones de pierna por encima de
 * la hora sin aportar a las prioridades del plan (glúteo y hombro). Aquí son
 * 8–12 minutos, dos días por semana, y encajan justo después de la postura.
 */
export const CORE_CASA = {
  titulo: "Core en casa",
  frecuencia: "2 días por semana",
  duracion: "8–12 min",
  descanso: "45–60 s cuando haga falta",
  cuando: "Va bien justo después de la rutina postural.",
  ejercicios: [
    {
      id: "dead-bug",
      nombre: "Dead bug",
      dosis: "2×8–10/lado",
      instruccion: "Lumbar pegada al suelo; baja brazo y pierna contrarios sin despegarla.",
      error: "Arquear la lumbar al estirar la pierna.",
    },
    {
      id: "plancha-lateral",
      nombre: "Plancha lateral",
      dosis: "2×20–30 s/lado",
      instruccion: "Cadera alta y alineada, hombro justo encima del codo.",
      error: "Dejar caer la cadera o rotar el pecho hacia el suelo.",
    },
    {
      id: "pallof",
      nombre: "Pallof press con goma",
      dosis: "2×10–12/lado",
      instruccion: "Goma al costado: estira los brazos al frente sin dejar que te gire el torso.",
      error: "Girar con la goma en vez de resistirla.",
    },
  ],
};

/** Recordatorios sugeridos, no obligaciones atadas a un lunes (§26). */
export const SEGUIMIENTO = [
  { id: "test-pared", titulo: "Test de la pared", cada: 42 },
  { id: "foto", titulo: "Foto comparable", cada: 14 },
];

/**
 * Los ejercicios del día. `diasDesdeInicio` decide si toca la basculación
 * pélvica, que solo va las primeras semanas.
 */
export function ejerciciosDeHoy(diasDesdeInicio = 0) {
  return EJERCICIOS.filter(
    (e) => !e.soloPrimerasSemanas || diasDesdeInicio < e.soloPrimerasSemanas * 7,
  );
}
