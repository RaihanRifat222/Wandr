import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ChatWindow from './_ChatWindow'

function getInitials(name: string | null, username: string | null) {
  if (name?.trim()) return name.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  return (username ?? '?')[0].toUpperCase()
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify conversation exists and user is a participant
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, participant_a, participant_b')
    .eq('id', conversationId)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .single()

  if (!conv) notFound()

  const otherId = conv.participant_a === user.id ? conv.participant_b : conv.participant_a

  const [{ data: myProfile }, { data: other }, { data: messages }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, username, avatar_url')
      .eq('id', user.id)
      .single(),
    supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, home_city')
      .eq('id', otherId)
      .single(),
    supabase
      .from('messages')
      .select('id, content, created_at, sender_id')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true }),
  ])

  const navUsername = myProfile?.username
  const profileHref = navUsername ? `/profile/${navUsername}` : '/profile/edit'
  const navInitials = myProfile?.full_name
    ? myProfile.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : (navUsername?.[0]?.toUpperCase() ?? '?')

  const otherName = other?.full_name ?? other?.username ?? 'Unknown'
  const otherInitials = getInitials(other?.full_name ?? null, other?.username ?? null)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* ── Chat container ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-0 sm:px-4 py-0 sm:py-6">
        <div className="flex-1 flex flex-col bg-surface sm:rounded-2xl sm:border sm:border-border overflow-hidden" style={{ minHeight: 'calc(100vh - 56px)' }}>

          {/* ── Chat header ─────────────────────────────────────────── */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-surface">
            <Link href="/messages" className="text-gray-400 hover:text-gray-700 transition mr-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            {other?.avatar_url ? (
              <img src={other.avatar_url} alt={otherName} className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-brand/10 text-brand font-serif font-bold flex items-center justify-center shrink-0 text-sm">
                {otherInitials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{otherName}</p>
              {other?.home_city && (
                <p className="text-xs text-gray-400">{other.home_city}</p>
              )}
            </div>
            {other?.username && (
              <Link
                href={`/profile/${other.username}`}
                className="text-xs text-brand font-medium hover:underline shrink-0"
              >
                Profile
              </Link>
            )}
          </div>

          {/* ── Chat window (client) ─────────────────────────────────── */}
          <ChatWindow
            conversationId={conversationId}
            initialMessages={messages ?? []}
            userId={user.id}
            other={{
              id:         other?.id ?? otherId,
              full_name:  other?.full_name ?? null,
              username:   other?.username ?? null,
              avatar_url: other?.avatar_url ?? null,
            }}
          />
        </div>
      </div>
    </div>
  )
}
