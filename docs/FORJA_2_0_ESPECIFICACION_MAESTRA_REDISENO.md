# FORJA 2.0 — ESPECIFICACIÓN MAESTRA DE REDISEÑO, UX, LÓGICA Y MIGRACIÓN

**Fecha:** 21 de agosto de 2026  
**Objetivo:** reconstruir FORJA para que sea mucho más clara, coherente, rápida y flexible, manteniendo todos los datos y planes actuales.  
**Usuario:** una sola persona. App personal, local-first, sin cuentas, sin necesidad de servidor.  

> **Principio central:** FORJA debe decir qué toca después; el usuario decide cuándo hacerlo.

---

# 1. INSTRUCCIÓN PRINCIPAL PARA QUIEN CONSTRUYA LA APP

No hacer otro parche visual encima de la estructura actual.

La app actual contiene muchas funciones útiles, pero la arquitectura está fragmentada y la planificación mezcla dos conceptos que deben quedar separados:

1. **QUÉ TOCA** según la progresión real.
2. **CUÁNDO SE RECOMIENDA HACERLO** según el calendario.

La nueva regla es:

> **El estado real del entrenamiento manda. El calendario solo recomienda.**

La reconstrucción debe:

- conservar todos los datos;
- conservar rutinas y planes;
- conservar el historial;
- conservar temporizadores y registro serie a serie;
- conservar dieta, postura, carrera y peso;
- eliminar duplicados;
- reducir navegación;
- simplificar la pantalla principal;
- convertir el calendario en una agenda sugerida y editable;
- hacer que fuerza y running progresen por sesiones realmente completadas;
- mantener las fases nutricionales vinculadas a fechas reales;
- no destruir ni reinicializar información durante la migración.

---

# 2. QUÉ ES FORJA

FORJA integra cuatro pilares:

1. **Hipertrofia**
2. **Running**
3. **Postura**
4. **Nutrición / composición corporal**

Reparto de responsabilidades:

## Gimnasio
FORJA es la herramienta principal. Debe guiar, registrar y analizar cada sesión.

## Carrera
La carrera se ejecuta con Garmin. FORJA indica la próxima sesión, permite programarla y registra que se ha hecho.

## Postura
FORJA muestra la rutina diaria, la ejecuta con temporizadores y registra cumplimiento/evolución.

## Nutrición y cuerpo
Fitia registra la comida. FORJA muestra objetivos, macros, fases y registra peso/cintura/fotos.

---

# 3. PROBLEMAS DE LA APP ACTUAL

## Demasiadas pestañas
Actualmente: Hoy, Gym, Carrera, Cuerpo, Dieta y Diario.

## Duplicación
La misma información aparece en varias pantallas.

## Acción y consulta mezcladas
Entrenar/correr/pesarse convive con planes largos, reglas y gráficas.

## Calendario demasiado importante
La app trata “miércoles = Pierna A” cuando debería tratar “después de Torso A toca Pierna A”.

## Diario penaliza cambios normales
Mover una sesión puede parecer incumplimiento.

## Textos largos compiten con las acciones
Protocolos y notas deben estar plegados.

## Postura está escondida
Es una tarea diaria y debe estar accesible en primer nivel.

---

# 4. PRINCIPIOS DE FORJA 2.0

1. Abrir la app y saber qué hacer en 2 segundos.
2. El usuario manda sobre el día.
3. Una sola fuente de verdad para cada dato.
4. Acción primero, explicación después.
5. Ningún plan se rompe por perder un día.
6. No mostrar culpa artificial por mover sesiones.
7. Los registros reales mandan sobre las fechas teóricas.

---

# 5. NUEVA NAVEGACIÓN PRINCIPAL

Eliminar las seis pestañas actuales.

Usar solo **4 pestañas**:

1. **HOY**
2. **ENTRENAR**
3. **PROGRESO**
4. **PLAN**

Ajustes se abre desde un icono de engranaje.

## HOY
Acciones y estado inmediato.

## ENTRENAR
Fuerza, carrera y postura.

## PROGRESO
Cuerpo, fuerza, carrera, postura e historial.

## PLAN
Nutrición, fuerza, 0→20 km, postura y agenda recomendada.

---

# 6. PANTALLA HOY

Debe responder:

1. ¿He apuntado el peso?
2. ¿Qué fuerza me toca después?
3. ¿Qué carrera me toca después?
4. ¿He hecho postura?
5. ¿Cuál es mi objetivo nutricional?

## Cabecera

Ejemplo:

> **Viernes, 21 agosto**

Chips pequeños:

> MINI-CUT · RUN S3 · RIR 3

Sin párrafos.

## Peso

Si falta:

> **Peso pendiente** — APUNTAR

Tras guardar:

> 95,4 kg · media 7 d: 95,8 kg

La gráfica completa vive en Progreso.

## Bloque principal

Título:

> **¿Qué quieres hacer hoy?**

Tres acciones:

- **FUERZA** — Próximo: Pierna A
- **CORRER** — Próxima: CaCo 2/2
- **POSTURA** — 0/6 hoy

