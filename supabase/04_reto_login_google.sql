-- RETO 1 · Login con Google (Supabase Auth).
-- Ejecutar DESPUÉS de 01, 02 y 03. Cambia solo permisos y políticas:
-- las tablas y los datos se quedan igual.

-- 1) El usuario con sesión usa el rol "authenticated", no "anon".
--    Las políticas "to anon" NO le aplican, así que hay que darle permisos.
grant select on public.perros to authenticated;
grant select, insert on public.avistamientos to authenticated;

-- 2) Ver sigue siendo público (con o sin sesión).
drop policy if exists "Cualquiera puede ver los perros" on public.perros;
create policy "Cualquiera puede ver los perros"
  on public.perros for select
  to anon, authenticated
  using (true);

drop policy if exists "Cualquiera puede ver los avistamientos" on public.avistamientos;
create policy "Cualquiera puede ver los avistamientos"
  on public.avistamientos for select
  to anon, authenticated
  using (true);

-- 3) La política de inserción: ya no "cualquiera con cualquier apodo".
--    Solo alguien con sesión, y el apodo DEBE ser el de su correo
--    (lo que va antes de la @, en minúsculas, máximo 20 caracteres).
--    La app calcula lo mismo en entrenador-repository.ts.
revoke insert on public.avistamientos from anon;
drop policy if exists "Cualquiera puede registrar un avistamiento" on public.avistamientos;
create policy "Solo el dueño de la sesión registra a su nombre"
  on public.avistamientos for insert
  to authenticated
  with check (
    apodo = left(split_part(lower(auth.jwt() ->> 'email'), '@', 1), 20)
  );

-- 4) Subir la foto de la captura también exige sesión.
drop policy if exists "Subir fotos de captura" on storage.objects;
create policy "Subir fotos de captura"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'poliperrodex'
    and (storage.foldername(name))[1] = 'capturas'
    and storage.extension(name) = 'jpg'
  );
