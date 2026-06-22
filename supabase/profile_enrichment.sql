-- ============================================================
-- Wandr — Profile enrichment fields
-- Run this in Supabase SQL Editor
-- ============================================================

alter table public.profiles
  add column if not exists tagline                  text,
  add column if not exists looking_for               text,
  add column if not exists favorite_moment_caption    text,
  add column if not exists favorite_moment_image_url  text,
  add column if not exists languages_spoken           text[] not null default '{}',
  add column if not exists countries_visited          integer;
