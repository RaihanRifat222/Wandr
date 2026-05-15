-- ============================================================
-- Wandr — Full Database Schema
-- Paste into Supabase SQL Editor and run.
-- ============================================================

-- ----------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique,
  full_name     text,
  avatar_url    text,
  bio           text,
  -- travel style sliders stored as jsonb, e.g.
  -- { "budget_luxury": 50, "planned_spontaneous": 70,
  --   "solo_group": 30, "relaxed_active": 60 }
  travel_style  jsonb not null default '{}',
  interests     text[] not null default '{}',
  -- rough budget per day in USD
  budget_min    integer,
  budget_max    integer,
  home_city     text,
  onboarded     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------
-- trips
-- ----------------------------------------------------------------
create table public.trips (
  id              uuid primary key default uuid_generate_v4(),
  host_id         uuid not null references public.profiles(id) on delete cascade,
  destination     text not null,
  region          text,
  start_date      date,
  end_date        date,
  group_size      integer not null default 2,
  budget_estimate integer,               -- per person per day USD
  description     text,
  travel_style    jsonb not null default '{}',
  status          text not null default 'open'
                  check (status in ('open', 'closed', 'cancelled')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.trips enable row level security;

create policy "Trips are viewable by everyone"
  on public.trips for select using (true);

create policy "Authenticated users can create trips"
  on public.trips for insert
  with check (auth.uid() = host_id);

create policy "Hosts can update their own trips"
  on public.trips for update
  using (auth.uid() = host_id);

create policy "Hosts can delete their own trips"
  on public.trips for delete
  using (auth.uid() = host_id);

-- ----------------------------------------------------------------
-- trip_requests
-- ----------------------------------------------------------------
create table public.trip_requests (
  id          uuid primary key default uuid_generate_v4(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  status      text not null default 'pending'
              check (status in ('pending', 'accepted', 'declined')),
  message     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(trip_id, requester_id)
);

alter table public.trip_requests enable row level security;

create policy "Trip hosts can view all requests for their trips"
  on public.trip_requests for select
  using (
    auth.uid() = requester_id
    or auth.uid() = (select host_id from public.trips where id = trip_id)
  );

create policy "Authenticated users can create trip requests"
  on public.trip_requests for insert
  with check (auth.uid() = requester_id);

create policy "Hosts can update request status"
  on public.trip_requests for update
  using (auth.uid() = (select host_id from public.trips where id = trip_id));

create policy "Requesters can delete their own pending requests"
  on public.trip_requests for delete
  using (auth.uid() = requester_id and status = 'pending');

-- ----------------------------------------------------------------
-- matches
-- ----------------------------------------------------------------
create table public.matches (
  id            uuid primary key default uuid_generate_v4(),
  user_a        uuid not null references public.profiles(id) on delete cascade,
  user_b        uuid not null references public.profiles(id) on delete cascade,
  score         integer not null check (score between 0 and 100),
  reasons       text[] not null default '{}',
  -- 'pending' = buddy request sent, 'connected' = both accepted, 'declined'
  status        text not null default 'pending'
                check (status in ('pending', 'connected', 'declined')),
  initiated_by  uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(user_a, user_b)
);

alter table public.matches enable row level security;

create policy "Users can view their own matches"
  on public.matches for select
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "Authenticated users can create matches"
  on public.matches for insert
  with check (auth.uid() = user_a or auth.uid() = user_b);

create policy "Match participants can update match status"
  on public.matches for update
  using (auth.uid() = user_a or auth.uid() = user_b);

-- ----------------------------------------------------------------
-- conversations
-- ----------------------------------------------------------------
create table public.conversations (
  id           uuid primary key default uuid_generate_v4(),
  match_id     uuid references public.matches(id) on delete set null,
  participant_a uuid not null references public.profiles(id) on delete cascade,
  participant_b uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique(participant_a, participant_b)
);

alter table public.conversations enable row level security;

create policy "Participants can view their own conversations"
  on public.conversations for select
  using (auth.uid() = participant_a or auth.uid() = participant_b);

create policy "Connected users can create conversations"
  on public.conversations for insert
  with check (auth.uid() = participant_a or auth.uid() = participant_b);

-- ----------------------------------------------------------------
-- messages
-- ----------------------------------------------------------------
create table public.messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  content         text not null,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "Conversation participants can view messages"
  on public.messages for select
  using (
    auth.uid() in (
      select participant_a from public.conversations where id = conversation_id
      union
      select participant_b from public.conversations where id = conversation_id
    )
  );

create policy "Conversation participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and auth.uid() in (
      select participant_a from public.conversations where id = conversation_id
      union
      select participant_b from public.conversations where id = conversation_id
    )
  );

create policy "Senders can delete their own messages"
  on public.messages for delete
  using (auth.uid() = sender_id);

-- ----------------------------------------------------------------
-- notifications
-- ----------------------------------------------------------------
create table public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null
              check (type in ('match', 'buddy_request', 'buddy_accepted', 'message', 'trip_request', 'trip_accepted', 'trip_declined')),
  title       text not null,
  body        text,
  -- generic reference to the related entity
  ref_id      uuid,
  ref_type    text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "System can insert notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id);

create policy "Users can mark their own notifications as read"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- Realtime — enable for messaging and notifications
-- ----------------------------------------------------------------
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;

-- ----------------------------------------------------------------
-- Storage buckets (run separately or via Supabase dashboard)
-- ----------------------------------------------------------------
-- insert into storage.buckets (id, name, public)
-- values ('avatars', 'avatars', true);
--
-- create policy "Avatar images are publicly accessible"
--   on storage.objects for select using (bucket_id = 'avatars');
--
-- create policy "Users can upload their own avatar"
--   on storage.objects for insert
--   with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
--
-- create policy "Users can update their own avatar"
--   on storage.objects for update
--   using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
