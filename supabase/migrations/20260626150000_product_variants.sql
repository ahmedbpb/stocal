-- Product variants table + richer product metadata

-- -----------------------------------------------------------------------------
-- 1. New columns on products
-- -----------------------------------------------------------------------------
alter table public.products
  add column if not exists material text,
  add column if not exists gender text,
  add column if not exists sku text;

alter table public.products drop constraint if exists products_gender_check;

alter table public.products
  add constraint products_gender_check
  check (
    gender is null
    or gender in ('Men', 'Women', 'Unisex', 'Kids')
  );

-- -----------------------------------------------------------------------------
-- 2. product_variants table
-- -----------------------------------------------------------------------------
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color text not null,
  size text not null,
  stock_quantity int not null default 0,
  created_at timestamptz not null default now(),
  constraint product_variants_stock_quantity_check check (stock_quantity >= 0)
);

create index if not exists product_variants_product_id_idx
  on public.product_variants (product_id);

-- -----------------------------------------------------------------------------
-- 3. RLS on product_variants
-- -----------------------------------------------------------------------------
alter table public.product_variants enable row level security;

drop policy if exists "Variants: public can read approved product variants" on public.product_variants;
drop policy if exists "Variants: sellers can read own product variants" on public.product_variants;
drop policy if exists "Variants: sellers can insert own product variants" on public.product_variants;
drop policy if exists "Variants: sellers can update own product variants" on public.product_variants;
drop policy if exists "Variants: sellers can delete own product variants" on public.product_variants;
drop policy if exists "Variants: super admins full access" on public.product_variants;

create policy "Variants: public can read approved product variants"
  on public.product_variants for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'approved'
    )
  );

create policy "Variants: sellers can read own product variants"
  on public.product_variants for select to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.seller_id = auth.uid()
    )
  );

create policy "Variants: sellers can insert own product variants"
  on public.product_variants for insert to authenticated
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.seller_id = auth.uid()
    )
  );

create policy "Variants: sellers can update own product variants"
  on public.product_variants for update to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.seller_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.seller_id = auth.uid()
    )
  );

create policy "Variants: sellers can delete own product variants"
  on public.product_variants for delete to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.seller_id = auth.uid()
    )
  );

create policy "Variants: super admins full access"
  on public.product_variants for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

grant select on table public.product_variants to anon, authenticated;
grant insert, update, delete on table public.product_variants to authenticated;
grant all on table public.product_variants to postgres, service_role;
