# FORJA · MÓDULO DIETA
## SOURCE OF TRUTH v3 — Septiembre 2026 → Septiembre 2027
### Fecha de versión: 2026-09-02

> **Estado:** DEFINITIVO PARA IMPLEMENTACIÓN  
> **source_of_truth:** `true`  
> **supersedes:** todas las versiones anteriores del módulo DIETA  
> Documento autocontenido para el agente de vibe coding de FORJA.

---

# 0. PRINCIPIO GENERAL

FORJA trabaja con tres niveles de datos:

- **[MEDIDO]**: peso, cintura, pasos, kcal/macros registrados, entrenamiento.
- **[ESTIMADO]**: cálculo por fórmula. Tiene error individual.
- **[DEDUCIDO]**: resultado inferido de varias semanas de ingesta + tendencia de peso + actividad.

Cuando existe un dato [DEDUCIDO] suficientemente estable, manda sobre el [ESTIMADO].

---

# 1. PERFIL

| Dato | Valor |
|---|---:|
| Sexo | Hombre |
| Edad | 41 años |
| Altura | 187 cm |
| Peso 02/09/2026 | 96,8 kg |
| Media 26 ago–2 sep | ~96,96 kg |
| Experiencia hipertrofia | ~10 meses |
| Creatina | 5 g/día |
| Pasos recientes | ~12.822/día |
| Agua habitual reciente | ~1–1,5 L/día |

Los ~12.822 pasos están dispersos durante el día trabajando en un taller. No equivalen automáticamente a una caminata continua de 9–10 km.

Los pasos de CaCo/carrera YA están incluidos en los pasos diarios. FORJA no debe sumar las calorías completas de carrera por separado encima de un TDEE que ya aprende con peso e ingesta.

---

# 2. OBJETIVOS

Prioridad estética:
- ganar mucha más masa muscular a largo plazo;
- hombros visualmente más anchos;
- espalda en V;
- mayor desarrollo de glúteos;
- reducir cintura;
- verse definido por primera vez;
- mejorar la apariencia de la zona del pecho.

Prioridad deportiva:
1. hipertrofia;
2. running progresivo CaCo → 20 km.

Si chocan por recuperación, hipertrofia tiene prioridad.

---

# 3. ENTRENAMIENTO

La rutina NO va por semanas rígidas.

> **Torso A → Pierna A → Torso B → Pierna B → repetir**

Objetivo habitual: ~3 sesiones de hipertrofia/semana, con días variables.

FORJA DIETA no debe asumir lunes/miércoles/viernes.

Tipos posibles:
```text
torsoA | legA | torsoB | legB | running | rest
```

Intensidad habitual:
- compuestos RIR ~1–2;
- aislados RIR ~1–2;
- ocasional última serie de aislamiento RIR 0–1;
- no fallo sistemático;
- no drop/rest-pause de rutina.

---

# 4. RUNNING

Sistema CaCo: correr/caminar.

Objetivo: progresar hasta 20 km por sesiones completadas, no por fecha rígida.

Sesiones recientes:

### 26 agosto
- 5×3 min corriendo
- 8 km/h correr / 5 km/h caminar
- FC media 131 / máx 154
- ~3.372 pasos

### 28 agosto
- 5×3 min
- FC media 124 / máx 153
- ~3.858 pasos

### 31 agosto
- 4×5 min
- 7,5 km/h correr / 4,5 km/h caminar
- FC media 122 / máx 139
- ~4.102 pasos

Las carreras actuales son cortas: no necesitan geles ni grandes aumentos de carbohidratos.

---

# 5. HORARIO HABITUAL DE COMIDAS

- **09:00–09:30** desayuno, normalmente pre-gym.
- **~12:00** hipertrofia cuando toca.
- **13:00–13:30** comida, normalmente post-gym.
- **17:00–18:00** merienda.
- **~21:00** cena.

FORJA no debe etiquetar automáticamente merienda = preentreno.

---

# 6. PESO RECIENTE E INGESTA

| Fecha | Peso |
|---|---:|
| 26/08 | 96,9 |
| 27/08 | 96,7 |
| 28/08 | 96,9 |
| 29/08 | 97,3 |
| 30/08 | 97,1 |
| 31/08 | 97,2 |
| 01/09 | 96,8 |
| 02/09 | 96,8 |

Ingesta registrada aproximada esa semana: **2.100–2.150 kcal/día**.

Esta semana se marca **NO CONCLUYENTE** porque coincide con:
- vuelta al gym tras ~3 semanas;
- recuperación de glucógeno;
- agua muscular;
- inflamación/agujetas;
- vuelta al running;
- cambios de actividad.

FORJA NO debe concluir:
- “2.150 = mantenimiento”;
- ni “seguro que estaba mal registrado”.

---

# 7. ESTIMACIÓN INICIAL DEL MANTENIMIENTO

Mifflin-St Jeor:

```text
10 × 97 + 6,25 × 187 − 5 × 41 + 5 ≈ 1.940 kcal/día
```

