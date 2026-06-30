'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'Home',     href: '/dashboard', icon: 'home'     },
  { label: 'Trips',    href: '/trips',     icon: 'trips'    },
  { label: 'Matches',  href: '/matches',   icon: 'matches'  },
  { label: 'Messages', href: '/messages',  icon: 'messages' },
  { label: 'Profile',  href: '__profile__', icon: 'profile' },
]

function Icon({ name, active }: { name: string; active: boolean }) {
  const color = active ? '#E8520A' : '#9CA3AF'
  const w = 22, h = 22

  if (name === 'home') return (
    <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
  if (name === 'trips') return (
    <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4 17 4 16.8 5.4 15.5 5.5l-4 .5L5 2H3l2 6.5L2.5 12 3 13.5l4-.5 4.5 6.5z"/>
    </svg>
  )
  if (name === 'matches') return (
    <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
  if (name === 'messages') return (
    <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
  if (name === 'profile') return (
    <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
  return null
}

export default function BottomNav({ profileHref }: { profileHref: string }) {
  const pathname = usePathname()

  const navWithProfile = NAV.map(item =>
    item.icon === 'profile' ? { ...item, href: profileHref } : item
  )

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/trips') return pathname === '/trips' || (pathname.startsWith('/trips') && !pathname.startsWith('/trips/new'))
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white border-t border-gray-200">
      <div className="flex items-stretch h-16">
        {navWithProfile.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.icon}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <Icon name={item.icon} active={active} />
              <span className={`text-[10px] font-medium ${active ? 'text-brand' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
