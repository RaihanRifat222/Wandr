'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { acceptBuddyRequest, declineBuddyRequest, sendBuddyRequest } from '@/lib/actions/profile'

type Status = 'none' | 'pending_sent' | 'pending_received' | 'connected'

export default function MatchActions({
  matchId,
  targetUserId,
  username,
  initialStatus,
  conversationId,
}: {
  matchId: string | null
  targetUserId: string
  username: string | null
  initialStatus: Status
  conversationId: string | null
}) {
  const [status, setStatus]   = useState<Status>(initialStatus)
  const [isPending, start]    = useTransition()
  const [error, setError]     = useState<string | null>(null)
  const router                = useRouter()

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">

        {/* ── Connected ──────────────────────────────────────── */}
        {status === 'connected' && (
          <>
            {conversationId ? (
              <Link
                href={`/messages/${conversationId}`}
                className="rounded-lg px-4 py-2 bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition"
              >
                Message
              </Link>
            ) : (
              <span className="rounded-lg px-4 py-2 bg-gray-100 text-gray-400 text-sm font-medium cursor-default">
                Connected
              </span>
            )}
            {username && (
              <Link
                href={`/profile/${username}`}
                className="rounded-lg px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
              >
                Profile
              </Link>
            )}
          </>
        )}

        {/* ── They sent me a request ─────────────────────────── */}
        {status === 'pending_received' && matchId && (
          <>
            <button
              disabled={isPending}
              onClick={() => start(async () => {
                const r = await acceptBuddyRequest(matchId)
                if (r?.error) { setError(r.error); return }
                setStatus('connected')
                router.refresh()
              })}
              className="rounded-lg px-4 py-2 bg-brand text-white text-sm font-semibold hover:brightness-95 disabled:opacity-50 transition"
            >
              {isPending ? 'Accepting…' : 'Accept'}
            </button>
            <button
              disabled={isPending}
              onClick={() => start(async () => {
                const r = await declineBuddyRequest(matchId)
                if (r?.error) { setError(r.error); return }
                router.refresh()
              })}
              className="rounded-lg px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Decline
            </button>
            {username && (
              <Link
                href={`/profile/${username}`}
                className="rounded-lg px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
              >
                Profile
              </Link>
            )}
          </>
        )}

        {/* ── I sent a request ───────────────────────────────── */}
        {status === 'pending_sent' && (
          <>
            <span className="rounded-lg px-4 py-2 text-sm text-brand/70 font-medium border border-brand/30 cursor-default">
              Request sent
            </span>
            {username && (
              <Link
                href={`/profile/${username}`}
                className="rounded-lg px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
              >
                Profile
              </Link>
            )}
          </>
        )}

        {/* ── Not connected yet ──────────────────────────────── */}
        {status === 'none' && (
          <>
            <button
              disabled={isPending}
              onClick={() => start(async () => {
                const r = await sendBuddyRequest(targetUserId)
                if (r?.error) { setError(r.error); return }
                setStatus('pending_sent')
              })}
              className="rounded-lg px-4 py-2 bg-brand text-white text-sm font-semibold hover:brightness-95 disabled:opacity-50 transition"
            >
              {isPending ? 'Sending…' : 'Connect'}
            </button>
            {username && (
              <Link
                href={`/profile/${username}`}
                className="rounded-lg px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
              >
                Profile
              </Link>
            )}
          </>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
