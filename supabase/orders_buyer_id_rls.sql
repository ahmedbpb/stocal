-- Fix RLS when orders table uses buyer_id (not user_id).
-- Run in Supabase SQL Editor if My Orders still returns empty after the page fix.

drop policy if exists "Orders: users can view own orders" on public.orders;
drop policy if exists "Orders: users can insert own orders" on public.orders;

create policy "Orders: users can insert own orders"
  on public.orders for insert to authenticated
  with check (buyer_id = auth.uid());

create policy "Orders: users can view own orders"
  on public.orders for select to authenticated
  using (buyer_id = auth.uid());
