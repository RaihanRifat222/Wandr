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
  return {}
}
