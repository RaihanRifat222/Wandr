import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import EditProfileForm from './_EditProfileForm'

export default async function EditProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) redirect('/login')

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('username, full_name, avatar_url, bio, travel_style, interests, budget_min, home_city')
    .eq('id', user.id)
    .single()

  if (!rawProfile) redirect('/onboarding')

  // Cast to known shape — Supabase returns jsonb/array as unknown
  const profile = rawProfile as {
    username: string | null
    full_name: string | null
    avatar_url: string | null
    bio: string | null
    home_city: string | null
    travel_style: Record<string, number>
    interests: string[]
    budget_min: number | null
  }

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          {profile.username && (
            <Link
              href={`/profile/${profile.username}`}
              className="text-sm text-gray-400 hover:text-gray-700 transition font-medium"
            >
              ← Back
            </Link>
          )}
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900">Edit profile</h1>
            <p className="text-sm text-gray-500 mt-0.5">Keep your travel profile up to date</p>
          </div>
        </div>

        <EditProfileForm profile={profile} userId={user.id} />
      </div>
    </main>
  )
}
