import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="min-h-screen bg-sand flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="font-serif text-4xl font-bold text-brand">Wandr</h1>
        <p className="text-stone-600">
          Dashboard coming soon. Signed in as{' '}
          <span className="font-medium text-stone-800">{user.email}</span>
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-full px-6 py-2.5 border border-stone-300 text-sm text-stone-600 hover:bg-stone-100 transition"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  )
}
