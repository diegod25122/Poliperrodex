import * as Linking from 'expo-linking';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useApodo } from '@/ui/core/apodo-view-model';
import { Estado } from '@/ui/core/estado';
import { colores } from '@/ui/core/tema';
import { Texto } from '@/ui/core/texto';

// RETO 1 · Google → Supabase → esta pantalla. Cuando Supabase devuelve a la
// app (exp://.../auth/callback o poliperrodex://auth/callback), Expo Router
// abre esta ruta. Si la URL trae la sesión, se la pasa al ViewModel; cuando
// la sesión existe, vuelve a la Pokédex.
//
// Leer la URL es trabajo de la vista (igual que el id del perfil del perro):
// el ViewModel recibe el texto ya leído.
export function LoginCallbackScreen() {
  const { apodo, completarDesdeUrl } = useApodo();
  const url = Linking.useLinkingURL();
  const [termino, setTermino] = useState(false);

  useEffect(() => {
    let vigente = true;
    const conSesion = url && /access_token|code=/.test(url);
    (conSesion ? completarDesdeUrl(url) : Promise.resolve()).finally(
      () => vigente && setTermino(true),
    );
    return () => {
      vigente = false;
    };
    // completarDesdeUrl cambia en cada render del proveedor; la URL es lo que importa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Esta ruta no es una pestaña: hay que salir de ella cuando ya hay sesión,
  // o cuando terminó sin sesión (la Pokédex mostrará el botón de Google).
  if (apodo || termino) return <Redirect href="/" />;

  return (
    <View style={estilos.fondo}>
      <Estado cargando />
      <Texto variante="nota" style={estilos.texto}>
        Entrando con Google…
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.papel },
  texto: { textAlign: 'center', paddingBottom: 48 },
});