## Próxima fuerza

Ejemplo:

> **PRÓXIMA FUERZA**  
> Pierna A  
> Último gym: Torso A · hace 2 días  
> Recomendación: hoy

Botones:

- EMPEZAR
- PROGRAMAR
- VER

Nunca decir “hoy toca” como obligación.

## Próxima carrera

Ejemplo:

> **PRÓXIMA CARRERA**  
> 6 × (2 min correr + 2 min caminar)  
> Última carrera: hace 1 día  
> Recomendación: espera hasta mañana

Botones:

- CORRER HOY
- PROGRAMAR
- VER

Si existe poca recuperación, avisar pero no bloquear.

## Postura

> **POSTURA · 0/6 · 8–10 min**

Botón EMPEZAR.

## Nutrición

Franja compacta:

> **1.700 kcal · 195P · 105HC · 55G**

Botón:

> VER PLAN DE HOY

## Estados temporales

Solo una tarjeta contextual cuando proceda:

- día anterior a día visual;
- día visual;
- rampa de vuelta;
- medición;
- foto.

## Eliminar de HOY

- “mañana toca” rígido;
- mapas grandes;
- reglas largas;
- gráficas;
- duplicados;
- avisos grandes de backup.

Sustituir “mañana toca” por:

> **Próxima recomendación**

calculada dinámicamente.

---

# 7. PANTALLA ENTRENAR

Selector:

> FUERZA | CARRERA | POSTURA

---

# 8. ENTRENAR > FUERZA

Arriba:

> **SIGUIENTE: PIERNA A**

Mostrar:

- último entrenamiento;
- días desde último gym;
- rampa vigente;
- RIR objetivo.

Botones:

- EMPEZAR AHORA
- PROGRAMAR
- VER RUTINA

## Rotación

Visual:

> Torso A → Pierna A → Torso B → Pierna B → ↻

Diferenciar:

- último completado;
- actual;
- futuro.

No asociar las cuatro sesiones a días fijos.

## Elegir otra rutina

Debe poder iniciarse una sesión diferente manualmente.

Si no coincide con la secuencia:

> Según la rotación toca Pierna A. ¿Quieres hacer Torso B?

Opciones:

- cancelar;
- hacer sin alterar secuencia;
- hacer y avanzar secuencia.

Nunca decidir en silencio.

---

# 9. ENTRENAMIENTO DE FUERZA EN VIVO

Conservar lo bueno de la app actual.

## Cabecera
- ejercicio X/Y;
- objetivo;
- reps;
- RIR;
- descanso.

## Referencia
Antes de la primera serie:

> Última vez: 70 kg · 10/10/9 · RIR 2

Botón:

> USAR ÚLTIMO PESO

## Registro
Campos grandes:

- kg;
- reps;
- RIR.

Botón:

> GUARDAR SERIE

Después inicia descanso automático.

## RIR
Opciones rápidas:

- 0–1
- 2
- 3+

Mostrar claramente el objetivo vigente.

## Descanso
Temporizador flotante:

- grandes: 2–3 min;
- aislados: 90–120 s.

Permitir:

- +30 s;
- saltar;
- vibración;
- sonido.

## Prioritarios
Mantener ⭐.

Si se intenta saltar:

> Este ejercicio es prioritario.

Permitir saltarlo igualmente.

---

# 10. RAMPA DE VUELTA

NO crear rutina Light separada.

La rutina base es siempre la misma.

La app aplica una capa temporal:

## 26 ago – 1 sep
- ~75–80 % de series;
- RIR ~3.

## 2 – 8 sep
- ~90–100 %;
- RIR 2.

## Desde 9 sep
- 100 %;
- RIR 1–2.

En vivo:

> **Rampa de vuelta · hoy 3 de 4 series**

---

# 11. RESUMEN DE FUERZA

Al terminar mostrar:

- duración;
- series;
- principales mejoras;
- recomendación breve.

Ejemplo:

> Laterales: +2 reps totales  
> Jalón: mantén peso  
> Press: día estable

Detalle completo plegado.

---

# 12. PROGRESIÓN DE FUERZA

Vive en:

> PROGRESO > FUERZA

Por ejercicio:

- última sesión;
- tendencia;
- mejor serie;
- recomendación.

Estados:

- SUBE PESO
- MANTÉN
- LLENA RANGO
- REVISAR

## Volumen muscular

No depender solo de lunes-domingo.

Mostrar:

- últimos 7 días;
- últimos 14 días;
- últimos 4 entrenamientos.

Con calendario flexible esto es mucho más fiable.

---

# 13. ENTRENAR > CARRERA

Mostrar:

> **PRÓXIMA SESIÓN**

Ejemplo:

> Bloque 3 · Sesión 1  
> 6 × (2′ correr + 2′ caminar)

Incluir:

- calentamiento;
- sesión;
- enfriamiento;
- RPE 3–4/10;
- test del habla.

Botones:

- MARCAR HECHA
- PROGRAMAR
- VER PLAN

---

# 14. RUNNING BASADO EN ESTADO, NO EN FECHA

La siguiente carrera depende de:

