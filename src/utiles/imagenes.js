/*
 * Fotos de progreso.
 *
 * Una foto del móvil son 3-5 MB. Guardarlas tal cual llenaría IndexedDB y
 * haría la copia de seguridad imposible de mandar por correo, así que se
 * reducen a 1080 px de lado largo y JPEG al 82 %: ~150-250 KB, de sobra para
 * comparar cómo estás y ligeras para un backup de meses.
 *
 * Se guardan como Blob, no como cadena base64: ocupan un 33 % menos y no hay
 * que descodificarlas para pintarlas.
 */

const LADO_MAXIMO = 1080;
const CALIDAD = 0.82;

/** Reduce y comprime un fichero de imagen. Devuelve un Blob JPEG. */
export async function comprimir(fichero) {
  const bitmap = await crearBitmap(fichero);

  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);

  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  lienzo.getContext("2d").drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close?.();

  return new Promise((resolver, rechazar) => {
    lienzo.toBlob(
      (blob) => (blob ? resolver(blob) : rechazar(new Error("No se pudo procesar la foto."))),
      "image/jpeg",
      CALIDAD,
    );
  });
}

/*
 * `createImageBitmap` con `imageOrientation: "from-image"` respeta el EXIF:
 * sin eso, las fotos hechas en vertical con algunos móviles salen tumbadas.
 * Safari viejo no lo soporta, y ahí se cae al camino del <img>.
 */
async function crearBitmap(fichero) {
  try {
    return await createImageBitmap(fichero, { imageOrientation: "from-image" });
  } catch {
    return new Promise((resolver, rechazar) => {
      const url = URL.createObjectURL(fichero);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolver(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        rechazar(new Error("No se pudo leer la foto."));
      };
      img.src = url;
    });
  }
}

/** Blob → data URL. Lo usa la copia de seguridad, que es un único JSON. */
export function aDataUrl(blob) {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(lector.result);
    lector.onerror = () => rechazar(lector.error);
    lector.readAsDataURL(blob);
  });
}

/** data URL → Blob, al restaurar una copia. */
export async function aBlob(dataUrl) {
  return (await fetch(dataUrl)).blob();
}

/** Tamaño legible para avisar de cuánto ocupa la copia. */
export function pesoLegible(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
