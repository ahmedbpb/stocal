-- Run this in Supabase SQL Editor if not already applied.
-- Extends products for storytelling, condition grading, and image URLs.

alter table public.products
  add column if not exists brand_name text,
  add column if not exists description text,
  add column if not exists condition text check (condition in ('new', 'used')),
  add column if not exists image_urls text[] not null default '{}';

-- Storage bucket for product / condition-proof images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

create policy "Product images: authenticated upload to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Product images: public read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');