- fase;
- bloque;
- sesión completada.

No depende de “hoy es jueves”.

## Semana = bloque de entrenamiento

Tratar S3 como:

> **Bloque S3**

No como lunes-domingo obligatorio.

Estados:

- EN CURSO
- COMPLETADO
- REPETIR
- AVANZAR

## Final de bloque

Al completar la última sesión:

> **Bloque completado**

Preguntar:

- fácil/bien;
- justo;
- molestias.

Acciones:

- AVANZAR
- REPETIR
- REVISAR

No avanzar por cambio de semana del calendario.

---

# 15. CARRERA PERDIDA

Puede:

- moverse;
- omitirse;
- mantenerse pendiente.

Nunca se recupera automáticamente pegándola a otra.

Si se omite:

> OMITIDA MANUALMENTE

y preguntar si se continúa con la siguiente o se mantiene/repite el bloque.

## Carreras consecutivas

Evitar dos días seguidos en esta fase.

Implementar como aviso:

> Corriste ayer. Para esta fase es preferible recuperar.

No bloquear.

---

# 16. CONFLICTO FUERZA / RUNNING

Prioridad actual:

> **FUERZA > RUNNING**

Si fuerza se mueve a un día de carrera:

> Hoy tienes carrera programada. Recomendamos mantener Fuerza y mover la carrera.

Opciones:

- mover carrera;
- omitir carrera;
- hacer ambos;
- cancelar.

---

# 17. ENTRENAR > POSTURA

Mostrar:

> **RUTINA DE HOY · 8–10 min**

Lista:

- pelvis;
- extensión torácica;
- chin tuck;
- wall slide;
- cobra;
- stacking.

Botón:

> EMPEZAR

## En vivo

Cada ejercicio:

- nombre;
- dosis;
- instrucción principal;
- error principal.

Ejemplo:

> CHIN TUCK  
> 2×8 · 5 s  
> Cabeza hacia atrás, no barbilla hacia abajo.

Temporizadores cuando proceda.

---

# 18. PANTALLA PROGRESO

Selector:

> CUERPO | FUERZA | CARRERA | POSTURA | HISTORIAL

## Cuerpo
- peso actual;
- media 7 días;
- cambio;
- gráfica 30/90 días;
- cintura;
- fotos.

## Fuerza
- tendencia por ejercicio;
- PRs;
- volumen rolling;
- recomendaciones.

## Carrera
- bloque actual;
- sesiones;
- minutos/km semanales;
- tirada más larga;
- hitos.

## Postura
- cumplimiento;
- test de pared;
- comparativas.

## Historial
Timeline única:

> 21 ago · Peso  
> 20 ago · Carrera  
> 19 ago · Torso A  
> 19 ago · Postura

Filtros por tipo.

---

# 19. ADHERENCIA

Cambiar completamente la lógica.

NO medir:

> “¿Hiciste Pierna A el miércoles?”

Medir:

### Fuerza
Sesiones completadas en ventana móvil.

### Running
Sesiones del bloque completadas.

### Postura
Días realizados.

### Nutrición
No fingir adherencia porque la comida se registra en Fitia.

## Mapa de calor
Si se conserva, mover a:

> Progreso > Historial > Consistencia

Mostrar acciones reales, no citas incumplidas.

---

# 20. PANTALLA PLAN

Solo consulta.

Secciones:

1. Nutrición
2. Fuerza
3. Carrera 0→20k
4. Postura
5. Agenda recomendada

---

# 21. PLAN > NUTRICIÓN

## Fase actual

Ejemplo:

> Mini-cut fuerte  
> 1.700 kcal  
> 195P · 105HC · 55G

## Macros por comida

### Mini-cut fuerte

| Comida | P | HC | G |
|---|---:|---:|---:|
| 09:00 Desayuno | 45 | 40 | 15 |
| 13:00 Comida post | 55 | 45 | 10 |
| 17:30 Merienda | 40 | 10 | 10 |
| 21:00 Cena | 55 | 10 | 20 |
| **Total** | **195** | **105** | **55** |

### Mini-cut moderado

| Comida | P | HC | G |
|---|---:|---:|---:|
| Desayuno | 45 | 45 | 15 |
| Comida post | 55 | 60 | 10 |
| Merienda | 40 | 10 | 10 |
| Cena | 55 | 15 | 25 |
| **Total** | **195** | **130** | **60** |

### Mantenimiento

| Comida | P | HC | G |
|---|---:|---:|---:|
| Desayuno | 45 | 70 | 15 |
| Comida post | 55 | 100 | 15 |
| Merienda | 40 | 35 | 10 |
| Cena | 45 | 53 | 30 |
| **Total** | **185** | **258** | **70** |

### Volumen ~2.500

| Comida | P | HC | G |
|---|---:|---:|---:|
| Desayuno | 45 | 75 | 15 |
| Comida post | 55 | 110 | 15 |
| Merienda | 40 | 40 | 10 |
| Cena | 45 | 58 | 30 |
| **Total** | **185** | **283** | **70** |

### Volumen ~2.550

