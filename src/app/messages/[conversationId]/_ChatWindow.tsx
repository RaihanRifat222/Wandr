'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/lib/actions/messages'

type Message = {
  id: string
  content: string
  created_at: string
  sender_id: string
}

type OtherUser = {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
}

function getInitials(name: string | null, username: string | null) {
  if (name?.trim()) return name.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  return (username ?? '?')[0].toUpperCase()
}

function fmtTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function fmtDay(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ChatWindow({
  conversationId,
  initialMessages,
  userId,
  other,
}: {
  conversationId: string
  initialMessages: Message[]
  userId: string
  other: OtherUser
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: messages.length > initialMessages.length ? 'smooth' : 'instant' })
  }, [messages])

  // Realtime — subscribe to new messages in this conversation
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages(prev =>
            prev.find(m => m.id === payload.new.id)
              ? prev
              : [...prev, payload.new as Message]
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return

    setInput('')
    setSending(true)
    const result = await sendMessage(conversationId, text)
    setSending(false)

    if (result?.error) {
      setInput(text) // restore on failure
    }
    // Realtime subscription picks up the new message automatically
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Group messages by day
  type Day = { label: string; messages: Message[] }
  const days: Day[] = []
  for (const msg of messages) {
    const label = fmtDay(msg.created_at)
    const last = days[days.length - 1]
    if (last?.label === label) last.messages.push(msg)
    else days.push({ label, messages: [msg] })
  }

  const otherInitials = getInitials(other.full_name, other.username)

  return (
    <div className="flex flex-col h-full">

      {/* ── Messages ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-10">
            No messages yet. Say hello!
          </p>
        )}

        {days.map(({ label, messages: dayMsgs }) => (
          <div key={label} className="space-y-3">
            {/* Day divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest shrink-0">
                {label}
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {dayMsgs.map((msg, i) => {
              const isMe = msg.sender_id === userId
              const prevMsg = dayMsgs[i - 1]
              const isFirst = !prevMsg || prevMsg.sender_id !== msg.sender_id

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Other person's avatar — only on first bubble in a group */}
                  {!isMe && (
                    <div className={`w-7 h-7 shrink-0 ${isFirst ? 'opacity-100' : 'opacity-0'}`}>
                      {other.avatar_url ? (
                        <img src={other.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center font-serif">
                          {otherInitials}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                        isMe
                          ? 'bg-brand text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {/* Timestamp on last message in group */}
                    {(i === dayMsgs.length - 1 || dayMsgs[i + 1]?.sender_id !== msg.sender_id) && (
                      <span className="text-[10px] text-gray-400 mt-1 px-1">
                        {fmtTime(msg.created_at)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ─────────────────────────────────────────────────── */}
      <div className="border-t border-border bg-surface px-4 py-3">
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message…"
            rows={1}
            disabled={sending}
            className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition max-h-32 disabled:opacity-50"
            style={{ lineHeight: '1.5' }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="rounded-xl px-4 py-2.5 bg-brand text-white text-sm font-semibold hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
          >
            {sending ? '…' : 'Send'}
          </button>
        </div>
        <p className="text-[10px] text-gray-300 mt-1.5 text-right">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
