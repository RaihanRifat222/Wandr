import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/lib/actions/auth'
import PostCard, { type PostData } from './_PostCard'
import CreatePostButton from './_CreatePostButton'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const [{ data: myProfile }, { data: postsRaw }, { data: myTrips }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, username, avatar_url')
      .eq('id', user.id)
      .single(),
    supabase
      .from('posts')
      .select(`
        id, image_url, caption, created_at, user_id,
        author:profiles!user_id ( id, username, full_name, avatar_url, home_city ),
        trip:trips!trip_id ( id, destination, region ),
        post_likes ( user_id ),
        post_comments (
          id, content, created_at, user_id,
          commenter:profiles!user_id ( id, username, full_name, avatar_url )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('trips')
      .select('id, destination')
      .eq('host_id', user.id)
      .eq('status', 'open')
      .order('created_at', { ascending: false }),
  ])

  const posts = (postsRaw ?? []) as unknown as PostData[]

  const navUsername = myProfile?.username
  const profileHref = navUsername ? `/profile/${navUsername}` : '/profile/edit'
  const navInitials = myProfile?.full_name
    ? myProfile.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : (navUsername?.[0]?.toUpperCase() ?? '?')

  return (
    <div className="min-h-screen bg-background">

      {/* ── Navbar ────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="font-serif text-xl font-bold text-brand shrink-0">Wandr</Link>
          <div className="hidden sm:flex items-center gap-1">
            {[
              { href: '/dashboard', label: 'Feed'         },
              { href: '/trips',     label: 'Browse trips' },
              { href: '/matches',   label: 'Matches'      },
              { href: '/messages',  label: 'Messages'     },
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
                <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold font-serif group-hover:bg-brand/20 transition">
                  {navInitials}
                </div>
              )}
            </Link>
            <form action={signOut}>
              <button type="submit" className="text-sm text-gray-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                Log out
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* ── Feed ──────────────────────────────────────────────────── */}
      <main className="max-w-[470px] mx-auto px-4 py-6 space-y-4">

        {/* Create post */}
        <CreatePostButton
          userTrips={myTrips ?? []}
          avatarUrl={myProfile?.avatar_url ?? null}
          initials={navInitials}
          userId={user.id}
        />

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 px-6 py-16 text-center">
            <p className="text-sm font-semibold text-gray-500">No posts yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Be the first to share a travel moment.
            </p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user.id}
              currentUserAvatar={myProfile?.avatar_url ?? null}
              currentUserInitials={navInitials}
            />
          ))
        )}

      </main>
    </div>
  )
}
