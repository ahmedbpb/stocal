-- Seller dashboard: product status, condition grading, defect fields, and RLS

-- -----------------------------------------------------------------------------
-- 1. Product columns — rename legacy approval_status → status when needed
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'approval_status'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'status'
  ) then
    alter table public.products rename column approval_status to status;
  end if;
end $$;

alter table public.products
  add column if not exists status text not null default 'pending',
  add column if not exists rejection_reason text,
  add column if not exists defect_image_url text,
  add column if not exists is_intact boolean not null default true;

-- Backfill status from legacy approval_status when both columns exist
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'approval_status'
  ) then
    update public.products
    set status = approval_status
    where approval_status is not null and status is distinct from approval_status;
  end if;
end $$;

-- Relax / replace legacy condition check (new|used) → graded stock conditions
alter table public.products drop constraint if exists products_condition_check;

alter table public.products
  add constraint products_condition_check
  check (
    condition is null
    or condition in ('new', 'used', 'like_new', 'good', 'fair')
  );

alter table public.products drop constraint if exists products_status_check;

alter table public.products
  add constraint products_status_check
  check (status in ('pending', 'approved', 'rejected'));

create index if not exists products_seller_id_idx on public.products (seller_id);
create index if not exists products_status_idx on public.products (status);

-- -----------------------------------------------------------------------------
-- 2. Products RLS
-- -----------------------------------------------------------------------------
alter table public.products enable row level security;

drop policy if exists "Products: public can view approved" on public.products;
drop policy if exists "Products: sellers can view own" on public.products;
drop policy if exists "Products: sellers can insert own" on public.products;
drop policy if exists "Products: sellers can update own" on public.products;
drop policy if exists "Products: sellers can delete own" on public.products;
drop policy if exists "Products: super admins full access" on public.products;

create policy "Products: public can view approved"
  on public.products for select to anon, authenticated
  using (status = 'approved');

create policy "Products: sellers can view own"
  on public.products for select to authenticated
  using (seller_id = auth.uid());

create policy "Products: sellers can insert own"
  on public.products for insert to authenticated
  with check (seller_id = auth.uid());

create policy "Products: sellers can update own"
  on public.products for update to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

create policy "Products: sellers can delete own"
  on public.products for delete to authenticated
  using (seller_id = auth.uid());

create policy "Products: super admins full access"
  on public.products for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- 3. Orders: sellers can view orders for their products
-- -----------------------------------------------------------------------------
drop policy if exists "Orders: sellers can view orders for their products" on public.orders;

create policy "Orders: sellers can view orders for their products"
  on public.orders for select to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.seller_id = auth.uid()
    )
  );
