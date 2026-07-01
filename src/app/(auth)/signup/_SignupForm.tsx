'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { signUpWithEmail, signInWithGoogle } from '@/lib/actions/auth'

const fieldVariants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }

function isWebView() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /FBAN|FBAV|Instagram|Twitter|Line|MicroMessenger|WebView|wv/.test(ua)
    || ((/iPhone|iPod|iPad/.test(ua)) && !/Safari/.test(ua))
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(signUpWithEmail, null)
  const [inWebView, setInWebView] = useState(false)
  useEffect(() => { setInWebView(isWebView()) }, [])

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Create your account</h2>

      <AnimatePresence>
        {state?.error && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600"
          >
            {state.error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {state?.message ? (
          <motion.div
            key="success"
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700"
          >
            {state.message}
          </motion.div>
        ) : (
          <motion.div key="form" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <motion.form
              action={formAction}
              className="space-y-4"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
            >
              <motion.div variants={fieldVariants}>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-lg px-4 py-3 border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
                />
              </motion.div>

              <motion.div variants={fieldVariants}>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  className="w-full rounded-lg px-4 py-3 border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
                />
              </motion.div>

              <motion.button
                type="submit"
                disabled={pending}
                variants={fieldVariants}
                whileHover={pending ? undefined : { scale: 1.01 }}
                whileTap={pending ? undefined : { scale: 0.98 }}
                className="w-full rounded-lg py-3 px-5 bg-brand text-white font-semibold text-sm hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed transition mt-2"
              >
                {pending ? 'Creating account…' : 'Create account'}
              </motion.button>
            </motion.form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {inWebView ? (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                <p className="font-semibold mb-1">Open in your browser to use Google sign-in</p>
                <p className="text-amber-700 text-xs">Google doesn&apos;t allow sign-in from in-app browsers (e.g. Facebook, Instagram). Tap the menu and choose <strong>&quot;Open in Chrome&quot;</strong> or <strong>&quot;Open in Safari&quot;</strong>.</p>
              </div>
            ) : (
              <form action={signInWithGoogle}>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-lg py-3 px-5 bg-surface border border-border text-gray-700 font-medium text-sm hover:bg-sand-dark transition flex items-center justify-center gap-2.5"
                >
                  <GoogleIcon />
                  Continue with Google
                </motion.button>
              </form>
            )}

            <p className="mt-7 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-brand font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
