'use client'

import { motion } from 'motion/react'
import MatchActions from './_MatchActions'

type Profile = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  home_city: string | null
  bio: string | null
  interests: string[]
  budget_min: number | null
}

function budgetLabel(min: number | null) {
  if (min == null) return null
  if (min === 0)   return 'Backpacker'
  if (min === 50)  return 'Budget'
  if (min === 100) return 'Mid-range'
  return 'Comfort'
}

function getInitials(name: string | null, username: string | null) {
  if (name?.trim()) return name.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  return (username ?? '?')[0].toUpperCase()
}

function compatibilityColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 65) return 'bg-brand'
  if (score >= 50) return 'bg-amber-400'
  return 'bg-gray-300'
}

function compatibilityLabel(score: number): string {
  if (score >= 80) return 'Great match'
  if (score >= 65) return 'Good match'
  if (score >= 50) return 'Some overlap'
  return 'Different styles'
}

export default function UserCard({
  profile,
  sharedInterests,
  score,
  matchId,
  matchStatus,
  conversationId,
  index = 0,
}: {
  profile: Profile
  sharedInterests: string[]
  score?: number
  matchId: string | null
  matchStatus: 'none' | 'pending_sent' | 'pending_received' | 'connected'
  conversationId: string | null
  index?: number
}) {
  const name     = profile.full_name ?? profile.username ?? 'Unknown'
  const initials = getInitials(profile.full_name, profile.username)
  const budget   = budgetLabel(profile.budget_min)
  const showBar  = score != null && score > 0 && matchStatus === 'none'

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 12) * 0.04 }}
      whileHover={{ y: -3 }}
      className="bg-surface rounded-xl border border-border p-5 flex flex-col gap-4 hover:shadow-md hover:border-brand/20 transition"
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-brand/10 text-brand font-serif font-bold flex items-center justify-center shrink-0 text-sm">
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{name}</span>
            {budget && (
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-orange-50 text-brand border border-brand/20">
                {budget}
              </span>
            )}
            {/* Score badge for connected/pending (DB score) */}
            {score != null && score > 0 && matchStatus !== 'none' && (
              <span className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 ml-auto shrink-0">
                {score}%
              </span>
            )}
          </div>
          {profile.home_city && (
            <p className="text-xs text-gray-400 mt-0.5">{profile.home_city}</p>
          )}
        </div>
      </div>

      {/* Compatibility bar — shown only on Discover cards with an embedding score */}
      {showBar && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{compatibilityLabel(score!)}</span>
            <span className="text-xs font-bold text-gray-700">{score}% compatible</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${compatibilityColor(score!)}`}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.6, delay: Math.min(index, 12) * 0.04 + 0.2, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Bio */}
      {profile.bio && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{profile.bio}</p>
      )}

      {/* Shared interests */}
      {sharedInterests.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sharedInterests.slice(0, 4).map(i => (
            <span key={i} className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-brand/10 text-brand">
              {i}
            </span>
          ))}
          {sharedInterests.length > 4 && (
            <span className="text-xs text-gray-400 self-center">+{sharedInterests.length - 4} more</span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <MatchActions
        matchId={matchId}
        targetUserId={profile.id}
        username={profile.username}
        initialStatus={matchStatus}
        conversationId={conversationId}
      />
    </motion.div>
  )
}
