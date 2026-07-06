-- ============================================================
-- Wandr — Trip group chats
-- Run this in Supabase SQL Editor (after schema.sql)
--
-- Adds group conversations: when a host accepts a trip join
-- request, the requester is added to one shared conversation per
-- trip (host + everyone accepted so far), instead of getting a
-- separate 1:1 conversation with the host.
--
-- Safe to re-run — every statement is idempotent.
-- ============================================================

-- ----------------------------------------------------------------
-- conversations — allow group rows alongside existing 1:1 rows
-- ----------------------------------------------------------------
alter table public.conversations
  add column if not exists trip_id  uuid references public.trips(id) on delete cascade,
  add column if not exists is_group boolean not null default false,
  add column if not exists title    text;

-- 1:1 conversations still require both participants; group
-- conversations use conversation_participants instead and must
-- reference a trip.
alter table public.conversations
  alter column participant_a drop not null,
  alter column participant_b drop not null;

do $$ begin
  alter table public.conversations
    add constraint conversations_shape_check check (
      (is_group = false and participant_a is not null and participant_b is not null)
      or
      (is_group = true and trip_id is not null)
    );
exception when duplicate_object then null;
end $$;

-- One group conversation per trip
create unique index if not exists conversations_trip_group_uidx
  on public.conversations (trip_id) where is_group;

-- ----------------------------------------------------------------
-- conversation_participants — membership for group conversations
-- (created before the policies below, since they reference it)
-- ----------------------------------------------------------------
create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table public.conversation_participants enable row level security;

-- A plain "select 1 from conversation_participants where ..." inside this
-- table's own RLS policy causes infinite recursion (evaluating the policy
-- requires evaluating the policy). Route the membership check through a
-- security-definer function instead — it runs as the (RLS-exempt) table
-- owner, so its internal query bypasses RLS instead of re-triggering it.
create or replace function public.is_conversation_member(
  p_conversation_id uuid,
  p_user_id         uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = p_conversation_id and user_id = p_user_id
  );
$$;

drop policy if exists "Members can view their conversation's participants" on public.conversation_participants;
create policy "Members can view their conversation's participants"
  on public.conversation_participants for select
  using ( public.is_conversation_member(conversation_id) );

do $$ begin
  create policy "Trip host can add participants"
    on public.conversation_participants for insert
    with check (
      auth.uid() = (
        select t.host_id from public.trips t
        join public.conversations c on c.trip_id = t.id
        where c.id = conversation_id
      )
    );
exception when duplicate_object then null;
end $$;

-- ----------------------------------------------------------------
-- conversations — group visibility/create policies
-- Combined via OR with the existing 1:1 policies.
-- ----------------------------------------------------------------
drop policy if exists "Group members can view their conversation" on public.conversations;
create policy "Group members can view their conversation"
  on public.conversations for select
  using ( is_group and public.is_conversation_member(id) );

-- Also let the trip host see their trip's group conversation directly via
-- trips.host_id, independent of conversation_participants. Without this,
-- inserting the group conversation fails: Postgres evaluates INSERT...
-- RETURNING against the SELECT policies, and at that exact instant the
-- host hasn't been added as a participant yet (that happens right after),
-- so "Group members can view their conversation" alone can't see it —
-- Postgres raises "new row violates row-level security policy".
drop policy if exists "Trip host can view their trip's group conversation" on public.conversations;
create policy "Trip host can view their trip's group conversation"
  on public.conversations for select
  using ( is_group and auth.uid() = (select host_id from public.trips where id = trip_id) );

do $$ begin
  create policy "Trip host can create the trip group conversation"
    on public.conversations for insert
    with check (
      is_group and auth.uid() = (select host_id from public.trips where id = trip_id)
    );
exception when duplicate_object then null;
end $$;

-- ----------------------------------------------------------------
-- messages — extend visibility/send rights to group members
-- ----------------------------------------------------------------
drop policy if exists "Group members can view messages" on public.messages;
create policy "Group members can view messages"
  on public.messages for select
  using ( public.is_conversation_member(conversation_id) );

drop policy if exists "Group members can send messages" on public.messages;
create policy "Group members can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and public.is_conversation_member(conversation_id)
  );

-- conversation_participants doesn't need to be in the realtime
-- publication — the chat window subscribes to `messages` only,
-- and the participant/member list is loaded on page load.
