'use client'

import { useState, useTransition } from 'react'
import { acceptTripRequest, declineTripRequest } from '@/lib/actions/trips'

type Status = 'pending' | 'accepted' | 'declined'

export default function RequestActions({
  requestId,
  tripId,
  initialStatus,
}: {
  requestId: string
  tripId: string
  initialStatus: Status
}) {
  const [status, setStatus] = useState<Status>(initialStatus)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (status === 'accepted') {
    return (
      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Accepted
      </span>
    )
  }

  if (status === 'declined') {
    return (
      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-400">
        Declined
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const r = await acceptTripRequest(requestId, tripId)
            if (r.error) setError(r.error)
            else setStatus('accepted')
          })
        }
        className="rounded-lg px-4 py-2 bg-brand text-white text-sm font-semibold hover:brightness-95 disabled:opacity-50 transition"
      >
        Accept
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const r = await declineTripRequest(requestId, tripId)
            if (r.error) setError(r.error)
            else setStatus('declined')
          })
        }
        className="rounded-lg px-4 py-2 border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
      >
        Decline
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
