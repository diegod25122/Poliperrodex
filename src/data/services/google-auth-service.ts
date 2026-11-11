import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from './supabase-service';

// RETO 1 · Service: envuelve el login con Google de Supabase Auth (OAuth).
// Entrega datos crudos del usuario; convertirlos en "entrenador" le toca
// al repositorio.
//
// El flujo:
// 1. Supabase arma la URL de Google (signInWithOAuth con skipBrowserRedirect).
// 2. expo-web-browser la abre en el navegador del teléfono.
// 3. El usuario elige su cuenta; Google vuelve a Supabase y Supabase
//    redirige a la app con los tokens en la URL.
// 4. Se leen los tokens y se crea la sesión con setSession.

// En web, cierra la ventana emergente cuando Google termina.
WebBrowser.maybeCompleteAuthSession();

// Expo Go: exp://192.168.x.x:8081/--/auth/callback · APK: poliperrodex://auth/callback
// Las dos tienen que estar en Supabase → Authentication → URL Configuration.
export const urlDeRegreso = Linking.createURL('auth/callback');

export type UsuarioAuth = {
  id: string;
  correo: string;
  nombre: string | null;
  foto: string | null;
};

type UsuarioSupabase = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

function aUsuarioAuth(u: UsuarioSupabase): UsuarioAuth {
  const m = u.user_metadata ?? {};
  return {
    id: u.id,
    correo: u.email ?? '',
    nombre: (m.full_name ?? m.name ?? null) as string | null,
    foto: (m.avatar_url ?? m.picture ?? null) as string | null,
  };
}

// Lee los parámetros del # (flujo implícito) y del ? (código PKCE o error).
function parametros(url: string): Record<string, string> {
  const salida: Record<string, string> = {};
  const partes = [url.split('#')[1], url.split('?')[1]?.split('#')[0]];
  for (const parte of partes) {
    if (!parte) continue;
    for (const par of parte.split('&')) {
      const [clave, valor = ''] = par.split('=');
      if (clave) salida[decodeURIComponent(clave)] = decodeURIComponent(valor.replace(/\+/g, ' '));
    }
  }
  return salida;
}

export async function usuarioActual(): Promise<UsuarioAuth | null> {
  const { data } = await supabase.auth.getSession();
  return data.session ? aUsuarioAuth(data.session.user) : null;
}

// Avisa cada vez que alguien entra o sale. Devuelve la función para dejar de escuchar.
export function escucharUsuario(alCambiar: (usuario: UsuarioAuth | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => {
    alCambiar(sesion ? aUsuarioAuth(sesion.user) : null);
  });
  return () => data.subscription.unsubscribe();
}

// Crea la sesión con los tokens de la URL de regreso. true si había sesión en la URL.
export async function sesionDesdeUrl(url: string): Promise<boolean> {
  const p = parametros(url);
  if (p.error_description || p.error) throw new Error(p.error_description || p.error);
  if (p.access_token && p.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: p.access_token,
      refresh_token: p.refresh_token,
    });
    if (error) throw new Error(`No se pudo abrir la sesión: ${error.message}`);
    return true;
  }
  if (p.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(p.code);
    if (error) throw new Error(`No se pudo abrir la sesión: ${error.message}`);
    return true;
  }
  return false;
}

// true si quedó la sesión abierta; false si el usuario cerró el navegador.
export async function iniciarSesionConGoogle(): Promise<boolean> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: urlDeRegreso,
      skipBrowserRedirect: true,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw new Error(`No se pudo iniciar con Google: ${error.message}`);
  if (!data?.url) throw new Error('Supabase no devolvió la dirección de Google');

  const respuesta = await WebBrowser.openAuthSessionAsync(data.url, urlDeRegreso);
  if (respuesta.type !== 'success') return false;
  return sesionDesdeUrl(respuesta.url);
}

export async function cerrarSesion(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`No se pudo cerrar la sesión: ${error.message}`);
}