| Comida | P | HC | G |
|---|---:|---:|---:|
| Desayuno | 45 | 80 | 15 |
| Comida post | 55 | 115 | 15 |
| Merienda | 40 | 40 | 10 |
| Cena | 45 | 60 | 30 |
| **Total** | **185** | **295** | **70** |

---

# 22. FASES NUTRICIONALES

| Fase | Fechas | kcal | P/HC/G |
|---|---|---:|---|
| Mini-cut fuerte | 26 ago – 1 sep | ~1700 | 195/105/55 |
| Mini-cut moderado | 2 – 8 sep | ~1850 | 195/130/60 |
| Mantenimiento | 9 – 15 sep | ~2400 | 185/258/70 |
| Volumen limpio | desde 16 sep | ~2500–2550 | 185/283–295/70 |

**Estas fases sí dependen de la fecha.**

Mover un entrenamiento no desplaza nutrición.

Reglas plegadas:

- creatina 5 g/día;
- agua normal;
- sal normal;
- sin deshidratación;
- media 7 días;
- cintura/fotos;
- ajustes de volumen en bloques de ±100 kcal.

---

# 23. DÍAS VISUALES

No mostrar solo “Día visual”.

Mostrar instrucciones útiles.

## Día anterior
- mantener kcal/macros;
- agua y sal normales;
- evitar atracón/alcohol;
- evitar alimentos que hinchen personalmente;
- cena moderada;
- entrenar según plan sin fallo.

## Día visual
- mantener kcal;
- no cortar agua;
- no quitar sal;
- reservar 20–30 g HC del total para antes del pump si interesa;
- pump 10–15 min opcional;
- evitar CaCo antes del momento importante.

## Con calendario flexible

No asumir que el 4 de septiembre siempre toca Torso A.

Si el siguiente entrenamiento real es torso y se quiere hacer:

> usarlo como sesión/pump.

Si toca pierna o no se quiere entrenar:

> ofrecer pump corto separado.

### Pump
- laterales 2–3×15–20;
- jalón/pullover 2×12–15;
- press/flexiones 2×12–15;
- bíceps 1–2×12–15;
- tríceps 1–2×12–15;
- RIR 2–3;
- sin fallo.

---

# 24. PLAN > FUERZA

La ejecución vive en Entrenar. Aquí solo referencia.

## Torso A
1. Jalón al pecho — 3×8–12
2. ⭐ Elevaciones laterales — 4×12–20
3. Press inclinado — 3×8–12
4. Remo pecho apoyado — 3×8–12
5. Press hombro — 2×8–12
6. ⭐ Reverse pec deck — 2×12–20
7. Curl — 2×10–15
8. Tríceps polea — 2×10–15

## Pierna A
Preservar el contenido actual existente:
1. Hack squat — 3×8–12
2. Prensa — 2×10–15
3. Curl femoral — 3×10–15
4. Extensión cuádriceps — 2×10–15
5. Hip thrust — 2×8–12
6. Gemelos — 3×10–20
7. ⭐ Sóleo — 3×12–15
8. ⭐ Tibial — 2×15–20
9. ⭐ Elevación lateral — 3×12–20
10. ⭐ Pullover — 2×10–15

Core:
- dead bug 2×8/lado;
- plancha lateral 2×20–30 s/lado.

## Torso B
1. Press plano — 3×8–12
2. ⭐ Laterales — 4×12–20
3. Jalón neutro — 3×8–12
4. High row — 3×8–12
5. Pec deck — 2×10–15
6. ⭐ Reverse pec deck — 2×12–20
7. Curl — 2×10–15
8. Tríceps sobre cabeza — 2×10–15

## Pierna B
Preservar contenido actual:
1. Hip thrust — 3×8–12
2. Prensa — 3×8–12
3. Curl femoral — 3×10–15
4. Extensión cuádriceps — 2×10–15
5. Extensión 45° — 2×10–15
6. Gemelos — 3×10–20
7. ⭐ Sóleo
8. ⭐ Tibial
9. ⭐ Laterales — 3×12–20
10. ⭐ Pullover — 2×10–15

Core:
- Pallof 2×10/lado;
- plancha lateral.

**No inventar dosis de sóleo/tibial durante la migración: conservar exactamente lo que ya tenga la app.**

## Reglas
Grandes:
- RIR 1–2;
- 2–3 min.

Aislados:
- RIR 1–2;
- última ocasional 0–1;
- 90–120 s.

Sin fallo sistemático, dropsets o rest-pause como base.

## Doble progresión
1. mantener peso;
2. subir reps dentro del rango;
3. llenar rango con RIR correcto;
4. subir incremento mínimo;
5. reconstruir reps.

No exigir récord en cada sesión.

---

# 25. PLAN > CARRERA 0→20 KM

Mostrar primero fase actual y próximo hito.

El plan completo queda detrás de “Ver 30 bloques”.

## Fase 1

