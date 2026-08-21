/*
 * FORJA 2.0 · Construir el prototipo instalable.
 *
 * Toma el diseño exportado de Claude Design (`diseno/FORJA 2.0.dc.html`) y lo
 * convierte en una PWA estática que se puede instalar en el móvil desde
 * GitHub Pages, sin depender de internet una vez instalada.
 *
 *   node scripts/construir-prototipo.mjs
 *
 * El diseño original no se toca: todo lo generado va a `prototipo/`.
 */

import { readFileSync, writeFileSync, copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, "..");
const DISENO = join(RAIZ, "diseno");
const SALIDA = join(RAIZ, "prototipo");

/*
 * El runtime de Claude Design carga React desde unpkg. Instalada en el móvil,
 * la app tiene que arrancar sin conexión, así que se sirven copias locales:
 * `window.__resources` es el mapa que el propio runtime consulta antes de ir
 * al CDN (ver `cdnScriptFor` en support.js).
 */
const RESOURCES = {
  "https://unpkg.com/react@18.3.1/umd/react.production.min.js": "./vendor/react.production.min.js",
  "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js":
    "./vendor/react-dom.production.min.js",
};

const CABECERA = `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>FORJA 2.0 · prototipo</title>
<meta name="theme-color" content="#0E0E0E">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="FORJA 2.0">
<link rel="manifest" href="./manifest.webmanifest">
<link rel="apple-touch-icon" href="./iconos/icono-192.png">
<script>window.__resources = ${JSON.stringify(RESOURCES, null, 2)};</script>`;

/*
 * El diseño ya resuelve sus propias zonas seguras (las barras fijas usan
 * `env(safe-area-inset-bottom)`), así que aquí solo se pinta el fondo hasta
 * los bordes y se quita el rebote del scroll, que instalada como app deja ver
 * el blanco del navegador por debajo.
 */
const ESTILOS = `<style>
  html, body { background: #0E0E0E; }
  body { min-height: 100svh; overscroll-behavior-y: none; }
  * { -webkit-tap-highlight-color: transparent; }
</style>`;

const REGISTRO_SW = `<script>
  if ("serviceWorker" in navigator) {
    addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
  }
</script>`;

/*
 * Aviso de que esto es una maqueta, no la app. Va arriba y SIN `position:fixed`
 * a propósito: abajo taparía la barra de pestañas, y fijo arriba taparía la
 * cabecera de cada pantalla. Así se va con el scroll y no estorba.
 */
const CINTA = `<div id="cinta-prototipo" style="background:#F3FF47;color:#0E0E0E;font:700 10px/1 'Helvetica Neue',Helvetica,Arial,sans-serif;letter-spacing:.14em;text-align:center;padding:calc(5px + env(safe-area-inset-top)) 8px 5px">PROTOTIPO · DATOS DE EJEMPLO, NO SE GUARDA NADA</div>`;

mkdirSync(SALIDA, { recursive: true });
mkdirSync(join(SALIDA, "iconos"), { recursive: true });
mkdirSync(join(SALIDA, "vendor"), { recursive: true });

/* ---------- index.html ---------- */

let html = readFileSync(join(DISENO, "FORJA 2.0.dc.html"), "utf8");

if (!html.includes('<script src="./support.js"></script>')) {
  throw new Error("El diseño ya no carga ./support.js: revisa la exportación.");
}

// La cabecera va ANTES de support.js: el runtime lee `window.__resources` en
// cuanto arranca, así que el mapa tiene que existir ya.
html = html.replace(
  '<script src="./support.js"></script>',
  `${CABECERA}\n${ESTILOS}\n<script src="./support.js"></script>`,
);

html = html.replace("<body>", `<body>\n${CINTA}`);
html = html.replace("</body>", `${REGISTRO_SW}\n</body>`);

writeFileSync(join(SALIDA, "index.html"), html);
copyFileSync(join(DISENO, "support.js"), join(SALIDA, "support.js"));

/* ---------- React local ---------- */

for (const f of readdirSync(join(DISENO, "vendor"))) {
  copyFileSync(join(DISENO, "vendor", f), join(SALIDA, "vendor", f));
}

/* ---------- manifest ---------- */

const manifest = {
  name: "FORJA 2.0 (prototipo)",
  short_name: "FORJA 2.0",
  description: "Prototipo del rediseño de FORJA. Maqueta navegable, sin datos reales.",
  lang: "es",
  dir: "ltr",
  start_url: "./",
  scope: "./",
  display: "standalone",
  orientation: "portrait",
  background_color: "#0E0E0E",
  theme_color: "#0E0E0E",
  categories: ["health", "fitness", "lifestyle"],
  icons: [
    { src: "iconos/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "iconos/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "iconos/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};

writeFileSync(join(SALIDA, "manifest.webmanifest"), JSON.stringify(manifest, null, 2));

/* ---------- service worker ---------- */

/*
 * Cache-first con lista fija: el prototipo son cuatro ficheros que no cambian
 * salvo que se vuelva a publicar, y al cambiar VERSION se tira la caché
 * entera. No hace falta Workbox para esto.
 */
const VERSION = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
const sw = `// Generado por scripts/construir-prototipo.mjs — no editar a mano.
const CACHE = "forja2-prototipo-${VERSION}";
const FICHEROS = [
  "./",
  "./index.html",
  "./support.js",
  "./manifest.webmanifest",
  "./vendor/react.production.min.js",
  "./vendor/react-dom.production.min.js",
  "./iconos/icono-192.png",
  "./iconos/icono-512.png",
  "./iconos/icono-maskable-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHEROS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      // Navegación offline a una ruta que no está en caché: cae al index.
      return fetch(e.request).catch(() =>
        e.request.mode === "navigate" ? caches.match("./index.html") : Response.error(),
      );
    }),
  );
});
`;

writeFileSync(join(SALIDA, "sw.js"), sw);

/* ---------- iconos ---------- */

const ORIGEN_ICONOS = join(RAIZ, "public", "iconos");
let copiados = 0;
try {
  for (const f of readdirSync(ORIGEN_ICONOS)) {
    copyFileSync(join(ORIGEN_ICONOS, f), join(SALIDA, "iconos", f));
    copiados++;
  }
} catch {
  console.warn("No hay iconos en public/iconos: ejecuta `npm run iconos` primero.");
}

// GitHub Pages pasa la carpeta por Jekyll y se come lo que empieza por "_".
writeFileSync(join(SALIDA, ".nojekyll"), "");

console.log(`prototipo/ listo · index.html + support.js + sw.js + ${copiados} iconos`);
