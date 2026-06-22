import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import MessagesList from './_MessagesList'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-serif text-2xl font-bold text-gray-900 mb-6">Messages</h1>
        <MessagesList currentUserId={user.id} conversations={conversations} />
      </main>
    </div>
  )
}