Hipótesis inicial de TDEE:

> **~2.850–3.000 kcal/día**

Punto central inicial:

> **~2.900 kcal/día**

Etiqueta: **[ESTIMADO / SIN CONFIRMAR]**

---

# 8. ESTRATEGIA ANUAL

```text
FASE 1 — DEFINICIÓN
↓
FASE 2 — MANTENIMIENTO POST-CUT
↓
FASE 3 — GANANCIA MUSCULAR LIMPIA
↓
FASE 4 — VERANO / MINI-CUT SOLO SI HACE FALTA
↓
REVISIÓN ANUAL
```

Las fases terminan por datos + criterios, no solo por calendario.

---

# 9. FASE 1 — DEFINICIÓN

Inicio: **2026-09-02**

Objetivo:
- perder grasa;
- conservar el máximo músculo;
- recuperar rendimiento pre-vacaciones.

Ganar algo de músculo puede ocurrir, pero no se promete.

Ritmo inicial orientativo:
> **~0,5–0,7 % del peso/semana**
> (~0,5–0,65 kg/sem con ~97 kg).

Se acepta menos si cintura/fotos mejoran y rendimiento va bien.

---

# 10. CALORÍAS Y MACROS DE ARRANQUE

> **2.400 kcal/día**

Macros:
> **185 P / 246 C / 75 G**

Comprobación:
```text
185×4 = 740
246×4 = 984
75×9  = 675
TOTAL = 2.399 kcal
```

FORJA muestra 2.400 kcal.

---

# 11. REPARTO POR COMIDAS — 2.400

| Comida | P | C | G | kcal aprox. |
|---|---:|---:|---:|---:|
| Desayuno | 45 | 70 | 12 | 568 |
| Comida | 55 | 90 | 15 | 715 |
| Merienda | 40 | 40 | 18 | 482 |
| Cena | 45 | 46 | 30 | 634 |
| **TOTAL** | **185** | **246** | **75** | **2.399** |

Los macros por comida son guía. Los diarios mandan.

---

# 12. DÍAS DE ENTRENAMIENTO/DESCANSO

Por defecto:
> **mismas calorías todos los días.**

Día sin gym: mismos totales; se pueden mover carbohidratos entre comidas.

CaCo actual <45 min: mismos totales.

---

# 13. VARIANTES DEL CUT

| kcal objetivo | P | C | G | kcal reales |
|---:|---:|---:|---:|---:|
| 2.550 | 185 | 277 | 78 | 2.550 |
| **2.400** | **185** | **246** | **75** | **2.399** |
| 2.250 | 185 | 220 | 70 | 2.250 |
| 2.150 | 185 | 206 | 65 | 2.149 |

Los ajustes van principalmente a carbohidratos.

2.150 es **zona de revisión**, no ley fisiológica absoluta. Si se llega ahí sin progreso, FORJA no sigue bajando automáticamente.

---

# 14. PRIMERA SEMANA

2–8 septiembre:

> **ADAPTACIÓN / NO EVALUAR**

El peso puede subir ~0,3–0,8 kg por glucógeno, agua y contenido intestinal.

Banner:
> **“DEFINICIÓN — adaptación. Las pesadas sueltas no cuentan.”**

---

# 15. BLOQUES DEL CUT

- Adaptación: 2–8 sep.
- Bloque 1: 9–29 sep.
- Bloque 2: 30 sep–20 oct.
- Bloque 3: 21 oct–10 nov.
- Bloque 4 opcional: 11 nov–1 dic.
- Tope orientativo: ~14 semanas.

No es obligatorio llegar al tope.

---

# 16. SEGUIMIENTO

Diario:
- peso matinal;
- kcal;
- P/C/G;
- pasos;
- entrenamiento;
- minutos de carrera.

Semanal:
- media de peso 7d;
- delta vs semana anterior;
- kcal medias;
- proteína media;
- pasos medios;
- adherencia;
- cintura.

Cada ~4 semanas:
- fotos frente/lateral/espalda en mismas condiciones.

Cintura:
- 1 vez/semana;
- mañana, ayunas;
- relajado;
- a la altura del ombligo;
- final de espiración normal;
- 2 medidas y guardar media.


# 17. ADHERENCIA

```text
adherencePct =
días dentro de ±150 kcal del objetivo
/
días evaluados
```

Referencia:
> **≥85 % = datos razonablemente utilizables**

Si adherencia es baja:
> no ajustar calorías todavía; primero revisar registro.

---

# 18. REGLAS DE AJUSTE DEL CUT

Nunca ajustar antes de 14 días desde el último cambio.

## Ritmo adecuado
Si baja ~0,4–0,8 kg/sem:
> mantener.

## Lento pero cintura baja
Si baja 0,2–0,4 kg/sem y cintura baja:
> mantener.

## Estancamiento
Si durante ~2 semanas:
- peso medio prácticamente plano;
- cintura plana;
- adherencia ≥85 %;
- actividad comparable;

