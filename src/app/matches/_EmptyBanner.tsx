'use client'

import { motion } from 'motion/react'

export default function EmptyBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-surface rounded-xl border border-border px-6 py-10 text-center"
    >
      <p className="text-sm font-semibold text-gray-500">No connections yet</p>
      <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
        Browse trips and send join requests, or connect directly with travellers below.
      </p>
    </motion.div>
  )
}
