import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/lib/actions/auth'
import MatchActions from './_MatchActions'

// ── Helpers ───────────────────────────────────────────────────────────────────

function budgetLabel(min: number | null) {
  if (min == null) return null
  if (min === 0)   return 'Backpacker'
  if (min === 50)  return 'Budget'
  if (min === 100) return 'Mid-range'
  return 'Comfort'
}

function getInitials(name: string | null, username: string | null) {
  if (name?.trim()) return name.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  return (username ?? '?')[0].toUpperCase()
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Profile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  home_city: string | null
  bio: string | null
  interests: string[]
  budget_min: number | null
}

type MatchRow = {
  id: string
  score: number
  reasons: string[]
  status: string
  initiated_by: string | null
  user_a: string
  user_b: string
  profile_a: Profile | null
  profile_b: Profile | null
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UserCard({
  profile,
  sharedInterests,
  score,
  badge,
  matchId,
  matchStatus,
  conversationId,
}: {
  profile: Profile
  sharedInterests: string[]
  score?: number
  badge?: string
  matchId: string | null
  matchStatus: 'none' | 'pending_sent' | 'pending_received' | 'connected'
  conversationId: string | null
}) {
  const name    = profile.full_name ?? profile.username ?? 'Unknown'
  const initials = getInitials(profile.full_name, profile.username)
  const budget  = budgetLabel(profile.budget_min)

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-4 hover:shadow-sm transition">
      {/* Header row */}
      <div className="flex items-start gap-3">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-brand/10 text-brand font-serif font-bold flex items-center justify-center shrink-0 text-sm">
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{name}</span>
            {budget && (
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-orange-50 text-brand border border-brand/20">
                {budget}
              </span>
            )}
            {score != null && score > 0 && (
              <span className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 ml-auto shrink-0">
                {score}% match
              </span>
            )}
          </div>
          {profile.home_city && (
            <p className="text-xs text-gray-400 mt-0.5">{profile.home_city}</p>
          )}
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{profile.bio}</p>
      )}

      {/* Shared interests */}
      {sharedInterests.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sharedInterests.slice(0, 4).map(i => (
            <span key={i} className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-brand/10 text-brand">
              {i}
            </span>
          ))}
          {sharedInterests.length > 4 && (
            <span className="text-xs text-gray-400 self-center">+{sharedInterests.length - 4} more</span>
          )}
        </div>
      )}

      {/* Status badge for context */}
      {badge && (
        <p className="text-xs text-gray-400 font-medium">{badge}</p>
      )}

      {/* Action buttons */}
      <MatchActions
        matchId={matchId}
        targetUserId={profile.id}
        username={profile.username}
        initialStatus={matchStatus}
        conversationId={conversationId}
      />
    </div>
  )
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">{title}</h2>
      <span className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-gray-100 text-gray-500">
        {count}
      </span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  // Fetch user's own profile (for shared interest calculation + navbar)
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url, interests, budget_min')
    .eq('id', user.id)
    .single()

  const myInterests: string[] = (myProfile?.interests ?? []) as string[]

  // Fetch all non-declined matches involving this user
  const { data: matchesRaw } = await supabase
    .from('matches')
    .select(`
      id, score, reasons, status, initiated_by, user_a, user_b,
      profile_a:profiles!user_a(id, username, full_name, avatar_url, home_city, bio, interests, budget_min),
      profile_b:profiles!user_b(id, username, full_name, avatar_url, home_city, bio, interests, budget_min)
    `)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .neq('status', 'declined')
    .order('score', { ascending: false })

  const matches = (matchesRaw ?? []) as unknown as MatchRow[]

  // Fetch conversations to map conversation IDs onto matches
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, participant_a, participant_b')
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)

  // Build a lookup: otherUserId → conversationId
  const convByUser = new Map<string, string>()
  for (const c of conversations ?? []) {
    const otherId = c.participant_a === user.id ? c.participant_b : c.participant_a
    convByUser.set(otherId, c.id)
  }

  // Process matches into display shape
  type ProcessedMatch = {
    matchId: string
    profile: Profile
    score: number
    status: 'pending_sent' | 'pending_received' | 'connected'
    sharedInterests: string[]
    conversationId: string | null
  }

  const processed: ProcessedMatch[] = matches.map(m => {
    const other = (m.user_a === user.id ? m.profile_b : m.profile_a)!
    const otherInterests: string[] = (other.interests ?? []) as string[]
    const shared = otherInterests.filter(i => myInterests.includes(i))

    let status: ProcessedMatch['status']
    if (m.status === 'connected') {
      status = 'connected'
    } else if (m.initiated_by === user.id) {
      status = 'pending_sent'
    } else {
      status = 'pending_received'
    }

    return {
      matchId: m.id,
      profile: other,
      score: m.score ?? 0,
      status,
      sharedInterests: shared,
      conversationId: convByUser.get(other.id) ?? null,
    }
  })

  const connected  = processed.filter(m => m.status === 'connected')
  const received   = processed.filter(m => m.status === 'pending_received')
  const sent       = processed.filter(m => m.status === 'pending_sent')

  // Discover: onboarded users not already in a match with current user
  const matchedIds = new Set(matches.map(m => m.user_a === user.id ? m.user_b : m.user_a))
  matchedIds.add(user.id)

  let discoverQuery = supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, home_city, bio, interests, budget_min')
    .eq('onboarded', true)
    .neq('id', user.id)

  const excludeArr = [...matchedIds]
  if (excludeArr.length > 0) {
    discoverQuery = discoverQuery.not('id', 'in', `(${excludeArr.join(',')})`)
  }

  const { data: discoverRaw } = await discoverQuery.limit(60)

  // Sort discover users by shared interest count descending
  const discover = (discoverRaw ?? [])
    .map((p: any) => ({
      profile: p as Profile,
      sharedInterests: ((p.interests ?? []) as string[]).filter(i => myInterests.includes(i)),
    }))
    .sort((a, b) => b.sharedInterests.length - a.sharedInterests.length)
    .slice(0, 24)

  // Navbar
  const navUsername = myProfile?.username
  const profileHref = navUsername ? `/profile/${navUsername}` : '/profile/edit'
  const navInitials = myProfile?.full_name
    ? myProfile.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : (navUsername?.[0]?.toUpperCase() ?? '?')

  const hasAnyMatches = processed.length > 0

  return (
    <div className="min-h-screen bg-background">

      {/* ── Navbar ────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="font-serif text-xl font-bold text-brand shrink-0">Wandr</Link>
          <div className="hidden sm:flex items-center gap-1">
            {[
              { href: '/trips',    label: 'Browse trips' },
              { href: '/matches',  label: 'Matches'      },
              { href: '/messages', label: 'Messages'     },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="text-sm text-gray-500 hover:text-gray-900 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition">
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={profileHref} className="group">
              {myProfile?.avatar_url ? (
                <img src={myProfile.avatar_url} alt="avatar" className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-brand transition" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold font-serif group-hover:bg-brand/20 transition">{navInitials}</div>
              )}
            </Link>
            <form action={signOut}>
              <button type="submit" className="text-sm text-gray-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition">Log out</button>
            </form>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Matches</h1>
          <p className="text-sm text-gray-400 mt-1">
            Connect with travellers, accept requests, and start conversations.
          </p>
        </div>

        {/* ── Incoming requests ─────────────────────────────────────────── */}
        {received.length > 0 && (
          <section>
            <SectionHeader title="Requests for you" count={received.length} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {received.map(m => (
                <UserCard
                  key={m.matchId}
                  profile={m.profile}
                  sharedInterests={m.sharedInterests}
                  score={m.score}
                  matchId={m.matchId}
                  matchStatus="pending_received"
                  conversationId={m.conversationId}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Connected ─────────────────────────────────────────────────── */}
        {connected.length > 0 && (
          <section>
            <SectionHeader title="Connected" count={connected.length} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {connected.map(m => (
                <UserCard
                  key={m.matchId}
                  profile={m.profile}
                  sharedInterests={m.sharedInterests}
                  score={m.score}
                  matchId={m.matchId}
                  matchStatus="connected"
                  conversationId={m.conversationId}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Sent requests ─────────────────────────────────────────────── */}
        {sent.length > 0 && (
          <section>
            <SectionHeader title="Pending" count={sent.length} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sent.map(m => (
                <UserCard
                  key={m.matchId}
                  profile={m.profile}
                  sharedInterests={m.sharedInterests}
                  matchId={m.matchId}
                  matchStatus="pending_sent"
                  conversationId={m.conversationId}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state for matches section */}
        {!hasAnyMatches && (
          <div className="bg-white rounded-xl border border-gray-100 px-6 py-10 text-center">
            <p className="text-sm font-semibold text-gray-500">No connections yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              Browse trips and send join requests, or connect directly with travellers below.
            </p>
          </div>
        )}

        {/* ── Discover ──────────────────────────────────────────────────── */}
        {discover.length > 0 && (
          <section>
            <SectionHeader title="Discover travellers" count={discover.length} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {discover.map(({ profile, sharedInterests }) => (
                <UserCard
                  key={profile.id}
                  profile={profile}
                  sharedInterests={sharedInterests}
                  matchId={null}
                  matchStatus="none"
                  conversationId={null}
                  badge={
                    sharedInterests.length > 0
                      ? `${sharedInterests.length} shared interest${sharedInterests.length > 1 ? 's' : ''}`
                      : undefined
                  }
                />
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
