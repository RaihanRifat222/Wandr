'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'

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
  const color = active ? 'white' : 'var(--muted)'
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--brand)" stroke="var(--brand)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          <stop offset="0%" stopColor="#F7F4E8" />
          <stop offset="100%" stopColor="#EAE3CC" />
        </linearGradient>
        <radialGradient id="ls-sun-glow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#D9A441" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#D9A441" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect width="220" height="185" fill="url(#ls-sky)" />

      {/* Sun */}
      <circle cx="172" cy="36" r="30" fill="url(#ls-sun-glow)" />
      <circle cx="172" cy="36" r="12" fill="#D9A441" />

      {/* Far ridge */}
      <path d="M0 108 L30 82 L62 100 L98 66 L138 90 L176 74 L220 88 L220 185 L0 185 Z"
            fill="#8A9A85" opacity="0.45" />

      {/* Mid ridge */}
      <path d="M0 126 L36 96 L74 116 L112 84 L152 108 L192 90 L220 100 L220 185 L0 185 Z"
            fill="#5C7460" opacity="0.7" />

      {/* Near ridge (pine) with topographic contour lines */}
      <path d="M0 148 L34 118 L82 140 L118 108 L168 134 L220 116 L220 185 L0 185 Z" fill="#2B4739" />
      <path d="M28 148 Q60 132 96 142 Q132 152 168 138" stroke="#EAE3CC" strokeWidth="1" fill="none" opacity="0.25" />
      <path d="M40 160 Q72 146 108 154 Q144 162 180 150" stroke="#EAE3CC" strokeWidth="1" fill="none" opacity="0.2" />
      <path d="M55 172 Q85 160 118 166 Q152 172 184 163" stroke="#EAE3CC" strokeWidth="1" fill="none" opacity="0.15" />

      {/* Trail — dashed rust path winding to the summit */}
      <path
        d="M18 185 Q30 160 26 142 Q22 122 42 112 Q64 100 60 118 Q56 134 82 138"
        stroke="#C1502E" strokeWidth="2" strokeDasharray="1 5" strokeLinecap="round" fill="none" opacity="0.85"
      />
      {/* Summit marker */}
      <circle cx="82" cy="138" r="4.5" fill="#C1502E" />
      <circle cx="82" cy="138" r="4.5" fill="none" stroke="#F7F4E8" strokeWidth="1.5" />

      {/* Pine trees */}
      {[[24, 176, 10], [196, 172, 13], [206, 180, 9]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y})`} opacity="0.9">
          <path d={`M0 0 L${-s * 0.6} ${s} L${s * 0.6} ${s} Z`} fill="#233B2F" />
          <path d={`M0 ${-s * 0.5} L${-s * 0.45} ${s * 0.55} L${s * 0.45} ${s * 0.55} Z`} fill="#2B4739" />
          <rect x={-1} y={s} width="2" height={s * 0.35} fill="#4A4536" />
        </g>
      ))}
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
    <aside className="hidden md:flex w-[220px] shrink-0 sticky top-0 h-screen flex-col bg-surface border-r border-border overflow-hidden">

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
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                active ? 'text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              ].join(' ')}
            >
              {active && (
                <motion.span
                  layoutId="sidebarActivePill"
                  className="absolute inset-0 rounded-xl bg-brand shadow-sm"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-3">
                <Icon name={item.icon} active={active} />
                {item.label}
              </span>
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
