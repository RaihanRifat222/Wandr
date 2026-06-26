-- ============================================================
-- Wandr — Multi-media posts support
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add media_urls array (backward-compat: existing posts keep image_url, new
-- posts populate both image_url (first item) and media_urls (all items))
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS media_urls text[] NOT NULL DEFAULT '{}';

-- Allow larger video uploads in the posts storage bucket
-- (bucket limits are set in Supabase dashboard — no SQL needed)
