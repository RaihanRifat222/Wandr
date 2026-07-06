import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import RequestActions from './_RequestActions'
import JoinButton from './_JoinButton'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function budgetLabel(e: number | null) {
  if (e == null) return null
  if (e <= 50)  return 'Backpacker'
  if (e <= 100) return 'Budget'
  if (e <= 200) return 'Mid-range'
  return 'Comfort'
}

function getInitials(name: string | null, username: string | null) {
  if (name?.trim()) return name.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  return (username ?? '?')[0].toUpperCase()
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── SVG icons ─────────────────────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function WalletIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12c0 1.1.9 2 2 2h14v-4" /><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Requester = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  home_city: string | null
  bio: string | null
  interests: string[]
  budget_min: number | null
}

type TripRequest = {
  id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  requester_id: string
  requester: Requester | null
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: trip }] = await Promise.all([
    supabase
      .from('trips')
      .select(`*, host:profiles!host_id(id, username, full_name, avatar_url, home_city, bio)`)
      .eq('id', id)
      .single(),
  ])

  if (!trip) notFound()

  const isHost = user.id === trip.host_id

  // RLS automatically scopes what we see:
  // host → all requests for the trip
  // requester → only their own request
  // neither → empty
  const { data: requestsRaw } = await supabase
    .from('trip_requests')
    .select(`
      id, status, created_at, requester_id,
      requester:profiles!requester_id(
        id, username, full_name, avatar_url, home_city, bio, interests, budget_min
      )
    `)
    .eq('trip_id', id)
    .order('created_at', { ascending: true })

  const requests = (requestsRaw ?? []) as unknown as TripRequest[]
  const myRequest = !isHost ? (requests.find(r => r.requester_id === user.id) ?? null) : null

  const pendingCount  = requests.filter(r => r.status === 'pending').length
  const acceptedCount = requests.filter(r => r.status === 'accepted').length

  const host = trip.host as { id: string; username: string | null; full_name: string | null; avatar_url: string | null; home_city: string | null; bio: string | null } | null

  const startFmt      = fmtDate(trip.start_date)
  const endFmt        = fmtDate(trip.end_date)
  const budget        = budgetLabel(trip.budget_estimate)
  const buddiesNeeded = trip.group_size - 1

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">

        {/* Back link */}
        <Link href="/trips" className="text-sm text-gray-400 hover:text-gray-700 transition font-medium">
          ← Back to trips
        </Link>

        {/* ── Trip header ───────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-brand to-pine" />
          <div className="p-6 space-y-4">

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {trip.region && (
                <span className="rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600">
                  {trip.region}
                </span>
              )}
              <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                trip.status === 'open'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}>
                {trip.status === 'open' ? 'Accepting requests' : 'Closed'}
              </span>
              {isHost && (
                <span className="rounded-full px-3 py-1 text-xs font-semibold bg-brand/10 text-brand border border-brand/20">
                  Your trip
                </span>
              )}
            </div>

            {/* Destination */}
            <h1 className="font-serif text-3xl font-bold text-gray-900">{trip.destination}</h1>

            {/* Meta chips */}
            <div className="flex flex-wrap gap-2">
              {(startFmt || endFmt) && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium">
                  <CalendarIcon />
                  {startFmt && endFmt ? `${startFmt} – ${endFmt}` : startFmt ?? endFmt}
                </span>
              )}
              {budget && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium">
                  <WalletIcon />
                  {budget}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium">
                <UsersIcon />
                {buddiesNeeded} {buddiesNeeded === 1 ? 'buddy' : 'buddies'} wanted
              </span>
            </div>

            {/* Description */}
            {trip.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{trip.description}</p>
            )}
          </div>
        </div>

        {/* ── Host card ────────────────────────────────────────────── */}
        {host && (
          <div className="bg-surface rounded-xl border border-border p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Posted by</p>
            <div className="flex items-center gap-4">
              {host.avatar_url ? (
                <img
                  src={host.avatar_url}
                  alt={host.full_name ?? ''}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-brand/10 text-brand font-serif font-bold flex items-center justify-center shrink-0 text-sm">
                  {getInitials(host.full_name, host.username)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{host.full_name ?? host.username}</p>
                {host.home_city && (
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <MapPinIcon /> {host.home_city}
                  </p>
                )}
                {host.bio && (
                  <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{host.bio}</p>
                )}
              </div>
              {host.username && !isHost && (
                <Link
                  href={`/profile/${host.username}`}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-brand border border-brand/20 hover:bg-brand/10 transition"
                >
                  View profile
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── Host: request management ─────────────────────────────── */}
        {isHost && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
                Join Requests
              </h2>
              <div className="flex gap-3 text-xs text-gray-400 font-medium">
                <span>{pendingCount} pending</span>
                <span>{acceptedCount} accepted</span>
              </div>
            </div>

            {requests.length === 0 ? (
              <div className="bg-surface rounded-xl border border-border px-6 py-10 text-center">
                <p className="text-sm text-gray-400">No requests yet.</p>
                <p className="text-xs text-gray-300 mt-1">Share your trip link to attract travel buddies.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map(req => {
                  const r = req.requester
                  if (!r) return null
                  const budg = r.budget_min != null
                    ? r.budget_min === 0   ? 'Backpacker'
                    : r.budget_min === 50  ? 'Budget'
                    : r.budget_min === 100 ? 'Mid-range'
                    : 'Comfort'
                    : null

                  return (
                    <div
                      key={req.id}
                      className={`bg-surface rounded-xl border border-border p-5 transition ${
                        req.status === 'declined' ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {r.avatar_url ? (
                          <img
                            src={r.avatar_url}
                            alt={r.full_name ?? ''}
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-brand/10 text-brand font-serif font-bold flex items-center justify-center shrink-0 text-sm">
                            {getInitials(r.full_name, r.username)}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          {/* Name + meta row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 text-sm">
                              {r.full_name ?? r.username}
                            </span>
                            {r.username && (
                              <span className="text-xs text-gray-400">@{r.username}</span>
                            )}
                            {budg && (
                              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-brand/10 text-brand border border-brand/20">
                                {budg}
                              </span>
                            )}
                            <span className="text-xs text-gray-300 ml-auto shrink-0">
                              {timeAgo(req.created_at)}
                            </span>
                          </div>

                          {r.home_city && (
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                              <MapPinIcon /> {r.home_city}
                            </p>
                          )}

                          {r.bio && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{r.bio}</p>
                          )}

                          {r.interests?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {(r.interests as string[]).slice(0, 5).map(i => (
                                <span
                                  key={i}
                                  className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600"
                                >
                                  {i}
                                </span>
                              ))}
                              {r.interests.length > 5 && (
                                <span className="text-xs text-gray-300 self-center">
                                  +{r.interests.length - 5} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-3 mt-4">
                            <RequestActions
                              requestId={req.id}
                              tripId={id}
                              initialStatus={req.status}
                            />
                            {r.username && (
                              <Link
                                href={`/profile/${r.username}`}
                                className="text-xs text-brand font-medium hover:underline shrink-0"
                              >
                                View profile
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Non-host: join status or join button ──────────────────── */}
        {!isHost && (
          <div className="bg-surface rounded-xl border border-border p-5">
            {myRequest ? (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  Your request
                </p>
                {myRequest.status === 'pending' && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-medium text-amber-700">
                    Request pending — waiting for the host to respond.
                  </div>
                )}
                {myRequest.status === 'accepted' && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">
                    Request accepted — you&apos;re going on this trip!
                  </div>
                )}
                {myRequest.status === 'declined' && (
                  <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-500">
                    Your request was not accepted for this trip.
                  </div>
                )}
              </>
            ) : trip.status === 'open' ? (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Want to join?
                </p>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  Send a request to the host. They&apos;ll review your profile and get back to you.
                </p>
                <JoinButton tripId={id} />
              </>
            ) : (
              <p className="text-sm text-gray-400">
                This trip is no longer accepting requests.
              </p>
            )}
          </div>
        )}

      </main>
    </>
  )
}
