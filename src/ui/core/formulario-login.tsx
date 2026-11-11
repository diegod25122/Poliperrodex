import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useApodo } from './apodo-view-model';
import { colores, espacio, radio } from './tema';
import { Texto } from './texto';

// RETO 1 · Reemplaza al formulario del apodo. Ya no se escribe nada:
// el entrenador entra con su cuenta de Google y su apodo sale del correo.
// Es una vista: no toca el repositorio, llama a entrarConGoogle del ViewModel.
export function FormularioLogin() {
  const { entrarConGoogle, entrando, error } = useApodo();

  return (
    <View style={estilos.caja}>
      <Texto variante="subtitulo">Antes de capturar, identifícate</Texto>
      <Texto variante="nota">
        Tus capturas quedan a nombre de tu cuenta de Google. Ya nadie puede
        registrar un avistamiento con tu apodo: la base de datos lo comprueba.
      </Texto>

      <Pressable
        onPress={entrarConGoogle}
        disabled={entrando}
        accessibilityRole="button"
        accessibilityLabel="Continuar con Google"
        style={({ pressed }) => [estilos.boton, (pressed || entrando) && { opacity: 0.6 }]}>
        {entrando ? (
          <ActivityIndicator color={colores.tinta} />
        ) : (
          <MaterialCommunityIcons name="google" size={22} color={colores.terracota} />
        )}
        <Text style={estilos.textoBoton}>
          {entrando ? 'Esperando a Google…' : 'Continuar con Google'}
        </Text>
      </Pressable>

      {error && <Texto style={{ color: colores.alerta }}>{error}</Texto>}
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: { gap: espacio.m, padding: espacio.l },
  boton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.s,
    borderWidth: 1.5,
    borderColor: colores.tinta,
    borderRadius: radio,
    backgroundColor: colores.blanco,
  },
  textoBoton: { fontSize: 16, fontWeight: '600', color: colores.tinta },
});
