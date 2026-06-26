'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createPost({
  mediaUrls,
  caption,
  tripId,
}: {
  mediaUrls: string[]
  caption: string | null
  tripId: string | null
}): Promise<{ error?: string }> {
  if (!mediaUrls.length) return { error: 'At least one photo or video is required' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('posts').insert({
    user_id:    user.id,
    image_url:  mediaUrls[0],
    media_urls: mediaUrls,
    caption:    caption?.trim() || null,
    trip_id:    tripId || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return {}
}

export async function toggleLike(
  postId: string
): Promise<{ liked: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { liked: false, error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('post_likes').delete().eq('id', existing.id)
    return { liked: false }
  } else {
    await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id })
    return { liked: true }
  }
}

export async function addComment(
  postId: string,
  content: string
): Promise<{ error?: string; comment?: {
  id: string
  content: string
  created_at: string
  user_id: string
  commenter: { id: string; username: string | null; full_name: string | null; avatar_url: string | null } | null
} }> {
  const trimmed = content.trim()
  if (!trimmed) return { error: 'Comment cannot be empty' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, user_id: user.id, content: trimmed })
    .select(`id, content, created_at, user_id, commenter:profiles!user_id(id, username, full_name, avatar_url)`)
    .single()

  if (error) return { error: error.message }
  return { comment: data as any }
}

export async function deletePost(postId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return {}
}
