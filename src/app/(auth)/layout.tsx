'use client'

import type { ReactNode } from 'react'
import { motion } from 'motion/react'

const PERKS = [
  'Match with travellers who share your style',
  'Post a trip and find buddies in minutes',
  'Real conversations, not endless swiping',
]

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background flex">

      {/* ── Brand panel — desktop only ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand via-orange-500 to-orange-600 px-14 py-16 flex-col justify-between">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10" />
        <div className="absolute bottom-10 -left-20 w-72 h-72 rounded-full bg-white/10" />

        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative font-serif text-3xl font-bold text-white tracking-tight"
        >
          Wandr
        </motion.span>

        <div className="relative">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-serif text-4xl font-bold text-white leading-tight mb-7"
          >
            Your next adventure starts with the right crew.
          </motion.h1>
          <ul className="space-y-3">
            {PERKS.map((perk, i) => (
              <motion.li
                key={perk}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                className="flex items-center gap-3 text-white/90 text-sm font-medium"
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 shrink-0">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                {perk}
              </motion.li>
            ))}
          </ul>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="relative text-white/60 text-xs"
        >
          Join thousands of backpackers already on the road.
        </motion.p>
      </div>

      {/* ── Form panel ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="lg:hidden mb-8 text-center select-none">
          <span className="font-serif text-5xl font-bold text-brand tracking-tight">
            Wandr
          </span>
          <p className="mt-2 text-sm text-gray-500 font-sans">
            Find your travel buddy
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-md bg-surface rounded-2xl shadow-sm border border-border px-8 py-10"
        >
          {children}
        </motion.div>
      </div>
    </main>
  )
}
