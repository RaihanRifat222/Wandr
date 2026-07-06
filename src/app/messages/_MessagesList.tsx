'use client'

import Link from 'next/link'
import { motion } from 'motion/react'

type Member = { id: string; full_name: string | null; username: string | null; avatar_url: string | null }

type Conversation = {
  id: string
  isGroup: boolean
  title: string | null
  other: Member | null
  members: Member[]
  lastMsg: { content: string; created_at: string; sender_id: string } | null
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function getInitials(name: string | null, username: string | null) {
  if (name?.trim()) return name.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  return (username ?? '?')[0].toUpperCase()
}

function ChatIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function GroupAvatar({ members }: { members: Member[] }) {
  const shown = members.slice(0, 2)
  return (
    <div className="relative w-11 h-11 shrink-0">
      {shown.map((m, i) => {
        const inits = getInitials(m.full_name, m.username)
        const offset = i === 0 ? 'top-0 left-0' : 'bottom-0 right-0'
        return m.avatar_url ? (
          <img
            key={m.id}
            src={m.avatar_url}
            alt={m.full_name ?? m.username ?? ''}
            className={`absolute ${offset} w-7 h-7 rounded-full object-cover ring-2 ring-surface`}
          />
        ) : (
          <div
            key={m.id}
            className={`absolute ${offset} w-7 h-7 rounded-full bg-brand/10 text-brand font-serif font-bold flex items-center justify-center text-[10px] ring-2 ring-surface`}
          >
            {inits}
          </div>
        )
      })}
    </div>
  )
}

export default function MessagesList({ currentUserId, conversations }: {
  currentUserId: string
  conversations: Conversation[]
}) {
  if (conversations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden bg-surface rounded-2xl border border-border px-6 py-20 text-center"
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-brand/5" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-brand/10" />

        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1, type: 'spring', stiffness: 200 }}
          className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand/10 text-brand mb-5"
        >
          <ChatIcon />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative text-base font-semibold text-gray-700"
        >
          No conversations yet
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28 }}
          className="relative text-sm text-gray-400 mt-1.5 max-w-sm mx-auto"
        >
          Connect with a traveller or get a trip request accepted to start messaging.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.36 }}
          className="relative flex items-center justify-center gap-3 mt-7"
        >
          <Link href="/trips">
            <motion.span
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-block rounded-lg px-5 py-2.5 bg-brand text-white text-sm font-semibold hover:brightness-95 transition"
            >
              Browse trips
            </motion.span>
          </Link>
          <Link href="/matches">
            <motion.span
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-block rounded-lg px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition"
            >
              Discover travellers
            </motion.span>
          </Link>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div className="bg-surface rounded-xl border border-border divide-y divide-gray-100 overflow-hidden">
      {conversations.map(({ id, isGroup, title, other, members, lastMsg }, i) => {
        const name = isGroup
          ? (title ?? 'Trip group chat')
          : (other?.full_name ?? other?.username ?? 'Unknown')
        const inits = getInitials(other?.full_name ?? null, other?.username ?? null)
        const subtitle = isGroup && !lastMsg
          ? members.map(m => m.full_name ?? m.username).filter(Boolean).join(', ')
          : null
        return (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
          >
            <Link href={`/messages/${id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-sand-dark transition group">
              {isGroup ? (
                <GroupAvatar members={members} />
              ) : other?.avatar_url ? (
                <img src={other.avatar_url} alt={name} className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100 shrink-0 group-hover:ring-brand/30 transition" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-brand/10 text-brand font-serif font-bold flex items-center justify-center shrink-0 text-sm">
                  {inits}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900 truncate">{name}</span>
                  {lastMsg && (
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(lastMsg.created_at)}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {subtitle ?? (lastMsg
                    ? (lastMsg.sender_id === currentUserId ? 'You: ' : '') + lastMsg.content
                    : 'No messages yet — say hello!')}
                </p>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
