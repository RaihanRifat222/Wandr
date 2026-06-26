import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { signOut } from '@/lib/actions/auth'
import NotificationBell from './NotificationBell'
import MessagesButton from './MessagesButton'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url')
    .eq('id', user.id)
    .single()

  const profileHref = profile?.username ? `/profile/${profile.username}` : '/profile/edit'
  const initials    = profile?.full_name
    ? profile.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : (profile?.username?.[0]?.toUpperCase() ?? '?')

  return (
    <nav className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="px-6 h-14 flex items-center justify-end gap-1">
        <MessagesButton userId={user.id} />
        <NotificationBell userId={user.id} />

        <Link href={profileHref} className="group ml-1">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-border group-hover:ring-brand transition"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold font-serif group-hover:bg-brand/20 transition">
              {initials}
            </div>
          )}
        </Link>

        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
          >
            Log out
          </button>
        </form>
      </div>
    </nav>
  )
}