| Bloque | Frecuencia | Sesión |
|---|---:|---|
| 1 | 2 | 6×(1′ correr + 2′ caminar) |
| 2 | 2 | 6×(1:30′ + 2′) |
| 3 | 3 | 6×(2′ + 2′) |
| 4 | 3 | 5×(3′ + 2′) |
| 5 | 3 | 4×(5′ + 2′) |
| 6 | 3 | 3×(7′ + 2′) |
| 7 | 3 | 3×(8′ + 2′) |
| 8 | 3 | 2×(12′ + 2′) |
| 9 | 3 | 2×(15′ + 2′) |
| 10 | 3 | 25′ / 25′ / 30′ continuos |

Siempre:
- 5–10 min caminar antes;
- 5 min caminar después;
- RPE 3–4;
- conversación posible.

## Fase 2

| Bloque | C1 | C2 | Larga |
|---|---:|---:|---:|
| 11 | 30′ | 30′ | 35′ |
| 12 | 30′ | 35′ | 40′ |
| 13 | 35′ | 35′ | 45′ |
| 14 | 30′ | 30′ | 35′ ↓ |
| 15 | 35′ | 40′ | 50′ |
| 16 | 35′ | 40′ | 55′ |
| 17 | 40′ | 40′ | 60′ |
| 18 | 35′ | 35′ | 45′ ↓ |

## Fase 3

| Bloque | C1 | C2 | Larga |
|---|---:|---:|---:|
| 19 | 5 km | 5 km | 8 km |
| 20 | 5 km | 5 km | 9 km |
| 21 | 5 km | 6 km | 10 km |
| 22 | 5 km | 5 km | 8 km ↓ |
| 23 | 6 km | 6 km | 11 km |
| 24 | 6 km | 6 km | 12,5 km |
| 25 | 6 km | 7 km | 14 km |
| 26 | 5 km | 5 km | 10 km ↓ |
| 27 | 7 km | 7 km | 16 km |
| 28 | 7 km | 8 km | 18 km |
| 29 | 5 km | 6 km | 12 km ↓ |
| 30 | 6 km | 7 km | 20 km |

## Reglas
- fácil;
- test del habla;
- no HIIT;
- no series rápidas;
- no tempo duro;
- evitar días consecutivos;
- repetir bloque si pesa;
- dolor localizado persistente = no progresar;
- sesión perdida no se amontona.

## Estado actual
Migrar el estado real existente.

No inferirlo por la fecha.

Guardar:
- fase;
- bloque;
- sesión;
- completadas;
- repetidos.

---

# 26. PLAN > POSTURA

## Rutina
Primeras 4 semanas:
- basculación pélvica 1×8.

Siempre:
- extensión torácica 1×8;
- chin tuck 2×8, 5 s;
- wall slide 2×8–10;
- cobra baja 2×20–30 s;
- stacking 3×20 s.

Frase:

> Rodillas suaves → costillas sobre pelvis → cuello largo.

Extras:
- pectoral 30 s/lado 3×/sem;
- flexor cadera 30 s/lado solo si hay tirantez;
- mini-reset 3–5 veces/día.

Tests/fotos:
- test pared cada 6 semanas;
- fotos comparables.

Son recordatorios sugeridos, no obligaciones ligadas a lunes.

---

# 27. AGENDA RECOMENDADA

Vive en:

> PLAN > AGENDA

Mostrar 7 días.

Ejemplo:

Lun · Fuerza  
Mar · Carrera  
Mié · Fuerza  
Jue · Carrera  
Vie · Fuerza  
Sáb · Descanso  
Dom · Carrera

Todos los eventos futuros llevan etiqueta:

> **SUGERIDO**

Permitir moverlos.

## Al mover fuerza
- identidad de la sesión no cambia;
- se recalculan sugerencias.

## Al mover running
- revisar recuperación;
- avisar si queda consecutivo;
- permitir omitir.

---

# 28. MOTOR DE FUERZA

Secuencia conceptual:

```text
TORSO_A
PIERNA_A
TORSO_B
PIERNA_B
```

El índice de siguiente sesión solo cambia al confirmar una sesión que debe avanzar la rotación.

No cambia al pasar un día.

## Omitir fuerza

Preguntar:

> ¿Omitir y avanzar o mantener pendiente?

Opciones:

- OMITIR Y AVANZAR
- MANTENER PENDIENTE
- CANCELAR

Nunca asumir.

---

# 29. MOTOR DE RUNNING

Separar conceptualmente:

- definición del plan;
- progreso real;
- sugerencias de agenda;
- registros.

La fecha sugerida no modifica el progreso.

---

# 30. PLAN Y REGISTRO SON DISTINTOS

## Plan
Qué debería ocurrir.

## Registro
Qué ocurrió realmente.

Reprogramar no sobrescribe historial.

---

# 31. MODELO DE DATOS CONCEPTUAL

## StrengthWorkoutTemplate
- id
- name
- orderIndex
- exercises

## ExerciseTemplate
- id
- name
- sets
- repMin
- repMax
- rest
- priority
- category
- targetMuscles

## StrengthSessionLog
- id
- workoutTemplateId
- actualDateTime
- recommendedDate
- status
- rampPhase
- duration
- notes
- sets[]

