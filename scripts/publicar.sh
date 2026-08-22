#!/usr/bin/env bash
#
# FORJA 2.0 · Publicar la app.
#
# Compila y sube el resultado a la rama `gh-pages`, que es la que sirve
# https://millonaris.github.io/forja-v2/. El móvil recoge la versión nueva la
# próxima vez que abras la app: el service worker va en autoUpdate.
#
#   npm run publicar
#
# La rama `gh-pages` contiene SOLO el resultado compilado y se reescribe entera
# en cada publicación: no guarda historial y no hay nada que conservar en ella.
#
# El prototipo de diseño sigue existiendo (`npm run prototipo`) pero ya no se
# publica: lo que hay en esa URL es la app.

set -euo pipefail

REPO="https://github.com/Millonaris/forja-v2.git"
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$RAIZ"

# Si las pruebas de aceptación no pasan, no se publica: son las reglas de las
# que depende que la app no invente lo que toca entrenar.
npm test
npm run iconos
npm run build

cd dist
# Sin esto GitHub Pages pasa la carpeta por Jekyll y se come los ficheros que
# empiezan por guion bajo.
touch .nojekyll

# Repositorio de usar y tirar: `dist` está en .gitignore, así que este .git de
# dentro no interfiere con el del proyecto.
rm -rf .git
git init -q -b gh-pages
# Con el buffer por defecto, subir todo de golpe hace que GitHub corte la
# conexión con un 400.
git config http.postBuffer 157286400
git add -A
git commit -q -m "Publicar $(date '+%Y-%m-%d %H:%M')"
git push -q -f "$REPO" gh-pages

echo
echo "Publicado en https://millonaris.github.io/forja-v2/"
echo "Tarda hasta un minuto en refrescarse."
