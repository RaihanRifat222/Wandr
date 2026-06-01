import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ConnectButton from './_ConnectButton'

// ── Constants ─────────────────────────────────────────────────────────────────

const BUDGET_OPTIONS = [
  { min: 0,   max: 50,   emoji: '🎒', label: 'Backpacker' },
  { min: 50,  max: 100,  emoji: '🌿', label: 'Budget'     },
  { min: 100, max: 200,  emoji: '✈️', label: 'Mid-range'  },
  { min: 200, max: 9999, emoji: '🥂', label: 'Comfort'    },
]

const SLIDERS = [
  { key: 'budget',  leftEmoji: '💰', left: 'Budget',  rightEmoji: '🥂', right: 'Luxury'      },
  { key: 'planned', leftEmoji: '📋', left: 'Planned', rightEmoji: '🎲', right: 'Spontaneous' },
  { key: 'solo',    leftEmoji: '🧍', left: 'Solo',    rightEmoji: '👥', right: 'Group'       },
  { key: 'relaxed', leftEmoji: '🛋️', left: 'Relaxed', rightEmoji: '🏃', right: 'Active'      },
] as const

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(fullName: string | null, username: string | null): string {
  if (fullName?.trim()) {
    return fullName.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  }
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
    <div className="relative h-1.5 w-full bg-stone-200 rounded-full">
      <div
        className="absolute top-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full bg-brand border-2 border-white shadow-sm"
        style={{ left: `calc(${value / 100} * (100% - 22px))` }}
      />
    </div>
  )
}

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
  const { data: trips } = await supabase
    .from('trips')
    .select('id, destination, start_date, end_date, group_size')
    .eq('host_id', profile.id)
    .eq('status', 'open')
    .gte('end_date', today)
    .order('start_date', { ascending: true })
    .limit(5)

  const isOwn = user?.id === profile.id
  let matchStatus: 'none' | 'pending' | 'connected' = 'none'

  if (user && !isOwn) {
    const ids = [user.id, profile.id].sort()
    const { data: match } = await supabase
      .from('matches')
      .select('status')
      .eq('user_a', ids[0])
      .eq('user_b', ids[1])
      .maybeSingle()

    if (match?.status === 'connected') matchStatus = 'connected'
    else if (match?.status === 'pending') matchStatus = 'pending'
  }

  const initials = getInitials(profile.full_name, profile.username)
  const budget = getBudgetLabel(profile.budget_min)
  const travelStyle = (profile.travel_style ?? {}) as Record<string, number>
  const hasStyle = Object.keys(travelStyle).length > 0
  const displayName = profile.full_name ?? username
  const firstName = profile.full_name?.split(' ')[0] ?? username

  return (
    <main className="min-h-screen bg-sand py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 items-start">

          {/* ── Left column ──────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-stone-100 p-6 space-y-5">
            {/* Avatar + name */}
            <div className="flex flex-col items-center gap-3 text-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-24 h-24 rounded-full object-cover border-2 border-stone-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-brand/10 text-brand flex items-center justify-center text-3xl font-bold font-serif">
                  {initials}
                </div>
              )}
              <div>
                <h1 className="font-serif text-xl font-bold text-stone-900">{displayName}</h1>
                <p className="text-sm text-stone-400 mt-0.5">@{profile.username}</p>
              </div>
            </div>

            {/* Home city */}
            {profile.home_city && (
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <span>📍</span>
                <span>{profile.home_city}</span>
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-stone-600 leading-relaxed">{profile.bio}</p>
            )}

            {/* Action */}
            {isOwn ? (
              <Link
                href="/profile/edit"
                className="block w-full text-center rounded-full py-2.5 border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition"
              >
                Edit profile
              </Link>
            ) : (
              <ConnectButton targetUserId={profile.id} initialStatus={matchStatus} />
            )}
          </div>

          {/* ── Right column ─────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Interests */}
            {profile.interests?.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-100 p-6">
                <h2 className="font-serif text-lg font-bold text-stone-800 mb-4">Interests</h2>
                <div className="flex flex-wrap gap-2">
                  {(profile.interests as string[]).map(interest => (
                    <span
                      key={interest}
                      className="rounded-full px-4 py-1.5 text-sm font-medium bg-brand text-white"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Travel style */}
            {hasStyle && (
              <div className="bg-white rounded-2xl border border-stone-100 p-6">
                <h2 className="font-serif text-lg font-bold text-stone-800 mb-6">
                  How {firstName} travels
                </h2>
                <div className="space-y-6">
                  {SLIDERS.map(({ key, leftEmoji, left, rightEmoji, right }) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-3">
                        <span className="text-stone-500 font-medium">{leftEmoji} {left}</span>
                        <span className="text-stone-500 font-medium">{right} {rightEmoji}</span>
                      </div>
                      <ReadOnlySlider value={travelStyle[key] ?? 50} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Budget + trips */}
            <div className="bg-white rounded-2xl border border-stone-100 p-6 space-y-6">
              {budget && (
                <div>
                  <h2 className="font-serif text-lg font-bold text-stone-800 mb-3">Budget</h2>
                  <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 border-2 border-brand bg-orange-50 text-sm font-semibold text-brand">
                    {budget.emoji} {budget.label}
                  </span>
                </div>
              )}

              <div>
                <h2 className="font-serif text-lg font-bold text-stone-800 mb-4">
                  Upcoming trips
                </h2>
                {trips && trips.length > 0 ? (
                  <div className="space-y-3">
                    {trips.map(trip => (
                      <Link
                        key={trip.id}
                        href={`/trips/${trip.id}`}
                        className="block rounded-xl border border-stone-100 px-4 py-3 hover:border-brand/30 hover:bg-orange-50/40 transition"
                      >
                        <p className="font-medium text-stone-800 text-sm">{trip.destination}</p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
                          {' · '}
                          {trip.group_size} {trip.group_size === 1 ? 'spot' : 'spots'}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-stone-400 italic">No upcoming trips posted yet</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
