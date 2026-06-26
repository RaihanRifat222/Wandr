'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<{ error?: string }> {
  const trimmed = content.trim()
  if (!trimmed) return { error: 'Message cannot be empty' }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: trimmed,
  })

  if (error) return { error: error.message }

  // Notify the other participant (fire-and-forget, non-blocking)
  const { data: conv } = await supabase
    .from('conversations')
    .select('participant_a, participant_b')
    .eq('id', conversationId)
    .single()

  if (conv) {
    const otherId = conv.participant_a === user.id ? conv.participant_b : conv.participant_a
    const { data: me } = await supabase
      .from('profiles').select('full_name, username').eq('id', user.id).single()
    const myName = me?.full_name ?? me?.username ?? 'Someone'
    await supabase.from('notifications').insert({
      user_id:  otherId,
      type:     'message',
      title:    `${myName} sent you a message`,
      ref_id:   conversationId,
      ref_type: 'conversation',
    })
  }

  revalidatePath(`/messages/${conversationId}`)
  return {}
}
