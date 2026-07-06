import OpenAI from 'openai'

const MODEL = 'gpt-4o-mini'

let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return client
}

export type TripContext = {
  destination: string
  region: string | null
  startDate: string | null
  endDate: string | null
  budgetEstimate: number | null
  description: string | null
}

export type AssistantChatMessage = {
  senderName: string
  content: string
  isBot: boolean
}

function buildSystemPrompt(trip: TripContext, memberNames: string[]): string {
  return [
    'You are Wandr AI, a trip-planning assistant embedded directly in a group chat for travellers coordinating a trip together.',
    `Trip: ${trip.destination}${trip.region ? ` (${trip.region})` : ''}.`,
    trip.startDate && trip.endDate
      ? `Dates: ${trip.startDate} to ${trip.endDate}.`
      : 'Dates: not set yet.',
    trip.budgetEstimate != null ? `Budget: around $${trip.budgetEstimate}/day per person.` : null,
    trip.description ? `Trip notes: ${trip.description}` : null,
    `Group members: ${memberNames.join(', ') || 'unknown'}.`,
    'Give practical, specific suggestions — activities, itineraries, logistics, local tips. Speak directly to the group, not to one person.',
    'Hard constraint: your reply is capped at 1000 output tokens (roughly 600 words) and must always finish as a complete, well-formed answer — never trail off or get cut short mid-list or mid-sentence. A shorter, fully finished answer always beats a longer one that gets cut off.',
    'If the trip spans more than about 5 days, never write a separate entry for every single day — that will not fit. Instead group days into a few phases or highlights (e.g. "Days 1-3: ...", "Days 4-7: ..."), and only break down individual days if the group asks about a specific day or short date range.',
  ].filter(Boolean).join('\n')
}

export async function generateTripAssistantReply({
  trip,
  memberNames,
  history,
}: {
  trip: TripContext
  memberNames: string[]
  history: AssistantChatMessage[]
}): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: MODEL,
    max_tokens: 1000,
    messages: [
      { role: 'system', content: buildSystemPrompt(trip, memberNames) },
      ...history.map(m => ({
        role: m.isBot ? ('assistant' as const) : ('user' as const),
        content: m.isBot ? m.content : `${m.senderName}: ${m.content}`,
      })),
    ],
  })

  const text = response.choices[0]?.message?.content
  return text?.trim() || "Sorry, I couldn't come up with a reply there — try asking again?"
}
