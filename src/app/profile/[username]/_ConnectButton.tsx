'use client'

import { useState, useTransition } from 'react'
import { motion } from 'motion/react'
import { sendBuddyRequest, acceptBuddyRequest } from '@/lib/actions/profile'
import type { MatchStatus } from './page'

export default function ConnectButton({
  targetUserId,
  matchStatus: initialStatus,
  matchId: initialMatchId,
}: {
  targetUserId: string
  matchStatus: MatchStatus
  matchId: string | null
}) {
  const [status, setStatus] = useState<MatchStatus>(initialStatus)
  const [matchId, setMatchId] = useState<string | null>(initialMatchId)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Connected — no action button needed (Message button is on the parent)
  if (status === 'connected') {
    return (
      <div className="rounded-lg py-2.5 border border-gray-200 text-sm font-medium text-gray-400 text-center cursor-default">
        Connected
      </div>
    )
  }

  // They sent me a request — show Accept / Decline
  if (status === 'pending_received' && matchId) {
    return (
      <div className="space-y-2">
        <motion.button
          whileHover={isPending ? undefined : { scale: 1.02 }}
          whileTap={isPending ? undefined : { scale: 0.97 }}
          onClick={() =>
            startTransition(async () => {
              const r = await acceptBuddyRequest(matchId)
              if (r?.error) setError(r.error)
              else setStatus('connected')
            })
          }
          disabled={isPending}
          className="w-full rounded-lg py-2.5 bg-brand text-white text-sm font-semibold hover:brightness-95 disabled:opacity-60 transition"
        >
          {isPending ? 'Accepting…' : 'Accept request'}
        </motion.button>
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
      </div>
    )
  }

  // I sent them a request — waiting
  if (status === 'pending_sent') {
    return (
      <div className="rounded-lg py-2.5 border-2 border-brand/30 text-sm font-medium text-brand/60 text-center cursor-default">
        Request sent
      </div>
    )
  }

  // No connection yet — show Connect
  return (
    <div className="space-y-2">
      <motion.button
        whileHover={isPending ? undefined : { scale: 1.02 }}
        whileTap={isPending ? undefined : { scale: 0.97 }}
        onClick={() =>
          startTransition(async () => {
            const r = await sendBuddyRequest(targetUserId)
            if (r?.error) setError(r.error)
            else setStatus('pending_sent')
          })
        }
        disabled={isPending}
        className="w-full rounded-lg py-2.5 bg-brand text-white text-sm font-semibold hover:brightness-95 disabled:opacity-60 transition"
      >
        {isPending ? 'Sending…' : 'Connect'}
      </motion.button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  )
}
