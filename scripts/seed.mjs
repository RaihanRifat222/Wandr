/**
 * Wandr — Demo seed script
 *
 * Creates 100 demo users (auth + profiles) and ~120 trips.
 *
 * Prerequisites:
 *   Add SUPABASE_SERVICE_ROLE_KEY to .env.local
 *   (Dashboard → Project Settings → API → service_role)
 *
 * Run:
 *   node --env-file=.env.local scripts/seed.mjs
 */

import { createClient } from '@supabase/supabase-js'

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  console.error('Add SUPABASE_SERVICE_ROLE_KEY to .env.local and re-run.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Demo data pools ───────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Alex','Sofia','Marco','Yuki','Priya','Liam','Amara','Diego','Emma','Chen',
  'Layla','Ethan','Nia','Lucas','Mia','Omar','Aria','Rafael','Zoe','Kenji',
  'Leila','Noah','Fatima','Oliver','Chloe','Ravi','Isla','Mateo','Luna','Jin',
  'Aisha','Felix','Sara','Kai','Ingrid','Tariq','Nora','Andre','Maya','Soren',
  'Hana','Isaac','Elena','Tobias','Nadia','Finn','Yasmin','Hugo','Cleo','Arjun',
  'Vera','Elias','Lena','Cyrus','Frida','Dominic','Mira','Julius','Anya','Cole',
  'Bianca','Max','Sasha','Ivan','Naomi','Paulo','Grace','Kasper','Rosa','Malik',
  'Claire','Hamid','Tara','Adrian','Wren','Kofi','Dana','Sven','Ines','Takeshi',
  'Simone','Remy','Petra','Theo','Celeste','Javier','Dani','Luca','Amira','Fynn',
  'Nora','Benedict','Yara','Ezra','Camille','Orion','Selena','Gael','Phoebe','Zara',
]

const LAST_INITIALS = 'ABCDEFGHJKLMNOPQRSTUVWYZ'.split('')

const HOME_CITIES = [
  'Berlin, Germany','London, UK','Tokyo, Japan','New York, USA','Sydney, Australia',
  'Barcelona, Spain','Bangkok, Thailand','São Paulo, Brazil','Amsterdam, Netherlands',
  'Mexico City, Mexico','Seoul, South Korea','Paris, France','Nairobi, Kenya',
  'Mumbai, India','Cape Town, South Africa','Toronto, Canada','Lisbon, Portugal',
  'Buenos Aires, Argentina','Stockholm, Sweden','Dubai, UAE','Istanbul, Turkey',
  'Singapore','Jakarta, Indonesia','Cairo, Egypt','Lagos, Nigeria','Vienna, Austria',
  'Bogotá, Colombia','Copenhagen, Denmark','Melbourne, Australia','Kuala Lumpur, Malaysia',
  'Athens, Greece','Warsaw, Poland','Casablanca, Morocco','Lima, Peru','Oslo, Norway',
  'Prague, Czech Republic','Accra, Ghana','Santiago, Chile','Helsinki, Finland',
  'Manila, Philippines','Johannesburg, South Africa','Montreal, Canada','Dublin, Ireland',
]

const BIOS = [
  'Chasing sunsets and street food in equal measure. Always planning the next escape.',
  'Slow traveller at heart — I\'d rather spend a month somewhere than a week everywhere.',
  'Former city desk worker turned full-time wanderer. Budget backpacker with zero regrets.',
  'Wildlife photographer by passion, budget traveller by necessity.',
  'I travel to eat. Every itinerary starts with the local food market.',
  'Mountains, coast, or city — I\'m happy anywhere with good company and a good story.',
  'Solo travel converted me. Now I\'m looking for like-minded souls to share adventures.',
  'Culture vulture who believes a day in a local neighbourhood beats any tourist trail.',
  'Scuba diver, hiker, and occasional train-sleeper. Nights under the stars preferred.',
  'Digital nomad hopping between coworking spaces and coffee shops worldwide.',
  'Backpacked through 30 countries. Still going, still learning, always curious.',
  'Spontaneous by nature — I book the flight and figure out the rest on the way.',
  'Language nerd who picks a destination partly based on how fun the language sounds.',
  'Former accountant, current adventure seeker. Numbers can wait.',
  'Volunteer traveller — I like to leave places a little better than I found them.',
  'Night owl in cities, early bird for sunrises. Both extremes, no in-between.',
  'Big believer that the best meals come from places with plastic chairs and no menu in English.',
  'Road tripper turned long-haul backpacker. Getting comfortable being uncomfortable.',
  'I travel for the connections — the people you meet make every trip.',
  'Minimalist packer, maximalist experiencer. One bag, infinite destinations.',
]