> reducir ~100–150 kcal, principalmente carbohidratos.

## Demasiado rápido
Si durante ~2 semanas:
- pérdida >~0,9 kg/sem;
- hambre fuerte;
- sueño malo;
- rendimiento empeora;

> añadir ~100–150 kcal, principalmente carbohidratos.

Si baja rápido pero se encuentra bien:
> no ajustar automáticamente.

---

# 19. TDEE DEDUCIDO

```text
tendenciaKgSemana =
mediaPesoSemanaActual − mediaPesoSemanaAnterior

TDEE_deducido =
kcalMedias − (tendenciaKgSemana × 7700 / 7)
```

Ejemplo:

```text
kcal medias = 2400
tendencia = -0,55 kg/sem

TDEE =
2400 − (-0,55 × 7700 / 7)
≈ 3005 kcal
```

El valor 7.700 kcal/kg es una simplificación útil, no una ley.

El cálculo puede contaminarse por:
- agua;
- glucógeno;
- sodio;
- inflamación;
- contenido intestinal;
- cambios de actividad.

FORJA solo debe aceptar el TDEE deducido si:
- hay ≥21 días en la fase;
- han pasado ≥21 días desde un cambio importante de kcal;
- adherencia ≥85 %;
- pasos razonablemente comparables;
- no hay una semana claramente anormal.

Guardar varias estimaciones válidas y suavizarlas.

---

# 20. CRITERIOS DE SALIDA DEL CUT

Cerrar cuando ocurra el primero:

### A. Estético
El usuario se ve suficientemente definido y cintura ha bajado claramente.

### B. Rendimiento/recuperación
Durante 2 semanas:
- caída consistente en ≥2 ejercicios importantes;
- sueño malo;
- hambre/fatiga elevadas.

### C. Tiempo
~14 semanas.

### D. Estancamiento en zona baja
Si alrededor de 2.150 kcal:
- pasan ~3 semanas;
- adherencia buena;
- peso y cintura no cambian;

> pausar y revisar, no bajar automáticamente más.

---

# 21. DIET BREAK

Opcional: 5–7 días alrededor del mantenimiento deducido si:
- adherencia empeora;
- hambre/fatiga son altas;
- cut se alarga;
- encaja socialmente.

Objetivo:
> descanso práctico y mental.

No presentarlo como “reset metabólico”.

---

# 22. DOLOR EN RUNNING

FORJA NO cambia automáticamente calorías por molestias.

Semáforo:

### Verde
0–2/10, transitorio, al día siguiente normal.
> continuar.

### Amarillo
localizado, recurrente o persiste al día siguiente.
> no progresar carga; revisar distribución/recuperación.

### Rojo
altera marcha/carrera, hinchazón, dolor caminando o empeora.
> parar running y valorar.

La nutrición ayuda a recuperación, pero no sustituye la gestión de carga.

---

# 23. FASE 2 — MANTENIMIENTO POST-CUT

Duración orientativa:
> **2–3 semanas**

Puede prolongarse si el peso sigue muy afectado por agua/glucógeno.

Objetivos:
- estabilizar peso;
- recuperar hambre/energía;
- mejorar rendimiento;
- confirmar mantenimiento con el peso nuevo.

## Entrada a mantenimiento — regla correcta

NO hacer automáticamente:
> `TDEE_deducido_final_cut - 100`

El TDEE deducido de las últimas semanas del cut ya refleja el peso y actividad finales.

Punto inicial:
> **último TDEE deducido válido**, redondeado de forma práctica.

Ejemplo:
```text
TDEE deducido final = 2780
inicio mantenimiento ≈ 2750–2800
```

Si el salto desde las kcal del cut es >~400 kcal:
> puede hacerse en dos pasos durante ~1 semana SOLO para reducir ruido de agua/glucógeno y facilitar la transición.

No porque subir a mantenimiento produzca grasa automáticamente.

---

# 24. PRIMERA SEMANA DE MANTENIMIENTO

Estado:
> **ADAPTACIÓN**

No evaluar.

Puede subir ~0,5–1 kg por:
- glucógeno;
- agua;
- contenido intestinal.

No etiquetar como grasa.

---

# 25. CONFIRMACIÓN DEL MANTENIMIENTO

Después de la semana de adaptación:
> usar al menos ~14 días adicionales.

No confirmar mantenimiento por una sola semana.

## Confirmación fuerte
Durante ~14 días:
- tendencia de peso cercana a 0;
- aproximadamente dentro de ±0,10 kg/sem;
- cintura estable;
- actividad comparable.

Guardar:
```text
maintenanceConfirmed = kcalActuales
maintenanceConfidence = "high"
```

## Confirmación provisional
Si tendencia está entre ±0,10 y ±0,20 kg/sem con cintura estable:
```text
maintenanceConfidence = "medium"
```

No perseguir falsa precisión.

Si sigue perdiendo claramente:
> +100 kcal.

