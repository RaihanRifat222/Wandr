'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { buildProfileText, generateEmbedding } from '@/lib/embeddings'

type SaveProfileInput = {
  homeCity: string
  bio: string
  interests: string[]
  travelStyle: { budget: number; planned: number; solo: number; relaxed: number }
  budgetMin: number
  budgetMax: number
}

export async function saveOnboardingProfile(
  input: SaveProfileInput
): Promise<{ error: string } | undefined> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) redirect('/login')

  const { error } = await supabase
    .from('profiles')
    .update({
      home_city: input.homeCity,
      bio: input.bio,
      interests: input.interests,
      travel_style: input.travelStyle,
      budget_min: input.budgetMin,
      budget_max: input.budgetMax,
      onboarded: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  // Generate embedding after onboarding — non-fatal if it fails
  try {
    const text = buildProfileText({
      interests:    input.interests,
      travel_style: input.travelStyle,
      budget_min:   input.budgetMin,
      home_city:    input.homeCity,
      bio:          input.bio,
    })
    if (text.trim()) {
      const embedding = await generateEmbedding(text)
      await supabase.from('profiles').update({ embedding }).eq('id', user.id)
    }
  } catch {
    // Non-fatal
  }

  redirect('/dashboard')
}
