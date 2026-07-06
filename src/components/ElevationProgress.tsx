'use client'

import { useId } from 'react'
import { motion } from 'motion/react'

const RIDGE = 'M0 20 L9 11 L18 16 L28 7 L38 14 L50 6 L62 15 L74 9 L86 16 L100 5 L114 14 L128 8 L142 16 L156 10 L170 15 L184 7 L200 13 L200 20 L0 20 Z'

export default function ElevationProgress({
  progress,
  className = '',
  height = 18,
  delay = 0,
}: {
  progress: number
  className?: string
  height?: number
  delay?: number
}) {
  const id = useId()
  const pct = Math.max(0, Math.min(100, progress))

  return (
    <svg
      viewBox="0 0 200 20"
      preserveAspectRatio="none"
      className={className}
      style={{ height, width: '100%', display: 'block' }}
      aria-hidden="true"
    >
      <path d={RIDGE} fill="var(--color-gray-200)" />
      <clipPath id={`ep-clip-${id}`}>
        <motion.rect
          y="0"
          height="20"
          initial={{ width: '0%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay, ease: 'easeOut' }}
        />
      </clipPath>
      <path d={RIDGE} fill="var(--brand)" clipPath={`url(#ep-clip-${id})`} />
    </svg>
  )
}
