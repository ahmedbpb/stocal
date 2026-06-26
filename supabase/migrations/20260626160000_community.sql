-- Community Hub: posts, reactions, comments, reports + moderator role

-- -----------------------------------------------------------------------------
-- 1. Moderator role on user_role enum
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'user_role' and e.enumlabel = 'moderator'
  ) then
    alter type public.user_role add value 'moderator';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Helpers
-- -----------------------------------------------------------------------------
create or replace function public.is_moderator()
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
      and role in ('moderator', 'super_admin')
  );
$$;

-- -----------------------------------------------------------------------------
-- 3. posts
-- -----------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  image_url text,
  status text not null default 'pending',
  rejection_reason text,
  created_at timestamptz not null default now(),
  constraint posts_status_check check (status in ('pending', 'approved', 'rejected')),
  constraint posts_content_length check (char_length(content) <= 500)
);

create index if not exists posts_user_id_idx on public.posts (user_id);
create index if not exists posts_status_idx on public.posts (status);
create index if not exists posts_created_at_idx on public.posts (created_at desc);

-- -----------------------------------------------------------------------------
-- 4. reactions
-- -----------------------------------------------------------------------------
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  created_at timestamptz not null default now(),
  constraint reactions_type_check check (type in ('like', 'dislike')),
  constraint reactions_post_user_unique unique (post_id, user_id)
);

create index if not exists reactions_post_id_idx on public.reactions (post_id);

-- -----------------------------------------------------------------------------
-- 5. comments
-- -----------------------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  status text not null default 'approved',
  created_at timestamptz not null default now(),
  constraint comments_status_check check (status in ('approved', 'removed'))
);

create index if not exists comments_post_id_idx on public.comments (post_id);

-- -----------------------------------------------------------------------------
-- 6. reports
-- -----------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint reports_target_type_check check (target_type in ('post', 'comment')),
  constraint reports_status_check check (status in ('pending', 'reviewed'))
);

create index if not exists reports_status_idx on public.reports (status);
create index if not exists reports_target_idx on public.reports (target_type, target_id);

-- -----------------------------------------------------------------------------
-- 7. RLS — posts
-- -----------------------------------------------------------------------------
alter table public.posts enable row level security;

drop policy if exists "Posts: public can read approved" on public.posts;
drop policy if exists "Posts: users can read own" on public.posts;
drop policy if exists "Posts: authenticated can insert pending" on public.posts;
drop policy if exists "Posts: users can delete own" on public.posts;
drop policy if exists "Posts: moderators full access" on public.posts;

create policy "Posts: public can read approved"
  on public.posts for select to anon, authenticated
  using (status = 'approved');

create policy "Posts: users can read own"
  on public.posts for select to authenticated
  using (user_id = auth.uid());

create policy "Posts: authenticated can insert pending"
  on public.posts for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

create policy "Posts: users can delete own"
  on public.posts for delete to authenticated
  using (user_id = auth.uid());

create policy "Posts: moderators full access"
  on public.posts for all to authenticated
  using (public.is_moderator())
  with check (public.is_moderator());

-- -----------------------------------------------------------------------------
-- 8. RLS — reactions
-- -----------------------------------------------------------------------------
alter table public.reactions enable row level security;

drop policy if exists "Reactions: public can read" on public.reactions;
drop policy if exists "Reactions: users manage own" on public.reactions;

create policy "Reactions: public can read"
  on public.reactions for select to anon, authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.status = 'approved'
    )
  );

create policy "Reactions: users manage own"
  on public.reactions for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 9. RLS — comments
-- -----------------------------------------------------------------------------
alter table public.comments enable row level security;

drop policy if exists "Comments: public can read approved" on public.comments;
drop policy if exists "Comments: authenticated can insert" on public.comments;
drop policy if exists "Comments: moderators full access" on public.comments;

create policy "Comments: public can read approved"
  on public.comments for select to anon, authenticated
  using (status = 'approved');

create policy "Comments: authenticated can insert"
  on public.comments for insert to authenticated
  with check (user_id = auth.uid() and status = 'approved');

create policy "Comments: moderators full access"
  on public.comments for all to authenticated
  using (public.is_moderator())
  with check (public.is_moderator());

-- -----------------------------------------------------------------------------
-- 10. RLS — reports
-- -----------------------------------------------------------------------------
alter table public.reports enable row level security;

drop policy if exists "Reports: authenticated can insert" on public.reports;
drop policy if exists "Reports: moderators can read all" on public.reports;
drop policy if exists "Reports: moderators can update" on public.reports;

create policy "Reports: authenticated can insert"
  on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());

create policy "Reports: moderators can read all"
  on public.reports for select to authenticated
  using (public.is_moderator());

create policy "Reports: moderators can update"
  on public.reports for update to authenticated
  using (public.is_moderator())
  with check (public.is_moderator());

-- -----------------------------------------------------------------------------
-- 11. Profiles — read for community authors + moderators
-- -----------------------------------------------------------------------------
drop policy if exists "Profiles: public read community authors" on public.profiles;
create policy "Profiles: public read community authors"
  on public.profiles for select to anon, authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.user_id = profiles.id and p.status = 'approved'
    )
    or exists (
      select 1 from public.comments c
      where c.user_id = profiles.id and c.status = 'approved'
    )
    or role in ('local_brand', 'stock_seller')
  );

drop policy if exists "Profiles: moderators can read all" on public.profiles;
create policy "Profiles: moderators can read all"
  on public.profiles for select to authenticated
  using (public.is_moderator());

-- -----------------------------------------------------------------------------
-- 12. Storage — community-images bucket
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('community-images', 'community-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Community images: authenticated upload to own folder" on storage.objects;
create policy "Community images: authenticated upload to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'community-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Community images: public read" on storage.objects;
create policy "Community images: public read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'community-images');

-- -----------------------------------------------------------------------------
-- 13. Grants
-- -----------------------------------------------------------------------------
grant select on table public.posts to anon, authenticated;
grant insert, delete on table public.posts to authenticated;
grant update on table public.posts to authenticated;

grant select on table public.reactions to anon, authenticated;
grant insert, update, delete on table public.reactions to authenticated;

grant select on table public.comments to anon, authenticated;
grant insert on table public.comments to authenticated;
grant delete, update on table public.comments to authenticated;

grant insert on table public.reports to authenticated;
grant select, update on table public.reports to authenticated;

grant all on table public.posts to postgres, service_role;
grant all on table public.reactions to postgres, service_role;
grant all on table public.comments to postgres, service_role;
grant all on table public.reports to postgres, service_role;
