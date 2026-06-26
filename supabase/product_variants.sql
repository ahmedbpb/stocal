-- =============================================================================
-- Stocal — Size & color variants on products; selections on orders
-- Run in Supabase SQL Editor before deploying the variant checkout update.
-- =============================================================================

alter table public.products
  add column if not exists sizes text[] not null default '{}',
  add column if not exists colors text[] not null default '{}';

alter table public.orders
  add column if not exists selected_size text,
  add column if not exists selected_color text;

comment on column public.products.sizes is 'Available sizes for this listing (e.g. S, M, L or shoe sizes)';
comment on column public.products.colors is 'Available colors for this listing (e.g. Black, White)';
comment on column public.orders.selected_size is 'Size chosen by the buyer at checkout';
comment on column public.orders.selected_color is 'Color chosen by the buyer at checkout';
