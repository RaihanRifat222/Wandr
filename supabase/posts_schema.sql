-- ============================================================
-- Wandr — Posts, Likes, Comments
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── posts ────────────────────────────────────────────────────
create table public.posts (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  image_url   text not null,
  caption     text,
  trip_id     uuid references public.trips(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "Posts are viewable by everyone"
  on public.posts for select using (true);

create policy "Users can create their own posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own posts"
  on public.posts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- ── post_likes ───────────────────────────────────────────────
create table public.post_likes (
  id          uuid primary key default uuid_generate_v4(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(post_id, user_id)
);

alter table public.post_likes enable row level security;

create policy "Likes are viewable by everyone"
  on public.post_likes for select using (true);

create policy "Users can like posts"
  on public.post_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike posts"
  on public.post_likes for delete
  using (auth.uid() = user_id);

-- ── post_comments ────────────────────────────────────────────
create table public.post_comments (
  id          uuid primary key default uuid_generate_v4(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

alter table public.post_comments enable row level security;

create policy "Comments are viewable by everyone"
  on public.post_comments for select using (true);

create policy "Users can add comments"
  on public.post_comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.post_comments for delete
  using (auth.uid() = user_id);

-- ── Realtime ─────────────────────────────────────────────────
alter publication supabase_realtime add table public.post_likes;
alter publication supabase_realtime add table public.post_comments;

-- ── Storage bucket ───────────────────────────────────────────
-- Run this block separately if the above succeeds
insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict do nothing;

create policy "Post images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'posts');

create policy "Users can upload post images"
  on storage.objects for insert
  with check (
    bucket_id = 'posts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own post images"
  on storage.objects for delete
  using (
    bucket_id = 'posts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