Si sube claramente y cintura sube:
> −100 kcal.

---

# 26. MACROS DE MANTENIMIENTO

Objetivo general:
- proteína ~175 g;
- grasa ~80 g;
- carbohidratos = resto.

Ejemplo a 2.750:
> **175 P / 332 C / 80 G ≈ 2.748 kcal**

| Comida | P | C | G |
|---|---:|---:|---:|
| Desayuno | 40 | 90 | 12 |
| Comida | 55 | 120 | 16 |
| Merienda | 40 | 55 | 20 |
| Cena | 40 | 67 | 32 |
| **TOTAL** | **175** | **332** | **80** |

---

# 27. FASE 3 — GANANCIA MUSCULAR LIMPIA

Inicio:
> solo cuando exista `maintenanceConfirmed`.

Inicio calórico:
> **mantenimiento confirmado + ~150–200 kcal/día**

Ejemplo:
```text
mantenimiento = 2750
inicio lean gain = 2900–2950
```

## Macros orientativos
- proteína ~175 g;
- grasa ~80–85 g;
- carbohidratos = resto.

Ejemplo a 2.950:
> **175 P / 371 C / 85 G ≈ 2.949 kcal**

---

# 28. RITMO DE GANANCIA

Objetivo:
> **~0,25–0,45 kg/mes**

NO por semana.

En 6 meses:
> ~1,5–2,5 kg de subida total sería razonable.

Si peso apenas sube pero:
- fuerza progresa;
- cintura está estable;

> no aumentar automáticamente calorías.

---

# 29. REVISIÓN DURANTE GANANCIA

Frecuencia:
> cada 4 semanas.

## Correcto
+0,25–0,45 kg/mes, cintura ≤+0,5 cm/mes y fuerza progresa:
> mantener.

## Demasiado rápido
>~0,6 kg/mes o cintura >~1 cm/mes:
> −100 kcal.

## Demasiado lento
No ajustar por un solo mes.

Si durante ~8 semanas:
- peso prácticamente plano;
- fuerza estancada;
- adherencia buena;

> +100 kcal.

## Cintura +2 cm desde inicio
> volver a mantenimiento 2–3 semanas y reevaluar.

No iniciar mini-cut automáticamente.

---

# 30. RUNNING DURANTE GANANCIA

A medida que aumente el volumen de carrera:
> `maintenanceCurrentEstimate` puede cambiar.

Mantener:
```text
maintenanceBaseline
maintenanceCurrentEstimate
```

No congelar para siempre el mantenimiento confirmado meses antes.

## Tiradas largas

### <75 min
Sin cambio.

### 75–120 min
Puede añadirse:
> ~30–50 g de carbohidratos ese día

alrededor de la carrera.

### >90 min
Puede recomendar:
> 30–60 g carbohidratos/hora durante la sesión según tolerancia.

Estas reglas son estrategia deportiva, no compensación automática de “calorías quemadas”.

## 20K
No tiene fecha rígida.

La semana real del 20K:
- no recortar kcal;
- priorizar carbohidratos;
- usar rango alto de ingesta;
- 2 días previos con mayor disponibilidad de carbohidrato;
- comida previa conocida y baja en fibra si hace falta.

Después:
> una semana aproximadamente en mantenimiento puede ser útil antes de retomar superávit.

---

# 31. FASE 4 — VERANO / MINI-CUT

Al terminar la fase larga de ganancia evaluar:
- cintura;
- fotos;
- peso;
- definición;
- rendimiento.

Si sigue suficientemente definido:
> mantenimiento.

Si ha acumulado grasa suficiente como para querer reducirla:
> mini-cut de ~4–6 semanas.

Déficit:
> mantenimiento actual − ~400–500 kcal.

Proteína:
> ~180–185 g.

No hacer mini-cut solo porque sea junio.

---

# 32. PROTEÍNA, GRASA Y CARBOHIDRATOS

## Proteína

| Fase | Objetivo |
|---|---:|
| Definición | ~185 g |
| Mantenimiento | ~175 g |
| Ganancia | ~175 g |
| Mini-cut | ~180–185 g |

No hace falta clavar cada gramo.

## Grasa

Rangos prácticos:
- cut: ~65–75 g;
- mantenimiento: ~75–85 g;
- gain: ~80–90 g.

No afirmar que un valor concreto en g/kg es obligatorio “para hormonas”.

## Carbohidratos

Después de cubrir kcal + proteína + grasa razonable:
> el resto carbohidratos.

Son especialmente útiles para hipertrofia, CaCo, running y glucógeno.

---

# 33. HIDRATACIÓN

Venía de ~1–1,5 L/día.

Objetivo inicial práctico:
> **~2,5–3 L/día de líquidos**

ajustando por:
- calor;
- sudor;
- ejercicio.

No forzar cantidades extremas.

Sal:
> normal y relativamente constante.

No manipular agua/sal.

---

# 34. CREATINA Y SUPLEMENTOS