const ALL_INTERESTS = [
  'Hiking','Diving','Street food','Photography','Nightlife',
  'Culture','Adventure','Budget travel','Luxury','Slow travel',
  'Wildlife','Backpacking','City breaks','Road trips','Volunteering',
]

const BUDGET_TIERS = [
  { key: 'backpacker', min: 0,   max: 50   },
  { key: 'budget',     min: 50,  max: 100  },
  { key: 'mid-range',  min: 100, max: 200  },
  { key: 'comfort',    min: 200, max: 9999 },
]

const DESTINATIONS = [
  { dest: 'Bali, Indonesia',        region: 'Asia'        },
  { dest: 'Lisbon, Portugal',       region: 'Europe'      },
  { dest: 'Bangkok, Thailand',      region: 'Asia'        },
  { dest: 'Medellín, Colombia',     region: 'Americas'    },
  { dest: 'Marrakech, Morocco',     region: 'Africa'      },
  { dest: 'Kyoto, Japan',           region: 'Asia'        },
  { dest: 'Porto, Portugal',        region: 'Europe'      },
  { dest: 'Mexico City, Mexico',    region: 'Americas'    },
  { dest: 'Cape Town, South Africa',region: 'Africa'      },
  { dest: 'Prague, Czech Republic', region: 'Europe'      },
  { dest: 'Chiang Mai, Thailand',   region: 'Asia'        },
  { dest: 'Buenos Aires, Argentina',region: 'Americas'    },
  { dest: 'Tbilisi, Georgia',       region: 'Europe'      },
  { dest: 'Hanoi, Vietnam',         region: 'Asia'        },
  { dest: 'Oaxaca, Mexico',         region: 'Americas'    },
  { dest: 'Nairobi, Kenya',         region: 'Africa'      },
  { dest: 'Queenstown, NZ',         region: 'Oceania'     },
  { dest: 'Barcelona, Spain',       region: 'Europe'      },
  { dest: 'Petra, Jordan',          region: 'Middle East' },
  { dest: 'Kathmandu, Nepal',       region: 'Asia'        },
  { dest: 'Havana, Cuba',           region: 'Americas'    },
  { dest: 'Amsterdam, Netherlands', region: 'Europe'      },
  { dest: 'Dubrovnik, Croatia',     region: 'Europe'      },
  { dest: 'Cartagena, Colombia',    region: 'Americas'    },
  { dest: 'Siem Reap, Cambodia',    region: 'Asia'        },
  { dest: 'Tangier, Morocco',       region: 'Africa'      },
  { dest: 'Reykjavik, Iceland',     region: 'Europe'      },
  { dest: 'Tel Aviv, Israel',       region: 'Middle East' },
  { dest: 'Melbourne, Australia',   region: 'Oceania'     },
  { dest: 'Bogotá, Colombia',       region: 'Americas'    },
  { dest: 'Tbilisi, Georgia',       region: 'Europe'      },
  { dest: 'Ho Chi Minh City',       region: 'Asia'        },
  { dest: 'Zanzibar, Tanzania',     region: 'Africa'      },
  { dest: 'Split, Croatia',         region: 'Europe'      },
  { dest: 'Cusco, Peru',            region: 'Americas'    },
  { dest: 'Hoi An, Vietnam',        region: 'Asia'        },
  { dest: 'Athens, Greece',         region: 'Europe'      },
  { dest: 'Muscat, Oman',           region: 'Middle East' },
  { dest: 'Patagonia, Argentina',   region: 'Americas'    },
  { dest: 'Ubud, Bali',             region: 'Asia'        },
]

