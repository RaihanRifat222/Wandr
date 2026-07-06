'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { embedText, buildTripEmbeddingInput } from '@/lib/ai/embeddings'

const BUDGET_ESTIMATE_MAP: Record<string, number> = {
  backpacker: 25,
  budget: 75,
  'mid-range': 150,
  comfort: 300,
}

export async function createTrip(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) redirect('/login')

  const destination = (formData.get('destination') as string)?.trim()
  if (!destination) return { error: 'Destination is required' }

  const region = (formData.get('region') as string) || null
  const startDate = (formData.get('start_date') as string) || null
  const endDate = (formData.get('end_date') as string) || null
  const buddiesWanted = Math.max(1, Math.min(9, Number(formData.get('buddies_wanted')) || 1))
  const budgetTier = (formData.get('budget_tier') as string) || null
  const description = (formData.get('description') as string)?.trim() || null

  if (startDate && endDate && endDate < startDate) {
    return { error: 'End date must be after start date' }
  }

  const budgetEstimate = budgetTier ? (BUDGET_ESTIMATE_MAP[budgetTier] ?? null) : null

  const tripFields = {
    destination,
    region,
    start_date: startDate,
    end_date: endDate,
    group_size: buddiesWanted + 1,
    budget_estimate: budgetEstimate,
    description,
  }

  let embedding: number[] | null = null
  try {
    embedding = await embedText(buildTripEmbeddingInput(tripFields))
  } catch {
    // Search indexing is best-effort — the trip should still get created
    // even if the embeddings API is unreachable.
  }

  const { error } = await supabase.from('trips').insert({
    host_id: user.id,
    ...tripFields,
    embedding,
    status: 'open',
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export type TripSearchResult = {
  id: string
  destination: string
  region: string | null
  start_date: string | null
  end_date: string | null
  group_size: number
  budget_estimate: number | null
  description: string | null
  similarity: number
  host: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
    home_city: string | null
    tagline: string | null
  } | null
}

export async function searchTrips(
  query: string
): Promise<{ error: string } | { results: TripSearchResult[] }> {
  const trimmed = query.trim()
  if (!trimmed) return { error: 'Describe what you\'re looking for' }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  let queryEmbedding: number[]
  try {
    queryEmbedding = await embedText(trimmed)
  } catch {
    return { error: 'Search is temporarily unavailable. Please try again.' }
  }

  const { data: matches, error } = await supabase.rpc('search_trips', {
    query_embedding: queryEmbedding,
    match_count: 30,
  })

  if (error) return { error: error.message }
  if (!matches || matches.length === 0) return { results: [] }

  const hostIds = [...new Set(matches.map((m: { host_id: string }) => m.host_id))]
  const { data: hosts } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, home_city, tagline')
    .in('id', hostIds)

  const hostById = new Map((hosts ?? []).map(h => [h.id, h]))

  const results: TripSearchResult[] = matches.map((m: {
    id: string; destination: string; region: string | null
    start_date: string | null; end_date: string | null
    group_size: number; budget_estimate: number | null
    description: string | null; host_id: string; similarity: number
  }) => ({
    id: m.id,
    destination: m.destination,
    region: m.region,
    start_date: m.start_date,
    end_date: m.end_date,
    group_size: m.group_size,
    budget_estimate: m.budget_estimate,
    description: m.description,
    similarity: m.similarity,
    host: hostById.get(m.host_id) ?? null,
  }))

  return { results }
}

export async function requestToJoin(
  tripId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Not authenticated' }

  const { data: request, error } = await supabase
    .from('trip_requests')
    .insert({ trip_id: tripId, requester_id: user.id, status: 'pending' })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Notify the trip host
  const [{ data: trip }, { data: profile }] = await Promise.all([
    supabase.from('trips').select('host_id, destination').eq('id', tripId).single(),
    supabase.from('profiles').select('full_name, username').eq('id', user.id).single(),
  ])

  if (trip && trip.host_id !== user.id && request) {
    const requesterName = profile?.full_name ?? profile?.username ?? 'Someone'
    await supabase.from('notifications').insert({
      user_id:  trip.host_id,
      type:     'trip_request',
      title:    `${requesterName} wants to join your trip to ${trip.destination}`,
      body:     request.id,
      ref_id:   tripId,
      ref_type: 'trip_request',
    })
  }

  revalidatePath(`/trips/${tripId}`)
  return {}
}

export async function acceptTripRequest(
  requestId: string,
  tripId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  // Get requester ID so we can create match + conversation
  const { data: req } = await supabase
    .from('trip_requests')
    .select('requester_id')
    .eq('id', requestId)
    .eq('trip_id', tripId)
    .single()

  if (!req) return { error: 'Request not found' }

  const { error } = await supabase
    .from('trip_requests')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('trip_id', tripId)

  if (error) return { error: error.message }

  // Mark the two users as connected (or create the match if it didn't exist)
  const ids = [user.id, req.requester_id].sort()
  await supabase.from('matches').upsert(
    {
      user_a:       ids[0],
      user_b:       ids[1],
      score:        0,
      reasons:      [],
      status:       'connected',
      initiated_by: user.id,
      updated_at:   new Date().toISOString(),
    },
    { onConflict: 'user_a,user_b' }
  )

  // Notify the requester their request was accepted
  const { data: trip } = await supabase
    .from('trips')
    .select('destination')
    .eq('id', tripId)
    .single()

  // Add the requester to the trip's shared group chat (host + everyone
  // accepted so far), creating it on the first acceptance.
  let { data: groupConversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('trip_id', tripId)
    .eq('is_group', true)
    .maybeSingle()

  if (!groupConversation) {
    const { data: newConversation, error: convError } = await supabase
      .from('conversations')
      .insert({ trip_id: tripId, is_group: true, title: trip?.destination ?? 'Trip chat' })
      .select('id')
      .single()

    if (convError || !newConversation) return { error: convError?.message ?? 'Could not create the group chat' }
    groupConversation = newConversation

    await supabase
      .from('conversation_participants')
      .insert({ conversation_id: groupConversation.id, user_id: user.id })
  }

  await supabase
    .from('conversation_participants')
    .upsert(
      { conversation_id: groupConversation.id, user_id: req.requester_id },
      { onConflict: 'conversation_id,user_id', ignoreDuplicates: true }
    )

  if (trip) {
    await supabase.from('notifications').insert({
      user_id:  req.requester_id,
      type:     'trip_accepted',
      title:    `Your request to join ${trip.destination} was accepted!`,
      body:     `You're now in the ${trip.destination} group chat.`,
      ref_id:   groupConversation.id,
      ref_type: 'conversation',
    })
  }

  revalidatePath(`/trips/${tripId}`)
  revalidatePath('/messages')
  return {}
}

export async function declineTripRequest(
  requestId: string,
  tripId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const { data: req } = await supabase
    .from('trip_requests')
    .select('requester_id')
    .eq('id', requestId)
    .eq('trip_id', tripId)
    .single()

  const { error } = await supabase
    .from('trip_requests')
    .update({ status: 'declined', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('trip_id', tripId)

  if (error) return { error: error.message }

  // Notify the requester their request was declined
  if (req) {
    const { data: trip } = await supabase
      .from('trips')
      .select('destination')
      .eq('id', tripId)
      .single()

    if (trip) {
      await supabase.from('notifications').insert({
        user_id:  req.requester_id,
        type:     'trip_declined',
        title:    `Your request to join ${trip.destination} was not accepted`,
        ref_id:   tripId,
        ref_type: 'trip',
      })
    }
  }

  revalidatePath(`/trips/${tripId}`)
  return {}
}
