-- Storefront: seller profile fields and public read access for seller profiles.

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists bio text;

comment on column public.profiles.avatar_url is 'Public avatar/logo URL for seller storefronts';
comment on column public.profiles.bio is 'Short seller bio shown on brand/stock storefront pages';

drop policy if exists "Profiles: public can read seller profiles" on public.profiles;
create policy "Profiles: public can read seller profiles"
  on public.profiles
  for select
  to anon, authenticated
  using (role in ('local_brand', 'stock_seller'));

grant select on table public.profiles to anon, authenticated;