Creatina:
> **5 g/día todo el año**

Whey:
> solo comodidad.

Cafeína:
> opcional según tolerancia.

No crear una lista obligatoria de suplementos.

---

# 35. COMIDAS LIBRES — REGLA DEFINITIVA

No existe “comida gratis”.

FORJA trabaja con:
> **promedio semanal + adherencia**

Ejemplo:
```text
objetivo = 2400 × 7 = 16.800 kcal/sem
```

Si un sábado se consumen 3.000 en vez de 2.400:
> +600 kcal sobre objetivo.

Opciones válidas:

### A. No compensar
Aceptar un déficit semanal algo menor.

### B. Repartir suavemente
Si el usuario quiere:
> reducir pequeñas cantidades en varios días.

Ejemplo:
> 100 kcal × 6 días.

NO:
- ayuno/castigo al día siguiente;
- fingir que las kcal no existieron.

---

# 36. ALCOHOL Y REGISTRO

Alcohol:
- registrar kcal;
- puede afectar sueño, recuperación y adherencia;
- minimizar durante definición.

Registro de comida:
prestar atención a:
- aceite;
- salsas;
- frutos secos;
- picoteos;
- bebidas;
- crudo/cocinado.

Si no hay progreso:
> auditar antes de asumir un metabolismo anormal.

No acusar al usuario de registrar mal.


# 37. UI DEL MÓDULO DIETA

Pantalla principal:

### Fase
Ejemplo:
> DEFINICIÓN

### Objetivo
> 2.400 kcal

### Macros
> 185 P / 246 C / 75 G

### Métricas
- peso hoy;
- media 7 días;
- cambio vs semana anterior;
- cintura;
- cambio cintura;
- pasos medios 7 días;
- adherencia;
- TDEE.

El TDEE debe mostrar etiqueta:
> ESTIMADO / DEDUCIDO / CONFIRMADO

También:
- próxima revisión;
- mensaje contextual.

Ejemplo:
> “Las pesadas sueltas no cuentan. Próxima revisión: 29 sep.”

---

# 38. SEMÁFORO

### Verde
- ritmo adecuado;
- cintura progresa;
- adherencia suficiente;
- rendimiento razonable.

### Amarillo
- datos ambiguos;
- poco tiempo desde ajuste;
- adherencia baja;
- actividad cambió;
- solo 1 semana fuera de objetivo.

### Rojo
- varias semanas fuera de objetivo;
- pérdida rápida + fatiga;
- dolor running rojo;
- rendimiento cae sostenidamente;
- datos incoherentes.

El semáforo NO modifica calorías por sí solo.

---

# 39. ESTADO DE DATOS

```js
const nutritionState = {
  version: "FORJA_DIETA_v3_2026-09-02",
  sourceOfTruth: true,

  profile: {
    sex: "male",
    age: 41,
    heightCm: 187,
    startDate: "2026-09-02",
    startWeightKg: 96.8,
    avgStepsBaseline: 12822,
    stepsAreDispersed: true,
    runningIncludedInSteps: true,
    creatineGPerDay: 5
  },

  phase: {
    current: "cut",
    startedAt: "2026-09-02",
    lastKcalChangeAt: "2026-09-02"
  },

  targets: {
    kcal: 2400,
    proteinG: 185,
    carbsG: 246,
    fatG: 75
  },

  expenditure: {
    bmrEstimated: 1940,
    tdeeInitialEstimate: 2900,
    tdeeInitialRange: [2850, 3000],
    tdeeCurrentEstimate: null,
    maintenanceConfirmed: null,
    maintenanceConfidence: null,
    maintenanceBaseline: null
  },

  body: {
    waistStartCm: null,
    waistCurrentCm: null,
    waistEndCutCm: null
  },

  tracking: []
};
```

---

# 40. CONFIGURACIÓN

```js
const NUTRITION_CFG = {
  kcalPerKgApprox: 7700,

  adherence: {
    min: 0.85,
    kcalTolerance: 150
  },

  tdee: {
    minValidDays: 21,
    minDaysAfterKcalChange: 21,
    maxStepVariancePct: 0.20
  },

  cut: {
    startKcal: 2400,
    preferredWeeklyLossKg: [0.4, 0.8],
    slowButAcceptableKg: [0.2, 0.4],
    tooFastKg: 0.9,
    adjustmentKcal: [100, 150],
    reviewZoneKcal: 2150,
    maxWeeks: 14
  },

  maintenance: {
    strongConfirmWeeklyTrendKg: 0.10,
    provisionalTrendKg: 0.20,
    adjustmentKcal: 100
  },

  gain: {
    targetKgPerMonth: [0.25, 0.45],
    excessiveKgPerMonth: 0.60,
    adjustmentKcal: 100,
    maxWaistGainCm: 2.0
  }
};
```

---

# 41. UTILIDADES

