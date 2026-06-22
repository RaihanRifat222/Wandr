import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import UserCard from './_UserCard'
import EmptyBanner from './_EmptyBanner'

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

  const hasAnyMatches = processed.length > 0

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

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
              {received.map((m, i) => (
                <UserCard
                  key={m.matchId}
                  index={i}
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
              {connected.map((m, i) => (
                <UserCard
                  key={m.matchId}
                  index={i}
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
              {sent.map((m, i) => (
                <UserCard
                  key={m.matchId}
                  index={i}
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
        {!hasAnyMatches && <EmptyBanner />}

        {/* ── Discover ──────────────────────────────────────────────────── */}
        {discover.length > 0 && (
          <section>
            <SectionHeader title="Discover travellers" count={discover.length} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {discover.map(({ profile, sharedInterests }, i) => (
                <UserCard
                  key={profile.id}
                  index={i}
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
