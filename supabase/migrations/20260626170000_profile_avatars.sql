-- Profile system: avatars storage bucket + bio length constraint

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists bio text;

alter table public.profiles
  drop constraint if exists profiles_bio_length;

alter table public.profiles
  add constraint profiles_bio_length check (bio is null or char_length(bio) <= 200);

-- Avatars bucket (public read, authenticated upload to own folder)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatars: authenticated upload to own folder" on storage.objects;
create policy "Avatars: authenticated upload to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Avatars: authenticated update own folder" on storage.objects;
create policy "Avatars: authenticated update own folder"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Avatars: public read" on storage.objects;
create policy "Avatars: public read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'avatars');
