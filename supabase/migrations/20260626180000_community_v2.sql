-- Community v2: threaded comments, notifications, follows, comment likes

-- -----------------------------------------------------------------------------
-- 1. Threaded comments
-- -----------------------------------------------------------------------------
alter table public.comments
  add column if not exists parent_id uuid references public.comments (id) on delete cascade;

create index if not exists comments_parent_id_idx on public.comments (parent_id);

-- -----------------------------------------------------------------------------
-- 2. Comment likes
-- -----------------------------------------------------------------------------
create table if not exists public.comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint comment_likes_unique unique (comment_id, user_id)
);

create index if not exists comment_likes_comment_id_idx on public.comment_likes (comment_id);

-- -----------------------------------------------------------------------------
-- 3. Notifications
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  entity_type text not null,
  entity_id uuid not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (
    type in (
      'post_liked',
      'post_disliked',
      'post_approved',
      'post_rejected',
      'comment_on_post',
      'comment_reply',
      'comment_mentioned',
      'new_follower',
      'report_reviewed'
    )
  ),
  constraint notifications_entity_type_check check (
    entity_type in ('post', 'comment', 'user')
  )
);

create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_user_unread_idx on public.notifications (user_id, is_read)
  where is_read = false;
create index if not exists notifications_created_at_idx on public.notifications (created_at desc);

-- -----------------------------------------------------------------------------
-- 4. Follows
-- -----------------------------------------------------------------------------
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint follows_unique unique (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create index if not exists follows_follower_id_idx on public.follows (follower_id);
create index if not exists follows_following_id_idx on public.follows (following_id);

-- -----------------------------------------------------------------------------
-- 5. RLS — comment_likes
-- -----------------------------------------------------------------------------
alter table public.comment_likes enable row level security;

drop policy if exists "Comment likes: public read" on public.comment_likes;
create policy "Comment likes: public read"
  on public.comment_likes for select to anon, authenticated
  using (
    exists (
      select 1
      from public.comments c
      where c.id = comment_id and c.status = 'approved'
    )
  );

drop policy if exists "Comment likes: users manage own" on public.comment_likes;
create policy "Comment likes: users manage own"
  on public.comment_likes for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 6. RLS — notifications
-- -----------------------------------------------------------------------------
alter table public.notifications enable row level security;

drop policy if exists "Notifications: users read own" on public.notifications;
create policy "Notifications: users read own"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Notifications: users update own" on public.notifications;
create policy "Notifications: users update own"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Notifications: authenticated can insert" on public.notifications;
create policy "Notifications: authenticated can insert"
  on public.notifications for insert to authenticated
  with check (true);

-- -----------------------------------------------------------------------------
-- 7. RLS — follows
-- -----------------------------------------------------------------------------
alter table public.follows enable row level security;

drop policy if exists "Follows: public read" on public.follows;
create policy "Follows: public read"
  on public.follows for select to anon, authenticated
  using (true);

drop policy if exists "Follows: users manage own" on public.follows;
create policy "Follows: users manage own"
  on public.follows for all to authenticated
  using (follower_id = auth.uid())
  with check (follower_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 8. RLS — comments (own delete)
-- -----------------------------------------------------------------------------
drop policy if exists "Comments: users can delete own" on public.comments;
create policy "Comments: users can delete own"
  on public.comments for delete to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 9. RLS — reports (ensure insert policy)
-- -----------------------------------------------------------------------------
drop policy if exists "Reports: authenticated can insert" on public.reports;
drop policy if exists "authenticated users can insert reports" on public.reports;
create policy "authenticated users can insert reports"
  on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 10. Profiles — public read for community member pages
-- -----------------------------------------------------------------------------
drop policy if exists "Profiles: public read for community" on public.profiles;
create policy "Profiles: public read for community"
  on public.profiles for select to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- 11. Grants
-- -----------------------------------------------------------------------------
grant select on table public.comment_likes to anon, authenticated;
grant insert, delete on table public.comment_likes to authenticated;

grant select, update on table public.notifications to authenticated;
grant insert on table public.notifications to authenticated;

grant select on table public.follows to anon, authenticated;
grant insert, delete on table public.follows to authenticated;

grant all on table public.comment_likes to postgres, service_role;
grant all on table public.notifications to postgres, service_role;
grant all on table public.follows to postgres, service_role;

-- -----------------------------------------------------------------------------
-- 12. Realtime for notifications
-- -----------------------------------------------------------------------------
alter table public.notifications replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
exception
  when undefined_object then null;
end $$;
