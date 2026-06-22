'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import PostCard, { type PostData } from './_PostCard'

type Props = {
  posts: PostData[]
  currentUserId: string
  currentUserAvatar: string | null
  currentUserInitials: string
}

export default function PostsFeed({ posts, currentUserId, currentUserAvatar, currentUserInitials }: Props) {
  const [items, setItems] = useState(posts)

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-surface rounded-xl border border-border px-6 py-16 text-center"
      >
        <p className="text-sm font-semibold text-gray-500">No posts yet</p>
        <p className="text-xs text-gray-400 mt-1">Be the first to share a travel moment.</p>
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      {items.map((post, i) => (
        <motion.div
          key={post.id}
          layout
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
        >
          <PostCard
            post={post}
            currentUserId={currentUserId}
            currentUserAvatar={currentUserAvatar}
            currentUserInitials={currentUserInitials}
            onDeleted={() => setItems(prev => prev.filter(p => p.id !== post.id))}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  )
}
