-- =============================================================================
-- Stocal — Shopping cart items
-- Run in Supabase SQL Editor before deploying the cart feature.
-- =============================================================================

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  selected_size text,
  selected_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists cart_items_user_product_variant_idx
  on public.cart_items (
    user_id,
    product_id,
    coalesce(selected_size, ''),
    coalesce(selected_color, '')
  );

create index if not exists cart_items_user_id_idx on public.cart_items (user_id);

-- -----------------------------------------------------------------------------
-- RLS — users manage only their own cart
-- -----------------------------------------------------------------------------
alter table public.cart_items enable row level security;

drop policy if exists "Cart: users can view own items" on public.cart_items;
drop policy if exists "Cart: users can insert own items" on public.cart_items;
drop policy if exists "Cart: users can update own items" on public.cart_items;
drop policy if exists "Cart: users can delete own items" on public.cart_items;

create policy "Cart: users can view own items"
  on public.cart_items for select to authenticated
  using (user_id = auth.uid());

create policy "Cart: users can insert own items"
  on public.cart_items for insert to authenticated
  with check (user_id = auth.uid());

create policy "Cart: users can update own items"
  on public.cart_items for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Cart: users can delete own items"
  on public.cart_items for delete to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
grant select, insert, update, delete on table public.cart_items to authenticated;
grant all on table public.cart_items to postgres, service_role;

comment on table public.cart_items is 'Per-user shopping cart line items before checkout';
comment on column public.cart_items.selected_size is 'Size chosen when adding to cart';
comment on column public.cart_items.selected_color is 'Color chosen when adding to cart';