```js
function average(values) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function lastN(records, n, offset = 0) {
  const end = records.length - offset;
  const start = Math.max(0, end - n);
  return records.slice(start, end);
}

function avgField(records, field) {
  const values = records
    .map(r => r[field])
    .filter(v => Number.isFinite(v));

  return average(values);
}

function avg7(records, field, offset = 0) {
  return avgField(lastN(records, 7, offset), field);
}

function weeklyWeightTrend(records) {
  if (records.length < 14) return null;

  const current = avg7(records, "weightKg", 0);
  const previous = avg7(records, "weightKg", 7);

  if (current === null || previous === null) return null;

  return current - previous;
}
```

---

# 42. ADHERENCIA Y PASOS

```js
function adherencePct(records, targetKcal, days = 14) {
  const sample = lastN(records, days);

  if (!sample.length) return null;

  const valid = sample.filter(r =>
    Number.isFinite(r.kcal) &&
    Math.abs(r.kcal - targetKcal) <=
      NUTRITION_CFG.adherence.kcalTolerance
  ).length;

  return valid / sample.length;
}

function stepsComparable(records) {
  const current = avg7(records, "steps", 0);
  const previous = avg7(records, "steps", 7);

  if (!current || !previous) return false;

  return (
    Math.abs(current - previous) / previous
    <= NUTRITION_CFG.tdee.maxStepVariancePct
  );
}
```

---

# 43. CÁLCULO TDEE DEDUCIDO

```js
function calculateDeductedTDEE(records) {
  if (records.length < 21) return null;

  const trendKgPerWeek = weeklyWeightTrend(records);
  if (trendKgPerWeek === null) return null;

  const avgKcal = avgField(lastN(records, 14), "kcal");
  if (avgKcal === null) return null;

  return Math.round(
    avgKcal -
    (trendKgPerWeek * NUTRITION_CFG.kcalPerKgApprox / 7)
  );
}
```

Test obligatorio:

```text
2400 kcal y -0,55 kg/sem
→ 2400 - (-0,55 × 7700 / 7)
→ 3005 kcal
```

---

# 44. VALIDACIÓN TDEE

```js
function canUseDeductedTDEE(state) {
  const records = state.tracking;

  if (records.length < NUTRITION_CFG.tdee.minValidDays) {
    return false;
  }

  const adherence = adherencePct(
    records,
    state.targets.kcal,
    14
  );

  if (
    adherence === null ||
    adherence < NUTRITION_CFG.adherence.min
  ) {
    return false;
  }

  if (!stepsComparable(records)) return false;

  return true;
}
```

FORJA puede almacenar las últimas estimaciones válidas y mostrar una media suavizada.

---

# 45. REVISIÓN DEL CUT

```js
function reviewCut(state, context) {
  if (context.daysSinceLastKcalChange < 14) {
    return {
      action: "hold",
      reason: "Menos de 14 días desde el último cambio."
    };
  }

  const trend = weeklyWeightTrend(state.tracking);

  const adherence = adherencePct(
    state.tracking,
    state.targets.kcal,
    14
  );

  if (trend === null) {
    return {
      action: "hold",
      reason: "Datos insuficientes."
    };
  }

  if (adherence < NUTRITION_CFG.adherence.min) {
    return {
      action: "audit",
      reason: "Revisar adherencia antes de tocar calorías."
    };
  }

  const loss = -trend;

  if (loss >= 0.4 && loss <= 0.8) {
    return {
      action: "hold",
      reason: "Ritmo adecuado."
    };
  }

  if (
    loss >= 0.2 &&
    loss < 0.4 &&
    context.waistTrendCm < 0
  ) {
    return {
      action: "hold",
      reason: "Lento pero cintura bajando."
    };
  }

  if (
    loss < 0.2 &&
    context.waistTrendCm >= 0 &&
    context.stepsComparable
  ) {
    return {
      action: "decrease",
      kcal: 100,
      reason: "Peso y cintura sin progreso suficiente."
    };
  }

  if (
    loss > 0.9 &&
    context.fatigueHigh
  ) {
    return {
      action: "increase",
      kcal: 100,
      reason: "Pérdida rápida con fatiga."
    };
  }

  return {
    action: "hold",
    reason: "Sin señal suficientemente clara."
  };
}
```

---

# 46. APLICAR CAMBIO DE CALORÍAS

```js
function setCalories(state, newKcal) {
  state.targets.kcal = newKcal;

  const protein = state.targets.proteinG;
  const fat = state.targets.fatG;

  state.targets.carbsG = Math.round(
    (newKcal - protein * 4 - fat * 9) / 4
  );

  state.phase.lastKcalChangeAt =
    new Date().toISOString().slice(0, 10);
}
```

Si la distribución resultante es poco práctica:
> FORJA puede mover ligeramente grasa dentro del rango de la fase.

---

# 47. CERRAR CUT

