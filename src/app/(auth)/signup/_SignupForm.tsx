'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUpWithEmail, signInWithGoogle } from '@/lib/actions/auth'

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

  return (
    <>
      <h2 className="text-xl font-semibold text-stone-800 mb-6">Create your account</h2>

      {state?.error && (
        <div role="alert" className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      {state?.message && (
        <div role="status" className="mb-5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
          {state.message}
        </div>
      )}

      {!state?.message && (
        <>
          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-full px-5 py-3 border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1.5">
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
                className="w-full rounded-full px-5 py-3 border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full py-3 px-5 bg-brand text-white font-medium text-sm hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed transition mt-2"
            >
              {pending ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs text-stone-400 font-medium">or</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="w-full rounded-full py-3 px-5 bg-white border border-stone-200 text-stone-700 font-medium text-sm hover:bg-stone-50 transition flex items-center justify-center gap-2.5"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-stone-500">
            Already have an account?{' '}
            <Link href="/login" className="text-brand font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </>
      )}
    </>
  )
}
