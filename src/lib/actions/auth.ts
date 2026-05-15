'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

type AuthState = { error?: string; message?: string } | null

function friendlyError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Incorrect email or password.'
  if (message.includes('User already registered')) return 'An account with this email already exists.'
  if (message.includes('Email not confirmed')) return 'Please confirm your email before signing in.'
  if (message.includes('Password should be')) return 'Password must be at least 6 characters.'
  if (message.includes('Unable to validate email')) return 'Please enter a valid email address.'
  if (message.includes('email rate limit')) return 'Too many attempts. Please try again later.'
  return message
}

export async function signUpWithEmail(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) return { error: friendlyError(error.message) }

  // If a session exists, email confirmation is disabled — go straight to onboarding
  if (data.session) {
    redirect('/onboarding')
  }

  return { message: 'Check your email for a confirmation link to complete signup.' }
}

export async function signInWithEmail(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: friendlyError(error.message) }

  redirect('/dashboard')
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const origin = (await headers()).get('origin')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error || !data.url) redirect('/login?error=oauth')

  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
