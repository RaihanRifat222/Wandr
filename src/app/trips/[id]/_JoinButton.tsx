'use client'

import { useState, useTransition } from 'react'
import { motion } from 'motion/react'
import { requestToJoin } from '@/lib/actions/trips'

export default function JoinButton({ tripId }: { tripId: string }) {
  const [requested, setRequested] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (requested) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
        Request sent — the host will review your profile and get back to you.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <motion.button
        type="button"
        disabled={isPending}
        whileHover={isPending ? undefined : { scale: 1.02 }}
        whileTap={isPending ? undefined : { scale: 0.97 }}
        onClick={() =>
          startTransition(async () => {
            const r = await requestToJoin(tripId)
            if (r.error) setError(r.error)
            else setRequested(true)
          })
        }
        className="rounded-lg px-6 py-3 bg-brand text-white text-sm font-semibold hover:brightness-95 disabled:opacity-50 transition shadow-sm"
      >
        {isPending ? 'Sending request…' : 'Request to join'}
      </motion.button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
