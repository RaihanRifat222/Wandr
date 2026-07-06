import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import MessagesList from './_MessagesList'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  // 1:1 conversations
  const { data: oneToOneRaw } = await supabase
    .from('conversations')
    .select(`
      id, created_at,
      participant_a, participant_b,
      pa:profiles!participant_a(id, username, full_name, avatar_url),
      pb:profiles!participant_b(id, username, full_name, avatar_url),
      messages(id, content, created_at, sender_id)
    `)
    .eq('is_group', false)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)

  const oneToOne = (oneToOneRaw ?? []).map((c: any) => {
    const other = c.participant_a === user.id ? c.pb : c.pa
    const sortedMsgs = [...(c.messages ?? [])].sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    return {
      id: c.id, isGroup: false, title: null, other,
      members: [], lastMsg: sortedMsgs[0] ?? null, created_at: c.created_at,
    }
  })

  // Group (trip) conversations
  const { data: myGroupLinks } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id)

  const groupIds = (myGroupLinks ?? []).map(l => l.conversation_id)

  const { data: groupRaw } = groupIds.length > 0
    ? await supabase
        .from('conversations')
        .select(`
          id, created_at, title,
          conversation_participants(user_id, profile:profiles(id, username, full_name, avatar_url)),
          messages(id, content, created_at, sender_id)
        `)
        .in('id', groupIds)
    : { data: [] as any[] }

  const groups = (groupRaw ?? []).map((c: any) => {
    const members = (c.conversation_participants ?? [])
      .map((p: any) => p.profile)
      .filter((p: any) => p && p.id !== user.id)
    const sortedMsgs = [...(c.messages ?? [])].sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    return {
      id: c.id, isGroup: true, title: c.title, other: null,
      members, lastMsg: sortedMsgs[0] ?? null, created_at: c.created_at,
    }
  })

  const conversations = [...oneToOne, ...groups].sort(
    (a, b) => new Date(b.lastMsg?.created_at ?? b.created_at).getTime()
            - new Date(a.lastMsg?.created_at ?? a.created_at).getTime()
  )

  return (
    <>
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-serif text-2xl font-bold text-gray-900 mb-6">Messages</h1>
        <MessagesList currentUserId={user.id} conversations={conversations} />
      </main>
    </>
  )
}
