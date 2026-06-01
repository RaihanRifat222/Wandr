'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateProfile, checkUsernameAvailable } from '@/lib/actions/profile'

// ── Constants ─────────────────────────────────────────────────────────────────

const INTERESTS = [
  'Hiking', 'Diving', 'Street food', 'Photography', 'Nightlife',
  'Culture', 'Adventure', 'Budget travel', 'Luxury', 'Slow travel',
  'Wildlife', 'Backpacking', 'City breaks', 'Road trips', 'Volunteering',
]

const BUDGET_OPTIONS = [
  { key: 'backpacker', emoji: '🎒', label: 'Backpacker', desc: 'Under €50 / day',  min: 0,   max: 50   },
  { key: 'budget',     emoji: '🌿', label: 'Budget',     desc: '€50–100 / day',    min: 50,  max: 100  },
  { key: 'mid-range',  emoji: '✈️', label: 'Mid-range',  desc: '€100–200 / day',   min: 100, max: 200  },
  { key: 'comfort',    emoji: '🥂', label: 'Comfort',    desc: '€200+ / day',       min: 200, max: 9999 },
] as const

const SLIDERS = [
  { key: 'budget'  as const, leftEmoji: '💰', left: 'Budget',  rightEmoji: '🥂', right: 'Luxury'      },
  { key: 'planned' as const, leftEmoji: '📋', left: 'Planned', rightEmoji: '🎲', right: 'Spontaneous' },
  { key: 'solo'    as const, leftEmoji: '🧍', left: 'Solo',    rightEmoji: '👥', right: 'Group'       },
  { key: 'relaxed' as const, leftEmoji: '🛋️', left: 'Relaxed', rightEmoji: '🏃', right: 'Active'      },
]

type TravelStyle = { budget: number; planned: number; solo: number; relaxed: number }

// ── Helpers ───────────────────────────────────────────────────────────────────

