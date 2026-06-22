/**
 * Wandr — Profile enrichment seed
 *
 * Adds languages_spoken, countries_visited, tagline (vibe),
 * looking_for, favorite_moment_image_url, and favorite_moment_caption
 * to 80% of all seeded profiles.
 *
 * Safe to re-run — only updates profiles that currently have no tagline.
 *
 * Run:
 *   node --env-file=.env.local scripts/seed-enrich-profiles.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Data pools ────────────────────────────────────────────────────────────────

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian',
  'Japanese', 'Korean', 'Mandarin', 'Arabic', 'Hindi', 'Russian',
  'Turkish', 'Dutch', 'Swedish', 'Polish', 'Indonesian', 'Thai',
  'Vietnamese', 'Greek', 'Hebrew', 'Czech', 'Danish', 'Norwegian',
]

const TAGLINES = [
  'Sunset chaser. Coffee first, plan second.',
  'Still looking for the best street food in the world.',
  'Mountains over malls. Always.',
  'One bag, infinite detours.',
  'Here for the stories you can\'t Instagram.',
  'Slow travel is the only travel.',
  'Making wrong turns into the best days.',
  'Perpetually in-between flights.',
  'Adventure is just bad planning in hindsight.',
  'I came for the views, stayed for the people.',
  'Every city deserves at least one lost afternoon.',
  'Budget first, comfort second, memories forever.',
  'Not all who wander are lost — some just don\'t have Google Maps.',
  'Collecting experiences, not souvenirs.',
  'Serial first-timer. Each destination is the best one.',
  'I travel to feel small in the best possible way.',
  'Dawn hikes and late-night markets. No in-between.',
  'Spontaneity is just a plan that hasn\'t happened yet.',
  'The further from home, the more like myself I feel.',
  'Currently somewhere between visas.',
  'Trains over planes. Always a good reason.',
  'Still chasing that first-day-of-travel feeling.',
  'A passport full of stamps and a head full of stories.',
  'I don\'t have a bucket list. I have a flight calendar.',
  'Good company makes any destination.',
]

const LOOKING_FOR = [
  'Someone who doesn\'t need a packed itinerary to have a great trip.',
  'A buddy who\'s up for spontaneous detours and questionable local food.',
  'Someone who gets that slow mornings are non-negotiable.',
  'A travel partner who knows when to talk and when to just watch the view.',
  'Someone equally happy hiking all day or doing nothing on a beach.',
  'A fellow night-market obsessive who eats first and sightseees second.',
  'Someone who can handle delayed buses without losing the plot.',
  'A like-minded soul who\'d rather find one incredible local spot than ten tourist ones.',
  'Someone who books the trip before fully planning it, and is fine with that.',
  'A co-adventurer comfortable with both dorm beds and occasional splurges.',
  'Someone who packs light and travels heavy on curiosity.',
  'A buddy who sees a wrong turn as part of the itinerary.',
  'Someone who understands that the journey is often better than the destination.',
  'A travel mate who appreciates silence at a sunrise as much as I do.',
  'Someone who can navigate a bus system using hand signals and goodwill.',
]

const MOMENT_CAPTIONS = [
  'Found this place by accident on day three. Ended up staying for a week.',
  'The locals invited us in. We shared a meal and didn\'t speak the same language. Still one of my best days.',
  'Got completely lost. Found this instead. No complaints.',
  'Woke up at 4am for this. Every second of lost sleep was worth it.',
  'No filter. This is just what the light does here in the afternoon.',
  'Third time visiting this spot. It still takes my breath away.',
  'This is why I travel. Not for the landmarks — for moments like this.',
  'Took the long route. Always worth it.',
  'We almost didn\'t stop here. Glad we did.',
  'A local tip from a stranger. Best advice I\'ve ever followed.',
  'This is what I think about when work gets too loud.',
  'Couldn\'t leave for three days. Didn\'t want to.',
  'No plan, no map, no idea where we were. Perfect day.',
  'The light here is genuinely otherworldly. Phone cameras can\'t do it justice.',
  'Stumbled onto this on the last day. Classic.',
  'Some places don\'t need context. They just hit you.',
  'This was supposed to be a quick detour. Added three days to the trip.',
  'Asked a guesthouse owner for a recommendation. This is what she pointed to.',
  'I\'ve been to flashier places. None of them stuck like this.',
  'The journey here was chaotic. Arrival was silence.',
]

// loremflickr.com — Flickr/CloudFront CDN, no Unsplash dependency
// Using travel-specific topics for varied, relevant images
const MOMENT_IMAGE_TOPICS = [
  'travel,landscape', 'mountain,nature', 'beach,ocean', 'forest,adventure',
  'sunset,travel', 'hiking,trail', 'waterfall,nature', 'city,travel',
  'island,paradise', 'camping,wilderness', 'road,journey', 'ancient,ruins',
  'rice,terraces', 'desert,sand', 'fjord,norway',
]

function momentImageUrl(index) {
  const topic = MOMENT_IMAGE_TOPICS[index % MOMENT_IMAGE_TOPICS.length]
  return `https://loremflickr.com/900/600/${topic}?lock=${index + 100}`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

function pickLanguages() {
  // 1–3 languages; always include English for ~85% of users
  const count = randInt(1, 3)
  const pool = Math.random() < 0.85
    ? ['English', ...LANGUAGES.filter(l => l !== 'English')]
    : LANGUAGES
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function pickCountriesVisited() {
  // Weighted toward realistic ranges for a travel-app demographic
  const roll = Math.random()
  if (roll < 0.25) return randInt(1, 5)    // early travellers
  if (roll < 0.60) return randInt(6, 20)   // regular travellers
  if (roll < 0.85) return randInt(21, 40)  // experienced
  return randInt(41, 70)                   // very well-travelled
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nWandr profile enrichment seed\n')

  // Fetch all onboarded profiles that haven't been enriched yet
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('onboarded', true)
    .is('tagline', null)   // skip already-enriched profiles
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch profiles:', error.message)
    process.exit(1)
  }

  if (!profiles?.length) {
    console.log('No profiles to enrich (all already have taglines).')
    console.log('To re-run, clear taglines first:\n')
    console.log('  UPDATE profiles SET tagline = NULL WHERE username LIKE \'%@demo%\';')
    process.exit(0)
  }

  // Randomly pick 80%
  const shuffled = [...profiles].sort(() => Math.random() - 0.5)
  const toEnrich = shuffled.slice(0, Math.ceil(shuffled.length * 0.8))

  console.log(`Found ${profiles.length} unenriched profiles`)
  console.log(`Enriching ${toEnrich.length} (80%)…\n`)

  const updates = toEnrich.map((profile, i) => ({
    id:                         profile.id,
    tagline:                    pick(TAGLINES),
    looking_for:                pick(LOOKING_FOR),
    languages_spoken:           pickLanguages(),
    countries_visited:          pickCountriesVisited(),
    favorite_moment_image_url:  momentImageUrl(i),
    favorite_moment_caption:    pick(MOMENT_CAPTIONS),
    updated_at:                 new Date().toISOString(),
  }))

  // Upsert in chunks of 50
  let done = 0
  const CHUNK = 50

  for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK)
    const { error: upsertErr } = await supabase
      .from('profiles')
      .upsert(chunk, { onConflict: 'id' })

    if (upsertErr) {
      console.warn(`  [warn] chunk ${i}: ${upsertErr.message}`)
    } else {
      done += chunk.length
    }
    process.stdout.write(`\r  ${done}/${toEnrich.length}`)
  }

  console.log(`\n\nDone — ${done} profiles enriched.\n`)
  console.log('Refresh a profile page to see the new data.\n')
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