## StrengthSetLog
- exerciseId
- setNumber
- weight
- reps
- rir

## StrengthState
- nextWorkoutIndex
- lastCompletedWorkoutId

## RunPlanBlock
- blockNumber
- phase
- sessions[]
- isDeload

## RunSessionTemplate
- type
- runMinutes
- walkMinutes
- repetitions
- duration
- distance
- notes

## RunLog
- templateId
- actualDate
- recommendedDate
- status
- distance
- duration
- notes

## RunState
- currentBlock
- currentSession
- repeatedBlocks[]

## WeightLog
- date
- kg

## Measurement
- date
- waist
- photos

## PostureLog
- date
- exercisesCompleted[]
- completed

## WallTest
- date
- result
- notes

## NutritionPhase
- id
- startDate
- endDate
- kcal
- protein
- carbs
- fat
- meals[]
- notes

## SpecialProtocol
- date/dateRange
- type
- title
- instructions
- priority

---

# 32. MIGRACIÓN

**Regla absoluta: NO BORRAR DATOS.**

Antes de cambiar schema:

1. crear backup automático;
2. guardar versión anterior;
3. migrar;
4. validar conteos;
5. permitir restaurar.

Conservar:

- sesiones de gym;
- cada serie;
- pesos;
- reps;
- RIR;
- carreras;
- notas;
- pesos diarios;
- postura;
- tests;
- fotos;
- ajustes;
- historial;
- última copia.

## Calendario antiguo

Fechas futuras rígidas pasan a:

> scheduleSuggestions

Los registros completados permanecen reales.

## Próxima fuerza tras migración

Calcular con último entrenamiento completado.

Si último = Torso A:

> siguiente = Pierna A.

## Running tras migración

Usar estado guardado.

Si no existe, inferir por historial y pedir confirmación una sola vez.

No reiniciar.

---

# 33. AJUSTES

Fuera de la barra inferior.

Secciones:

- Plan
- Apariencia
- Avisos
- Datos
- Backup
- Avanzado

## Plan
Permitir editar:
- posición de fuerza;
- bloque de carrera;
- fecha nutricional;
- días preferidos;
- prioridad.

---

# 34. BACKUP

Conservar export/import.

Formato con:

- schemaVersion;
- timestamp;
- data.

En Ajustes:

> Última copia: hace 12 días

No ocupar Home salvo alerta realmente necesaria.

---

# 35. ESTILO VISUAL

Objetivo:

> deportivo, serio, limpio, rápido.

Usar:

- espacio;
- números grandes;
- tipografía clara;
- una acción primaria por bloque;
- iconos sencillos;
- tarjetas solo para agrupaciones reales.

## Color
- Fuerza: color principal.
- Running: segundo acento.
- Postura: acento suave.
- Nutrición: neutro.
- Verde: éxito.
- Ámbar: advertencia.
- Rojo: error/dolor real.

Nunca rojo por reprogramar.

## Jerarquía
1. título;
2. dato;
3. contexto;
4. acción.

Máximo 2 líneas antes de acción.

## Notas largas
Plegadas bajo:

> Ver instrucciones

---

# 36. COSAS QUE NO SE DEBEN HACER

- seis tabs;
- duplicar la misma información;
- “hoy toca” como mandato;
- Home gigantesco;
- mapa de 30 semanas siempre visible;
- reglas largas entre acciones;
- métricas sin utilidad;
- rojo por faltar a una fecha;
- popups constantes;
- calendario como fuente de verdad.

---

# 37. NOTIFICACIONES

Ejemplos correctos:

> ¿Apuntas tu peso?

> Hoy sería buen día para Pierna A.

> Ya has dejado recuperación desde la última carrera.

> Te quedan 8 min de postura.

Evitar:

> Tienes que hacer Pierna A.

---

# 38. MOTOR DE RECOMENDACIONES

Intentar:

1. ~3 fuerza/7 días;
2. 2–3 running según bloque;
3. evitar running consecutivo;
4. priorizar fuerza en conflicto;
5. dar recuperación alrededor de pierna;
6. permitir dos gym seguidos con aviso;
7. no reintroducir automáticamente carreras perdidas.

Todo es recomendación.

## Tiradas largas futuras
Cuando larga >10 km:

- evitar recomendar Pierna dura el día anterior;
- mostrar aviso de recuperación.

No bloquear.

---

# 39. PRIMER USO TRAS REDISEÑO

Si hay historial:

NO onboarding desde cero.

Mostrar:

> Hemos reorganizado FORJA.

Tres mensajes:

1. tus datos siguen aquí;
2. ahora eliges cuándo entrenar;
3. el calendario solo recomienda.

Botón:

> CONTINUAR

---

# 40. PRUEBAS DE ACEPTACIÓN

## Fuerza

### Caso A
Lunes Torso A completado.

Debe mostrar:

> próximo: Pierna A.

### Caso B
Pasa miércoles sin entrenar.

Debe seguir:

> Pierna A.

### Caso C
Jueves pulsa entrenar.

Carga Pierna A.

### Caso D
Termina Pierna A.

Siguiente = Torso B.

