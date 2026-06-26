-- RBAC: profiles table, role enum, and helpers for Stocal
-- Run in the Supabase SQL Editor if not already applied.
--
-- Role model:
--   customer      — default shoppers (home, cart, orders)
--   local_brand   — can list local brand products
--   stock_seller  — can list original stock products
--   super_admin   — full /admin dashboard access (platform admin)

-- 1. Role enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum (
      'customer',
      'local_brand',
      'stock_seller',
      'super_admin'
    );
  end if;
end $$;

-- 2. Profiles table (one row per auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure role column exists on older deployments
alter table public.profiles
  add column if not exists role public.user_role not null default 'customer';

-- 3. Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 4. Helper used by RLS policies
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'super_admin'
  );
$$;

-- 5. RLS
alter table public.profiles enable row level security;

drop policy if exists "Profiles: users can read own profile" on public.profiles;
create policy "Profiles: users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Profiles: users can update own profile" on public.profiles;
create policy "Profiles: users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 6. Promote your first admin (replace with your user UUID)
-- update public.profiles set role = 'super_admin' where id = '<your-auth-user-uuid>';

grant usage on schema public to authenticated;
grant select, update on table public.profiles to authenticated;
