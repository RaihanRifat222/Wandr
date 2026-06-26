import { createClient } from '@/lib/supabase/server'
import LeftSidebar from './LeftSidebar'

export default async function LeftSidebarWrapper() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  const profileHref = profile?.username
    ? `/profile/${profile.username}`
    : '/profile/edit'

  return <LeftSidebar profileHref={profileHref} />
}
