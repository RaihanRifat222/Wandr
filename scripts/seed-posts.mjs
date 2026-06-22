/**
 * Wandr — Posts seed script
 *
 * Creates 1–3 posts for each seeded demo user.
 * Uses loremflickr.com for images (Flickr/CloudFront CDN, no Unsplash).
 *
 * Run:
 *   node --env-file=.env.local scripts/seed-posts.mjs
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

// ── Image pool ────────────────────────────────────────────────────────────────
// loremflickr.com serves Flickr photos directly via CloudFront CDN.
// ?lock=N keeps the same image for a given number — no Unsplash dependency.

const IMAGE_TOPICS = [
  'travel', 'beach', 'mountain', 'nature', 'adventure',
  'hiking', 'ocean', 'forest', 'sunset', 'landscape',
  'backpacking', 'camping', 'waterfall', 'city', 'island',
]

// 60 unique lock values spread across the topics
const IMAGE_POOL = Array.from({ length: 60 }, (_, i) => {
  const topic = IMAGE_TOPICS[i % IMAGE_TOPICS.length]
  return `https://loremflickr.com/800/800/${topic}?lock=${i + 1}`
})

// ── Captions ─────────────────────────────────────────────────────────────────

const CAPTIONS = [
  'This place genuinely stopped me in my tracks. Australia keeps surprising me.',
  'No filter needed. Nature just does this for free.',
  'Three days in and already planning to come back.',
  'Found this spot completely by accident. Best detour I\'ve ever taken.',
  'The early starts are always worth it for light like this.',
  'Can\'t believe this is in our own backyard. Why are we always flying overseas?',
  'Took a wrong turn and ended up here. Not complaining.',
  'This is what weekends are for.',
  'Still thinking about this place two weeks later.',
  'Brought two friends. They\'ve already booked return trips.',
  'The water here is ridiculous. Genuinely unreal.',
  'Woke up at 5am for this. Would do it again in a heartbeat.',
  'This country is enormous and I feel like I\'ve seen almost none of it.',
  'Nature put a lot of effort into this one.',
  'Local tip: skip the tourist spots and drive an extra 20 minutes.',
  'The kind of place that makes you want to switch off your phone.',
  'There\'s something about the Australian light that hits different in the afternoon.',
  'This is my third time here and it still takes my breath away.',
  'Perfect weekend. Zero complaints. 10/10 would recommend.',
  'Had this entire stretch of beach to ourselves for three hours.',
  'The silence out here is something else entirely.',
  'Just got back. Already looking at flights to go again.',
  'If you know, you know. If you don\'t — come find out.',
  'Left my phone in the car for most of this trip. Best decision.',
  'Australia is massive. I keep forgetting how massive.',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nWandr posts seed — fetching demo users…\n')

  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, username, full_name')
    .eq('onboarded', true)
    .limit(120)

  if (profErr || !profiles?.length) {
    console.error('Could not fetch profiles:', profErr?.message ?? 'none found')
    console.error('Make sure you ran seed.mjs first.')
    process.exit(1)
  }

  console.log(`Found ${profiles.length} users\n`)

  // Get their trips (to tag in posts)
  const userIds = profiles.map(p => p.id)
  const { data: trips } = await supabase
    .from('trips')
    .select('id, host_id, destination')
    .in('host_id', userIds)
    .eq('status', 'open')

  const tripsByUser = new Map()
  for (const t of trips ?? []) {
    if (!tripsByUser.has(t.host_id)) tripsByUser.set(t.host_id, [])
    tripsByUser.get(t.host_id).push(t)
  }

  // Build posts
  const posts = []

  for (const profile of profiles) {
    const count      = randInt(1, 3)
    const userTrips  = tripsByUser.get(profile.id) ?? []

    for (let i = 0; i < count; i++) {
      const imageUrl = IMAGE_POOL[posts.length % IMAGE_POOL.length]

      // Tag a trip ~60% of the time (if they have one)
      const tagTrip = userTrips.length > 0 && Math.random() < 0.6
        ? userTrips[i % userTrips.length]
        : null

      // Spread created_at over the past 30 days so the feed isn't all the same timestamp
      const daysAgo     = randInt(0, 30)
      const hoursAgo    = randInt(0, 23)
      const createdAt   = new Date(Date.now() - (daysAgo * 86400 + hoursAgo * 3600) * 1000).toISOString()

      posts.push({
        user_id:    profile.id,
        image_url:  imageUrl,
        caption:    pick(CAPTIONS),
        trip_id:    tagTrip?.id ?? null,
        created_at: createdAt,
        updated_at: createdAt,
      })
    }
  }

  console.log(`Inserting ${posts.length} posts…`)

  // Insert in chunks of 50
  let inserted = 0
  for (let i = 0; i < posts.length; i += 50) {
    const chunk = posts.slice(i, i + 50)
    const { error } = await supabase.from('posts').insert(chunk)
    if (error) console.warn(`  [warn] chunk ${i}: ${error.message}`)
    else inserted += chunk.length
    process.stdout.write(`\r  ${inserted}/${posts.length}`)
  }

  console.log(`\n\nDone — ${inserted} posts created across ${profiles.length} users\n`)
  console.log('Refresh the feed to see them.\n')
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
