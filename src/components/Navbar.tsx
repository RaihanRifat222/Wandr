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
      <div className="px-4 h-14 flex items-center gap-2">
        {/* Logo — only visible on mobile where the sidebar is hidden */}
        <Link href="/dashboard" className="md:hidden flex items-center gap-1 select-none mr-auto">
          <span className="font-serif text-xl font-bold text-brand leading-none">Wandr</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#E8520A" stroke="#E8520A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3" fill="white" stroke="none"/>
          </svg>
        </Link>

        <div className="flex items-center gap-1 ml-auto">
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
              className="hidden sm:block text-sm text-gray-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </nav>
  )
}
