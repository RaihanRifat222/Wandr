'use client'

import { motion } from 'motion/react'
import ElevationProgress from '@/components/ElevationProgress'

type RegionCount = { region: string; count: number }

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

export default function TripsSidebar({ regionCounts, totalTrips }: {
  regionCounts: RegionCount[]
  totalTrips: number
}) {
  const max = Math.max(1, ...regionCounts.map(r => r.count))

  return (
    <div className="space-y-4 sticky top-20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand to-pine p-5 text-white"
      >
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-2 mb-2">
          <SearchIcon />
          <p className="font-serif font-bold text-base">Try describing your trip</p>
        </div>
        <p className="relative text-sm text-white/85 leading-relaxed">
          Search like &ldquo;laid-back hiking buddy for a slow Southeast Asia trip&rdquo; — the more specific, the better the matches.
        </p>
      </motion.div>

      {regionCounts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="bg-surface rounded-xl border border-border p-5"
        >
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <GlobeIcon /> {totalTrips} open trips
          </h2>
          <div className="space-y-3">
            {regionCounts.map(({ region, count }, i) => (
              <motion.div
                key={region}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.12 + i * 0.05 }}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-gray-600">{region}</span>
                  <span className="text-gray-400">{count}</span>
                </div>
                <ElevationProgress progress={(count / max) * 100} height={12} delay={0.2 + i * 0.05} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
