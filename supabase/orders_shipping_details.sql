-- =============================================================================
-- Stocal — Add shipping details to orders
-- Run in Supabase SQL Editor before deploying the checkout update.
-- =============================================================================

alter table public.orders
  add column if not exists phone text,
  add column if not exists address text;

comment on column public.orders.phone is 'Customer phone number for delivery coordination';
comment on column public.orders.address is 'Customer delivery address';
