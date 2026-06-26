-- Run in Supabase SQL Editor for User Management dashboard.
-- Enables super admins to list users (with email) and update roles.

-- Allow super admins to update any profile (role changes)
create policy "Profiles: super admins can update any profile"
  on public.profiles
  for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- RPC: returns all profiles joined with auth email (super_admin only)
create or replace function public.get_admin_users()
returns table (
  id uuid,
  email text,
  role public.user_role,
  full_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Not authorized';
  end if;

  return query
    select
      p.id,
      u.email::text,
      p.role,
      p.full_name
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

grant execute on function public.get_admin_users() to authenticated;
