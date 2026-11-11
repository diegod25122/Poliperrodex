-- Los perros que se pueden capturar. Esta tabla la llena el docente
-- y la app solo la lee.
create table public.perros (
  id          uuid primary key default gen_random_uuid(),
  numero      smallint not null unique,
  nombre      text not null unique,
  rasgo       text not null,
  descripcion text not null,
  foto_path   text not null,
  creado_en   timestamptz not null default now()
);

-- Cada foto que alguien toma de un perro.
create table public.avistamientos (
  id         uuid primary key default gen_random_uuid(),
  perro_id   uuid not null references public.perros (id) on delete cascade,
  apodo      text not null check (char_length(apodo) between 3 and 20),
  foto_path  text not null,
  latitud    double precision not null check (latitud between -90 and 90),
  longitud   double precision not null check (longitud between -180 and 180),
  creado_en  timestamptz not null default now()
);

-- La Pokédex filtra por apodo y el perfil por perro; sin estos índices,
-- cada consulta recorre la tabla completa.
create index avistamientos_perro_id_idx on public.avistamientos (perro_id);
create index avistamientos_apodo_idx on public.avistamientos (apodo);

-- Los tres poliperros. foto_path es el nombre del archivo en la raíz del bucket:
-- la fila puede existir antes de subir la foto, solo que la app mostrará
-- un recuadro vacío hasta que el archivo esté en Storage con ese nombre.
-- Los rasgos y descripciones son de ejemplo: cámbialos por los reales.
insert into public.perros (numero, nombre, rasgo, descripcion, foto_path) values
  (1, 'Franzua', 'Tipo: Guardián',
   'Patrulla la entrada desde temprano y conoce a todos los guardias por su nombre.',
   'franzua.jpg'),
  (2, 'Asiri', 'Tipo: Exploradora',
   'Nunca está dos veces en el mismo lugar. Si la ves, ya tienes suerte.',
   'asiri.jpg'),
  (3, 'Teo', 'Tipo: Dormilón',
   'Su hábitat natural es cualquier rincón con sol. Se deja fotografiar sin problema.',
   'teo.jpg');
