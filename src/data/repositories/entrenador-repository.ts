import type { Entrenador } from '@/domain/models/entrenador';

import {
  cerrarSesion,
  escucharUsuario,
  iniciarSesionConGoogle,
  sesionDesdeUrl,
  usuarioActual,
  type UsuarioAuth,
} from '../services/google-auth-service';

// RETO 1 · Antes el "entrenador" era un apodo guardado en un archivo del
// teléfono, y cualquiera podía escribir el apodo de otro. Ahora sale de la
// sesión de Supabase Auth con Google. 

// El apodo es la parte del correo antes de la @, en minúsculas y con máximo
// 20 caracteres (el CHECK de la tabla). La política de inserción calcula lo
// mismo desde el token, así que nadie puede guardar con el apodo de otro.
export function apodoDesdeCorreo(correo: string): string {
  return correo.toLowerCase().split('@')[0].slice(0, 20);
}

function aDominio(usuario: UsuarioAuth): Entrenador {
  const apodo = apodoDesdeCorreo(usuario.correo);
  return {
    id: usuario.id,
    apodo,
    nombre: usuario.nombre ?? apodo,
    fotoUrl: usuario.foto,
  };
}

export const entrenadorRepository = {
  async actual(): Promise<Entrenador | null> {
    const usuario = await usuarioActual();
    return usuario ? aDominio(usuario) : null;
  },

  // Devuelve la función para dejar de escuchar.
  escuchar(alCambiar: (entrenador: Entrenador | null) => void): () => void {
    return escucharUsuario((usuario) => alCambiar(usuario ? aDominio(usuario) : null));
  },

  // true si quedó dentro; false si cerró el navegador sin elegir cuenta.
  entrarConGoogle(): Promise<boolean> {
    return iniciarSesionConGoogle();
  },

  // Cuando el sistema abre la app con el enlace de regreso de Google.
  completarDesdeUrl(url: string): Promise<boolean> {
    return sesionDesdeUrl(url);
  },

  salir(): Promise<void> {
    return cerrarSesion();
  },
};
