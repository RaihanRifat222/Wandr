'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { buildProfileText, generateEmbedding } from '@/lib/embeddings'

const BLOCKED_USERNAMES = ['edit', 'me', 'new', 'admin', 'api', 'login', 'signup']

export type UpdateProfileInput = {
  fullName: string
  username: string
  homeCity: string
  bio: string
  interests: string[]
  travelStyle: { budget: number; planned: number; solo: number; relaxed: number }
  budgetMin: number
  budgetMax: number
  tagline: string
  lookingFor: string
  favoriteMomentCaption: string
  favoriteMomentImageUrl: string
  languagesSpoken: string[]
  countriesVisited: number | null
}

export async function updateProfile(
  input: UpdateProfileInput
): Promise<{ error: string } | { username: string }> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) redirect('/login')

  const clean = input.username.toLowerCase().trim()

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: input.fullName.trim() || null,
      username: clean,
      home_city: input.homeCity.trim() || null,
      bio: input.bio.trim() || null,
      interests: input.interests,
      travel_style: input.travelStyle,
      budget_min: input.budgetMin,
      budget_max: input.budgetMax,
      tagline: input.tagline.trim() || null,
      looking_for: input.lookingFor.trim() || null,
      favorite_moment_caption: input.favoriteMomentCaption.trim() || null,
      favorite_moment_image_url: input.favoriteMomentImageUrl.trim() || null,
      languages_spoken: input.languagesSpoken,
      countries_visited: input.countriesVisited,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') return { error: 'That username is already taken.' }
    return { error: error.message }
  }

  // Regenerate embedding in the background — don't block the response
  try {
    const text = buildProfileText({
      interests:        input.interests,
      travel_style:     input.travelStyle,
      budget_min:       input.budgetMin,
      bio:              input.bio,
      tagline:          input.tagline,
      looking_for:      input.lookingFor,
      home_city:        input.homeCity,
      languages_spoken: input.languagesSpoken,
      countries_visited: input.countriesVisited,
    })
    if (text.trim()) {
      const embedding = await generateEmbedding(text)
      await supabase.from('profiles').update({ embedding }).eq('id', user.id)
    }
  } catch {
    // Non-fatal — profile was saved; embedding can be backfilled later
  }

  revalidatePath(`/profile/${clean}`)
  return { username: clean }
}

export async function checkUsernameAvailable(
  username: string
): Promise<{ available: boolean; message?: string }> {
  const trimmed = username.toLowerCase().trim()

  if (trimmed.length < 3) return { available: false, message: 'At least 3 characters' }
  if (!/^[a-z0-9_]+$/.test(trimmed))
    return { available: false, message: 'Letters, numbers and underscores only' }
  if (BLOCKED_USERNAMES.includes(trimmed))
    return { available: false, message: 'Username not available' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', trimmed)
    .neq('id', user?.id ?? '')
    .maybeSingle()

  return data
    ? { available: false, message: 'Username already taken' }
    : { available: true }
}

export async function acceptBuddyRequest(
  matchId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: match } = await supabase
    .from('matches')
    .select('id, user_a, user_b')
    .eq('id', matchId)
    .eq('status', 'pending')
    .single()

  if (!match) return { error: 'Request not found' }

  const { error } = await supabase
    .from('matches')
    .update({ status: 'connected', updated_at: new Date().toISOString() })
    .eq('id', matchId)

  if (error) return { error: error.message }

  // Open a conversation between them
  await supabase.from('conversations').upsert(
    { participant_a: match.user_a, participant_b: match.user_b, match_id: matchId },
    { onConflict: 'participant_a,participant_b' }
  )

  revalidatePath('/messages')
  revalidatePath('/matches')
  return {}
}

export async function declineBuddyRequest(
  matchId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { error } = await supabase
    .from('matches')
    .update({ status: 'declined', updated_at: new Date().toISOString() })
    .eq('id', matchId)

  if (error) return { error: error.message }
  revalidatePath('/matches')
  return {}
}

export async function sendBuddyRequest(
  targetUserId: string
): Promise<{ error: string } | undefined> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) redirect('/login')

  const ids = [user.id, targetUserId].sort()

  const { error } = await supabase.from('matches').upsert(
    {
      user_a: ids[0],
      user_b: ids[1],
      score: 0,
      status: 'pending',
      initiated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_a,user_b' }
  )

  if (error) return { error: error.message }
  revalidatePath('/profile')
}
