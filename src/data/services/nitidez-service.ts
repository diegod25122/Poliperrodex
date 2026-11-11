import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { decode } from 'jpeg-js';

// RETO 2 · ¿Salió movida la foto?
//
// Una foto nítida tiene bordes marcados: entre un píxel y su vecino el brillo
// cambia mucho. Una foto movida o desenfocada tiene esos cambios "lavados".
// El operador Laplaciano mide justamente eso (cuánto difiere cada píxel de
// sus 4 vecinos) y la VARIANZA de ese resultado resume la imagen en un número:
// alto = nítida, bajo = borrosa. Es el método clásico de Pech-Pacheco et al.
// (2000) y el que usa OpenCV en los ejemplos de detección de desenfoque.
//
// Se mide sobre una copia pequeña (ANCHO_ANALISIS px) en escala de grises:
// así toma décimas de segundo en JavaScript y el número no depende de la
// resolución de la cámara de cada teléfono.
const ANCHO_ANALISIS = 400;

export async function medirNitidez(uri: string): Promise<number> {
  const contexto = ImageManipulator.manipulate(uri);
  contexto.resize({ width: ANCHO_ANALISIS, height: null });
  const imagen = await contexto.renderAsync();
  const chica = await imagen.saveAsync({ format: SaveFormat.JPEG, compress: 1 });

  const bytes = new Uint8Array(await new File(chica.uri).arrayBuffer());
  const { width, height, data } = decode(bytes, { useTArray: true });

  // Escala de grises (luminancia), un valor por píxel.
  const gris = new Float32Array(width * height);
  for (let i = 0, p = 0; i < gris.length; i++, p += 4) {
    gris[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }

  // Laplaciano 3x3 [0 1 0 / 1 -4 1 / 0 1 0] y su varianza (sin los bordes).
  let suma = 0;
  let sumaCuadrados = 0;
  let n = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const l = gris[i - width] + gris[i + width] + gris[i - 1] + gris[i + 1] - 4 * gris[i];
      suma += l;
      sumaCuadrados += l * l;
      n++;
    }
  }
  const media = suma / n;
  return sumaCuadrados / n - media * media;
}

// Deja la foto lista para subir: máximo ANCHO_SUBIDA px de ancho (sin
// deformarla: el alto se calcula solo) y buena calidad JPEG. Así ya no hace
// falta comprimir fuerte en la cámara (quality 0.6 añadía bloques y borrosidad)
// y el archivo sigue cabiendo en el límite de 5 MB del bucket.
const ANCHO_SUBIDA = 1600;

export async function prepararParaSubir(uri: string): Promise<string> {
  const contexto = ImageManipulator.manipulate(uri);
  contexto.resize({ width: ANCHO_SUBIDA, height: null });
  const imagen = await contexto.renderAsync();
  const lista = await imagen.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
  return lista.uri;
}
