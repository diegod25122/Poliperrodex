// RETO 1 · Modelo de dominio: quien usa la app. Antes era solo un apodo
// escrito a mano; ahora sale de su cuenta de Google.
export type Entrenador = {
  id: string;
  // Lo que se guarda en avistamientos.apodo. Sale del correo y la base de
  // datos comprueba que coincida con la sesión (supabase/04_reto_login_google.sql).
  apodo: string;
  nombre: string;
  fotoUrl: string | null;
};
