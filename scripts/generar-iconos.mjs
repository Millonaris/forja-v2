/*
 * FORJA 2.0 · Generador de iconos de la PWA.
 *
 * Dibuja el icono a mano y escribe los PNG sin depender de ninguna librería
 * de imagen: solo zlib, que ya viene con Node. Así se puede regenerar el icono
 * en cualquier máquina con `npm run iconos` sin instalar nada más.
 *
 * Se dibuja al cuádruple de tamaño y se reduce después (supermuestreo), que es
 * lo que da los bordes suaves de las esquinas redondeadas.
 */

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, "..", "iconos");

const NEGRO = [14, 14, 14]; // #0E0E0E, el fondo del rediseño
const LIMA = [243, 255, 71]; // #F3FF47, el acento de FORJA 2.0 (la v1 usa cian)
const BLANCO = [255, 255, 255];

/**
 * La F de FORJA en geometría pura, en coordenadas del lienzo de 512:
 * asta vertical + dos brazos, con el mismo trazo grueso de la tipografía
 * condensada del sistema. [x, y, ancho, alto, radio]
 */
const BARRAS = [
  [150, 110, 56, 292, 10], // asta
  [150, 110, 214, 56, 10], // brazo superior
  [150, 222, 160, 56, 10], // brazo central
];

/** ¿Está el punto dentro de un rectángulo de esquinas redondeadas? */
function dentroDeRedondeado(px, py, x, y, ancho, alto, radio) {
  if (px < x || py < y || px >= x + ancho || py >= y + alto) return false;
  const r = Math.min(radio, ancho / 2, alto / 2);
  // Centro del arco de la esquina más cercana.
  const cx = Math.min(Math.max(px, x + r), x + ancho - r);
  const cy = Math.min(Math.max(py, y + r), y + alto - r);
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

/**
 * Genera los píxeles RGBA del icono.
 * @param tam            lado en píxeles
 * @param escalaContenido 1 = a sangre; <1 deja zona segura (iconos maskable);
 *                        >1 amplía el glifo (para el badge, que se ve diminuto)
 * @param radioRelativo  radio de la esquina del fondo, 0 = cuadrado
 * @param fondo          color de fondo, o null para fondo transparente
 * @param tinta          color de las barras de la F
 */
function dibujar(tam, escalaContenido, radioRelativo, fondo = NEGRO, tinta = LIMA) {
  const SS = 4; // factor de supermuestreo
  const grande = tam * SS;
  const acumulado = new Float32Array(tam * tam * 4);

  const radioFondo = grande * radioRelativo;
  const escala = (grande / 512) * escalaContenido;
  const desplazamiento = (grande - 512 * escala) / 2;

  for (let y = 0; y < grande; y++) {
    for (let x = 0; x < grande; x++) {
      let color = null;

      // Fondo (cuadrado o con esquinas redondeadas). Puede ser transparente.
      const enFondo =
        radioFondo > 0 ? dentroDeRedondeado(x, y, 0, 0, grande, grande, radioFondo) : true;
      if (enFondo) color = fondo;

      // Barras, en coordenadas del lienzo original.
      if (enFondo) {
        const ox = (x - desplazamiento) / escala;
        const oy = (y - desplazamiento) / escala;
        for (const [bx, by, bw, bh, br] of BARRAS) {
          if (dentroDeRedondeado(ox, oy, bx, by, bw, bh, br)) {
            color = tinta;
            break;
          }
        }
      }

      // Se acumula en el píxel de destino para promediar al reducir.
      const dx = Math.floor(x / SS);
      const dy = Math.floor(y / SS);
      const i = (dy * tam + dx) * 4;
      if (color) {
        acumulado[i] += color[0];
        acumulado[i + 1] += color[1];
        acumulado[i + 2] += color[2];
        acumulado[i + 3] += 255;
      }
    }
  }

  const muestras = SS * SS;
  const pixeles = Buffer.alloc(tam * tam * 4);
  for (let i = 0; i < tam * tam * 4; i++) {
    pixeles[i] = Math.round(acumulado[i] / muestras);
  }
  return pixeles;
}

/* ---------- Escritura del PNG ---------- */

const TABLA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = TABLA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function trozo(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length, 0);
  const cuerpo = Buffer.concat([Buffer.from(tipo, "ascii"), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo), 0);
  return Buffer.concat([largo, cuerpo, crc]);
}

function png(ancho, alto, rgba) {
  // Cada línea lleva delante su byte de filtro (0 = sin filtro).
  const conFiltro = Buffer.alloc(alto * (ancho * 4 + 1));
  for (let y = 0; y < alto; y++) {
    conFiltro[y * (ancho * 4 + 1)] = 0;
    rgba.copy(conFiltro, y * (ancho * 4 + 1) + 1, y * ancho * 4, (y + 1) * ancho * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ancho, 0);
  ihdr.writeUInt32BE(alto, 4);
  ihdr[8] = 8; // 8 bits por canal
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // filtro adaptativo
  ihdr[12] = 0; // sin entrelazado

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo("IHDR", ihdr),
    trozo("IDAT", deflateSync(conFiltro, { level: 9 })),
    trozo("IEND", Buffer.alloc(0)),
  ]);
}

/* ---------- Generación ---------- */

mkdirSync(SALIDA, { recursive: true });

const iconos = [
  { nombre: "icono-192.png", tam: 192, contenido: 1, radio: 0.22 },
  { nombre: "icono-512.png", tam: 512, contenido: 1, radio: 0.22 },
  // Maskable: fondo a sangre y contenido al 72 % para que Android pueda
  // recortarlo en círculo, cuadrado o gota sin comerse el dibujo.
  { nombre: "icono-maskable-512.png", tam: 512, contenido: 0.72, radio: 0 },
  // Badge de notificación: Android ignora el color y pinta solo la SILUETA
  // (el canal alfa). Con el icono normal, que es un cuadrado opaco, la
  // silueta es un cuadrado blanco; aquí va la F sola sobre transparente.
  // La F queda centrada de fábrica (su caja va de x150-364, y110-402 en el
  // lienzo de 512: centro 257,256) y se amplía porque el badge se ve diminuto.
  { nombre: "badge-96.png", tam: 96, contenido: 1.5, radio: 0, fondo: null, tinta: BLANCO },
  // Versión grande del badge para el manifest (purpose: "monochrome"): es la
  // que usa Android para la barra de estado cuando la app está instalada.
  { nombre: "icono-monocromo-512.png", tam: 512, contenido: 1.5, radio: 0, fondo: null, tinta: BLANCO },
];

for (const { nombre, tam, contenido, radio, fondo = NEGRO, tinta = LIMA } of iconos) {
  const datos = png(tam, tam, dibujar(tam, contenido, radio, fondo, tinta));
  writeFileSync(join(SALIDA, nombre), datos);
  console.log(`${nombre} · ${tam}×${tam} · ${(datos.length / 1024).toFixed(1)} KB`);
}
