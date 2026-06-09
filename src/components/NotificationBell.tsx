'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  ref_id: string | null
  ref_type: string | null
  read: boolean
  created_at: string
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60)   return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

function notifLink(n: Notification) {
  if (n.ref_type === 'post') return '/dashboard'
  if (n.ref_type === 'trip') return n.ref_id ? `/trips/${n.ref_id}` : '/trips'
  return '#'
}

function TypeIcon({ type }: { type: string }) {
  if (type === 'post_like') return (
    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </div>
  )
  if (type === 'post_comment') return (
    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </div>
  )
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    </div>
  )
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen]     = useState(false)
  const dropdownRef         = useRef<HTMLDivElement>(null)
  const supabase            = createClient()

  const unread = notifications.filter(n => !n.read).length

  // Initial load
  useEffect(() => {
    supabase
      .from('notifications')
      .select('id, type, title, body, ref_id, ref_type, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setNotifications(data) })
  }, [userId])

  // Realtime: push new notifications in live
  useEffect(() => {
    const channel = supabase
      .channel(`notifs:${userId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'notifications',
        filter: `user_id=eq.${userId}`,
      }, payload => {
        setNotifications(prev => [payload.new as Notification, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  // Close dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  async function handleToggle() {
    const next = !open
    setOpen(next)
    // Mark all as read when opening
    if (next && unread > 0) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>

      {/* Bell button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
        aria-label="Notifications"
      >
        <svg
          width="20" height="20" viewBox="0 0 24 24"
          fill={unread > 0 ? '#E8520A' : 'none'}
          stroke={unread > 0 ? '#E8520A' : 'currentColor'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>

        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center px-0.5 leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-100 shadow-xl z-50 overflow-hidden">

          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unread === 0 && notifications.length > 0 && (
              <span className="text-xs text-gray-400">All caught up</span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-gray-400">No notifications yet</p>
            </div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50">
              {notifications.map(n => (
                <Link
                  key={n.id}
                  href={notifLink(n)}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition ${
                    !n.read ? 'bg-orange-50/50' : ''
                  }`}
                >
                  <TypeIcon type={n.type} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-snug">{n.title}</p>
                    {n.body && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate italic">"{n.body}"</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>

                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-brand mt-1.5 shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
