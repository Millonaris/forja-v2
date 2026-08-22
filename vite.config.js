import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

export default defineConfig({
  // Versión y fecha de compilación visibles en Ajustes: sin esto no hay forma
  // de saber qué versión tiene instalada el móvil cuando algo no se actualiza.
  define: {
    __VERSION_FORJA__: JSON.stringify(version),
    __FECHA_FORJA__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },

  // Rutas relativas: la app funciona igual servida en la raíz que en una
  // subcarpeta de GitHub Pages, y también abierta desde el propio dispositivo.
  base: "./",

  plugins: [
    react(),

    VitePWA({
      // La app se actualiza sola cuando publicas una versión nueva.
      registerType: "autoUpdate",
      includeAssets: ["iconos/*.png"],

      manifest: {
        name: "FORJA",
        short_name: "FORJA",
        description: "Entrenamiento, carrera, postura y nutrición. Todo local, sin internet.",
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
          // Monocromo: instalada como app, Android saca de AQUÍ el iconito de
          // la barra de estado de las notificaciones.
          { src: "iconos/icono-monocromo-512.png", sizes: "512x512", type: "image/png", purpose: "monochrome" },
        ],
        shortcuts: [
          { name: "Empezar entreno", short_name: "Entreno", url: "./#entrenar" },
          { name: "Apuntar peso", short_name: "Peso", url: "./#peso" },
          { name: "Rutina postural", short_name: "Postura", url: "./#postura" },
        ],
      },

      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        // Es parte del propio service worker (ver importScripts): precachearlo
        // sería guardar una copia del trabajador dentro del trabajador.
        globIgnores: ["sw-avisos.js"],
        // El despertador del descanso, que es lo único capaz de avisar con la
        // app en segundo plano o el móvil bloqueado.
        importScripts: ["sw-avisos.js"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },

      devOptions: { enabled: false },
    }),
  ],

  // Accesible desde el móvil en la misma wifi.
  server: { port: Number(process.env.PORT) || 5173, strictPort: false, host: true },
  preview: { port: Number(process.env.PORT) || 4173, host: true },

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("dexie")) return "datos";
          return "vendor";
        },
      },
    },
  },
});
