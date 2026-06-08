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

  revalidatePath(`/messages/${conversationId}`)
  return {}
}
