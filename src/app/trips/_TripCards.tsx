'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
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

const REGION_STYLES: Record<string, { from: string; to: string; emoji: string }> = {
  Europe:           { from: '#667eea', to: '#764ba2', emoji: '🏛️' },
  Asia:             { from: '#f093fb', to: '#f5576c', emoji: '⛩️' },
  Americas:         { from: '#43e97b', to: '#38f9d7', emoji: '🌎' },
  Africa:           { from: '#f7971e', to: '#ffd200', emoji: '🦁' },
  Oceania:          { from: '#4facfe', to: '#00f2fe', emoji: '🐨' },
  'Middle East':    { from: '#f6d365', to: '#fda085', emoji: '🕌' },
}
const FALLBACK_STYLE = { from: '#E8520A', to: '#f97316', emoji: '🌍' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cardStyle(region: string | null) {
  return region ? (REGION_STYLES[region] ?? FALLBACK_STYLE) : FALLBACK_STYLE
}

function budgetBadge(estimate: number | null) {
  if (estimate == null) return null
  if (estimate <= 50)  return { emoji: '🎒', label: 'Backpacker' }
  if (estimate <= 100) return { emoji: '🌿', label: 'Budget'     }
  if (estimate <= 200) return { emoji: '✈️', label: 'Mid-range'  }
  return                      { emoji: '🥂', label: 'Comfort'    }
}

function formatDates(start: string | null, end: string | null) {
  if (!start && !end) return null
  // append time to avoid timezone-shift on date-only strings
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  if (start) return `From ${fmt(start)}`
  return `Until ${fmt(end!)}`
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function TripCard({ trip, animKey }: { trip: Trip; animKey: number }) {
  const style   = cardStyle(trip.region)
  const budget  = budgetBadge(trip.budget_estimate)
  const dates   = formatDates(trip.start_date, trip.end_date)
  const buddies = trip.group_size - 1

  const hostName     = trip.host?.full_name ?? 'A traveller'
  const hostInitials = hostName.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    // animKey change remounts the div → triggers card-enter CSS animation
    <div key={animKey} className="card-enter bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden">

      {/* ── Gradient header ─────────────────────────────────────────── */}
      <div
        className="relative h-52 flex flex-col justify-end px-7 pb-6"
        style={{ background: `linear-gradient(135deg, ${style.from} 0%, ${style.to} 100%)` }}
      >
        <span className="absolute right-5 top-5 text-7xl opacity-[0.15] select-none pointer-events-none leading-none">
          {style.emoji}
        </span>
        <span className="absolute right-20 bottom-3 text-4xl opacity-[0.12] select-none pointer-events-none leading-none">
          ✈️
        </span>

        {trip.region && (
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-1">
            {trip.region}
          </span>
        )}
        <h2 className="font-serif text-3xl font-bold text-white leading-tight drop-shadow-sm">
          {trip.destination}
        </h2>
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="px-7 py-6 space-y-5">

        {/* Info chips */}
        <div className="flex flex-wrap gap-2">
          {dates && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-stone-100 text-stone-700 text-xs font-medium">
              📅 {dates}
            </span>
          )}
          {budget && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-stone-100 text-stone-700 text-xs font-medium">
              {budget.emoji} {budget.label}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-stone-100 text-stone-700 text-xs font-medium">
            👥 {buddies} {buddies === 1 ? 'buddy' : 'buddies'} needed
          </span>
        </div>

        {/* Host */}
        <div className="flex items-center gap-3 py-4 border-y border-stone-100">
          {trip.host?.avatar_url ? (
            <img
              src={trip.host.avatar_url}
              alt={hostName}
              className="w-11 h-11 rounded-full object-cover border-2 border-stone-100 shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-brand/10 text-brand text-sm font-bold font-serif flex items-center justify-center shrink-0">
              {hostInitials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-stone-800 truncate">{hostName}</p>
            {trip.host?.home_city && (
              <p className="text-xs text-stone-400 mt-0.5">🏠 {trip.host.home_city}</p>
            )}
          </div>
          {trip.host?.username && (
            <Link
              href={`/profile/${trip.host.username}`}
              className="text-xs text-brand font-semibold hover:underline shrink-0"
            >
              Profile →
            </Link>
          )}
        </div>

        {/* Description */}
        {trip.description ? (
          <p className="text-sm text-stone-600 leading-relaxed line-clamp-4">
            {trip.description}
          </p>
        ) : (
          <p className="text-sm text-stone-400 italic">No description provided.</p>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TripCards({ trips, requestedIds, userId }: Props) {
  const [regionFilter, setRegionFilter] = useState<string | null>(null)
  const [idx, setIdx]                   = useState(0)
  const [animKey, setAnimKey]           = useState(0)
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
    setIdx(next)
    setAnimKey(k => k + 1)
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
    setIdx(0)
    setAnimKey(k => k + 1)
    setJustJoined(false)
  }

  // ── Empty: no trips at all ───────────────────────────────────────
  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <span className="text-7xl mb-5">🌍</span>
        <h2 className="font-serif text-2xl font-bold text-stone-800 mb-2">No trips yet</h2>
        <p className="text-stone-500 text-sm mb-7 max-w-xs">
          Be the first to post a trip and find your travel buddy!
        </p>
        <Link
          href="/trips/new"
          className="rounded-full px-7 py-3 bg-brand text-white text-sm font-semibold hover:brightness-95 transition shadow-sm"
        >
          Post the first trip ✈️
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Browse Trips</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            {total} trip{total !== 1 ? 's' : ''} {regionFilter ? `in ${regionFilter}` : 'available'}
          </p>
        </div>
        <Link
          href="/trips/new"
          className="rounded-full px-4 py-2 bg-brand text-white text-xs font-semibold hover:brightness-95 transition shadow-sm"
        >
          + Post a trip
        </Link>
      </div>

      {/* ── Region filters ──────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {[null, ...REGIONS].map(r => (
          <button
            key={r ?? 'all'}
            type="button"
            onClick={() => changeFilter(r)}
            className={[
              'rounded-full px-4 py-1.5 text-xs font-medium border transition-all',
              regionFilter === r
                ? 'bg-brand text-white border-brand shadow-sm'
                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300',
            ].join(' ')}
          >
            {r ?? 'All regions'}
          </button>
        ))}
      </div>

      {/* ── No results for this filter ──────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-20 text-center">
          <span className="text-5xl mb-3">🔍</span>
          <p className="text-stone-500 text-sm">No open trips in {regionFilter} right now.</p>
          <button
            type="button"
            onClick={() => changeFilter(null)}
            className="mt-4 text-brand text-sm font-medium hover:underline"
          >
            View all regions
          </button>
        </div>
      )}

      {/* ── Card + actions ──────────────────────────────────────────── */}
      {filtered.length > 0 && trip && (
        <div className="flex flex-col items-center gap-5">

          {/* Card with side-nav arrows */}
          <div className="relative w-full max-w-md">

            {cur > 0 && (
              <button
                type="button"
                aria-label="Previous trip"
                onClick={() => advance('prev')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 w-10 h-10 rounded-full bg-white border border-stone-200 shadow-md text-stone-500 hover:text-brand hover:border-brand transition flex items-center justify-center text-lg hidden sm:flex"
              >
                ←
              </button>
            )}

            {cur < total - 1 && (
              <button
                type="button"
                aria-label="Next trip"
                onClick={() => advance('next')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 w-10 h-10 rounded-full bg-white border border-stone-200 shadow-md text-stone-500 hover:text-brand hover:border-brand transition flex items-center justify-center text-lg hidden sm:flex"
              >
                →
              </button>
            )}

            <TripCard trip={trip} animKey={animKey} />
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-4 w-full max-w-md">

            {/* Pass */}
            <button
              type="button"
              onClick={handlePass}
              disabled={cur >= total - 1}
              className="flex-1 flex items-center justify-center gap-2 rounded-full py-4 bg-white border-2 border-stone-200 text-stone-600 text-sm font-semibold hover:border-stone-300 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm"
            >
              <span className="text-base leading-none">✕</span>
              Pass
            </button>

            {/* Counter */}
            <div className="flex flex-col items-center shrink-0 min-w-[3.5rem]">
              <span className="text-lg font-serif font-bold text-stone-700">{cur + 1}</span>
              <span className="text-[10px] text-stone-400 font-medium -mt-0.5">of {total}</span>
            </div>

            {/* Join / Your trip */}
            {trip.host?.id === userId ? (
              <div className="flex-1 flex items-center justify-center gap-2 rounded-full py-4 bg-stone-100 border-2 border-stone-200 text-stone-400 text-sm font-semibold cursor-default">
                <span className="text-base leading-none">🧳</span>
                Your trip
              </div>
            ) : (
              <button
                type="button"
                onClick={handleJoin}
                disabled={justJoined || joined.has(trip.id)}
                className={[
                  'flex-1 flex items-center justify-center gap-2 rounded-full py-4 text-sm font-semibold transition shadow-sm border-2',
                  justJoined
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : joined.has(trip.id)
                    ? 'bg-stone-100 border-stone-200 text-stone-400 cursor-default'
                    : 'bg-brand border-brand text-white hover:brightness-95',
                ].join(' ')}
              >
                {justJoined ? (
                  <><span className="text-base leading-none">✓</span> Requested!</>
                ) : joined.has(trip.id) ? (
                  <><span className="text-base leading-none">✓</span> Requested</>
                ) : (
                  <><span className="text-base leading-none">✈</span> Join</>
                )}
              </button>
            )}
          </div>

          {/* Mobile prev/next hint */}
          <div className="flex items-center gap-3 sm:hidden">
            <button
              type="button"
              onClick={() => advance('prev')}
              disabled={cur <= 0}
              className="text-xs text-stone-400 hover:text-stone-700 disabled:opacity-30 transition font-medium"
            >
              ← Prev
            </button>
            <span className="text-stone-300">·</span>
            <button
              type="button"
              onClick={() => advance('next')}
              disabled={cur >= total - 1}
              className="text-xs text-stone-400 hover:text-stone-700 disabled:opacity-30 transition font-medium"
            >
              Next →
            </button>
          </div>

          {/* End of stack message */}
          {cur === total - 1 && (
            <p className="text-xs text-stone-400 text-center mt-1">
              You&apos;ve seen all {total} trip{total !== 1 ? 's' : ''} •{' '}
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
