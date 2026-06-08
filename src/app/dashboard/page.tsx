import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/lib/actions/auth'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 22) return 'Good evening'
  return 'Good night'
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const [
    { data: profile },
    { count: tripCount },
    { count: matchCount },
    { count: connectionCount },
    { data: myOpenTrips },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, username, avatar_url, bio')
      .eq('id', user.id)
      .single(),
    supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .eq('host_id', user.id),
    supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
    supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'connected')
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
    supabase
      .from('trips')
      .select('id')
      .eq('host_id', user.id)
      .eq('status', 'open'),
  ])

  // Count pending join requests across all hosted trips
  const myTripIds = (myOpenTrips ?? []).map((t: { id: string }) => t.id)
  const { count: pendingRequestCount } = myTripIds.length > 0
    ? await supabase
        .from('trip_requests')
        .select('*', { count: 'exact', head: true })
        .in('trip_id', myTripIds)
        .eq('status', 'pending')
    : { count: 0 }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Traveller'
  const username = profile?.username
  const greeting = getGreeting()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : (username?.[0]?.toUpperCase() ?? '?')

  const profileHref = username ? `/profile/${username}` : '/profile/edit'

  const actions = [
    {
      href: '/matches',
      title: 'Find Buddies',
      desc: 'AI-matched travel companions',
      from: '#E8520A',
      to: '#f97316',
    },
    {
      href: '/trips',
      title: 'Browse Trips',
      desc: 'Find your next adventure',
      from: '#0ea5e9',
      to: '#0284c7',
    },
    {
      href: '/trips/new',
      title: 'Post a Trip',
      desc: 'Share your travel plans',
      from: '#10b981',
      to: '#059669',
    },
    {
      href: profileHref,
      title: 'My Profile',
      desc: 'View and edit your profile',
      from: '#8b5cf6',
      to: '#7c3aed',
    },
  ]

  const stats = [
    { value: tripCount ?? 0, label: 'Trips posted' },
    { value: matchCount ?? 0, label: 'Buddy matches' },
    { value: connectionCount ?? 0, label: 'Connections' },
  ]

  return (
    <div className="min-h-screen bg-background">

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          <span className="font-serif text-xl font-bold text-brand shrink-0">Wandr</span>

          <div className="hidden sm:flex items-center gap-1">
            {[
              { href: '/trips', label: 'Browse trips' },
              { href: '/matches', label: 'Matches' },
              { href: '/messages', label: 'Messages' },
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
            <Link href={profileHref} className="group flex items-center gap-2">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={firstName}
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

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl text-white"
          style={{ background: 'linear-gradient(135deg, #E8520A 0%, #f97316 55%, #fb923c 100%)' }}
        >
          {/* Geometric accents */}
          <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-16 -bottom-12 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-4 top-4 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative px-8 py-10">
            <p className="text-xs font-semibold text-orange-200 mb-1 uppercase tracking-widest">{greeting}</p>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-3">{firstName}</h1>
            <p className="text-orange-100 text-sm sm:text-base max-w-md leading-relaxed">
              {profile?.bio ?? 'Your next adventure is waiting. Where are you headed?'}
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                href="/matches"
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 bg-white text-brand text-sm font-semibold hover:bg-orange-50 transition shadow-sm"
              >
                Find travel buddies
                <ArrowRightIcon />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Profile incomplete nudge ──────────────────────────────────── */}
        {!username && (
          <Link
            href="/profile/edit"
            className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 hover:bg-amber-100 transition group"
          >
            <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">Complete your profile</p>
              <p className="text-xs text-amber-600 mt-0.5">Add a username so other travellers can find and connect with you</p>
            </div>
            <span className="text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0">
              <ChevronRightIcon />
            </span>
          </Link>
        )}

        {/* ── Pending join requests banner ──────────────────────────────── */}
        {(pendingRequestCount ?? 0) > 0 && myOpenTrips && myOpenTrips.length > 0 && (
          <Link
            href={`/trips/${myOpenTrips[0].id}`}
            className="flex items-center gap-4 bg-brand/5 border border-brand/20 rounded-xl px-5 py-4 hover:bg-brand/10 transition group"
          >
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
              {pendingRequestCount}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">
                {pendingRequestCount === 1
                  ? '1 traveller wants to join your trip'
                  : `${pendingRequestCount} travellers want to join your trips`}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Review their profiles and accept or decline</p>
            </div>
            <span className="text-gray-400 group-hover:translate-x-0.5 transition-transform shrink-0">
              <ChevronRightIcon />
            </span>
          </Link>
        )}

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-100 px-4 py-5 text-center hover:shadow-sm transition"
            >
              <p className="font-serif text-3xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-1.5 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Action cards ───────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Quick actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {actions.map(({ href, title, desc, from, to }) => (
              <Link
                key={title}
                href={href}
                className="group rounded-xl p-5 text-white hover:scale-[1.02] hover:shadow-lg transition-all duration-200 flex flex-col"
                style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
              >
                <h3 className="font-semibold text-sm leading-snug">{title}</h3>
                <p className="text-xs mt-1.5 leading-snug flex-1" style={{ color: 'rgba(255,255,255,0.72)' }}>{desc}</p>
                <span className="mt-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-150">
                  <ArrowRightIcon />
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Info strip ─────────────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E8520A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 5v4l2.5 2.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">How matching works</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Our AI compares travel style, budget, destinations and interests to find your ideal travel buddy.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Safe connections</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Only connect and message travellers you&apos;ve matched with. Always meet in public first.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
