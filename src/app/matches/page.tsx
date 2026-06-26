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

function SectionHeader({
  title,
  count,
  subtitle,
}: {
  title: string
  count: number
  subtitle?: string
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">{title}</h2>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-gray-100 text-gray-500">
            {count}
          </span>
        </div>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url, interests, budget_min, embedding')
    .eq('id', user.id)
    .single()

  const myInterests: string[] = (myProfile?.interests ?? []) as string[]
  const myEmbedding = (myProfile as any)?.embedding as number[] | null

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

  const convByUser = new Map<string, string>()
  for (const c of conversations ?? []) {
    const otherId = c.participant_a === user.id ? c.participant_b : c.participant_a
    convByUser.set(otherId, c.id)
  }

  // Process existing matches into display shape
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
    if (m.status === 'connected') status = 'connected'
    else if (m.initiated_by === user.id) status = 'pending_sent'
    else status = 'pending_received'

    return {
      matchId:        m.id,
      profile:        other,
      score:          m.score ?? 0,
      status,
      sharedInterests: shared,
      conversationId:  convByUser.get(other.id) ?? null,
    }
  })

  const connected = processed.filter(m => m.status === 'connected')
  const received  = processed.filter(m => m.status === 'pending_received')
  const sent      = processed.filter(m => m.status === 'pending_sent')

  // ── Discover: IDs already in a match relationship ──────────────────────────
  const matchedIds = new Set(matches.map(m => m.user_a === user.id ? m.user_b : m.user_a))
  matchedIds.add(user.id)

  type DiscoverUser = { profile: Profile; sharedInterests: string[]; score: number }
  let discover: DiscoverUser[] = []
  let discoverUsedEmbeddings = false

  if (myEmbedding) {
    // ── Vector search: find most compatible profiles ───────────────────────
    type RpcMatch = { id: string; similarity: number }
    const { data: similarRaw } = await supabase.rpc('match_profiles', {
      query_embedding: myEmbedding,
      match_count:     60,
      exclude_id:      user.id,
    })
    const similar = (similarRaw as RpcMatch[] | null) ?? []

    const topRows = similar
      .filter(r => !matchedIds.has(r.id))
      .slice(0, 24)

    if (topRows.length > 0) {
      const { data: discoverProfiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, home_city, bio, interests, budget_min')
        .in('id', topRows.map(r => r.id))

      const scoreById = new Map<string, number>(similar.map(r => [r.id, r.similarity]))

      discover = (discoverProfiles ?? [])
        .map((p: any) => ({
          profile:         p as Profile,
          sharedInterests: ((p.interests ?? []) as string[]).filter((i: string) => myInterests.includes(i)),
          score:           Math.round((scoreById.get(p.id) ?? 0) * 100),
        }))
        .sort((a, b) => b.score - a.score)

      discoverUsedEmbeddings = true
    }
  }

  if (!discoverUsedEmbeddings) {
    // ── Fallback: Jaccard sort ─────────────────────────────────────────────
    let q = supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, home_city, bio, interests, budget_min')
      .eq('onboarded', true)
      .neq('id', user.id)

    const excludeArr = [...matchedIds]
    if (excludeArr.length > 0) q = q.not('id', 'in', `(${excludeArr.join(',')})`)

    const { data: discoverRaw } = await q.limit(60)

    discover = (discoverRaw ?? [])
      .map((p: any) => ({
        profile:         p as Profile,
        sharedInterests: ((p.interests ?? []) as string[]).filter((i: string) => myInterests.includes(i)),
        score:           0,
      }))
      .sort((a, b) => b.sharedInterests.length - a.sharedInterests.length)
      .slice(0, 24)
  }

  const hasAnyMatches = processed.length > 0

  return (
    <>
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

        {!hasAnyMatches && <EmptyBanner />}

        {/* ── Discover ──────────────────────────────────────────────────── */}
        {discover.length > 0 && (
          <section>
            <SectionHeader
              title="Discover travellers"
              count={discover.length}
              subtitle={
                discoverUsedEmbeddings
                  ? 'Ranked by travel compatibility'
                  : 'Ranked by shared interests'
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {discover.map(({ profile, sharedInterests, score }, i) => (
                <UserCard
                  key={profile.id}
                  index={i}
                  profile={profile}
                  sharedInterests={sharedInterests}
                  score={score}
                  matchId={null}
                  matchStatus="none"
                  conversationId={null}
                />
              ))}
            </div>
          </section>
        )}

      </main>
    </>
  )
}