function getBudgetKey(min: number | null): string {
  if (min === 0)   return 'backpacker'
  if (min === 50)  return 'budget'
  if (min === 100) return 'mid-range'
  if (min === 200) return 'comfort'
  return ''
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-6 space-y-5">
      <h2 className="font-serif text-lg font-bold text-stone-800">{title}</h2>
      {children}
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ProfileRow = {
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  home_city: string | null
  travel_style: Record<string, number>
  interests: string[]
  budget_min: number | null
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EditProfileForm({
  profile,
  userId,
}: {
  profile: ProfileRow
  userId: string
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState(false)

  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [username, setUsername] = useState(profile.username ?? '')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle')
  const [usernameMsg, setUsernameMsg] = useState('')
  const [homeCity, setHomeCity] = useState(profile.home_city ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [interests, setInterests] = useState<string[]>(profile.interests ?? [])
  const [travelStyle, setTravelStyle] = useState<TravelStyle>({
    budget: 50, planned: 50, solo: 50, relaxed: 50,
    ...profile.travel_style,
  })
  const [budgetKey, setBudgetKey] = useState(getBudgetKey(profile.budget_min))

  const initials = (() => {
    if (fullName.trim()) return fullName.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    if (username.trim()) return username.trim()[0].toUpperCase()
    return '?'
  })()

  const BIO_MAX = 200

  // ── Avatar upload ─────────────────────────────────────────────────────────

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(data.publicUrl)

      await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl, updated_at: new Date().toISOString() })
        .eq('id', userId)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  // ── Username availability check ───────────────────────────────────────────

  async function handleUsernameBlur() {
    const val = username.toLowerCase().trim()
    if (!val || val === profile.username) {
      setUsernameStatus('idle')
      return
    }
    setUsernameStatus('checking')
    const { available, message } = await checkUsernameAvailable(val)
    if (available) {
      setUsernameStatus('ok')
      setUsernameMsg('')
    } else {
      setUsernameStatus('error')
      setUsernameMsg(message ?? 'Not available')
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  function handleSave() {
    const trimmedUsername = username.toLowerCase().trim()
    if (!trimmedUsername) { setError('Username is required'); return }
    if (usernameStatus === 'error') return

    const opt = BUDGET_OPTIONS.find(o => o.key === budgetKey)
    if (!opt) { setError('Please select a budget range'); return }

    setError(null)
    startTransition(async () => {
      const result = await updateProfile({
        fullName,
        username: trimmedUsername,
        homeCity,
        bio,
        interests,
        travelStyle,
        budgetMin: opt.min,
        budgetMax: opt.max,
      })

      if ('error' in result) {
        setError(result.error)
      } else {
        setToast(true)
        setTimeout(() => {
          setToast(false)
          router.push(`/profile/${result.username}`)
        }, 1400)
      }
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-10">

      {/* ── Avatar ──────────────────────────────────────────────────────── */}
      <Section title="Avatar">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="relative shrink-0 group"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-stone-100 group-hover:opacity-75 transition"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand/10 text-brand flex items-center justify-center text-2xl font-bold font-serif group-hover:bg-brand/20 transition">
                {initials}
              </div>
            )}
            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <span className="text-xs font-medium bg-black/50 text-white rounded-full px-2 py-0.5">
                {uploading ? '…' : 'Change'}
              </span>
            </span>
          </button>
          <div>
            <p className="text-sm text-stone-700 font-medium">
              {uploading ? 'Uploading…' : 'Click to upload a new photo'}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">JPG, PNG, WebP — max 5 MB</p>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </Section>

      {/* ── Basic info ──────────────────────────────────────────────────── */}
      <Section title="Basic info">
        <div className="space-y-4">

          <label className="block">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">
              Display name
            </span>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-full px-5 py-3 border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">
              Username
            </span>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 text-sm pointer-events-none">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={e => {
                  setUsername(e.target.value)
                  setUsernameStatus('idle')
                }}
                onBlur={handleUsernameBlur}
                placeholder="yourname"
                className={`w-full rounded-full pl-9 pr-5 py-3 border bg-stone-50 text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 transition ${
                  usernameStatus === 'error'
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-300'
                    : usernameStatus === 'ok'
                    ? 'border-emerald-300 focus:ring-emerald-200 focus:border-emerald-300'
                    : 'border-stone-200 focus:ring-brand focus:border-brand'
                }`}
              />
            </div>
            {usernameStatus === 'error'    && <p className="text-xs text-red-500 mt-1 ml-2">{usernameMsg}</p>}
            {usernameStatus === 'ok'       && <p className="text-xs text-emerald-600 mt-1 ml-2">✓ Available</p>}
            {usernameStatus === 'checking' && <p className="text-xs text-stone-400 mt-1 ml-2">Checking…</p>}
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">
              Home city
            </span>
            <input
              type="text"
              value={homeCity}
              onChange={e => setHomeCity(e.target.value)}
              placeholder="e.g. Lisbon, Portugal"
              className="w-full rounded-full px-5 py-3 border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5 block">
              Bio
            </span>
            <div className="relative">
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value.slice(0, BIO_MAX))}
                placeholder="Tell travellers about yourself…"
                rows={4}
                className="w-full rounded-2xl px-5 py-4 border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition resize-none"
              />
              <span
                className={`absolute bottom-3 right-4 text-xs ${
                  bio.length >= BIO_MAX ? 'text-red-400' : 'text-stone-400'
                }`}
              >
                {bio.length}/{BIO_MAX}
              </span>
            </div>
          </label>

        </div>
      </Section>

      {/* ── Interests ───────────────────────────────────────────────────── */}
      <Section title="Interests">
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map(interest => {
            const active = interests.includes(interest)
            return (
              <button
                key={interest}
                type="button"
                onClick={() =>
                  setInterests(prev =>
                    prev.includes(interest)
                      ? prev.filter(i => i !== interest)
                      : [...prev, interest]
                  )
                }
                className={`rounded-full px-4 py-2 text-sm font-medium border transition-all ${
                  active
                    ? 'bg-brand text-white border-brand shadow-sm'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-brand/40'
                }`}
              >
                {interest}
              </button>
            )
          })}
        </div>
      </Section>

      {/* ── Travel style ────────────────────────────────────────────────── */}
      <Section title="Travel style">
        <div className="space-y-8">
          {SLIDERS.map(({ key, leftEmoji, left, rightEmoji, right }) => (
            <div key={key}>
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-stone-600 font-medium">{leftEmoji} {left}</span>
                <span className="text-stone-600 font-medium">{right} {rightEmoji}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={travelStyle[key]}
                onChange={e =>
                  setTravelStyle(prev => ({ ...prev, [key]: Number(e.target.value) }))
                }
              />
            </div>
          ))}
        </div>
      </Section>

      {/* ── Budget range ────────────────────────────────────────────────── */}
      <Section title="Budget range">
        <div className="space-y-3">
          {BUDGET_OPTIONS.map(opt => {
            const active = budgetKey === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setBudgetKey(opt.key)}
                className={`w-full text-left rounded-xl px-5 py-4 border-2 transition-all flex items-center gap-4 ${
                  active
                    ? 'border-brand bg-orange-50'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <span className="text-2xl leading-none">{opt.emoji}</span>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${active ? 'text-brand' : 'text-stone-800'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">{opt.desc}</p>
                </div>
                {active && (
                  <span className="text-brand ml-auto shrink-0">
                    <CheckIcon />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </Section>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── Save button ─────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || usernameStatus === 'error' || uploading}
        className="w-full rounded-full py-3 bg-brand text-white font-medium hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isPending ? 'Saving…' : 'Save changes'}
      </button>

      {/* ── Success toast ────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="rounded-xl bg-emerald-600 text-white px-6 py-3 text-sm font-medium shadow-lg">
            ✓ Profile saved!
          </div>
        </div>
      )}
    </div>
  )
}