const TRIP_DESCRIPTIONS = [
  'Looking for a laid-back travel buddy to explore temples, eat incredible food, and maybe rent a scooter or two. I\'m pretty flexible on the schedule — let\'s figure it out together.',
  'I\'m planning a mix of hiking and city days. Would love someone who can handle rough terrain in the morning and a rooftop bar in the evening.',
  'Solo traveller hoping to split costs on accommodation. I like early starts and local markets. No rush, no rigid plans.',
  'Beach base with day trips into the hills. Diving is the main draw but I\'m equally happy reading on the sand. Chill vibes only.',
  'This is a foodie trip first and sightseeing trip second. If you can\'t handle three meals a day being the top priority, we might not be compatible.',
  'Long-haul overland route. Requires flexibility and a decent tolerance for the occasional delayed bus. Big reward at the end.',
  'Urban exploration — street art, architecture, neighbourhood cafés. No major tourist sites unless they\'re genuinely worth it.',
  'Volunteering project in the mornings, exploring in the afternoons. Looking for someone who wants purpose AND adventure.',
  'I\'ve rented a motorbike and I\'m doing the mountain loop. Happy to have a co-pilot or just someone doing a parallel route.',
  'Island hopping by ferry. Slow pace, swimming, some snorkelling, a lot of hammock time. That\'s the whole plan.',
  'Budget focused — dorm beds and street food, but not at the expense of missing out. Skipping tourist traps, finding hidden gems.',
  'Cultural immersion trip. I want to take a cooking class, visit local homes, attend a festival if timing works out.',
  'Night market circuit across the country. Four cities in three weeks. Looking for a fellow food obsessive.',
  'Adventure-heavy: white-water rafting, zip-lining, one big hike. Would suit someone who wants an active week.',
  'Working remotely for the month and exploring on weekends. Good coffee shop recommendations welcome.',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function futureDate(minDaysFromNow, maxDaysFromNow) {
  const d = new Date()
  d.setDate(d.getDate() + randInt(minDaysFromNow, maxDaysFromNow))
  return d.toISOString().split('T')[0]
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ── Build user data ───────────────────────────────────────────────────────────

function buildUser(i) {
  const firstName  = FIRST_NAMES[i] ?? `Traveller${i}`
  const lastInit   = pick(LAST_INITIALS)
  const num        = String(i + 1).padStart(3, '0')
  const username   = `${firstName.toLowerCase()}_${lastInit.toLowerCase()}${num}`
  const email      = `${username}@demo.wandr.app`
  const password   = 'Seed@wandr2025!'
  const budget     = pick(BUDGET_TIERS)
  const nInterests = randInt(3, 8)
  const interests  = pickN(ALL_INTERESTS, nInterests)
  const homeCity   = pick(HOME_CITIES)
  const bio        = pick(BIOS)
  const avatarUrl  = `https://i.pravatar.cc/150?u=${username}`

  const travelStyle = {
    budget:  randInt(10, 90),
    planned: randInt(10, 90),
    solo:    randInt(10, 90),
    relaxed: randInt(10, 90),
  }

  return {
    email,
    password,
    username,
    full_name: `${firstName} ${lastInit}.`,
    avatar_url: avatarUrl,
    bio,
    home_city: homeCity,
    interests,
    travel_style: travelStyle,
    budget_min: budget.min,
    budget_max: budget.max,
  }
}

// ── Build trips ───────────────────────────────────────────────────────────────

function buildTrips(profileId, count) {
  return Array.from({ length: count }, () => {
    const { dest, region } = pick(DESTINATIONS)
    const startOffset      = randInt(14, 200)
    const startDate        = futureDate(startOffset, startOffset)
    const endDate          = futureDate(startOffset + 7, startOffset + 30)
    const budget           = pick(BUDGET_TIERS)

    return {
      host_id:         profileId,
      destination:     dest,
      region,
      start_date:      startDate,
      end_date:        endDate,
      group_size:      randInt(2, 4),
      budget_estimate: budget.min === 0 ? 30 : budget.min + randInt(0, 30),
      description:     Math.random() > 0.2 ? pick(TRIP_DESCRIPTIONS) : null,
      travel_style:    {},
      status:          'open',
    }
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const TOTAL = 100
  const BATCH = 5       // users per batch (keep under rate limits)
  const DELAY = 600     // ms between batches

  console.log(`\nWandr seed — creating ${TOTAL} demo users + trips\n`)

  const createdIds = []

  // ── 1. Create auth users (batched) ────────────────────────────────────────
  console.log('Step 1/3  Creating auth users…')

  for (let batchStart = 0; batchStart < TOTAL; batchStart += BATCH) {
    const batchEnd = Math.min(batchStart + BATCH, TOTAL)
    const batch = []

    for (let i = batchStart; i < batchEnd; i++) {
      const u = buildUser(i)
      batch.push(
        supabase.auth.admin.createUser({
          email:          u.email,
          password:       u.password,
          email_confirm:  true,         // skip email verification
          user_metadata:  { full_name: u.full_name, avatar_url: u.avatar_url },
        }).then(({ data, error }) => {
          if (error) {
            // Skip if user already exists (idempotent re-runs)
            if (error.message?.includes('already been registered')) return null
            console.warn(`  [warn] user ${u.email}: ${error.message}`)
            return null
          }
          return { id: data.user.id, ...u }
        })
      )
    }

    const results = await Promise.all(batch)
    const valid = results.filter(Boolean)
    createdIds.push(...valid)

    const pct = Math.round((Math.min(batchEnd, TOTAL) / TOTAL) * 100)
    process.stdout.write(`\r  ${pct}% (${Math.min(batchEnd, TOTAL)}/${TOTAL})`)

    if (batchEnd < TOTAL) await sleep(DELAY)
  }

  console.log(`\n  Done — ${createdIds.length} users created\n`)

  // ── 2. Update profiles ────────────────────────────────────────────────────
  console.log('Step 2/3  Updating profiles…')

  // The on_auth_user_created trigger may need a moment to fire
  await sleep(1000)

  const profileUpdates = createdIds.map(u =>
    supabase
      .from('profiles')
      .update({
        username:     u.username,
        full_name:    u.full_name,
        avatar_url:   u.avatar_url,
        bio:          u.bio,
        home_city:    u.home_city,
        interests:    u.interests,
        travel_style: u.travel_style,
        budget_min:   u.budget_min,
        budget_max:   u.budget_max,
        onboarded:    true,
        updated_at:   new Date().toISOString(),
      })
      .eq('id', u.id)
      .then(({ error }) => {
        if (error) console.warn(`  [warn] profile ${u.username}: ${error.message}`)
      })
  )

  await Promise.all(profileUpdates)
  console.log(`  Done — ${createdIds.length} profiles updated\n`)

  // ── 3. Create trips ───────────────────────────────────────────────────────
  console.log('Step 3/3  Creating trips…')

  const allTrips = createdIds.flatMap(u => {
    // ~60% of users have 1 trip, ~30% have 2 trips, ~10% have 0
    const roll = Math.random()
    const count = roll < 0.1 ? 0 : roll < 0.7 ? 1 : 2
    return buildTrips(u.id, count)
  })

  // Insert in chunks of 50
  let tripsInserted = 0
  for (let i = 0; i < allTrips.length; i += 50) {
    const chunk = allTrips.slice(i, i + 50)
    const { error } = await supabase.from('trips').insert(chunk)
    if (error) console.warn(`  [warn] trips chunk: ${error.message}`)
    else tripsInserted += chunk.length
  }

  console.log(`  Done — ${tripsInserted} trips created\n`)

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('────────────────────────────────────')
  console.log(`Users created : ${createdIds.length}`)
  console.log(`Trips created : ${tripsInserted}`)
  console.log('')
  console.log('All demo users share the password:')
  console.log('  Seed@wandr2025!')
  console.log('')
  console.log('Sample logins (format: <username>@demo.wandr.app):')
  createdIds.slice(0, 5).forEach(u => console.log(`  ${u.email}  /  Seed@wandr2025!`))
  console.log('────────────────────────────────────\n')
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
