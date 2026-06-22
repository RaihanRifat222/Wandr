/**
 * Wandr — Backfill profile embeddings
 *
 * Generates OpenAI text-embedding-3-small vectors for every onboarded profile
 * that doesn't have one yet.  Idempotent: profiles with existing embeddings
 * are skipped.
 *
 * Prerequisites:
 *   SUPABASE_SERVICE_ROLE_KEY and OPENAI_API_KEY in .env.local
 *
 * Run:
 *   node --env-file=.env.local scripts/seed-embeddings.mjs
 *
 * Cost estimate: ~100 profiles × ~60 tokens avg = 6k tokens ≈ $0.00012
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_API_KEY   = process.env.OPENAI_API_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or OPENAI_API_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

const BATCH_SIZE = 50

const BUDGET_LABEL = {
  0:   'backpacker ($0–50/day)',
  50:  'budget ($50–100/day)',
  100: 'mid-range ($100–200/day)',
  200: 'comfort ($200+/day)',
}

function styleLabel(key, val) {
  const map = {
    budget:  ['budget-focused',  'luxury-focused'],
    planned: ['likes planning',  'spontaneous'],
    solo:    ['prefers solo',    'prefers group travel'],
    relaxed: ['relaxed pace',    'active pace'],
  }
  const [low, high] = map[key] ?? [key, key]
  if (val < 35) return low
  if (val > 65) return high
  return `balanced ${low.split(' ')[0]}/${high.split(' ')[0]}`
}

function buildProfileText(p) {
  const lines = []

  if (p.interests?.length)
    lines.push(`Travel interests: ${p.interests.join(', ')}`)

  const style = p.travel_style ?? {}
  const styleDesc = ['budget', 'planned', 'solo', 'relaxed']
    .filter(k => style[k] != null)
    .map(k => styleLabel(k, style[k]))
  if (styleDesc.length)
    lines.push(`Travel style: ${styleDesc.join(', ')}`)

  const budgetLabel = p.budget_min != null ? BUDGET_LABEL[p.budget_min] : null
  if (budgetLabel)
    lines.push(`Budget: ${budgetLabel}`)

  if (p.home_city)
    lines.push(`Home city: ${p.home_city}`)

  if (p.bio?.trim())
    lines.push(`About: ${p.bio.trim()}`)

  if (p.tagline?.trim())
    lines.push(`Travel vibe: ${p.tagline.trim()}`)

  if (p.looking_for?.trim())
    lines.push(`Looking for: ${p.looking_for.trim()}`)

  if (p.languages_spoken?.length)
    lines.push(`Languages: ${p.languages_spoken.join(', ')}`)

  if (p.countries_visited != null)
    lines.push(`Countries visited: ${p.countries_visited}`)

  return lines.join('\n')
}

async function main() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, interests, travel_style, budget_min, home_city, bio, tagline, looking_for, languages_spoken, countries_visited')
    .eq('onboarded', true)
    .is('embedding', null)

  if (error) {
    console.error('Failed to fetch profiles:', error.message)
    process.exit(1)
  }

  if (!profiles || profiles.length === 0) {
    console.log('No profiles need embedding. All done.')
    return
  }

  console.log(`Embedding ${profiles.length} profiles…`)

  for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
    const batch = profiles.slice(i, i + BATCH_SIZE)
    const inputs = batch.map(buildProfileText)

    // Filter out empty texts (profiles with no data at all)
    const nonEmpty = batch.map((p, j) => ({ profile: p, text: inputs[j] })).filter(x => x.text.trim())

    if (nonEmpty.length === 0) {
      console.log(`  Batch ${i}–${i + BATCH_SIZE}: all empty, skipped`)
      continue
    }

    const res = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: nonEmpty.map(x => x.text),
    })

    await Promise.all(
      nonEmpty.map((x, j) =>
        supabase
          .from('profiles')
          .update({ embedding: res.data[j].embedding })
          .eq('id', x.profile.id)
      )
    )

    console.log(`  ${Math.min(i + BATCH_SIZE, profiles.length)}/${profiles.length} embedded`)
  }

  console.log('Done.')
}

main()
