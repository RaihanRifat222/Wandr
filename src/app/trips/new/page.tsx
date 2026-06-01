import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/lib/actions/auth'
import CreateTripForm from './_CreateTripForm'

export default async function NewTripPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url')
    .eq('id', user.id)
    .single()

  const username = profile?.username
  const profileHref = username ? `/profile/${username}` : '/profile/edit'

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .slice(0, 2)
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : (username?.[0]?.toUpperCase() ?? '?')

  return (
    <div className="min-h-screen bg-sand">

      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          <Link href="/dashboard" className="font-serif text-xl font-bold text-brand shrink-0">
            Wandr
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            {[
              { href: '/trips',   label: 'Browse trips' },
              { href: '/matches', label: 'Matches' },
              { href: '/messages', label: 'Messages' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-stone-500 hover:text-stone-900 font-medium px-3 py-1.5 rounded-lg hover:bg-stone-100 transition"
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href={profileHref} className="group flex items-center gap-2">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover border-2 border-stone-100 group-hover:border-brand transition"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold font-serif group-hover:bg-brand/20 transition">
                  {initials}
                </div>
              )}
            </Link>

            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-stone-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-stone-400 mb-6">
          <Link href="/dashboard" className="hover:text-stone-700 transition">
            Dashboard
          </Link>
          <span>›</span>
          <span className="text-stone-600 font-medium">New trip</span>
        </div>

        <CreateTripForm />

      </main>
    </div>
  )
}
