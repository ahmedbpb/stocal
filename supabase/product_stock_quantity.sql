-- =============================================================================
-- Stocal — Product inventory / stock quantity
-- Run in Supabase SQL Editor before deploying stock management.
-- =============================================================================

alter table public.products
  add column if not exists stock_quantity integer not null default 1;

alter table public.products
  drop constraint if exists products_stock_quantity_check;

alter table public.products
  add constraint products_stock_quantity_check
  check (stock_quantity >= 0);

comment on column public.products.stock_quantity is 'Available units for sale; 0 means sold out';

-- Atomic stock deduction at checkout (callable by authenticated buyers)
create or replace function public.deduct_product_stock(
  p_product_id uuid,
  p_quantity integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be positive';
  end if;

  update public.products
  set stock_quantity = stock_quantity - p_quantity
  where id = p_product_id
    and stock_quantity >= p_quantity;

  if not found then
    raise exception 'Insufficient stock for product %', p_product_id;
  end if;
end;
$$;

grant execute on function public.deduct_product_stock(uuid, integer) to authenticated;
