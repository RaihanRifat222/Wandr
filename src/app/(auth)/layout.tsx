import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center select-none">
        <span className="font-serif text-5xl font-bold text-brand tracking-tight">
          Wandr
        </span>
        <p className="mt-2 text-sm text-gray-500 font-sans">
          Find your travel buddy
        </p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-10">
        {children}
      </div>
    </main>
  )
}
