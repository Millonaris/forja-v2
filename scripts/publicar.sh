#!/usr/bin/env bash
#
# FORJA 2.0 · Publicar el prototipo.
#
# Reconstruye `prototipo/` desde el diseño y lo sube a la rama `gh-pages`, que
# es la que sirve https://millonaris.github.io/forja-v2/. El móvil recoge la
# versión nueva la próxima vez que abras la app.
#
#   npm run publicar
#
# La rama `gh-pages` contiene SOLO el resultado y se reescribe entera en cada
# publicación: no guarda historial y no hay nada que conservar en ella.
#
# Cuando la app real sustituya al prototipo, aquí solo cambia qué carpeta se
# sube; la URL y la instalación del móvil siguen siendo las mismas.

set -euo pipefail

REPO="https://github.com/Millonaris/forja-v2.git"
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$RAIZ"
node scripts/generar-iconos.mjs
node scripts/construir-prototipo.mjs

cd prototipo
# Sin esto GitHub Pages pasa la carpeta por Jekyll y se come los ficheros que
# empiezan por guion bajo.
touch .nojekyll

# Repositorio de usar y tirar: `prototipo/` está en .gitignore, así que este
# .git de dentro no interfiere con el del proyecto.
rm -rf .git
git init -q -b gh-pages
git config http.postBuffer 157286400
git add -A
git commit -q -m "Publicar $(date '+%Y-%m-%d %H:%M')"
git push -q -f "$REPO" gh-pages

echo
echo "Publicado en https://millonaris.github.io/forja-v2/"
echo "Tarda hasta un minuto en refrescarse."
