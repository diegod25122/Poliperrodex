-- GRANT dice qué puede hacer el rol sobre la tabla en general.
-- RLS dice qué filas, y bajo qué condición. Hacen falta las dos cosas.
grant select on public.perros to anon;
grant select, insert on public.avistamientos to anon;

alter table public.perros enable row level security;
alter table public.avistamientos enable row level security;

create policy "Cualquiera puede ver los perros"
  on public.perros for select
  to anon
  using (true);

create policy "Cualquiera puede ver los avistamientos"
  on public.avistamientos for select
  to anon
  using (true);

-- sin login, cualquiera con la clave
-- publicable puede insertar avistamientos a nombre de cualquier apodo.
-- No hay políticas de update ni delete, así que nadie puede borrar ni editar.
create policy "Cualquiera puede registrar un avistamiento"
  on public.avistamientos for insert
  to anon
  with check (true);
