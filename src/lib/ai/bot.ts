import { createAdminClient } from '@/lib/supabase/admin'

export const BOT_USERNAME = 'wandr_ai'
export const BOT_FULL_NAME = 'Wandr AI'
const BOT_EMAIL = 'ai-bot@wandr.app'

const BOT_AVATAR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="32" fill="#2B4739"/>
  <path d="M32 12 L37 27 L52 32 L37 37 L32 52 L27 37 L12 32 L27 27 Z" fill="#D9A441"/>
</svg>
`.trim()

const BOT_AVATAR_URL = `data:image/svg+xml;base64,${Buffer.from(BOT_AVATAR_SVG).toString('base64')}`

let cachedBotId: string | null = null

// Looks up the Wandr AI bot's profile, creating its underlying auth user
// (and letting the existing handle_new_user trigger provision the profile
// row) on first use. profiles.id has a hard FK to auth.users, so a "bot"
// needs a real — if never logged into — auth account to satisfy it.
export async function getOrCreateBotProfileId(): Promise<string> {
  if (cachedBotId) return cachedBotId

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('username', BOT_USERNAME)
    .maybeSingle()

  if (existing) {
    cachedBotId = existing.id
    return existing.id
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email: BOT_EMAIL,
    email_confirm: true,
    user_metadata: { full_name: BOT_FULL_NAME, avatar_url: BOT_AVATAR_URL },
  })

  if (error || !created.user) {
    throw new Error(`Could not create Wandr AI bot account: ${error?.message ?? 'unknown error'}`)
  }

  await admin
    .from('profiles')
    .update({
      username: BOT_USERNAME,
      full_name: BOT_FULL_NAME,
      avatar_url: BOT_AVATAR_URL,
      bio: 'Mention @wandr in any group chat for trip planning help.',
      onboarded: true,
    })
    .eq('id', created.user.id)

  cachedBotId = created.user.id
  return created.user.id
}
