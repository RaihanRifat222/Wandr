import OpenAI from 'openai'

const EMBEDDING_MODEL = 'text-embedding-3-small'

let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return client
}

export async function embedText(text: string): Promise<number[]> {
  const res = await getClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  })
  return res.data[0].embedding
}

export function buildTripEmbeddingInput(trip: {
  destination: string
  region: string | null
  start_date: string | null
  end_date: string | null
  group_size: number
  budget_estimate: number | null
  description: string | null
}): string {
  return [
    `Destination: ${trip.destination}`,
    trip.region && `Region: ${trip.region}`,
    trip.start_date && trip.end_date && `Dates: ${trip.start_date} to ${trip.end_date}`,
    `Group size: ${trip.group_size}`,
    trip.budget_estimate != null && `Budget: ~$${trip.budget_estimate}/day`,
    trip.description && `Description: ${trip.description}`,
  ].filter(Boolean).join('\n')
}
