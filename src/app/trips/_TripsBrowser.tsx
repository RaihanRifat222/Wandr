'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { searchTrips, requestToJoin, type TripSearchResult } from '@/lib/actions/trips'
import TripCards from './_TripCards'

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
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

function UsersIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function PlaneIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4 17 4 16.8 5.4 15.5 5.5l-4 .5L5 2H3l2 6.5L2.5 12 3 13.5l4-.5 4.5 6.5z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ─── Result card ──────────────────────────────────────────────────────────────

function ResultCard({
  trip, userId, joined, onJoin,
}: {
  trip: TripSearchResult
  userId: string
  joined: boolean
  onJoin: (id: string) => void
}) {
  const budget  = budgetLabel(trip.budget_estimate)
  const dates   = formatDates(trip.start_date, trip.end_date)
  const buddies = trip.group_size - 1
  const hostName = trip.host?.full_name ?? 'A traveller'
  const isOwn = trip.host?.id === userId
  const matchPct = Math.round(Math.min(1, Math.max(0, trip.similarity)) * 100)

  return (
    <div className="bg-surface rounded-xl border border-border p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {trip.region && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{trip.region}</span>
          )}
          <h3 className="font-serif text-lg font-bold text-gray-900 truncate">{trip.destination}</h3>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 bg-brand/10 text-brand text-xs font-bold">
          {matchPct}% match
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {dates && (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium">
            <CalendarIcon /> {dates}
          </span>
        )}
        {budget && (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium">
            <WalletIcon /> {budget}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium">
          <UsersIcon /> {buddies} {buddies === 1 ? 'buddy' : 'buddies'} needed
        </span>
      </div>

      {trip.description && (
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{trip.description}</p>
      )}

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
        <Link
          href={trip.host?.username ? `/profile/${trip.host.username}` : '#'}
          className="flex items-center gap-2 min-w-0"
        >
          {trip.host?.avatar_url ? (
            <img src={trip.host.avatar_url} alt={hostName} className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-100 shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-brand/10 text-brand text-xs font-bold font-serif flex items-center justify-center shrink-0">
              {hostName[0]?.toUpperCase()}
            </div>
          )}
          <span className="text-xs font-medium text-gray-700 truncate hover:underline">{hostName}</span>
        </Link>

        {isOwn ? (
          <span className="text-xs text-gray-400 font-medium shrink-0">Your trip</span>
        ) : (
          <motion.button
            type="button"
            onClick={() => onJoin(trip.id)}
            disabled={joined}
            whileHover={joined ? undefined : { scale: 1.03 }}
            whileTap={joined ? undefined : { scale: 0.96 }}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              joined ? 'bg-gray-100 text-gray-400 cursor-default' : 'bg-brand text-white hover:brightness-95'
            }`}
          >
            {joined ? <><CheckIcon /> Requested</> : <><PlaneIcon /> Join</>}
          </motion.button>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TripsBrowser({ trips, requestedIds, userId }: Props) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<TripSearchResult[] | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [joined, setJoined]     = useState(() => new Set(requestedIds))
  const [isPending, startTransition] = useTransition()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setSearchError(null)
    startTransition(async () => {
      const r = await searchTrips(query)
      if ('error' in r) setSearchError(r.error)
      else setResults(r.results)
    })
  }

  function clearSearch() {
    setQuery('')
    setResults(null)
    setSearchError(null)
  }

  function handleJoin(tripId: string) {
    if (joined.has(tripId)) return
    setJoined(prev => new Set([...prev, tripId]))
    startTransition(async () => { await requestToJoin(tripId) })
  }

  return (
    <div className="space-y-5">
      {/* ── Search bar ──────────────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Describe who or what kind of trip you're looking for…"
          className="w-full rounded-xl pl-11 pr-28 py-3.5 border border-border bg-surface text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition shadow-sm"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <SearchIcon />
        </span>
        <motion.button
          type="submit"
          disabled={isPending || !query.trim()}
          whileHover={isPending ? undefined : { scale: 1.02 }}
          whileTap={isPending ? undefined : { scale: 0.97 }}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg px-4 py-2 bg-brand text-white text-xs font-semibold hover:brightness-95 disabled:opacity-50 transition"
        >
          {isPending ? 'Searching…' : 'Search'}
        </motion.button>
      </form>

      {searchError && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2.5">{searchError}</p>
      )}

      {/* ── Search results ──────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {results !== null ? (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {results.length} {results.length === 1 ? 'trip' : 'trips'} matching &ldquo;{query}&rdquo;
              </p>
              <button
                type="button"
                onClick={clearSearch}
                className="text-xs text-brand font-medium hover:underline"
              >
                Clear search
              </button>
            </div>

            {results.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <p className="text-gray-500 text-sm">No trips matched that description yet.</p>
                <button
                  type="button"
                  onClick={clearSearch}
                  className="mt-4 text-brand text-sm font-medium hover:underline"
                >
                  Browse all trips instead
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((trip, i) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                  >
                    <ResultCard
                      trip={trip}
                      userId={userId}
                      joined={joined.has(trip.id)}
                      onJoin={handleJoin}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="browse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TripCards trips={trips} requestedIds={requestedIds} userId={userId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
