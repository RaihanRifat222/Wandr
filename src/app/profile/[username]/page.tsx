import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ConnectButton from './_ConnectButton'

// ── Constants ─────────────────────────────────────────────────────────────────

const BUDGET_OPTIONS = [
  { min: 0,   max: 50,   label: 'Backpacker' },
  { min: 50,  max: 100,  label: 'Budget'     },
  { min: 100, max: 200,  label: 'Mid-range'  },
  { min: 200, max: 9999, label: 'Comfort'    },
]

const SLIDERS = [
  { key: 'budget',  left: 'Budget',  right: 'Luxury'      },
  { key: 'planned', left: 'Planned', right: 'Spontaneous' },
  { key: 'solo',    left: 'Solo',    right: 'Group'       },
  { key: 'relaxed', left: 'Relaxed', right: 'Active'      },
] as const

// ── SVG icons ─────────────────────────────────────────────────────────────────

function MapPinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(fullName: string | null, username: string | null): string {
  if (fullName?.trim()) return fullName.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  return (username ?? '?')[0].toUpperCase()
}

function getBudgetLabel(min: number | null) {
  if (min === null) return null
  return BUDGET_OPTIONS.find(o => o.min === min) ?? null
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '?'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Read-only slider ──────────────────────────────────────────────────────────

function ReadOnlySlider({ value }: { value: number }) {
  return (
    <div className="relative h-1 w-full bg-gray-200 rounded-full">
      <div
        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-brand border-2 border-white shadow-sm"
        style={{ left: `calc(${value / 100} * (100% - 16px))` }}
      />
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MatchStatus = 'none' | 'pending_sent' | 'pending_received' | 'connected'

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const [{ data: profile }, { data: { user } }] = await Promise.all([
    supabase.from('profiles').select('*').eq('username', username).single(),
    supabase.auth.getUser(),
  ])

  if (!profile) notFound()

  const today = new Date().toISOString().split('T')[0]
  const [
    { data: trips },
    { data: profilePosts },
    { count: tripCount },
    { count: connectionCount },
  ] = await Promise.all([
    supabase
      .from('trips')
      .select('id, destination, start_date, end_date, group_size')
      .eq('host_id', profile.id)
      .eq('status', 'open')
      .gte('end_date', today)
      .order('start_date', { ascending: true })
      .limit(5),
    supabase
      .from('posts')
      .select('id, image_url, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .eq('host_id', profile.id),
    supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'connected')
      .or(`user_a.eq.${profile.id},user_b.eq.${profile.id}`),
  ])

  const isOwn = user?.id === profile.id
  let matchStatus: MatchStatus = 'none'
  let matchId: string | null = null
  let conversationId: string | null = null

  if (user && !isOwn) {
    const ids = [user.id, profile.id].sort()

    const [{ data: match }, { data: conversation }] = await Promise.all([
      supabase
        .from('matches')
        .select('id, status, initiated_by')
        .eq('user_a', ids[0])
        .eq('user_b', ids[1])
        .maybeSingle(),
      supabase
        .from('conversations')
        .select('id')
        .eq('participant_a', ids[0])
        .eq('participant_b', ids[1])
        .maybeSingle(),
    ])

    if (match?.status === 'connected') {
      matchStatus = 'connected'
    } else if (match?.status === 'pending') {
      matchStatus = match.initiated_by === user.id ? 'pending_sent' : 'pending_received'
    }

    matchId = match?.id ?? null
    conversationId = conversation?.id ?? null
  }

  const initials = getInitials(profile.full_name, profile.username)
  const budget = getBudgetLabel(profile.budget_min)
  const travelStyle = (profile.travel_style ?? {}) as Record<string, number>
  const hasStyle = Object.keys(travelStyle).length > 0
  const displayName = profile.full_name ?? username

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5 items-start">

          {/* ── Left column ──────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
            {/* Avatar + name */}
            <div className="flex flex-col items-center gap-3 text-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-gray-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-brand/10 text-brand flex items-center justify-center text-3xl font-bold font-serif">
                  {initials}
                </div>
              )}
              <div>
                <h1 className="font-serif text-xl font-bold text-gray-900">{displayName}</h1>
                <p className="text-sm text-gray-400 mt-0.5">@{profile.username}</p>
              </div>
            </div>

            {/* Home city */}
            {profile.home_city && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPinIcon />
                <span>{profile.home_city}</span>
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
            )}

            {/* Actions */}
            {isOwn ? (
              <Link
                href="/profile/edit"
                className="block w-full text-center rounded-lg py-2.5 border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Edit profile
              </Link>
            ) : (
              <div className="space-y-2">
                <ConnectButton
                  targetUserId={profile.id}
                  matchStatus={matchStatus}
                  matchId={matchId}
                />
                {/* Message button — only when conversation exists */}
                {conversationId && (
                  <Link
                    href={`/messages/${conversationId}`}
                    className="block w-full text-center rounded-lg py-2.5 bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition"
                  >
                    Message
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* ── Right column ─────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Stats row */}
            <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 grid grid-cols-3 divide-x divide-gray-100">
              {[
                { value: profilePosts?.length ?? 0, label: 'Posts' },
                { value: tripCount ?? 0,            label: 'Trips'  },
                { value: connectionCount ?? 0,      label: 'Connections' },
              ].map(({ value, label }) => (
                <div key={label} className="text-center px-4">
                  <p className="font-serif text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
                </div>
              ))}
            </div>

            {/* Interests */}
            {profile.interests?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Interests</h2>
                <div className="flex flex-wrap gap-2">
                  {(profile.interests as string[]).map(interest => (
                    <span
                      key={interest}
                      className="rounded-full px-3.5 py-1.5 text-xs font-semibold bg-brand/10 text-brand"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Travel style */}
            {hasStyle && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">
                  Travel style
                </h2>
                <div className="space-y-5">
                  {SLIDERS.map(({ key, left, right }) => (
                    <div key={key}>
                      <div className="flex justify-between text-xs font-medium text-gray-400 mb-2.5">
                        <span>{left}</span>
                        <span>{right}</span>
                      </div>
                      <ReadOnlySlider value={travelStyle[key] ?? 50} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Budget + trips */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
              {budget && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Budget</h2>
                  <span className="inline-flex items-center rounded-lg px-3.5 py-2 border-2 border-brand bg-orange-50 text-sm font-semibold text-brand">
                    {budget.label}
                  </span>
                </div>
              )}

              <div>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  Upcoming trips
                </h2>
                {trips && trips.length > 0 ? (
                  <div className="space-y-2">
                    {trips.map(trip => (
                      <Link
                        key={trip.id}
                        href={`/trips/${trip.id}`}
                        className="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-3 hover:border-brand/30 hover:bg-orange-50/30 transition group"
                      >
                        <div className="text-gray-300 group-hover:text-brand/50 transition shrink-0">
                          <CalendarIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate">{trip.destination}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
                            {' · '}
                            {trip.group_size} {trip.group_size === 1 ? 'spot' : 'spots'}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No upcoming trips posted yet</p>
                )}
              </div>
            </div>

            {/* Posts grid */}
            {profilePosts && profilePosts.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Posts</h2>
                <div className="grid grid-cols-3 gap-1.5">
                  {profilePosts.map(post => (
                    <Link key={post.id} href="/dashboard" className="block aspect-square overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={post.image_url}
                        alt=""
                        className="w-full h-full object-cover hover:opacity-90 transition"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  )
}
