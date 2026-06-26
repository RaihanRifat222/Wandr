'use client'

import { useState, useRef, useTransition, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { createClient } from '@/lib/supabase/client'
import { createPost } from '@/lib/actions/posts'

type Trip = { id: string; destination: string }

type Props = {
  userTrips: Trip[]
  avatarUrl: string | null
  initials: string
  userId: string
}

type MediaFile = {
  file: File
  preview: string
  isVideo: boolean
}

const MAX_FILES    = 10
const MAX_IMG_SIZE = 20 * 1024 * 1024   // 20 MB
const MAX_VID_SIZE = 200 * 1024 * 1024  // 200 MB

function isVideoFile(file: File) {
  return file.type.startsWith('video/')
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function PhotoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
    </svg>
  )
}

function VideoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="0" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  )
}

function AddIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreatePostButton({ userTrips, avatarUrl, initials, userId }: Props) {
  const [open,       setOpen]       = useState(false)
  const [media,      setMedia]      = useState<MediaFile[]>([])
  const [active,     setActive]     = useState(0)
  const [caption,    setCaption]    = useState('')
  const [tripId,     setTripId]     = useState('')
  const [uploading,  setUploading]  = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [, startTransition]         = useTransition()
  const fileInputRef                = useRef<HTMLInputElement>(null)

  function addFiles(files: FileList | File[]) {
    const remaining = MAX_FILES - media.length
    if (remaining <= 0) { setError(`Maximum ${MAX_FILES} files per post`); return }

    const toAdd: MediaFile[] = []
    for (const f of Array.from(files).slice(0, remaining)) {
      const vid = isVideoFile(f)
      if (!vid && !f.type.startsWith('image/')) { setError('Only images and videos are supported'); continue }
      const limit = vid ? MAX_VID_SIZE : MAX_IMG_SIZE
      if (f.size > limit) { setError(`${vid ? 'Video' : 'Image'} must be under ${vid ? '200' : '20'} MB`); continue }
      toAdd.push({ file: f, preview: URL.createObjectURL(f), isVideo: vid })
    }

    if (toAdd.length) {
      setMedia(prev => {
        const next = [...prev, ...toAdd]
        setActive(next.length - 1)
        return next
      })
      setError(null)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files)
    e.target.value = ''
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
  }, [media])

  function removeMedia(i: number) {
    setMedia(prev => {
      const next = prev.filter((_, idx) => idx !== i)
      setActive(Math.min(active, Math.max(0, next.length - 1)))
      return next
    })
  }

  function close() {
    media.forEach(m => URL.revokeObjectURL(m.preview))
    setOpen(false)
    setMedia([])
    setActive(0)
    setCaption('')
    setTripId('')
    setError(null)
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!media.length) { setError('Add at least one photo or video'); return }
    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Upload all files in parallel
      const urls = await Promise.all(
        media.map(async ({ file }) => {
          const ext  = file.name.split('.').pop() ?? 'bin'
          const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('posts')
            .upload(path, file, { upsert: false })
          if (uploadError) throw new Error(uploadError.message)
          return supabase.storage.from('posts').getPublicUrl(path).data.publicUrl
        })
      )

      startTransition(async () => {
        const result = await createPost({
          mediaUrls: urls,
          caption:   caption.trim() || null,
          tripId:    tripId || null,
        })
        if (result.error) {
          setError(result.error)
          setUploading(false)
        } else {
          close()
        }
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploading(false)
    }
  }

  const cur = media[active]

  return (
    <>
      {/* ── Trigger ──────────────────────────────────────────────── */}
      <motion.div
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-brand/10 text-brand font-serif font-bold flex items-center justify-center text-xs shrink-0">
            {initials}
          </div>
        )}
        <span className="flex-1 text-sm text-gray-400 select-none">Share a travel moment…</span>
        <span className="rounded-lg px-4 py-1.5 bg-brand text-white text-xs font-semibold shrink-0">Post</span>
      </motion.div>

      {/* ── Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-surface rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 text-sm">New Post</h2>
                <button onClick={close} className="text-gray-400 hover:text-gray-700 transition text-xl leading-none">×</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="p-5 space-y-4">

                  {/* ── Media area ───────────────────────────────── */}
                  {media.length === 0 ? (
                    // Empty drop zone
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={e => e.preventDefault()}
                      className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-xl py-12 cursor-pointer hover:border-brand/40 hover:bg-orange-50/30 transition"
                    >
                      <PhotoIcon />
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">Click or drag to upload</p>
                        <p className="text-xs text-gray-400 mt-0.5">Photos (JPG, PNG, WebP, GIF) &amp; Videos (MP4, MOV) · up to {MAX_FILES} files</p>
                      </div>
                    </div>
                  ) : (
                    // Preview of active media
                    <div className="space-y-3">
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black">
                        {cur?.isVideo ? (
                          <video
                            src={cur.preview}
                            className="w-full h-full object-contain"
                            controls
                            playsInline
                          />
                        ) : (
                          <img
                            src={cur?.preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        )}
                        {/* Remove current */}
                        <button
                          type="button"
                          onClick={() => removeMedia(active)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-sm hover:bg-black/80 transition"
                        >
                          ×
                        </button>
                        {/* Slide counter */}
                        {media.length > 1 && (
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {media.map((_, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setActive(i)}
                                className={`w-1.5 h-1.5 rounded-full transition ${i === active ? 'bg-white' : 'bg-white/50'}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Thumbnail strip */}
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {media.map((m, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setActive(i)}
                            className={`relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition ${
                              i === active ? 'border-brand' : 'border-transparent'
                            }`}
                          >
                            {m.isVideo ? (
                              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                <VideoIcon />
                              </div>
                            ) : (
                              <img src={m.preview} alt="" className="w-full h-full object-cover" />
                            )}
                          </button>
                        ))}

                        {/* Add more button */}
                        {media.length < MAX_FILES && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="shrink-0 w-14 h-14 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-brand/40 hover:text-brand transition"
                          >
                            <AddIcon />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {/* Caption */}
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">
                      Caption
                    </label>
                    <textarea
                      value={caption}
                      onChange={e => setCaption(e.target.value.slice(0, 300))}
                      placeholder="Write a caption…"
                      rows={3}
                      className="w-full rounded-lg px-4 py-3 border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none transition"
                    />
                    <p className="text-right text-xs text-gray-300 mt-1">{caption.length}/300</p>
                  </div>

                  {/* Tag a trip */}
                  {userTrips.length > 0 && (
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">
                        Tag a trip (optional)
                      </label>
                      <select
                        value={tripId}
                        onChange={e => setTripId(e.target.value)}
                        className="w-full rounded-lg px-4 py-3 border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
                      >
                        <option value="">No trip tagged</option>
                        {userTrips.map(t => (
                          <option key={t.id} value={t.id}>{t.destination}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {error && (
                    <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-5 pb-5">
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 rounded-lg py-2.5 border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!media.length || uploading}
                    className="flex-1 rounded-lg py-2.5 bg-brand text-white text-sm font-semibold hover:brightness-95 disabled:opacity-50 transition"
                  >
                    {uploading
                      ? `Uploading ${media.length > 1 ? `${media.length} files` : ''}…`
                      : `Share post${media.length > 1 ? ` (${media.length})` : ''}`}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
