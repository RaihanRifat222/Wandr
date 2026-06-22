'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { requestToJoin } from '@/lib/actions/trips'

// ─── Types ────────────────────────────────────────────────────────────────────

type Host = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  home_city: string | null
}

type Trip = {
  id: string
  destination: string
  region: string | null
  start_date: string | null
  end_date: string | null
  group_size: number
  budget_estimate: number | null
  description: string | null
  created_at: string
  host: Host | null
}

type Props = {
  trips: Trip[]
  requestedIds: string[]
  userId: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REGIONS = ['Europe', 'Asia', 'Americas', 'Africa', 'Oceania', 'Middle East']

const REGION_STYLES: Record<string, { from: string; to: string }> = {
  Europe:        { from: '#667eea', to: '#764ba2' },
  Asia:          { from: '#f093fb', to: '#f5576c' },
  Americas:      { from: '#43e97b', to: '#38f9d7' },
  Africa:        { from: '#f7971e', to: '#ffd200' },
  Oceania:       { from: '#4facfe', to: '#00f2fe' },
  'Middle East': { from: '#f6d365', to: '#fda085' },
}
const FALLBACK_STYLE = { from: '#E8520A', to: '#f97316' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cardStyle(region: string | null) {
  return region ? (REGION_STYLES[region] ?? FALLBACK_STYLE) : FALLBACK_STYLE
}

function budgetLabel(estimate: number | null): string | null {
  if (estimate == null) return null
  if (estimate <= 50)  return 'Backpacker'
  if (estimate <= 100) return 'Budget'
  if (estimate <= 200) return 'Mid-range'
  return 'Comfort'
}

function formatDates(start: string | null, end: string | null) {
  if (!start && !end) return null
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  if (start) return `From ${fmt(start)}`
  return `Until ${fmt(end!)}`
}

// ─── SVG icons ────────────────────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function WalletIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12c0 1.1.9 2 2 2h14v-4" /><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function PlaneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4 17 4 16.8 5.4 15.5 5.5l-4 .5L5 2H3l2 6.5L2.5 12 3 13.5l4-.5 4.5 6.5z" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

// ─── Card animation variants ────────────────────────────────────────────────

const cardVariants = {
  enter:  (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit:   (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0, scale: 0.97 }),
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function TripCard({ trip }: { trip: Trip }) {
  const style   = cardStyle(trip.region)
  const budget  = budgetLabel(trip.budget_estimate)
  const dates   = formatDates(trip.start_date, trip.end_date)
  const buddies = trip.group_size - 1

  const hostName     = trip.host?.full_name ?? 'A traveller'
  const hostInitials = hostName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    <div className="bg-surface rounded-2xl shadow-lg border border-border overflow-hidden">

      {/* ── Gradient header ──────────────────────────────────────────── */}
      <div
        className="relative h-44 flex flex-col justify-end px-6 pb-5"
        style={{ background: `linear-gradient(135deg, ${style.from} 0%, ${style.to} 100%)` }}
      >
        {/* subtle inner highlight */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

        {trip.region && (
          <span className="relative text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">
            {trip.region}
          </span>
        )}
        <Link href={`/trips/${trip.id}`} className="relative group">
          <h2 className="font-serif text-2xl font-bold text-white leading-tight group-hover:underline underline-offset-2 decoration-white/60">
            {trip.destination}
          </h2>
        </Link>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="px-6 py-5 space-y-4">

        {/* Info chips */}
        <div className="flex flex-wrap gap-2">
          {dates && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium">
              <CalendarIcon /> {dates}
            </span>
          )}
          {budget && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium">
              <WalletIcon /> {budget}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium">
            <UsersIcon /> {buddies} {buddies === 1 ? 'buddy' : 'buddies'} needed
          </span>
        </div>

        {/* Host */}
        <div className="flex items-center gap-3 py-3.5 border-y border-gray-100">
          {trip.host?.avatar_url ? (
            <img
              src={trip.host.avatar_url}
              alt={hostName}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand/10 text-brand text-sm font-bold font-serif flex items-center justify-center shrink-0">
              {hostInitials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{hostName}</p>
            {trip.host?.home_city && (
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <MapPinIcon /> {trip.host.home_city}
              </p>
            )}
          </div>
          {trip.host?.username && (
            <Link
              href={`/profile/${trip.host.username}`}
              className="text-xs text-brand font-semibold hover:underline shrink-0"
            >
              View profile
            </Link>
          )}
        </div>

        {/* Description */}
        {trip.description ? (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">
            {trip.description}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic">No description provided.</p>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TripCards({ trips, requestedIds, userId }: Props) {
  const [regionFilter, setRegionFilter] = useState<string | null>(null)
  const [idx, setIdx]                   = useState(0)
  const [direction, setDirection]       = useState(1)
  const [joined, setJoined]             = useState(() => new Set(requestedIds))
  const [justJoined, setJustJoined]     = useState(false)
  const [, startTransition]             = useTransition()

  const filtered = regionFilter
    ? trips.filter(t => t.region === regionFilter)
    : trips

  const total = filtered.length
  const cur   = Math.min(idx, Math.max(0, total - 1))
  const trip  = filtered[cur]

  function advance(dir: 'next' | 'prev') {
    const next = dir === 'next' ? cur + 1 : cur - 1
    if (next < 0 || next >= total) return
    setDirection(dir === 'next' ? 1 : -1)
    setIdx(next)
  }

  function handlePass() { advance('next') }

  function handleJoin() {
    if (!trip || joined.has(trip.id)) return
    const id = trip.id
    setJoined(prev => new Set([...prev, id]))
    setJustJoined(true)
    startTransition(async () => { await requestToJoin(id) })
    setTimeout(() => {
      setJustJoined(false)
      advance('next')
    }, 900)
  }

  function changeFilter(r: string | null) {
    setRegionFilter(r)
    setDirection(1)
    setIdx(0)
    setJustJoined(false)
  }

  // ── Empty: no trips at all ───────────────────────────────────────
  if (trips.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center py-28 text-center"
      >
        <div className="text-gray-200 mb-6">
          <GlobeIcon />
        </div>
        <h2 className="font-serif text-2xl font-bold text-gray-800 mb-2">No trips yet</h2>
        <p className="text-gray-500 text-sm mb-7 max-w-xs">
          Be the first to post a trip and find your travel buddy.
        </p>
        <Link
          href="/trips/new"
          className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 bg-brand text-white text-sm font-semibold hover:brightness-95 transition shadow-sm"
        >
          Post the first trip
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Browse Trips</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {total} trip{total !== 1 ? 's' : ''} {regionFilter ? `in ${regionFilter}` : 'available'}
          </p>
        </div>
        <Link
          href="/trips/new"
          className="rounded-lg px-4 py-2 bg-brand text-white text-xs font-semibold hover:brightness-95 transition shadow-sm"
        >
          + Post a trip
        </Link>
      </div>

      {/* ── Region filters ───────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {[null, ...REGIONS].map(r => {
          const active = regionFilter === r
          return (
            <button
              key={r ?? 'all'}
              type="button"
              onClick={() => changeFilter(r)}
              className={[
                'relative rounded-full px-4 py-1.5 text-xs font-medium border transition-colors',
                active
                  ? 'text-white border-brand'
                  : 'bg-surface text-gray-600 border-border hover:border-gray-300',
              ].join(' ')}
            >
              {active && (
                <motion.span
                  layoutId="regionPillBg"
                  className="absolute inset-0 rounded-full bg-brand shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{r ?? 'All regions'}</span>
            </button>
          )
        })}
      </div>

      {/* ── No results for this filter ───────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-20 text-center">
          <p className="text-gray-500 text-sm">No open trips in {regionFilter} right now.</p>
          <button
            type="button"
            onClick={() => changeFilter(null)}
            className="mt-4 text-brand text-sm font-medium hover:underline"
          >
            View all regions
          </button>
        </div>
      )}

      {/* ── Card + actions ───────────────────────────────────────────── */}
      {filtered.length > 0 && trip && (
        <div className="flex flex-col items-center gap-5">

          {/* Card with side-nav arrows */}
          <div className="relative w-full max-w-md overflow-hidden">

            {cur > 0 && (
              <motion.button
                type="button"
                aria-label="Previous trip"
                onClick={() => advance('prev')}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 z-10 w-10 h-10 rounded-full bg-surface border border-border shadow-md text-gray-500 hover:text-brand hover:border-brand transition flex items-center justify-center text-lg hidden sm:flex"
              >
                ←
              </motion.button>
            )}

            {cur < total - 1 && (
              <motion.button
                type="button"
                aria-label="Next trip"
                onClick={() => advance('next')}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 z-10 w-10 h-10 rounded-full bg-surface border border-border shadow-md text-gray-500 hover:text-brand hover:border-brand transition flex items-center justify-center text-lg hidden sm:flex"
              >
                →
              </motion.button>
            )}

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={trip.id}
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <TripCard trip={trip} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-4 w-full max-w-md">

            {/* Pass */}
            <motion.button
              type="button"
              onClick={handlePass}
              disabled={cur >= total - 1}
              whileHover={cur >= total - 1 ? undefined : { scale: 1.02 }}
              whileTap={cur >= total - 1 ? undefined : { scale: 0.96 }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 bg-surface border-2 border-border text-gray-600 text-sm font-semibold hover:border-gray-300 hover:bg-sand-dark disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm"
            >
              <span className="text-base leading-none">✕</span>
              Pass
            </motion.button>

            {/* Counter */}
            <div className="flex flex-col items-center shrink-0 min-w-[3.5rem]">
              <span className="text-lg font-serif font-bold text-gray-700">{cur + 1}</span>
              <span className="text-[10px] text-gray-400 font-medium -mt-0.5">of {total}</span>
            </div>

            {/* Join / Your trip */}
            {trip.host?.id === userId ? (
              <div className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 bg-gray-100 border-2 border-gray-200 text-gray-400 text-sm font-semibold cursor-default">
                Your trip
              </div>
            ) : (
              <motion.button
                type="button"
                onClick={handleJoin}
                disabled={justJoined || joined.has(trip.id)}
                whileHover={justJoined || joined.has(trip.id) ? undefined : { scale: 1.02 }}
                whileTap={justJoined || joined.has(trip.id) ? undefined : { scale: 0.96 }}
                className={[
                  'flex-1 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition shadow-sm border-2',
                  justJoined
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : joined.has(trip.id)
                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-default'
                    : 'bg-brand border-brand text-white hover:brightness-95',
                ].join(' ')}
              >
                {justJoined ? (
                  <motion.span
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="flex items-center gap-2"
                  >
                    <CheckIcon /> Requested!
                  </motion.span>
                ) : joined.has(trip.id) ? (
                  <><CheckIcon /> Requested</>
                ) : (
                  <><PlaneIcon /> Join</>
                )}
              </motion.button>
            )}
          </div>

          {/* View details */}
          {trip && (
            <Link
              href={`/trips/${trip.id}`}
              className="text-xs text-gray-400 hover:text-brand transition font-medium"
            >
              View full details →
            </Link>
          )}

          {/* Mobile prev/next */}
          <div className="flex items-center gap-3 sm:hidden">
            <button
              type="button"
              onClick={() => advance('prev')}
              disabled={cur <= 0}
              className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 transition font-medium"
            >
              ← Prev
            </button>
            <span className="text-gray-300">·</span>
            <button
              type="button"
              onClick={() => advance('next')}
              disabled={cur >= total - 1}
              className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 transition font-medium"
            >
              Next →
            </button>
          </div>

          {/* End of stack */}
          {cur === total - 1 && (
            <p className="text-xs text-gray-400 text-center mt-1">
              You&apos;ve seen all {total} trip{total !== 1 ? 's' : ''} &middot;{' '}
              <Link href="/trips/new" className="text-brand hover:underline font-medium">
                Post your own
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
