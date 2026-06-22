/**
 * Wandr — Australia seed script
 *
 * Adds 50 demo users based in Australian cities.
 * 25 of them post a trip to a destination within Australia.
 *
 * Run:
 *   node --env-file=.env.local scripts/seed-australia.mjs
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

// ── Australian data pools ─────────────────────────────────────────────────────

const AU_CITIES = [
  'Sydney, NSW', 'Melbourne, VIC', 'Brisbane, QLD', 'Perth, WA',
  'Adelaide, SA', 'Gold Coast, QLD', 'Newcastle, NSW', 'Canberra, ACT',
  'Sunshine Coast, QLD', 'Wollongong, NSW', 'Hobart, TAS', 'Geelong, VIC',
  'Townsville, QLD', 'Cairns, QLD', 'Darwin, NT', 'Toowoomba, QLD',
  'Ballarat, VIC', 'Bendigo, VIC', 'Launceston, TAS', 'Mackay, QLD',
  'Rockhampton, QLD', 'Bunbury, WA', 'Hervey Bay, QLD', 'Wagga Wagga, NSW',
  'Albury-Wodonga, NSW/VIC',
]

const AU_TRIP_DESTINATIONS = [
  { dest: 'Great Barrier Reef, QLD',          region: 'Oceania' },
  { dest: 'Uluru, NT',                        region: 'Oceania' },
  { dest: 'Daintree Rainforest, QLD',         region: 'Oceania' },
  { dest: 'Great Ocean Road, VIC',            region: 'Oceania' },
  { dest: 'Whitsundays, QLD',                 region: 'Oceania' },
  { dest: 'Blue Mountains, NSW',              region: 'Oceania' },
  { dest: 'Kakadu National Park, NT',         region: 'Oceania' },
  { dest: 'Kangaroo Island, SA',              region: 'Oceania' },
  { dest: 'Byron Bay, NSW',                   region: 'Oceania' },
  { dest: 'Noosa, QLD',                       region: 'Oceania' },
  { dest: 'Margaret River, WA',               region: 'Oceania' },
  { dest: 'Cradle Mountain, TAS',             region: 'Oceania' },
  { dest: 'Port Douglas, QLD',                region: 'Oceania' },
  { dest: 'Barossa Valley, SA',               region: 'Oceania' },
  { dest: 'Kimberley, WA',                    region: 'Oceania' },
  { dest: 'Coral Bay, WA',                    region: 'Oceania' },
  { dest: 'Airlie Beach, QLD',                region: 'Oceania' },
  { dest: 'Phillip Island, VIC',              region: 'Oceania' },
  { dest: 'Hunter Valley, NSW',               region: 'Oceania' },
  { dest: 'Broome, WA',                       region: 'Oceania' },
  { dest: "Fraser Island (K'gari), QLD",      region: 'Oceania' },
  { dest: 'Eyre Peninsula, SA',               region: 'Oceania' },
  { dest: 'Ningaloo Reef, WA',                region: 'Oceania' },
  { dest: 'Grampians National Park, VIC',     region: 'Oceania' },
  { dest: 'Flinders Ranges, SA',              region: 'Oceania' },
]

const FIRST_NAMES = [
  'Lachlan', 'Olivia', 'Noah', 'Charlotte', 'Jack', 'Amelia', 'Oliver',
  'Isla', 'William', 'Mia', 'James', 'Ava', 'Lucas', 'Grace', 'Ethan',
  'Sophie', 'Mason', 'Chloe', 'Logan', 'Lily', 'Elijah', 'Hannah',
  'Benjamin', 'Zoe', 'Henry', 'Emma', 'Sebastian', 'Ruby', 'Hudson', 'Emily',
  'Archer', 'Matilda', 'Jasper', 'Evie', 'Flynn', 'Willow', 'Kai', 'Sienna',
  'Hamish', 'Freya', 'Angus', 'Harriet', 'Finn', 'Imogen', 'Rory', 'Phoebe',
  'Callum', 'Scarlett', 'Declan', 'Eliza',
]

const LAST_INITIALS = 'ABCDEFGHJKLMNPQRSTUVWYZ'.split('')

const BIOS = [
  'Sydney local who finally started exploring beyond the harbour. Australia is massive — barely scratched the surface.',
  'Melbourne coffee snob turned weekend adventurer. Looking for someone who appreciates both cold brews and cold rivers.',
  'Queensland born and raised. If it involves the reef or rainforest, I\'m in.',
  'Perth girl who spent years flying east for work. Now I fly to go exploring. The west is severely underrated.',
  'Canberra might be quiet but I\'m not. Planning to see every national park in Aus before I\'m 30.',
  'Hobart hipster who loves the wilderness on my doorstep. Cradle Mountain has my heart.',
  'Darwin local. Wet season or dry season, this place is something else. Looking for people brave enough to visit.',
  'Grew up in the Adelaide Hills, now chasing waterfalls everywhere I can find them.',
  'Byron Bay local (yes, really). Looking for travel buddies who want the off-the-beaten-path version.',
  'Gold Coast party reputation aside, I\'m here for the hinterland and the hiking.',
  'Newcastle lass who thinks everyone should do a lap of Australia at least once.',
  'Cairns-based dive instructor. The reef is genuinely as good as everyone says.',
  'Townsville local who loves the Magnetic Island ferry life. Looking for outdoorsy travel companions.',
  'Sunshine Coast surfer turned outback explorer. Tried the desert — now I\'m obsessed.',
  'Geelong local who drives to Melbourne for things but has stopped pretending that\'s embarrassing.',
  'Ballarat history nerd who loves a good road trip through regional Australia.',
  'Launceston based, always planning the next Tassie adventure. Whisky and wilderness.',
  'Wollongong cliff-walker. I\'ve done the coastal track six times and I\'d do it again.',
  'Brisbane transplant from London. The weather alone is worth it. Now exploring QLD properly.',
  'Adelaide local who thinks the Barossa beats Tuscany, full stop.',
]

const TRIP_DESCRIPTIONS = [
  'Planning a proper reef dive trip — multiple sites over a week. Looking for certified divers or anyone keen to get their open water cert.',
  'Road trip through the Red Centre. Uluru, Kings Canyon, Alice Springs. Going slow and really taking it in.',
  'Daintree self-drive trip. Wanna spend a few days in the rainforest, spot crocs, swim in swimming holes.',
  'Great Ocean Road camping road trip. No rush, stopping at every lookout. Need a co-pilot who won\'t mind driving.',
  'Whitsundays sailing trip on a budget charter. Crew of 4 needed — snorkelling, island hopping, sunsets.',
  'Blue Mountains for a long weekend — hiking, waterfalls, cosy cabin. Looking for hiking buddies.',
  'Kakadu and Litchfield in the dry season. 4WD access, jumping croc cruises, ancient rock art.',
  'Kangaroo Island escape — wildlife spotting, local produce, seal colonies. Car ferry from Adelaide.',
  'Byron Bay to Noosa drive along the coast, spending 2–3 nights at each stop.',
  'Margaret River wine and surf trip. Cellar doors in the morning, waves in the afternoon.',
  'Cradle Mountain hike — the Overland Track. 6-day multi-day hike through Tassie wilderness. Serious walkers only.',
  'Port Douglas base camp to explore the reef and rainforest. One of the only places on earth with two World Heritage sites side by side.',
  'Kimberley 4WD adventure — Gibb River Road, gorges, remote camping. Need someone with their own 4WD ideally.',
  'Coral Bay snorkelling week — one of the least-crowded reef experiences left in Australia.',
  'Airlie Beach week leading up to a Whitsundays day sail. Party vibes but also genuinely beautiful.',
  'Phillip Island for the penguin parade and Great Ocean Road combo trip.',
  'Hunter Valley wine weekend — cellar doors, nice dinners, lazy mornings. Low-key, no rush.',
  'Broome during camel season. Cable Beach sunset rides, Chinatown history, Staircase to the Moon.',
  "K'gari (Fraser Island) 4WD and camping trip. Freshwater lakes, dingo territory, coloured sand cliffs.",
  'Eyre Peninsula road trip — oysters, sea lions, swimming with great whites (cage dive).',
  'Ningaloo Reef whale shark snorkelling — March to July season. One of the world\'s best wildlife encounters.',
  'Grampians camping and rock climbing long weekend from Melbourne.',
  'Flinders Ranges 4WD trip — outback SA at its most dramatic. Wilpena Pound is unreal.',
  'Noosa National Park coastal walk and estuary kayak. Easy, beautiful, underrated.',
  'Darwin Harbour sunset cruise and jumping croc tour. Starting point for a Kakadu trip.',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function pickN(arr, n) { return [...arr].sort(() => Math.random() - 0.5).slice(0, n) }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

function futureDate(minDays, maxDays) {
  const d = new Date()
  d.setDate(d.getDate() + randInt(minDays, maxDays))
  return d.toISOString().split('T')[0]
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

const ALL_INTERESTS = [
  'Hiking', 'Diving', 'Street food', 'Photography', 'Nightlife',
  'Culture', 'Adventure', 'Budget travel', 'Luxury', 'Slow travel',
  'Wildlife', 'Backpacking', 'City breaks', 'Road trips', 'Volunteering',
]

const BUDGET_TIERS = [
  { min: 0,   max: 50   },
  { min: 50,  max: 100  },
  { min: 100, max: 200  },
  { min: 200, max: 9999 },
]

// ── Build user ────────────────────────────────────────────────────────────────

function buildUser(i) {
  const firstName  = FIRST_NAMES[i] ?? `Aussie${i}`
  const lastInit   = pick(LAST_INITIALS)
  const num        = String(i + 1).padStart(3, '0')
  const username   = `${firstName.toLowerCase()}_au${num}`
  const email      = `${username}@demo.wandr.app`
  const city       = AU_CITIES[i % AU_CITIES.length]
  const budget     = pick(BUDGET_TIERS)

  return {
    email,
    password: 'Seed@wandr2025!',
    username,
    full_name:  `${firstName} ${lastInit}.`,
    avatar_url: `https://i.pravatar.cc/150?u=${username}`,
    bio:        BIOS[i % BIOS.length],
    home_city:  city,
    interests:  pickN(ALL_INTERESTS, randInt(3, 7)),
    travel_style: {
      budget:  randInt(10, 90),
      planned: randInt(10, 90),
      solo:    randInt(10, 90),
      relaxed: randInt(10, 90),
    },
    budget_min: budget.min,
    budget_max: budget.max,
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const TOTAL = 50
  const BATCH = 5
  const DELAY = 600

  console.log('\nWandr AU seed — creating 50 Australian users + 25 trips\n')

  const created = []

  // ── 1. Create auth users ──────────────────────────────────────────────────
  console.log('Step 1/3  Creating auth users…')

  for (let start = 0; start < TOTAL; start += BATCH) {
    const end   = Math.min(start + BATCH, TOTAL)
    const batch = []

    for (let i = start; i < end; i++) {
      const u = buildUser(i)
      batch.push(
        supabase.auth.admin.createUser({
          email:         u.email,
          password:      u.password,
          email_confirm: true,
          user_metadata: { full_name: u.full_name, avatar_url: u.avatar_url },
        }).then(({ data, error }) => {
          if (error) {
            if (error.message?.includes('already been registered')) return null
            console.warn(`  [warn] ${u.email}: ${error.message}`)
            return null
          }
          return { id: data.user.id, ...u }
        })
      )
    }

    const results = await Promise.all(batch)
    created.push(...results.filter(Boolean))
    process.stdout.write(`\r  ${Math.round((Math.min(end, TOTAL) / TOTAL) * 100)}% (${Math.min(end, TOTAL)}/${TOTAL})`)
    if (end < TOTAL) await sleep(DELAY)
  }

  console.log(`\n  Done — ${created.length} users created\n`)

  // ── 2. Update profiles ────────────────────────────────────────────────────
  console.log('Step 2/3  Updating profiles…')
  await sleep(1000)

  await Promise.all(created.map(u =>
    supabase.from('profiles').update({
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
    }).eq('id', u.id)
  ))

  console.log(`  Done — ${created.length} profiles updated\n`)

  // ── 3. Create trips (first 25 users) ─────────────────────────────────────
  console.log('Step 3/3  Creating Australian trips…')

  const tripUsers  = created.slice(0, 25)
  const trips      = tripUsers.map((u, i) => {
    const { dest, region } = AU_TRIP_DESTINATIONS[i % AU_TRIP_DESTINATIONS.length]
    const startOffset      = randInt(14, 180)
    const budget           = pick(BUDGET_TIERS)

    return {
      host_id:         u.id,
      destination:     dest,
      region,
      start_date:      futureDate(startOffset, startOffset),
      end_date:        futureDate(startOffset + 5, startOffset + 21),
      group_size:      randInt(2, 4),
      budget_estimate: budget.min === 0 ? 40 : budget.min + randInt(0, 40),
      description:     TRIP_DESCRIPTIONS[i % TRIP_DESCRIPTIONS.length],
      travel_style:    {},
      status:          'open',
    }
  })

  const { error: tripError } = await supabase.from('trips').insert(trips)
  if (tripError) console.warn(`  [warn] trips: ${tripError.message}`)

  console.log(`  Done — ${trips.length} Australian trips created\n`)

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('────────────────────────────────────────')
  console.log(`Users created : ${created.length}`)
  console.log(`Trips created : ${trips.length}`)
  console.log(`Region        : Oceania`)
  console.log(`Password      : Seed@wandr2025!`)
  console.log('')
  console.log('Sample logins:')
  created.slice(0, 5).forEach(u => console.log(`  ${u.email}`))
  console.log('────────────────────────────────────────\n')
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
