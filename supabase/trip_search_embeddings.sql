-- ============================================================
-- Wandr — Trip search via embeddings (pgvector)
-- Run this in Supabase SQL Editor
-- ============================================================

create extension if not exists vector;

-- text-embedding-3-small produces 1536-dimensional vectors
alter table public.trips
  add column if not exists embedding vector(1536);

-- Fast approximate nearest-neighbour search at scale (cosine distance)
create index if not exists trips_embedding_idx
  on public.trips using hnsw (embedding vector_cosine_ops);

-- RPC the app calls via supabase.rpc('search_trips', { ... })
create or replace function public.search_trips(
  query_embedding vector(1536),
  match_count      int default 50
)
returns table (
  id              uuid,
  destination     text,
  region          text,
  start_date      date,
  end_date        date,
  group_size      integer,
  budget_estimate integer,
  description     text,
  host_id         uuid,
  created_at      timestamptz,
  similarity      float
)
language sql stable
as $$
  select
    trips.id,
    trips.destination,
    trips.region,
    trips.start_date,
    trips.end_date,
    trips.group_size,
    trips.budget_estimate,
    trips.description,
    trips.host_id,
    trips.created_at,
    1 - (trips.embedding <=> query_embedding) as similarity
  from public.trips
  where trips.status = 'open'
    and trips.embedding is not null
  order by trips.embedding <=> query_embedding
  limit match_count;
$$;