### Caso E
Jueves Torso A y viernes quiere Pierna A.

Avisar de recuperación, pero permitir.

---

# 41. PRUEBAS RUNNING

### Carrera perdida
Martes hecha, jueves omitida, domingo corre.

No obligar a recuperar jueves + domingo.

### Bloque repetido
Usuario pulsa REPETIR S5.

Mantener S5 aunque cambie la semana del calendario.

### Carrera consecutiva
Si quiere correr al día siguiente:

avisar, no bloquear.

---

# 42. PRUEBAS DE INTEGRACIÓN

## Conflicto
Jueves tenía carrera sugerida y mueve Pierna A al jueves.

App propone mover/omitir carrera.

## Nutrición
Mueve gym del 1 al 2 de septiembre.

El 2 cambia igualmente a fase nutricional 2.

## Día visual
El 4 ya no coincide con Torso A.

No asumir Torso A. Ofrecer protocolo correcto según el estado real.

## Adherencia
Pierna A sugerida miércoles y hecha jueves.

Cuenta como completada.

No como “miércoles fallado + jueves extra”.

## Volumen
Sesiones domingo y lunes.

No generar conclusión falsa por corte semanal.

Usar rolling 7/14 días y últimos 4 entrenos.

---

# 43. ORDEN DE CONSTRUCCIÓN

## Fase 1
Proteger datos y backup.

## Fase 2
Motores de estado de fuerza/running/nutrición.

## Fase 3
Nueva navegación.

## Fase 4
Migrar entreno en vivo.

## Fase 5
Carrera/postura.

## Fase 6
Progreso.

## Fase 7
Pulido visual.

---

# 44. REUTILIZAR LO QUE YA FUNCIONA

Si es estable, conservar:

- registro serie a serie;
- temporizador;
- vibración;
- historial;
- pesos/reps previos;
- cálculo de ritmo;
- peso diario;
- export/import;
- almacenamiento local.

No reescribir por capricho.

---

# 45. REHACER

Sí rehacer:

- navegación;
- Home;
- calendario;
- motor de “qué toca”;
- adherencia;
- integración de dieta/cuerpo/postura;
- running por estado;
- agenda;
- jerarquía de textos.

---

# 46. LOCAL-FIRST

Seguir funcionando:

- sin cuenta;
- sin servidor obligatorio;
- sin suscripción;
- sin internet constante.

Los datos viven localmente.

Si se almacenan fotos, utilizar almacenamiento local apropiado y migrable.

---

# 47. PRIORIDAD SI HAY CONFLICTO ENTRE ESTA ESPECIFICACIÓN Y LA APP ACTUAL

1. No perder datos.
2. Nueva lógica flexible.
3. Conservar planes/contenido actual.
4. Nueva arquitectura.
5. Estética.

No modificar silenciosamente:

- ejercicios;
- macros;
- fases;
- progresiones;

solo por rediseñar.

Si existe discrepancia entre una versión antigua y el contenido actual:

> conservar el contenido actual y dejarlo configurable.

---

# 48. DEFINICIÓN FINAL

FORJA 2.0 debe sentirse como:

> **un entrenador personal que sabe qué toca después, pero entiende que la vida cambia los días.**

No como:

> **un calendario que castiga si no obedeces una fecha.**

Debe integrar fuerza, carrera, postura, nutrición y composición corporal sin parecer seis apps separadas.

---

# 49. FRASE DE PRODUCTO

> **FORJA te dice qué toca después; tú decides cuándo hacerlo.**

---

# 50. REQUISITO DE ENTREGA

No considerar terminado hasta que:

- haya solo 4 pestañas;
- no existan duplicados importantes;
- fuerza sea secuencial;
- running sea progresivo por estado;
- fechas de entreno sean flexibles;
- nutrición siga por fecha;
- postura esté en Hoy y Entrenar;
- peso se registre en 2 toques;
- datos antiguos sobrevivan;
- agenda sea recomendada;
- las pruebas de aceptación funcionen.


---

# 51. FUNCIONES ACTUALES QUE TAMBIÉN DEBEN CONSERVARSE

Además de todo lo anterior, FORJA 2.0 debe mantener las siguientes capacidades de la versión actual.

## Veredictos de carrera

En:

> PROGRESO > CARRERA

Mantener análisis simples y comprensibles de:

- evolución del ritmo cuando exista una carrera continua comparable;
- volumen reciente;
- base aeróbica;
- tirada más larga;
- consistencia.

No inventar métricas cuando una sesión CaCo solo se registra como “hecha”.

En sesiones de intervalos CaCo:

- no exigir km;
- no exigir ritmo;
- permitir nota.

En sesiones continuas:

- km;
- minutos;
- ritmo calculado.

## Gráfico de carrera

Conservar gráficos útiles:

- km por semana/bloque;
- minutos corriendo;
- tirada larga.

Pero colocarlos en Progreso, nunca como contenido prioritario de Hoy.

---

# 52. DETALLE DEL DÍA / NOTAS

Conservar la posibilidad de revisar un día concreto.

Desde Historial o calendario:

