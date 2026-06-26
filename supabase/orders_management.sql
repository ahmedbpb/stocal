-- =============================================================================
-- Stocal — Orders table for purchase requests
-- Run in Supabase SQL Editor. Migrates legacy orders table if present.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Create or migrate orders table
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Rename legacy buyer_id → user_id
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'buyer_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'user_id'
  ) then
    alter table public.orders rename column buyer_id to user_id;
  end if;
end $$;

-- Ensure user_id exists on fresh legacy tables without buyer_id
alter table public.orders
  add column if not exists user_id uuid references public.profiles (id) on delete restrict;

alter table public.orders
  add column if not exists status text not null default 'pending';

alter table public.orders
  drop column if exists hub_status;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_status_check'
  ) then
    alter table public.orders
      add constraint orders_status_check
      check (status in ('pending', 'confirmed', 'shipped', 'cancelled'));
  end if;
end $$;

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_product_id_idx on public.orders (product_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- -----------------------------------------------------------------------------
-- 2. RLS — drop legacy policies, create new ones
-- -----------------------------------------------------------------------------
alter table public.orders enable row level security;

drop policy if exists "Orders: buyers can view own orders" on public.orders;
drop policy if exists "Orders: sellers can view orders for their products" on public.orders;
drop policy if exists "Orders: super admins can view all orders" on public.orders;
drop policy if exists "Orders: customers can insert own orders" on public.orders;
drop policy if exists "Orders: super admins can update orders" on public.orders;

create policy "Orders: users can insert own orders"
  on public.orders for insert to authenticated
  with check (user_id = auth.uid());

create policy "Orders: users can view own orders"
  on public.orders for select to authenticated
  using (user_id = auth.uid());

create policy "Orders: super admins can view all orders"
  on public.orders for select to authenticated
  using (public.is_super_admin());

create policy "Orders: super admins can update all orders"
  on public.orders for update to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- 3. Grants
-- -----------------------------------------------------------------------------
grant select, insert on table public.orders to authenticated;
grant update on table public.orders to authenticated;
grant all on table public.orders to postgres, service_role;
