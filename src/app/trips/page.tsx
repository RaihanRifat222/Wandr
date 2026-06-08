import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/lib/actions/auth'
import TripCards from './_TripCards'

export default async function BrowseTripsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const [{ data: profile }, { data: trips }, { data: myRequests }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, username, avatar_url')
      .eq('id', user.id)
      .single(),
    supabase
      .from('trips')
      .select(`
        id, destination, region, start_date, end_date,
        group_size, budget_estimate, description, created_at,
        host:profiles!host_id ( id, username, full_name, avatar_url, home_city )
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('trip_requests')
      .select('trip_id')
      .eq('requester_id', user.id),
  ])

  const username = profile?.username
  const profileHref = username ? `/profile/${username}` : '/profile/edit'
  const initials = profile?.full_name
    ? profile.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : (username?.[0]?.toUpperCase() ?? '?')

  const requestedIds = (myRequests ?? []).map(r => r.trip_id as string)

  return (
    <div className="min-h-screen bg-background">

      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          <Link href="/dashboard" className="font-serif text-xl font-bold text-brand shrink-0">
            Wandr
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            {[
              { href: '/trips',    label: 'Browse trips' },
              { href: '/matches',  label: 'Matches'      },
              { href: '/messages', label: 'Messages'     },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-gray-500 hover:text-gray-900 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href={profileHref} className="group">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-brand transition"
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
                className="text-sm text-gray-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <TripCards trips={(trips ?? []) as any} requestedIds={requestedIds} userId={user.id} />
      </main>
    </div>
  )
}
