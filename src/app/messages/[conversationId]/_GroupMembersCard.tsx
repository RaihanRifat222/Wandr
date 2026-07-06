'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'

type Member = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

function getInitials(name: string | null, username: string | null) {
  if (name?.trim()) return name.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  return (username ?? '?')[0].toUpperCase()
}

export default function GroupMembersCard({
  title,
  subtitle,
  members,
  currentUserId,
}: {
  title: string
  subtitle: string | null
  members: Member[]
  currentUserId: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  return (
    <div className="relative flex-1 min-w-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex-1 min-w-0 text-left group"
      >
        <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-brand transition-colors">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-400 truncate">{subtitle}</p>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-72 bg-surface rounded-xl border border-border shadow-xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{members.length} {members.length === 1 ? 'person' : 'people'}</p>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {members.map(m => {
                const isMe = m.id === currentUserId
                const name = m.full_name ?? m.username ?? 'Unknown'
                const inits = getInitials(m.full_name, m.username)

                const row = (
                  <div className="flex items-center gap-3 px-4 py-3">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-brand/10 text-brand font-serif font-bold flex items-center justify-center text-xs shrink-0">
                        {inits}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {name}{isMe ? ' (You)' : ''}
                    </span>
                  </div>
                )

                return m.username ? (
                  <Link
                    key={m.id}
                    href={`/profile/${m.username}`}
                    onClick={() => setOpen(false)}
                    className="block hover:bg-gray-50 transition"
                  >
                    {row}
                  </Link>
                ) : (
                  <div key={m.id}>{row}</div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