Mostrar automáticamente:

- fuerza realizada;
- carrera realizada;
- postura;
- peso;
- nota.

Los checks se derivan de los registros reales.

Permitir corregir manualmente un check cuando exista un caso excepcional.

La corrección manual debe quedar identificada como:

> ajuste manual

para no destruir el registro real.

Mantener una nota libre por día.

---

# 53. INFORME / REVISIÓN PARA ENTRENADOR O IA

Conservar y mejorar la función actual de “Revisión”.

Ubicación recomendada:

> PROGRESO > menú ··· > GENERAR INFORME

o

> PLAN > REVISIÓN

Generar un informe en Markdown/texto fácil de copiar o exportar.

Debe incluir, según selección:

## Resumen
- fecha;
- peso actual;
- media 7 días;
- fase nutricional;
- bloque running;
- próxima fuerza.

## Fuerza
- últimas sesiones;
- cargas/reps/RIR;
- tendencias;
- ejercicios estancados;
- volumen reciente.

## Carrera
- bloque;
- sesiones;
- km/min;
- tirada larga;
- notas/molestias.

## Postura
- adherencia;
- último test;
- fotos/fechas cuando corresponda.

## Cuerpo
- peso;
- cintura;
- tendencia.

## Notas
- notas libres recientes.

Opciones:

- últimos 7 días;
- 14 días;
- 30 días;
- rango personalizado.

Botones:

- COPIAR
- DESCARGAR MD
- COMPARTIR

Esta función es útil y NO debe desaparecer por el rediseño.

---

# 54. PRIMERA CALIBRACIÓN EN INSTALACIÓN LIMPIA

Si no existe historial, mostrar un onboarding mínimo.

Objetivos:

1. Apuntar peso inicial.
2. Elegir posición inicial de la rotación de fuerza.
3. Elegir bloque/sesión actual de running.
4. Hacer o posponer test de pared.
5. Añadir o posponer foto de perfil.
6. Elegir días preferidos como simples recomendaciones.

No obligar a completar foto/test para empezar a usar la app.

---

# 55. APARIENCIA Y ACCESIBILIDAD

Conservar ajustes actuales:

- tema claro;
- tema oscuro;
- seguir sistema;
- color de acento;
- vibración;
- sonidos;
- avisos.

Además:

- botones grandes;
- contraste suficiente;
- no depender solo del color para estados;
- números fáciles de leer durante el gym;
- targets táctiles cómodos para móvil;
- ningún control importante con scroll horizontal obligatorio.

---

# 56. ESTADOS VISUALES DEL CALENDARIO

Diferenciar claramente:

## Realizado
Evento sólido.

## Sugerido
Contorno / estilo más ligero.

## Programado manualmente
Estilo intermedio + icono calendario.

## Omitido manualmente
Gris, sin rojo de error.

## Pendiente
No convertirlo en “fracaso”.

Esto debe dejar visualmente clarísimo qué ocurrió de verdad y qué era solamente una recomendación.

---

# 57. FECHAS DE MEDICIÓN Y FOTOS

Durante el plan temporal actual existen fechas como:

- 26 agosto;
- 29 agosto;
- 4 septiembre;
- 8 septiembre;
- 15 septiembre.

La app puede recordarlas.

Pero si no se hace una medición exactamente ese día:

- no bloquear;
- permitir registrar al día siguiente;
- guardar la fecha real;
- conservar la fecha sugerida por separado.

Mismo principio que con entrenamiento.

---

# 58. DISEÑO DE “PLAN DE HOY” DE NUTRICIÓN

Aunque Fitia registre alimentos, FORJA debe servir como chuleta inmediata.

Desde HOY > VER PLAN DE HOY:

Mostrar en una sola pantalla:

1. kcal;
2. P/HC/G;
3. cuatro comidas;
4. horario;
5. si es día de gym, destacar desayuno y postentreno;
6. protocolo especial si existe.

No mostrar registro de alimentos ni crear un segundo Fitia.

---

# 59. GESTIÓN DEL PREENTRENO

Contexto actual:

- desayuno habitual a las 09:00;
- normalmente avena;
- hipertrofia sobre las 12:00;
- comida después.

Por defecto:

> no existe comida preentreno separada obligatoria.

La app no debe añadir una quinta comida por error.

Nota plegada:

> Si hay hambre o falta de energía, puede redistribuirse parte de los macros diarios a un pequeño preentreno sin aumentar las kcal totales.

---

# 60. REGLA FINAL DE CONSERVACIÓN FUNCIONAL

Antes de eliminar cualquier funcionalidad de la versión actual, clasificarla:

### A. Acción frecuente
Debe quedar muy accesible.

### B. Consulta útil
Mover a Plan o Progreso.

### C. Duplicado
Eliminar la copia y enlazar a la fuente única.

### D. Poco usado pero útil
Mantener dentro de menú secundario.

No eliminar por simplificar:

- informe/revisión;
- backup;
- correcciones;
- notas;
- fotos;
- test;
- progresión;
- historial.

La simplificación debe venir de **mejor organización**, no de perder capacidades.
