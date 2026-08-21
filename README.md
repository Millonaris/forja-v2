# FORJA 2.0

Rediseño de [FORJA](https://github.com/Millonaris/forja). App personal de
entrenamiento: hipertrofia, carrera, postura y nutrición. Local, sin cuentas,
sin servidor.

> **FORJA te dice qué toca después; tú decides cuándo hacerlo.**

## Estado

**Fase 1 · prototipo navegable.** Lo que se publica hoy es la maqueta del
rediseño, no la app: se puede recorrer entera, pero los datos son de ejemplo y
no se guarda nada. Sirve para validar el diseño en el móvil de verdad antes de
construirlo.

**Fase 2 · la app.** React + Vite + Dexie, migrando los datos de la v1, según
[la especificación maestra](docs/FORJA_2_0_ESPECIFICACION_MAESTRA_REDISENO.md).
Cuando esté, sustituye al prototipo en la misma URL y el móvil se actualiza solo.

La v1 sigue funcionando y no se toca: https://millonaris.github.io/forja/

## Instalarlo en el móvil

1. Abre https://millonaris.github.io/forja-v2/ en Chrome (Android) o Safari (iPhone).
2. Menú del navegador → **Añadir a pantalla de inicio** / **Instalar app**.
3. Se abre a pantalla completa, con su icono propio (la F en lima; la v1 es cian).

Funciona sin conexión: el service worker guarda todo en la primera visita.

## Qué hay aquí

| Carpeta | Qué es |
|---|---|
| `diseno/` | El diseño exportado de Claude Design (`.dc.html` + su runtime + React local) |
| `docs/` | La especificación maestra del rediseño y capturas de referencia |
| `scripts/` | Generador de iconos, constructor del prototipo y publicación |
| `prototipo/` | Resultado compilado — generado, no versionado |

## Comandos

```bash
npm run construir   # genera iconos + prototipo/
npm run servir      # lo sirve en http://localhost:4321
npm run publicar    # construye y sube a la rama gh-pages
```

No hay dependencias que instalar: los scripts solo usan Node y lo que ya trae.

## Notas del prototipo

El diseño exportado usa el runtime de Claude Design (`support.js`), que carga
React desde unpkg. Para que la app arranque sin conexión, el constructor
inyecta un `window.__resources` que redirige esas URLs a las copias de
`diseno/vendor/`. Si algún día se re-exporta el diseño y cambia la versión de
React, hay que actualizar las dos cosas a la vez: el mapa en
`scripts/construir-prototipo.mjs` y los ficheros de `diseno/vendor/`.
