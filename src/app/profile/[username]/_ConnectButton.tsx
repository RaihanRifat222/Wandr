'use client'

import { useState, useTransition } from 'react'
import { sendBuddyRequest } from '@/lib/actions/profile'

type Status = 'none' | 'pending' | 'connected'

export default function ConnectButton({
  targetUserId,
  initialStatus,
}: {
  targetUserId: string
  initialStatus: Status
}) {
  const [status, setStatus] = useState<Status>(initialStatus)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (status === 'connected') {
    return (
      <button
        disabled
        className="w-full rounded-full py-2.5 border-2 border-stone-200 text-sm font-medium text-stone-400 cursor-default"
      >
        ✓ Connected
      </button>
    )
  }

  if (status === 'pending') {
    return (
      <button
        disabled
        className="w-full rounded-full py-2.5 border-2 border-brand/30 text-sm font-medium text-brand/60 cursor-default"
      >
        Request sent
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() =>
          startTransition(async () => {
            const result = await sendBuddyRequest(targetUserId)
            if (result?.error) setError(result.error)
            else setStatus('pending')
          })
        }
        disabled={isPending}
        className="w-full rounded-full py-2.5 bg-brand text-white text-sm font-medium hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        {isPending ? 'Sending…' : 'Connect'}
      </button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  )
}
