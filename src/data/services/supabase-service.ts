import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { env } from './env';

// Service: envuelve una fuente de datos externa y nada más.
// No guarda estado ni transforma datos; eso le toca al repositorio.
//
// RETO 1 · Con login la sesión sí se guarda: en AsyncStorage, para que al
// cerrar y abrir la app el entrenador siga dentro. El token se renueva solo
// mientras la app está en primer plano, como recomienda Supabase.
export const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    // La sesión de Google llega en la URL de regreso y la lee
    // google-auth-service; no hay barra de direcciones que revisar.
    detectSessionInUrl: false,
  },
});

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (estado) => {
    if (estado === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export function urlPublica(ruta: string): string {
  return supabase.storage.from(env.bucket).getPublicUrl(ruta).data.publicUrl;
}

export async function subirImagen(ruta: string, bytes: ArrayBuffer): Promise<void> {
  const { error } = await supabase.storage
    .from(env.bucket)
    .upload(ruta, bytes, { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error(`No se pudo subir la foto: ${error.message}`);
}