```js
function closeCut(state, currentValidTDEE) {
  state.body.waistEndCutCm =
    state.body.waistCurrentCm;

  state.phase.current = "maintenance";
  state.phase.startedAt =
    new Date().toISOString().slice(0, 10);

  // Usar TDEE deducido final.
  // NO restar automáticamente 100 kcal.
  const maintenanceStart =
    Math.round(currentValidTDEE / 50) * 50;

  state.targets.kcal = maintenanceStart;
  state.targets.proteinG = 175;
  state.targets.fatG = 80;
  state.targets.carbsG = Math.round(
    (maintenanceStart - 175 * 4 - 80 * 9) / 4
  );

  state.expenditure.maintenanceConfirmed = null;
  state.expenditure.maintenanceConfidence = null;
}
```

Si el salto supera ~400 kcal:
> la UI puede ofrecer transición en dos pasos, pero no es obligatoria.

---

# 48. REVISAR MANTENIMIENTO

```js
function reviewMaintenance(state, context) {
  if (context.daysInPhase < 21) {
    return {
      action: "hold",
      reason: "Adaptación / datos insuficientes."
    };
  }

  const trend = weeklyWeightTrend(state.tracking);

  if (trend === null) {
    return {
      action: "hold",
      reason: "Datos insuficientes."
    };
  }

  const absTrend = Math.abs(trend);

  if (
    absTrend <= 0.10 &&
    Math.abs(context.waistTrendCm) <= 0.3
  ) {
    state.expenditure.maintenanceConfirmed =
      state.targets.kcal;

    state.expenditure.maintenanceConfidence = "high";

    return {
      action: "confirm",
      confidence: "high",
      reason: "Peso y cintura estables."
    };
  }

  if (
    absTrend <= 0.20 &&
    Math.abs(context.waistTrendCm) <= 0.3
  ) {
    state.expenditure.maintenanceConfirmed =
      state.targets.kcal;

    state.expenditure.maintenanceConfidence = "medium";

    return {
      action: "confirm",
      confidence: "medium",
      reason: "Mantenimiento aproximado."
    };
  }

  if (trend < -0.20) {
    return {
      action: "increase",
      kcal: 100,
      reason: "Continúa perdiendo peso."
    };
  }

  if (
    trend > 0.20 &&
    context.waistTrendCm > 0
  ) {
    return {
      action: "decrease",
      kcal: 100,
      reason: "Peso y cintura suben."
    };
  }

  return {
    action: "hold",
    reason: "Datos ambiguos; mantener."
  };
}
```

---

# 49. INICIAR GANANCIA

```js
function startLeanGain(state) {
  if (!state.expenditure.maintenanceConfirmed) {
    throw new Error(
      "No iniciar ganancia sin mantenimiento confirmado."
    );
  }

  state.phase.current = "gain";
  state.phase.startedAt =
    new Date().toISOString().slice(0, 10);

  const startKcal =
    state.expenditure.maintenanceConfirmed + 175;

  state.targets.kcal = startKcal;
  state.targets.proteinG = 175;
  state.targets.fatG = 85;
  state.targets.carbsG = Math.round(
    (startKcal - 175 * 4 - 85 * 9) / 4
  );
}
```

---

# 50. REVISAR GANANCIA

```js
function reviewGain(context) {
  const monthlyGainKg =
    context.monthlyWeightTrendKg;

  if (
    monthlyGainKg >= 0.25 &&
    monthlyGainKg <= 0.45 &&
    context.monthlyWaistChangeCm <= 0.5 &&
    context.strengthProgressing
  ) {
    return {
      action: "hold",
      reason: "Ganancia limpia dentro de objetivo."
    };
  }

  if (
    monthlyGainKg > 0.60 ||
    context.monthlyWaistChangeCm > 1.0
  ) {
    return {
      action: "decrease",
      kcal: 100,
      reason: "Ganancia demasiado rápida."
    };
  }

  if (
    context.weeksFlat >= 8 &&
    !context.strengthProgressing
  ) {
    return {
      action: "increase",
      kcal: 100,
      reason: "Peso y fuerza estancados."
    };
  }

  if (
    context.waistGainFromPhaseStartCm >= 2.0
  ) {
    return {
      action: "maintenanceBlock",
      weeks: 2,
      reason: "Cintura +2 cm desde inicio."
    };
  }

  return {
    action: "hold",
    reason: "No hay motivo claro para ajustar."
  };
}
```

---

# 51. RUNNING Y NUTRICIÓN

```js
function runningNutrition(minutes) {
  if (!minutes || minutes < 75) {
    return {
      extraCarbsG: 0,
      intraCarbs: null
    };
  }

  if (minutes <= 120) {
    return {
      extraCarbsG: 40,
      intraCarbs:
        minutes > 90
          ? "30–60 g/h según tolerancia"
          : null
    };
  }

  return {
    extraCarbsG: 50,
    intraCarbs: "30–60 g/h según tolerancia"
  };
}
```

Esto representa disponibilidad de carbohidratos, no “devolver calorías quemadas”.

---

# 52. DOLOR RUNNING

