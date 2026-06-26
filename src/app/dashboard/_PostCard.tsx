'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { toggleLike, addComment, deletePost } from '@/lib/actions/posts'

// ── Types ─────────────────────────────────────────────────────────────────────

type Author = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  home_city: string | null
}

type Comment = {
  id: string
  content: string
  created_at: string
  user_id: string
  commenter: { id: string; username: string | null; full_name: string | null; avatar_url: string | null } | null
}

export type PostData = {
  id: string
  image_url: string
  media_urls: string[] | null
  caption: string | null
  created_at: string
  user_id: string
  author: Author | null
  trip: { id: string; destination: string; region: string | null } | null
  post_likes: { user_id: string }[]
  post_comments: Comment[]
}

type Props = {
  post: PostData
  currentUserId: string
  currentUserAvatar: string | null
  currentUserInitials: string
  onDeleted: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string | null, username: string | null) {
  if (name?.trim()) return name.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  return (username ?? '?')[0].toUpperCase()
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}d`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── SVG icons ─────────────────────────────────────────────────────────────────

function HeartIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#E8520A" stroke="#E8520A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {dir === 'left' ? <polyline points="15 18 9 12 15 6"/> : <polyline points="9 18 15 12 9 6"/>}
    </svg>
  )
}

function MultiIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <rect x="7" y="3" width="14" height="14" rx="2" opacity="0.7"/>
      <rect x="3" y="7" width="14" height="14" rx="2"/>
    </svg>
  )
}

function isVideo(url: string) {
  return /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url)
}

function MediaCarousel({ urls }: { urls: string[] }) {
  const [idx, setIdx] = useState(0)

  if (urls.length === 0) return null

  const cur = urls[idx]

  return (
    <div className="relative aspect-square w-full overflow-hidden bg-black">
      {isVideo(cur) ? (
        <video
          key={cur}
          src={cur}
          className="w-full h-full object-contain"
          controls
          playsInline
          preload="metadata"
        />
      ) : (
        <img
          key={cur}
          src={cur}
          alt={`Photo ${idx + 1} of ${urls.length}`}
          className="w-full h-full object-cover"
        />
      )}

      {/* Prev / Next */}
      {urls.length > 1 && (
        <>
          {idx > 0 && (
            <button
              type="button"
              onClick={() => setIdx(i => i - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
            >
              <ChevronIcon dir="left" />
            </button>
          )}
          {idx < urls.length - 1 && (
            <button
              type="button"
              onClick={() => setIdx(i => i + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
            >
              <ChevronIcon dir="right" />
            </button>
          )}

          {/* Dots */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
            {urls.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/50'}`}
              />
            ))}
          </div>

          {/* Multi-photo badge (top right) */}
          <div className="absolute top-2 right-2 pointer-events-none">
            <MultiIcon />
          </div>
        </>
      )}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PostCard({ post, currentUserId, currentUserAvatar, currentUserInitials, onDeleted }: Props) {
  const [liked,          setLiked]          = useState(() => post.post_likes.some(l => l.user_id === currentUserId))
  const [likeCount,      setLikeCount]      = useState(post.post_likes.length)
  const [comments,       setComments]       = useState<Comment[]>(post.post_comments)
  const [commentText,    setCommentText]    = useState('')
  const [showAll,        setShowAll]        = useState(false)
  const [showBurst,      setShowBurst]      = useState(false)
  const [, startTransition]                 = useTransition()
  const commentInputRef                     = useRef<HTMLInputElement>(null)
  const isOwn = post.user_id === currentUserId

  const authorName     = post.author?.full_name ?? post.author?.username ?? 'A traveller'
  const authorInitials = getInitials(post.author?.full_name ?? null, post.author?.username ?? null)
  const displayComments = showAll ? comments : comments.slice(-2)

  function handleLike() {
    const next = !liked
    setLiked(next)
    setLikeCount(c => c + (next ? 1 : -1))
    if (next) {
      setShowBurst(true)
      setTimeout(() => setShowBurst(false), 500)
    }
    startTransition(async () => {
      const r = await toggleLike(post.id)
      if (r.error) {
        setLiked(!next)
        setLikeCount(c => c + (next ? -1 : 1))
      }
    })
  }

  function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = commentText.trim()
    if (!text) return
    setCommentText('')
    startTransition(async () => {
      const r = await addComment(post.id, text)
      if (r.comment) {
        setComments(prev => [...prev, r.comment!])
        setShowAll(true)
      }
    })
  }

  function handleDelete() {
    if (!confirm('Delete this post?')) return
    startTransition(async () => {
      const r = await deletePost(post.id)
      if (!r.error) onDeleted()
    })
  }

  return (
    <article className="bg-surface border border-border rounded-xl overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={post.author?.username ? `/profile/${post.author.username}` : '#'} className="shrink-0">
          {post.author?.avatar_url ? (
            <img src={post.author.avatar_url} alt={authorName} className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand/10 text-brand font-serif font-bold flex items-center justify-center text-xs">
              {authorInitials}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              href={post.author?.username ? `/profile/${post.author.username}` : '#'}
              className="text-sm font-semibold text-gray-900 hover:underline truncate"
            >
              {authorName}
            </Link>
            {post.trip && (
              <>
                <span className="text-gray-300 text-xs">·</span>
                <Link
                  href={`/trips/${post.trip.id}`}
                  className="text-xs text-brand font-medium hover:underline flex items-center gap-1 truncate"
                >
                  <MapPinIcon /> {post.trip.destination}
                </Link>
              </>
            )}
          </div>
          {post.author?.home_city && (
            <p className="text-xs text-gray-400 truncate">{post.author.home_city}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400">{timeAgo(post.created_at)}</span>
          {isOwn && (
            <button
              onClick={handleDelete}
              className="text-gray-300 hover:text-red-400 transition text-xs font-medium"
              title="Delete post"
            >
              ···
            </button>
          )}
        </div>
      </div>

      {/* ── Media carousel ──────────────────────────────────────── */}
      <MediaCarousel
        urls={post.media_urls?.length ? post.media_urls : [post.image_url]}
      />

      {/* ── Actions row ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 pt-3 pb-1">
        <motion.button
          onClick={handleLike}
          whileTap={{ scale: 0.8 }}
          className={`relative ${liked ? 'text-brand' : 'text-gray-700 hover:text-gray-500'}`}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <HeartIcon filled={liked} />
          <AnimatePresence>
            {showBurst && (
              <motion.span
                initial={{ opacity: 0.8, scale: 0.6 }}
                animate={{ opacity: 0, scale: 1.7 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute inset-0 flex items-center justify-center text-brand pointer-events-none"
              >
                <HeartIcon filled />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
        <button
          onClick={() => commentInputRef.current?.focus()}
          className="text-gray-700 hover:text-gray-500 transition"
          aria-label="Comment"
        >
          <CommentIcon />
        </button>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="px-4 pb-1 space-y-1.5">
        {/* Like count */}
        {likeCount > 0 && (
          <p className="text-sm font-semibold text-gray-900">
            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
          </p>
        )}

        {/* Caption */}
        {post.caption && (
          <p className="text-sm text-gray-800 leading-relaxed">
            <Link
              href={post.author?.username ? `/profile/${post.author.username}` : '#'}
              className="font-semibold hover:underline mr-1.5"
            >
              {authorName}
            </Link>
            {post.caption}
          </p>
        )}

        {/* Comments */}
        {comments.length > 2 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="text-xs text-gray-400 hover:text-gray-600 transition"
          >
            View all {comments.length} comments
          </button>
        )}

        {displayComments.map(c => (
          <p key={c.id} className="text-sm text-gray-800 leading-snug">
            <Link
              href={c.commenter?.username ? `/profile/${c.commenter.username}` : '#'}
              className="font-semibold hover:underline mr-1.5"
            >
              {c.commenter?.full_name ?? c.commenter?.username ?? 'User'}
            </Link>
            {c.content}
          </p>
        ))}
      </div>

      {/* ── Comment input ────────────────────────────────────────── */}
      <form onSubmit={handleCommentSubmit} className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 mt-2">
        {currentUserAvatar ? (
          <img src={currentUserAvatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-brand/10 text-brand font-serif font-bold flex items-center justify-center text-xs shrink-0">
            {currentUserInitials}
          </div>
        )}
        <input
          ref={commentInputRef}
          type="text"
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
        />
        {commentText.trim() && (
          <button
            type="submit"
            className="text-xs font-semibold text-brand hover:brightness-90 transition shrink-0"
          >
            Post
          </button>
        )}
      </form>

    </article>
  )
}
