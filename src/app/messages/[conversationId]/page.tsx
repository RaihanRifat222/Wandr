import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ChatWindow from './_ChatWindow'
import GroupMembersCard from './_GroupMembersCard'

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

  // RLS scopes this to conversations the user actually belongs to
  // (either as participant_a/b, or via conversation_participants for groups)
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, is_group, title, participant_a, participant_b')
    .eq('id', conversationId)
    .single()

  if (!conv) notFound()

  type Member = { id: string; username: string | null; full_name: string | null; avatar_url: string | null; home_city?: string | null }

  let members: Member[]
  let allMembers: Member[] = []
  let headerTitle: string
  let headerSubtitle: string | null = null

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url')
    .eq('id', user.id)
    .single()

  if (conv.is_group) {
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('profile:profiles(id, username, full_name, avatar_url)')
      .eq('conversation_id', conversationId)

    allMembers = ((participants ?? []) as any[]).map(p => p.profile as Member).filter(Boolean)
    members = allMembers.filter(p => p.id !== user.id)

    headerTitle = conv.title ?? 'Trip group chat'
    headerSubtitle = members.map(m => m.full_name ?? m.username).filter(Boolean).join(', ')
  } else {
    const otherId = conv.participant_a === user.id ? conv.participant_b : conv.participant_a
    const { data: other } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, home_city')
      .eq('id', otherId)
      .single()

    members = other ? [other] : []
    headerTitle = other?.full_name ?? other?.username ?? 'Unknown'
    headerSubtitle = other?.home_city ?? null
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('id, content, created_at, sender_id')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  const navUsername = myProfile?.username
  const profileHref = navUsername ? `/profile/${navUsername}` : '/profile/edit'
  const navInitials = myProfile?.full_name
    ? myProfile.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : (navUsername?.[0]?.toUpperCase() ?? '?')

  const headerInitials = getInitials(
    conv.is_group ? headerTitle : (members[0]?.full_name ?? null),
    conv.is_group ? null : (members[0]?.username ?? null)
  )
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
            {conv.is_group ? (
              <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            ) : members[0]?.avatar_url ? (
              <img src={members[0].avatar_url!} alt={headerTitle} className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-brand/10 text-brand font-serif font-bold flex items-center justify-center shrink-0 text-sm">
                {headerInitials}
              </div>
            )}
            {conv.is_group ? (
              <GroupMembersCard
                title={headerTitle}
                subtitle={headerSubtitle}
                members={allMembers}
                currentUserId={user.id}
              />
            ) : (
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{headerTitle}</p>
                {headerSubtitle && (
                  <p className="text-xs text-gray-400 truncate">{headerSubtitle}</p>
                )}
              </div>
            )}
            {!conv.is_group && members[0]?.username && (
              <Link
                href={`/profile/${members[0].username}`}
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
            isGroup={conv.is_group}
            members={members}
          />
        </div>
      </div>
    </div>
  )
}
