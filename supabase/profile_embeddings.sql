-- ============================================================
-- Wandr — Profile embeddings (pgvector)
-- Run this in Supabase SQL Editor
-- ============================================================

create extension if not exists vector;

-- text-embedding-3-small → 1536 dims
alter table public.profiles
  add column if not exists embedding vector(1536);

-- HNSW index: faster than IVFFlat, no need to tune `lists`
create index if not exists profiles_embedding_idx
  on public.profiles using hnsw (embedding vector_cosine_ops);

-- ── match_profiles ────────────────────────────────────────────
-- Used by the Matches page: find the N most compatible profiles
-- for a given user, excluding themselves.
--
-- supabase.rpc('match_profiles', {
--   query_embedding: [...],
--   match_count: 20,
--   exclude_id: '<current-user-uuid>'
-- })
create or replace function public.match_profiles(
  query_embedding vector(1536),
  match_count     int  default 20,
  exclude_id      uuid default null
)
returns table (
  id         uuid,
  similarity float
)
language sql stable
as $$
  select
    profiles.id,
    1 - (profiles.embedding <=> query_embedding) as similarity
  from public.profiles
  where profiles.embedding is not null
    and profiles.onboarded = true
    and (exclude_id is null or profiles.id != exclude_id)
  order by profiles.embedding <=> query_embedding
  limit match_count;
$$;
