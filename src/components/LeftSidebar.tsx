'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ── Nav items ────────────────────────────────────────────────────────────────

const NAV = [
  { label: 'Home',     href: '/dashboard', icon: 'home'     },
  { label: 'Trips',    href: '/trips',     icon: 'trips'    },
  { label: 'Matches',  href: '/matches',   icon: 'matches'  },
  { label: 'Messages', href: '/messages',  icon: 'messages' },
  { label: 'Profile',  href: '__profile__', icon: 'profile' },
]

// ── Icons ─────────────────────────────────────────────────────────────────────

function Icon({ name, active }: { name: string; active: boolean }) {
  const color = active ? 'white' : '#9CA3AF'
  const w = 19, h = 19

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

// ── Map pin icon for logo ─────────────────────────────────────────────────────

function MapPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#E8520A" stroke="#E8520A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3" fill="white" stroke="none"/>
    </svg>
  )
}

// ── Landscape illustration ────────────────────────────────────────────────────

function LandscapeIllustration() {
  return (
    <svg viewBox="0 0 220 185" xmlns="http://www.w3.org/2000/svg" className="w-full block">
      <defs>
        <linearGradient id="ls-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE8C8" />
          <stop offset="45%" stopColor="#FBBD85" />
          <stop offset="100%" stopColor="#F5A455" />
        </linearGradient>
        <linearGradient id="ls-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#56C5BF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#3AADAA" stopOpacity="0.7" />
        </linearGradient>
        <radialGradient id="ls-sun-glow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FFE080" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FFE080" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect width="220" height="185" fill="url(#ls-sky)" />

      {/* Sun glow */}
      <circle cx="98" cy="68" r="46" fill="url(#ls-sun-glow)" />
      {/* Sun */}
      <circle cx="98" cy="68" r="24" fill="#FFE07A" opacity="0.96" />

      {/* Far mountains — lightest */}
      <path d="M0 112 L28 78 L58 98 L96 55 L136 82 L172 66 L220 78 L220 185 L0 185 Z"
            fill="#EE965C" opacity="0.45" />

      {/* Mid mountains */}
      <path d="M0 128 L38 92 L72 114 L110 78 L150 102 L190 86 L220 96 L220 185 L0 185 Z"
            fill="#C96A28" opacity="0.72" />

      {/* Near hills */}
      <path d="M0 150 L32 122 L80 144 L128 116 L182 138 L220 126 L220 185 L0 185 Z"
            fill="#8B3A0E" opacity="0.88" />

      {/* Water */}
      <path d="M0 164 Q55 156 110 165 Q165 173 220 162 L220 185 L0 185 Z"
            fill="url(#ls-water)" />
      {/* Water shimmer */}
      <path d="M18 173 Q60 167 105 173 Q148 179 188 171"
            stroke="#88DFDA" strokeWidth="1.5" fill="none" opacity="0.55" />

      {/* Palm trunk */}
      <path d="M183 185 Q181 170 176 153 Q173 141 170 132"
            stroke="#2E1404" strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* Palm fronds */}
      <path d="M170 132 Q153 119 140 127 Q156 113 170 132" fill="#2A5E14" opacity="0.92" />
      <path d="M170 132 Q188 116 198 128 Q186 113 170 132" fill="#2A5E14" opacity="0.92" />
      <path d="M170 132 Q164 113 178 110 Q172 120 170 132" fill="#2E6A18" opacity="0.9" />
      <path d="M170 132 Q155 127 150 138 Q159 122 170 132" fill="#2A5E14" opacity="0.8" />
      <path d="M170 132 Q186 128 194 140 Q183 124 170 132" fill="#2A5E14" opacity="0.8" />

      {/* Clouds */}
      <ellipse cx="40" cy="40" rx="22" ry="9" fill="white" opacity="0.22" />
      <ellipse cx="55" cy="35" rx="16" ry="7" fill="white" opacity="0.18" />
      <ellipse cx="155" cy="30" rx="18" ry="7" fill="white" opacity="0.18" />
      <ellipse cx="168" cy="26" rx="12" ry="6" fill="white" opacity="0.15" />
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LeftSidebar({ profileHref }: { profileHref: string }) {
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
    <aside className="hidden md:flex w-[220px] shrink-0 sticky top-0 h-screen flex-col bg-[#FDF8F2] border-r border-[#EDE0CA] overflow-hidden">

      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <Link href="/dashboard" className="flex items-center gap-1.5 select-none">
          <span className="font-serif text-2xl font-bold text-brand leading-none">Wandr</span>
          <MapPinIcon />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navWithProfile.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.icon}
              href={item.href}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-gray-500 hover:bg-[#F0E8DA] hover:text-gray-800',
              ].join(' ')}
            >
              <Icon name={item.icon} active={active} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Landscape illustration */}
      <div className="mt-auto">
        <LandscapeIllustration />
      </div>
    </aside>
  )
}