```js
function runningPainTrafficLight({
  painScore,
  persistsNextDay,
  altersGait,
  swelling,
  painWalking
}) {
  if (
    altersGait ||
    swelling ||
    painWalking ||
    painScore >= 5
  ) {
    return "red";
  }

  if (
    persistsNextDay ||
    painScore >= 3
  ) {
    return "yellow";
  }

  return "green";
}
```

Acciones:
```text
green  → continuar
yellow → no progresar carga; revisar recuperación
red    → parar running y valorar
```

NO cambiar automáticamente calorías por dolor.

---

# 53. COMIDAS LIBRES EN FORJA

```text
objetivoSemanalKcal = objetivoDiario × 7
consumoSemanalKcal  = suma real
diferenciaSemanal   = consumo - objetivo
```

Ejemplo de UI:
> “Esta semana vas +520 kcal sobre el objetivo. Puedes aceptarlo o repartir un ajuste pequeño. No hace falta compensar de golpe.”

---

# 54. REGLA MAESTRA DE DECISIÓN

Antes de cambiar calorías:

```text
1. ¿Han pasado ≥14 días desde el último cambio?
2. ¿La adherencia es suficiente?
3. ¿La actividad es comparable?
4. ¿Qué dice la media de peso?
5. ¿Qué dice la cintura?
6. ¿Qué dice el rendimiento?
```

Si no hay respuesta clara:
> **mantener.**

---

# 55. QUÉ FORJA NUNCA DEBE HACER

1. Cambiar kcal por una pesada.
2. Cambiar kcal por 2–3 días.
3. Interpretar automáticamente agua/glucógeno como grasa.
4. Contar dos veces el running.
5. Calcular mantenimiento solo con Mifflin.
6. Suponer que 2.150 kcal son mantenimiento por una semana plana.
7. Acusar automáticamente al usuario de registrar mal.
8. Bajar kcal por dolor de rodilla/tibia/Aquiles.
9. Hacer mini-cut porque “toca junio”.
10. Subir mucho peso intencionadamente en volumen.
11. Tratar una comida libre como calorías inexistentes.
12. Hacer ayuno/castigo tras una comida alta.
13. Cambiar dieta y entrenamiento simultáneamente sin necesidad.
14. Prometer ganancia muscular durante déficit.
15. Fijar peso final obligatorio.

---

# 56. BANNERS

```js
const nutritionBanners = {
  cut:
    "DEFINICIÓN — Las pesadas sueltas no cuentan. Próxima revisión: {date}.",

  cutAdaptation:
    "ADAPTACIÓN — Agua y glucógeno pueden mover la báscula. No ajustar.",

  maintenance:
    "MANTENIMIENTO — Confirmando tu gasto real con el peso nuevo.",

  maintenanceAdaptation:
    "ADAPTACIÓN A MANTENIMIENTO — La subida inicial puede ser agua/glucógeno.",

  gain:
    "GANANCIA LIMPIA — Objetivo +0,25–0,45 kg/mes. Manda también la cintura.",

  summer:
    "VERANO — Mantener. Mini-cut solo si los datos y el objetivo visual lo justifican."
};
```

---

# 57. RESUMEN ANUAL

```text
SEP 2026
↓
Definición desde ~2.400 kcal.

SEP–NOV/DIC
↓
Cut por bloques.
FORJA aprende TDEE con peso + ingesta + actividad.

CIERRE DEL CUT
↓
Mantenimiento 2–3+ semanas.
Semana 1 = adaptación.
Confirmar mantenimiento.

DESPUÉS
↓
Ganancia limpia:
mantenimiento confirmado + ~150–200 kcal.

MESES SIGUIENTES
↓
Subida muy lenta de peso.
Revisar cintura y fuerza cada 4 semanas.
Running aumenta progresivamente.

VERANO 2027
↓
Si sigue suficientemente definido:
mantenimiento.

Si ha acumulado grasa suficiente:
mini-cut corto.

SEP 2027
↓
Revisión anual.
```

---

# 58. ESTADO ACTUAL

A fecha **2026-09-02**:

```text
phase = DEFINICIÓN

targetKcal = 2400
protein = 185 g
carbs = 246 g
fat = 75 g

weight = 96.8 kg
waist = pendiente

TDEE estimate = ~2900
TDEE status = ESTIMADO / SIN CONFIRMAR
```

Mensaje inicial:

> **“Empieza la fase de definición. Durante los primeros días la báscula puede no reflejar la pérdida de grasa por agua, glucógeno y vuelta al entrenamiento. No se ajustarán calorías por pesadas aisladas.”**

---

# 59. PRINCIPIO FINAL

FORJA no debe ser una calculadora rígida.

Debe seguir:

> **medir → esperar suficiente tiempo → detectar tendencia → ajustar poco → volver a medir.**

El objetivo anual no es un número concreto de báscula.

Es:

> **menos grasa + más músculo + mejor rendimiento + un sistema sostenible que aprenda del usuario.**
