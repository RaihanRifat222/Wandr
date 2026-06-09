import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
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

  const posts      = (postsRaw ?? []) as unknown as PostData[]
  const initials   = myProfile?.full_name
    ? myProfile.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : (myProfile?.username?.[0]?.toUpperCase() ?? '?')

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-[470px] mx-auto px-4 py-6 space-y-4">
        <CreatePostButton
          userTrips={myTrips ?? []}
          avatarUrl={myProfile?.avatar_url ?? null}
          initials={initials}
          userId={user.id}
        />

        {posts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 px-6 py-16 text-center">
            <p className="text-sm font-semibold text-gray-500">No posts yet</p>
            <p className="text-xs text-gray-400 mt-1">Be the first to share a travel moment.</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user.id}
              currentUserAvatar={myProfile?.avatar_url ?? null}
              currentUserInitials={initials}
            />
          ))
        )}
      </main>
    </div>
  )
}
