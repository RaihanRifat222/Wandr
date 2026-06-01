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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const [
    { data: profile },
    { count: tripCount },
    { count: matchCount },
    { count: connectionCount },
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
  ])

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
      emoji: '🤝',
      title: 'Find Buddies',
      desc: 'AI-matched travel companions',
      from: '#E8520A',
      to: '#f97316',
    },
    {
      href: '/trips',
      emoji: '🗺️',
      title: 'Browse Trips',
      desc: 'Find your next adventure',
      from: '#10b981',
      to: '#0d9488',
    },
    {
      href: '/trips/new',
      emoji: '➕',
      title: 'Post a Trip',
      desc: 'Share your travel plans',
      from: '#3b82f6',
      to: '#2563eb',
    },
    {
      href: profileHref,
      emoji: '👤',
      title: 'My Profile',
      desc: 'View and edit your profile',
      from: '#8b5cf6',
      to: '#6d28d9',
    },
  ]

  const stats = [
    { emoji: '🗺️', value: tripCount ?? 0, label: 'Trips posted' },
    { emoji: '🤝', value: matchCount ?? 0, label: 'Buddy matches' },
    { emoji: '🔗', value: connectionCount ?? 0, label: 'Connections' },
  ]

  return (
    <div className="min-h-screen bg-sand">

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <span className="font-serif text-xl font-bold text-brand shrink-0">Wandr</span>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-1">
            {[
              { href: '/trips', label: 'Browse trips' },
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

          {/* Right side: avatar + logout */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href={profileHref} className="group flex items-center gap-2">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={firstName}
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

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── Hero banner ─────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl text-white" style={{ background: 'linear-gradient(135deg, #E8520A 0%, #f97316 50%, #fbbf24 100%)' }}>
          {/* Decorative background emojis */}
          <span className="absolute -right-4 -top-4 text-[120px] opacity-10 select-none pointer-events-none">🌍</span>
          <span className="absolute right-20 bottom-0 text-[80px] opacity-10 select-none pointer-events-none">✈️</span>

          <div className="relative px-8 py-10">
            <p className="text-sm font-medium text-orange-100 mb-1 tracking-wide">{greeting}</p>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-3">{firstName} 👋</h1>
            <p className="text-orange-100 text-sm sm:text-base max-w-md leading-relaxed">
              {profile?.bio ?? 'Your next adventure is waiting. Where are you headed?'}
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                href="/matches"
                className="rounded-full px-5 py-2.5 bg-white text-brand text-sm font-semibold hover:bg-orange-50 transition shadow-sm"
              >
                Find buddies
              </Link>
            </div>
          </div>
        </div>

        {/* ── Profile incomplete nudge ─────────────────────────────────── */}
        {!username && (
          <Link
            href="/profile/edit"
            className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 hover:bg-amber-100 transition group"
          >
            <span className="text-2xl">✨</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">Complete your profile</p>
              <p className="text-xs text-amber-600 mt-0.5">Add a username so other travellers can find and connect with you</p>
            </div>
            <span className="text-amber-400 group-hover:translate-x-0.5 transition-transform text-lg shrink-0">→</span>
          </Link>
        )}

        {/* ── Stats ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map(({ emoji, value, label }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-stone-100 px-4 py-5 text-center hover:border-brand/20 hover:shadow-sm transition"
            >
              <p className="text-2xl mb-2">{emoji}</p>
              <p className="font-serif text-3xl font-bold text-stone-900">{value}</p>
              <p className="text-xs text-stone-400 mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Action cards ────────────────────────────────────────────── */}
        <div>
          <h2 className="font-serif text-xl font-bold text-stone-800 mb-4">What&apos;s next?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {actions.map(({ href, emoji, title, desc, from, to }) => (
              <Link
                key={title}
                href={href}
                className="group rounded-2xl p-5 text-white hover:scale-[1.03] hover:shadow-xl transition-all duration-200 flex flex-col"
                style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
              >
                <span className="text-3xl mb-4 block">{emoji}</span>
                <h3 className="font-semibold text-sm leading-snug">{title}</h3>
                <p className="text-xs mt-1 leading-snug" style={{ color: 'rgba(255,255,255,0.72)' }}>{desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Tips strip ──────────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-stone-100 p-5 flex items-start gap-4">
            <span className="text-2xl shrink-0">💡</span>
            <div>
              <p className="text-sm font-semibold text-stone-800">How matching works</p>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Our AI compares travel style, budget, destinations and interests to find your ideal travel buddy.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-stone-100 p-5 flex items-start gap-4">
            <span className="text-2xl shrink-0">🔒</span>
            <div>
              <p className="text-sm font-semibold text-stone-800">Safe connections</p>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Only connect and message travellers you&apos;ve matched with. Always meet in public first.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
