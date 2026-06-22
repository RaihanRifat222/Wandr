/**
 * Wandr — Backfill trip embeddings
 *
 * Generates OpenAI embeddings for every open trip missing one
 * (existing seed data, or any trip created before this feature shipped).
 *
 * Prerequisites:
 *   SUPABASE_SERVICE_ROLE_KEY and OPENAI_API_KEY in .env.local
 *
 * Run:
 *   node --env-file=.env.local scripts/backfill-trip-embeddings.mjs
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_API_KEY   = process.env.OPENAI_API_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or OPENAI_API_KEY in environment.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

const EMBEDDING_MODEL = 'text-embedding-3-small'
const BATCH_SIZE = 50

function buildTripEmbeddingInput(trip) {
  return [
    `Destination: ${trip.destination}`,
    trip.region && `Region: ${trip.region}`,
    trip.start_date && trip.end_date && `Dates: ${trip.start_date} to ${trip.end_date}`,
    `Group size: ${trip.group_size}`,
    trip.budget_estimate != null && `Budget: ~$${trip.budget_estimate}/day`,
    trip.description && `Description: ${trip.description}`,
  ].filter(Boolean).join('\n')
}

async function main() {
  const { data: trips, error } = await supabase
    .from('trips')
    .select('id, destination, region, start_date, end_date, group_size, budget_estimate, description')
    .is('embedding', null)

  if (error) {
    console.error('Failed to fetch trips:', error.message)
    process.exit(1)
  }

  if (!trips || trips.length === 0) {
    console.log('No trips need embedding. All done.')
    return
  }

  console.log(`Embedding ${trips.length} trips…`)

  for (let i = 0; i < trips.length; i += BATCH_SIZE) {
    const batch = trips.slice(i, i + BATCH_SIZE)
    const inputs = batch.map(buildTripEmbeddingInput)

    const res = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: inputs })

    await Promise.all(
      batch.map((trip, j) =>
        supabase.from('trips').update({ embedding: res.data[j].embedding }).eq('id', trip.id)
      )
    )

    console.log(`  ${Math.min(i + BATCH_SIZE, trips.length)}/${trips.length} embedded`)
  }

  console.log('Done.')
}

main()
