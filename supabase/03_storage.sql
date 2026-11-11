-- Bucket público: las fotos se pueden ver con una URL directa,
-- sin firmar. Limitamos tamaño y tipo desde el propio bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('poliperrodex', 'poliperrodex', true, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Público para leer no significa público para escribir. Subir sigue
-- necesitando una política, y esta solo deja hacerlo dentro de capturas/
-- y con extensión .jpg. La raíz del bucket, donde van las fotos oficiales
-- de los perros, queda solo para quien administra el proyecto.
create policy "Subir fotos de captura"
  on storage.objects for insert
  to anon
  with check (
    bucket_id = 'poliperrodex'
    and (storage.foldername(name))[1] = 'capturas'
    and storage.extension(name) = 'jpg'
  );
