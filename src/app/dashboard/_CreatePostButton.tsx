'use client'

import { useState, useRef, useTransition } from 'react'
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

export default function CreatePostButton({ userTrips, avatarUrl, initials, userId }: Props) {
  const [open,        setOpen]        = useState(false)
  const [file,        setFile]        = useState<File | null>(null)
  const [preview,     setPreview]     = useState<string | null>(null)
  const [caption,     setCaption]     = useState('')
  const [tripId,      setTripId]      = useState('')
  const [uploading,   setUploading]   = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [, startTransition]           = useTransition()
  const fileInputRef                  = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 10 * 1024 * 1024) { setError('Image must be under 10 MB'); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { setError('Please drop an image file'); return }
    if (f.size > 10 * 1024 * 1024) { setError('Image must be under 10 MB'); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
  }

  function close() {
    setOpen(false)
    setFile(null)
    setPreview(null)
    setCaption('')
    setTripId('')
    setError(null)
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Please select an image'); return }
    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(path, file, { upsert: false })

      if (uploadError) throw new Error(uploadError.message)

      const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(path)

      startTransition(async () => {
        const result = await createPost({
          imageUrl: publicUrl,
          caption:  caption.trim() || null,
          tripId:   tripId || null,
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
              <button
                onClick={close}
                className="text-gray-400 hover:text-gray-700 transition text-lg leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-4">

                {/* Image upload */}
                {preview ? (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full aspect-square object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => { setFile(null); setPreview(null) }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-sm hover:bg-black/80 transition"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-xl py-12 cursor-pointer hover:border-brand/40 hover:bg-orange-50/30 transition"
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                    </svg>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">Click to upload</p>
                      <p className="text-xs text-gray-400 mt-0.5">or drag and drop — JPG, PNG, WebP · max 10 MB</p>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
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
                  disabled={!file || uploading}
                  className="flex-1 rounded-lg py-2.5 bg-brand text-white text-sm font-semibold hover:brightness-95 disabled:opacity-50 transition"
                >
                  {uploading ? 'Sharing…' : 'Share post'}
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
