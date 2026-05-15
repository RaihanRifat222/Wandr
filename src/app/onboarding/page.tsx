import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingFlow from './_OnboardingFlow'

export const metadata = { title: 'Get started — Wandr' }

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded')
    .eq('id', user.id)
    .single()

  if (profile?.onboarded) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-sand flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center select-none">
        <span className="font-serif text-4xl font-bold text-brand">Wandr</span>
        <p className="mt-2 text-sm text-stone-500">Let's set up your profile</p>
      </div>
      <OnboardingFlow />
    </main>
  )
}
