'use client'

import Link from 'next/link'
import { motion } from 'motion/react'

type SuggestedTrip = {
  id: string
  destination: string
  region: string | null
  host: { full_name: string | null; username: string | null; avatar_url: string | null } | null
}

type Props = {
  suggestedTrips: SuggestedTrip[]
  showProfileNudge: boolean
}

function CompassIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}

export default function DashboardSidebar({ suggestedTrips, showProfileNudge }: Props) {
  return (
    <div className="space-y-4 sticky top-20">
      {showProfileNudge && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand to-orange-500 p-5 text-white"
        >
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
          <p className="relative font-serif font-bold text-base">Finish your profile</p>
          <p className="relative text-sm text-white/85 mt-1.5 leading-relaxed">
            Add your vibe and a favorite travel moment so the right buddies find you.
          </p>
          <Link href="/profile/edit">
            <motion.span
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative inline-block mt-4 rounded-lg px-4 py-2 bg-white text-brand text-xs font-semibold hover:brightness-95 transition"
            >
              Complete profile
            </motion.span>
          </Link>
        </motion.div>
      )}

      {suggestedTrips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="bg-surface rounded-xl border border-border p-5"
        >
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <CompassIcon /> Suggested trips
          </h2>
          <div className="space-y-3">
            {suggestedTrips.map((trip, i) => {
              const hostName = trip.host?.full_name ?? trip.host?.username ?? 'A traveller'
              return (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.12 + i * 0.05 }}
                >
                  <Link
                    href={`/trips/${trip.id}`}
                    className="flex items-center gap-3 rounded-lg p-2.5 -m-2.5 hover:bg-sand-dark transition group"
                  >
                    {trip.host?.avatar_url ? (
                      <img src={trip.host.avatar_url} alt={hostName} className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-brand/10 text-brand font-serif font-bold flex items-center justify-center text-xs shrink-0">
                        {hostName[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-brand transition">{trip.destination}</p>
                      <p className="text-xs text-gray-400 truncate">{hostName}{trip.region ? ` · ${trip.region}` : ''}</p>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
          <Link href="/trips" className="block text-center text-xs text-brand font-semibold hover:underline mt-4">
            Browse all trips
          </Link>
        </motion.div>
      )}
    </div>
  )
}
