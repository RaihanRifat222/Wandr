import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/lib/actions/auth'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function getInitials(name: string | null, username: string | null) {
  if (name?.trim()) return name.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  return (username ?? '?')[0].toUpperCase()
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url')
    .eq('id', user.id)
    .single()

  // Fetch all conversations with participant profiles and messages
  const { data: convRaw } = await supabase
    .from('conversations')
    .select(`
      id, created_at,
      participant_a, participant_b,
      pa:profiles!participant_a(id, username, full_name, avatar_url),
      pb:profiles!participant_b(id, username, full_name, avatar_url),
      messages(id, content, created_at, sender_id)
    `)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const conversations = (convRaw ?? []).map((c: any) => {
    const other = c.participant_a === user.id ? c.pb : c.pa
    const sortedMsgs = [...(c.messages ?? [])].sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const lastMsg = sortedMsgs[0] ?? null
    return { id: c.id, other, lastMsg, created_at: c.created_at }
  })

  const navUsername = myProfile?.username
  const profileHref = navUsername ? `/profile/${navUsername}` : '/profile/edit'
  const navInitials = myProfile?.full_name
    ? myProfile.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : (navUsername?.[0]?.toUpperCase() ?? '?')

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

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-serif text-2xl font-bold text-gray-900 mb-6">Messages</h1>

        {conversations.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 px-6 py-16 text-center">
            <p className="text-sm font-semibold text-gray-500">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Connect with a traveller or get a trip request accepted to start messaging.
            </p>
            <Link
              href="/trips"
              className="inline-block mt-5 rounded-lg px-5 py-2.5 bg-brand text-white text-sm font-semibold hover:brightness-95 transition"
            >
              Browse trips
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
            {conversations.map(({ id, other, lastMsg }) => {
              const name = other?.full_name ?? other?.username ?? 'Unknown'
              const inits = getInitials(other?.full_name ?? null, other?.username ?? null)
              return (
                <Link
                  key={id}
                  href={`/messages/${id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition"
                >
                  {other?.avatar_url ? (
                    <img src={other.avatar_url} alt={name} className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100 shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-brand/10 text-brand font-serif font-bold flex items-center justify-center shrink-0 text-sm">
                      {inits}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">{name}</span>
                      {lastMsg && (
                        <span className="text-xs text-gray-400 shrink-0">{timeAgo(lastMsg.created_at)}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {lastMsg
                        ? (lastMsg.sender_id === user.id ? 'You: ' : '') + lastMsg.content
                        : 'No messages yet — say hello!'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
