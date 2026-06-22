'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Conv = {
  id: string
  other: { id: string; username: string | null; full_name: string | null; avatar_url: string | null } | null
  lastMsg: { content: string; created_at: string; sender_id: string; read_at: string | null } | null
  unread: number
}

function getInitials(name: string | null, username: string | null) {
  if (name?.trim()) return name.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  return (username ?? '?')[0].toUpperCase()
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60)    return 'now'
  if (s < 3600)  return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

export default function MessagesButton({ userId }: { userId: string }) {
  const [convs, setConvs]   = useState<Conv[]>([])
  const [open, setOpen]     = useState(false)
  const dropdownRef         = useRef<HTMLDivElement>(null)
  const supabase            = createClient()

  const totalUnread = convs.reduce((n, c) => n + c.unread, 0)

  async function load() {
    const { data } = await supabase
      .from('conversations')
      .select(`
        id, participant_a, participant_b,
        pa:profiles!participant_a(id, username, full_name, avatar_url),
        pb:profiles!participant_b(id, username, full_name, avatar_url),
        messages(id, content, created_at, sender_id, read_at)
      `)
      .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)

    if (!data) return

    const processed: Conv[] = data.map((c: any) => {
      const other = c.participant_a === userId ? c.pb : c.pa
      const msgs  = [...(c.messages ?? [])].sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      return {
        id:      c.id,
        other,
        lastMsg: msgs[0] ?? null,
        unread:  msgs.filter((m: any) => m.sender_id !== userId && !m.read_at).length,
      }
    })

    processed.sort((a, b) => {
      if (!a.lastMsg) return 1
      if (!b.lastMsg) return -1
      return new Date(b.lastMsg.created_at).getTime() - new Date(a.lastMsg.created_at).getTime()
    })

    setConvs(processed.slice(0, 6))
  }

  useEffect(() => { load() }, [userId])

  // Realtime: reload on any new message
  useEffect(() => {
    const ch = supabase
      .channel(`msgs-btn:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [userId])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleOpen() {
    const next = !open
    setOpen(next)
    // Optimistically clear badge when opening
    if (next && totalUnread > 0) {
      setConvs(prev => prev.map(c => ({ ...c, unread: 0 })))
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>

      {/* Icon button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
        aria-label="Messages"
      >
        <svg
          width="20" height="20" viewBox="0 0 24 24"
          fill={totalUnread > 0 ? '#E8520A' : 'none'}
          stroke={totalUnread > 0 ? '#E8520A' : 'currentColor'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {totalUnread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center px-0.5 leading-none">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-surface rounded-xl border border-border shadow-xl z-50 overflow-hidden">

          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Messages</h3>
          </div>

          {convs.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-400">No conversations yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {convs.map(c => {
                const name    = c.other?.full_name ?? c.other?.username ?? 'Unknown'
                const inits   = getInitials(c.other?.full_name ?? null, c.other?.username ?? null)
                const isUnread = c.unread > 0

                return (
                  <Link
                    key={c.id}
                    href={`/messages/${c.id}`}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition ${isUnread ? 'bg-orange-50/40' : ''}`}
                  >
                    {c.other?.avatar_url ? (
                      <img src={c.other.avatar_url} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-brand/10 text-brand font-serif font-bold flex items-center justify-center text-xs shrink-0">
                        {inits}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-sm truncate ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {name}
                        </span>
                        {c.lastMsg && (
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {timeAgo(c.lastMsg.created_at)}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${isUnread ? 'font-medium text-gray-700' : 'text-gray-400'}`}>
                        {c.lastMsg
                          ? (c.lastMsg.sender_id === userId ? 'You: ' : '') + c.lastMsg.content
                          : 'No messages yet'}
                      </p>
                    </div>

                    {isUnread && (
                      <div className="w-2 h-2 rounded-full bg-brand shrink-0" />
                    )}
                  </Link>
                )
              })}
            </div>
          )}

          <div className="border-t border-gray-100 px-4 py-2.5">
            <Link
              href="/messages"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-brand hover:underline"
            >
              See all messages
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
