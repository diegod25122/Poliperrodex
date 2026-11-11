import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { entrenadorRepository } from '@/data/repositories/entrenador-repository';
import type { Entrenador } from '@/domain/models/entrenador';

// Es un ViewModel compartido: el apodo lo necesitan la Pokédex, la captura
// y el perfil. Por eso vive en un contexto de React y no en una sola pantalla.
// No guarda nada por su cuenta: lee y escribe a través del repositorio.
//
// RETO 1 · El apodo ya no se escribe: sale de la sesión de Google. Las
// pantallas siguen leyendo `apodo` y `listo` igual que antes; lo que cambia
// son las acciones: entrar con Google y cerrar sesión.
type EstadoApodo = {
  apodo: string | null;
  entrenador: Entrenador | null;
  // false mientras se lee la sesión guardada; evita mostrar el login un
  // instante y esconderlo enseguida.
  listo: boolean;
  entrando: boolean;
  error: string | null;
  entrarConGoogle: () => Promise<void>;
  completarDesdeUrl: (url: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
};

const ApodoContext = createContext<EstadoApodo | null>(null);

export function ApodoProvider({ children }: { children: ReactNode }) {
  const [entrenador, setEntrenador] = useState<Entrenador | null>(null);
  const [listo, setListo] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    entrenadorRepository
      .actual()
      .then((e) => vigente && setEntrenador(e))
      // Si la sesión guardada está dañada, se pide entrar de nuevo y listo.
      .catch(() => vigente && setEntrenador(null))
      .finally(() => vigente && setListo(true));
    // La fuente de verdad es la sesión de Supabase: cuando entra o sale
    // alguien (desde cualquier pantalla), todas se enteran.
    const dejarDeEscuchar = entrenadorRepository.escuchar(setEntrenador);
    return () => {
      vigente = false;
      dejarDeEscuchar();
    };
  }, []);

  async function entrarConGoogle() {
    setEntrando(true);
    setError(null);
    try {
      await entrenadorRepository.entrarConGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo entrar con Google');
    } finally {
      setEntrando(false);
    }
  }

  async function completarDesdeUrl(url: string) {
    try {
      await entrenadorRepository.completarDesdeUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo entrar con Google');
    }
  }

  async function cerrarSesion() {
    setError(null);
    try {
      await entrenadorRepository.salir();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cerrar la sesión');
    }
  }

  return (
    <ApodoContext.Provider
      value={{
        apodo: entrenador?.apodo ?? null,
        entrenador,
        listo,
        entrando,
        error,
        entrarConGoogle,
        completarDesdeUrl,
        cerrarSesion,
      }}>
      {children}
    </ApodoContext.Provider>
  );
}

export function useApodo(): EstadoApodo {
  const valor = useContext(ApodoContext);
  if (!valor) throw new Error('useApodo debe usarse dentro de <ApodoProvider>');
  return valor;
}
