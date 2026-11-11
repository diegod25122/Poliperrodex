import { Accelerometer } from 'expo-sensors';

const UMBRAL_CAIDA_LIBRE = 0.35; // g
const DURACION_MINIMA_CAIDA_MS = 120;
const UMBRAL_IMPACTO = 2.2; // g
const VENTANA_IMPACTO_MS = 1000;

// Envuelve el sensor y entrega un solo evento: "hubo una caída".
// Quien lo usa no necesita saber nada de vectores ni de unidades g.
// Devuelve la función para dejar de escuchar.
export function escucharCaidas(alCaer: () => void): () => void {
  let inicioCaidaLibre: number | null = null;
  let finCaidaLibre: number | null = null;

  Accelerometer.setUpdateInterval(40);
  const suscripcion = Accelerometer.addListener(({ x, y, z }) => {
    const magnitud = Math.sqrt(x * x + y * y + z * z);
    const ahora = Date.now();

    if (magnitud < UMBRAL_CAIDA_LIBRE) {
      inicioCaidaLibre ??= ahora;
      return;
    }
    if (inicioCaidaLibre !== null) {
      if (ahora - inicioCaidaLibre >= DURACION_MINIMA_CAIDA_MS) finCaidaLibre = ahora;
      inicioCaidaLibre = null;
    }
    if (finCaidaLibre !== null) {
      if (ahora - finCaidaLibre > VENTANA_IMPACTO_MS) finCaidaLibre = null;
      else if (magnitud > UMBRAL_IMPACTO) {
        finCaidaLibre = null;
        alCaer();
      }
    }
  });

  return () => suscripcion.remove();
}

// RETO 2 · Esperar a que el teléfono esté quieto antes de disparar.
// Al tocar el botón la mano empuja el teléfono, y esa sacudida es la causa
// número uno de fotos movidas. Miramos las últimas MUESTRAS_QUIETUD lecturas
// 0,3 s: si la aceleración casi no cambia, el teléfono está quieto.
// Resuelve true si se quedó quieto, o false si pasó el tiempo máximo
// (entonces se dispara igual y la revisión de nitidez decide).
const MUESTRAS_QUIETUD = 8;
const UMBRAL_QUIETUD = 0.04; 

export function esperarQuietud(tiempoMaximoMs = 1500): Promise<boolean> {
  return new Promise((resolver) => {
    const ultimas: number[] = [];
    Accelerometer.setUpdateInterval(40);
    const suscripcion = Accelerometer.addListener(({ x, y, z }) => {
      ultimas.push(Math.sqrt(x * x + y * y + z * z));
      if (ultimas.length > MUESTRAS_QUIETUD) ultimas.shift();
      if (ultimas.length < MUESTRAS_QUIETUD) return;
      const media = ultimas.reduce((a, b) => a + b, 0) / ultimas.length;
      const varianza = ultimas.reduce((a, b) => a + (b - media) ** 2, 0) / ultimas.length;
      if (Math.sqrt(varianza) < UMBRAL_QUIETUD) terminar(true);
    });
    const reloj = setTimeout(() => terminar(false), tiempoMaximoMs);
    function terminar(quieto: boolean) {
      clearTimeout(reloj);
      suscripcion.remove();
      resolver(quieto);
    }
  });
}
