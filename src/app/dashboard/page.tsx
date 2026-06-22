import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { type PostData } from './_PostCard'
import PostsFeed from './_PostsFeed'
import CreatePostButton from './_CreatePostButton'
import DashboardSidebar from './_DashboardSidebar'
import { cosineSim } from '@/lib/embeddings'

// ── Feed ranking ──────────────────────────────────────────────────────────────
// Scores each post by author compatibility + recency, then sorts descending.
// Uses cosine similarity when embeddings are available, Jaccard fallback otherwise.

type ScoringAuthor = {
  id: string
  embedding?: number[] | null
  interests?: string[]
  travel_style?: Record<string, number>
  budget_min?: number | null
  budget_max?: number | null
}

type MyProfile = {
  embedding: number[] | null
  interests: string[]
  travel_style: Record<string, number>
  budget_min: number | null
  budget_max: number | null
}

function scorePost(
  post: PostData,
  me: MyProfile,
  myInterests: Set<string>,
  connectedIds: Set<string>,
  pendingIds: Set<string>,
): number {
  const author = post.author as unknown as ScoringAuthor | null
  const hoursAgo = (Date.now() - new Date(post.created_at).getTime()) / 3_600_000

  // Recency: 100pts fresh → ~13pts after 7 days (e^-t/48)
  const recency = 100 * Math.exp(-hoursAgo / 48)

  if (!author) return recency

  let rel = 0

  // Connection bonus
  if (connectedIds.has(author.id)) rel += 100
  else if (pendingIds.has(author.id)) rel += 30

  if (me.embedding && author.embedding) {
    // Cosine similarity: range 0–1, scaled to 0–120pts
    const sim = cosineSim(me.embedding, author.embedding)
    rel += Math.max(0, sim) * 120
  } else {
    // Fallback: Jaccard interest overlap × 60 + style proximity × 40
    const theirInterests = author.interests ?? []
    if (myInterests.size > 0 && theirInterests.length > 0) {
      const shared = theirInterests.filter(i => myInterests.has(i)).length
      const union  = new Set([...me.interests, ...theirInterests]).size
      rel += (shared / union) * 60
    }

    const myStyle    = me.travel_style ?? {}
    const theirStyle = author.travel_style ?? {}
    const styleKeys  = (['budget', 'planned', 'solo', 'relaxed'] as const)
      .filter(k => myStyle[k] != null && theirStyle[k] != null)
    if (styleKeys.length > 0) {
      const proximity = styleKeys.reduce(
        (sum, k) => sum + (1 - Math.abs((myStyle[k] ?? 50) - (theirStyle[k] ?? 50)) / 100),
        0,
      ) / styleKeys.length
      rel += proximity * 40
    }

    if (me.budget_min != null && author.budget_min != null) {
      const myMax    = me.budget_max    ?? 9_999
      const theirMax = author.budget_max ?? 9_999
      if (!(myMax < author.budget_min || theirMax < me.budget_min)) rel += 20
    }
  }

  return rel + recency
}

function rankPosts(
  posts: PostData[],
  me: MyProfile,
  connectedIds: Set<string>,
  pendingIds: Set<string>,
): PostData[] {
  const myInterests = new Set(me.interests)
  return [...posts].sort(
    (a, b) =>
      scorePost(b, me, myInterests, connectedIds, pendingIds) -
      scorePost(a, me, myInterests, connectedIds, pendingIds),
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const [{ data: myProfile }, { data: postsRaw }, { data: myTrips }, { data: suggestedTripsRaw }, { data: myMatches }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, username, avatar_url, tagline, favorite_moment_image_url, interests, travel_style, budget_min, budget_max, embedding')
      .eq('id', user.id)
      .single(),
    supabase
      .from('posts')
      .select(`
        id, image_url, caption, created_at, user_id,
        author:profiles!user_id ( id, username, full_name, avatar_url, home_city, interests, travel_style, budget_min, budget_max, embedding ),
        trip:trips!trip_id ( id, destination, region ),
        post_likes ( user_id ),
        post_comments (
          id, content, created_at, user_id,
          commenter:profiles!user_id ( id, username, full_name, avatar_url )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('trips')
      .select('id, destination')
      .eq('host_id', user.id)
      .eq('status', 'open')
      .order('created_at', { ascending: false }),
    supabase
      .from('trips')
      .select('id, destination, region, host:profiles!host_id ( full_name, username, avatar_url )')
      .eq('status', 'open')
      .neq('host_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('matches')
      .select('user_a, user_b, status')
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
  ])

  // Build connection sets for ranking
  const connectedIds = new Set<string>()
  const pendingIds   = new Set<string>()
  for (const m of myMatches ?? []) {
    const otherId = m.user_a === user.id ? m.user_b : m.user_a
    if (m.status === 'connected') connectedIds.add(otherId)
    else if (m.status === 'pending') pendingIds.add(otherId)
  }

  const rawPosts = (postsRaw ?? []) as unknown as PostData[]
  const meForRanking: MyProfile = {
    embedding:    (myProfile as any)?.embedding as number[] | null        ?? null,
    interests:    (myProfile?.interests   as string[])                    ?? [],
    travel_style: (myProfile?.travel_style as Record<string, number>)     ?? {},
    budget_min:   myProfile?.budget_min  as number | null                 ?? null,
    budget_max:   myProfile?.budget_max  as number | null                 ?? null,
  }
  const rankedPosts = rankPosts(rawPosts, meForRanking, connectedIds, pendingIds).slice(0, 30)

  // Strip embeddings — large float arrays, not needed by client components
  const posts = rankedPosts.map(p => {
    const author = p.author as any
    if (author?.embedding) {
      const { embedding: _e, ...rest } = author
      return { ...p, author: rest } as PostData
    }
    return p
  })

  const initials   = myProfile?.full_name
    ? myProfile.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : (myProfile?.username?.[0]?.toUpperCase() ?? '?')

  const showProfileNudge = !myProfile?.tagline || !myProfile?.favorite_moment_image_url

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[470px_1fr] gap-8 items-start">
        <div className="space-y-4 w-full">
          <CreatePostButton
            userTrips={myTrips ?? []}
            avatarUrl={myProfile?.avatar_url ?? null}
            initials={initials}
            userId={user.id}
          />

          <PostsFeed
            posts={posts}
            currentUserId={user.id}
            currentUserAvatar={myProfile?.avatar_url ?? null}
            currentUserInitials={initials}
          />
        </div>

        <div className="hidden lg:block">
          <DashboardSidebar
            suggestedTrips={(suggestedTripsRaw ?? []) as any}
            showProfileNudge={showProfileNudge}
          />
        </div>
      </main>
    </div>
  )
}
