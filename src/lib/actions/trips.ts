'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

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

  const { error } = await supabase.from('trips').insert({
    host_id: user.id,
    destination,
    region,
    start_date: startDate,
    end_date: endDate,
    group_size: buddiesWanted + 1,
    budget_estimate: budgetEstimate,
    description,
    status: 'open',
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  redirect('/dashboard')
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

  const { error } = await supabase.from('trip_requests').insert({
    trip_id: tripId,
    requester_id: user.id,
    status: 'pending',
  })

  if (error) return { error: error.message }

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

  // Open a conversation between them (idempotent)
  const { data: match } = await supabase
    .from('matches')
    .select('id')
    .eq('user_a', ids[0])
    .eq('user_b', ids[1])
    .single()

  await supabase.from('conversations').upsert(
    {
      participant_a: ids[0],
      participant_b: ids[1],
      match_id:      match?.id ?? null,
    },
    { onConflict: 'participant_a,participant_b' }
  )

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

  const { error } = await supabase
    .from('trip_requests')
    .update({ status: 'declined', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('trip_id', tripId)

  if (error) return { error: error.message }

  revalidatePath(`/trips/${tripId}`)
  return {}
}
