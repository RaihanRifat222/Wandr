'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react'

type Props = {
  children: ReactNode
  className?: string
  /** Max tilt in degrees. */
  max?: number
}

function useTiltRotation(value: MotionValue<number>, max: number, invert = false) {
  return useTransform(value, [-0.5, 0.5], invert ? [max, -max] : [-max, max])
}

export default function TiltCard({ children, className, max = 8 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const px = useMotionValue(0)
  const py = useMotionValue(0)

  const rotateXRaw = useTiltRotation(py, max, true)
  const rotateYRaw = useTiltRotation(px, max)
  const rotateX = useSpring(rotateXRaw, { stiffness: 300, damping: 25 })
  const rotateY = useSpring(rotateYRaw, { stiffness: 300, damping: 25 })

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el || e.pointerType === 'touch') return
    const rect = el.getBoundingClientRect()
    px.set((e.clientX - rect.left) / rect.width - 0.5)
    py.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  function handlePointerLeave() {
    px.set(0)
    py.set(0)
  }

  return (
    <motion.div
      ref={ref}
      style={{ perspective: 900 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div className={className} style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}>
        {children}
      </motion.div>
    </motion.div>
  )
}
