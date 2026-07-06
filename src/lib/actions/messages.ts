'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOrCreateBotProfileId, BOT_FULL_NAME } from '@/lib/ai/bot'
import { generateTripAssistantReply, type AssistantChatMessage } from '@/lib/ai/tripAssistant'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'

const BOT_MENTION = /@wandr\b/i

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

  // Notify every other member of the conversation (fire-and-forget, non-blocking)
  const { data: members } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)

  let recipientIds = (members ?? []).map(m => m.user_id).filter(id => id !== user.id)

  if (recipientIds.length === 0) {
    // Legacy 1:1 conversation — no conversation_participants rows
    const { data: conv } = await supabase
      .from('conversations')
      .select('participant_a, participant_b')
      .eq('id', conversationId)
      .single()
    if (conv) {
      const otherId = conv.participant_a === user.id ? conv.participant_b : conv.participant_a
      if (otherId) recipientIds = [otherId]
    }
  }

  if (recipientIds.length > 0) {
    const { data: me } = await supabase
      .from('profiles').select('full_name, username').eq('id', user.id).single()
    const myName = me?.full_name ?? me?.username ?? 'Someone'
    await supabase.from('notifications').insert(
      recipientIds.map(id => ({
        user_id:  id,
        type:     'message' as const,
        title:    `${myName} sent you a message`,
        ref_id:   conversationId,
        ref_type: 'conversation',
      }))
    )
  }

  // If someone @mentions the AI in a group chat, generate a reply in the
  // background so this send doesn't wait on LLM latency.
  if (BOT_MENTION.test(trimmed)) {
    const { data: conv } = await supabase
      .from('conversations')
      .select('is_group, trip_id')
      .eq('id', conversationId)
      .single()

    if (conv?.is_group && conv.trip_id) {
      const tripId = conv.trip_id
      after(() => respondAsTripAssistant(conversationId, tripId))
    }
  }

  revalidatePath(`/messages/${conversationId}`)
  return {}
}

async function respondAsTripAssistant(conversationId: string, tripId: string) {
  const admin = createAdminClient()

  const [{ data: trip }, { data: participants }, { data: recentMessages }, botId] = await Promise.all([
    admin
      .from('trips')
      .select('destination, region, start_date, end_date, budget_estimate, description')
      .eq('id', tripId)
      .single(),
    admin
      .from('conversation_participants')
      .select('profile:profiles(id, full_name, username)')
      .eq('conversation_id', conversationId),
    admin
      .from('messages')
      .select('sender_id, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(20),
    getOrCreateBotProfileId(),
  ])

  if (!trip) return

  type Profile = { id: string; full_name: string | null; username: string | null }
  const profileById = new Map<string, Profile>(
    ((participants ?? []) as unknown as { profile: Profile }[]).map(p => [p.profile.id, p.profile])
  )
  profileById.set(botId, { id: botId, full_name: BOT_FULL_NAME, username: 'wandr_ai' })

  const history: AssistantChatMessage[] = (recentMessages ?? [])
    .slice()
    .reverse()
    .map(m => {
      const sender = profileById.get(m.sender_id)
      return {
        senderName: sender?.full_name ?? sender?.username ?? 'Someone',
        content: m.content,
        isBot: m.sender_id === botId,
      }
    })

  const memberNames = [...profileById.values()]
    .filter(p => p.id !== botId)
    .map(p => p.full_name ?? p.username ?? 'Someone')

  let reply: string
  try {
    reply = await generateTripAssistantReply({
      trip: {
        destination: trip.destination,
        region: trip.region,
        startDate: trip.start_date,
        endDate: trip.end_date,
        budgetEstimate: trip.budget_estimate,
        description: trip.description,
      },
      memberNames,
      history,
    })
  } catch (err) {
    console.error('[tripAssistant] generation failed:', err)
    reply = "Sorry, I'm having trouble thinking right now — try mentioning me again in a bit."
  }

  // Make the bot a real participant so its name/avatar resolve correctly
  // everywhere participants are looked up (chat bubbles, member list, etc).
  await admin
    .from('conversation_participants')
    .upsert(
      { conversation_id: conversationId, user_id: botId },
      { onConflict: 'conversation_id,user_id', ignoreDuplicates: true }
    )

  await admin.from('messages').insert({
    conversation_id: conversationId,
    sender_id: botId,
    content: reply,
  })

  const recipientIds = [...profileById.keys()].filter(id => id !== botId)
  if (recipientIds.length > 0) {
    await admin.from('notifications').insert(
      recipientIds.map(id => ({
        user_id:  id,
        type:     'message' as const,
        title:    `${BOT_FULL_NAME} replied in the group chat`,
        ref_id:   conversationId,
        ref_type: 'conversation',
      }))
    )
  }
}
