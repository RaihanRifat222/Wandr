import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS entirely. Server-only: never import
// this from a client component. Used for actions with no real user session
// to act as (e.g. the Wandr AI bot posting messages).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
