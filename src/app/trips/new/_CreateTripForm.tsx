'use client'

import { useActionState, useRef, useState } from 'react'
import { createTrip } from '@/lib/actions/trips'

const REGIONS = ['Europe', 'Asia', 'Americas', 'Africa', 'Oceania', 'Middle East']

const BUDGET_OPTIONS = [
  { key: 'backpacker', label: 'Backpacker', desc: '< €50 / day' },
  { key: 'budget',     label: 'Budget',     desc: '€50–100 / day' },
  { key: 'mid-range',  label: 'Mid-range',  desc: '€100–200 / day' },
  { key: 'comfort',    label: 'Comfort',    desc: '€200+ / day' },
]

const MAX_DESC = 500

function SectionLabel({ text }: { text: string }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
      {text}
    </p>
  )
}

export default function CreateTripForm() {
  const [state, dispatch, isPending] = useActionState(createTrip, null)

  // Uncontrolled number input — browser owns the value; ref lets +/− buttons drive it
  const buddiesRef = useRef<HTMLInputElement>(null)
  const [buddiesDisplay, setBuddiesDisplay] = useState(1)

  function stepBuddies(dir: 1 | -1) {
    const input = buddiesRef.current
    if (!input) return
    if (dir === 1) input.stepUp()
    else input.stepDown()
    const next = Number(input.value)
    setBuddiesDisplay(next)
  }

  const [descLen, setDescLen] = useState(0)

  return (
    <form action={dispatch}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden px-8 pt-8 pb-7"
          style={{ background: 'linear-gradient(135deg, #E8520A 0%, #f97316 55%, #fb923c 100%)' }}
        >
          {/* Geometric accents */}
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-12 -bottom-10 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
          <h1 className="font-serif text-2xl font-bold text-white">Post a Trip</h1>
          <p className="text-orange-100 text-sm mt-1">Share your plans and find your perfect travel buddy</p>
        </div>

        <div className="px-8 py-8 space-y-8">

          {/* ── Destination ───────────────────────────────────────────── */}
          <section className="space-y-3">
            <SectionLabel text="Destination" />

            <input
              type="text"
              name="destination"
              required
              placeholder="e.g. Bali, Indonesia"
              autoFocus
              className="w-full rounded-lg px-4 py-3 border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
            />

            <div>
              <p className="text-xs text-gray-400 font-medium mb-2">Region (optional)</p>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map(r => (
                  <label key={r} className="cursor-pointer">
                    <input type="radio" name="region" value={r} className="sr-only peer" />
                    <span className="inline-block rounded-full px-4 py-1.5 text-xs font-medium border transition-all select-none cursor-pointer bg-white text-gray-600 border-gray-200 hover:border-gray-300 peer-checked:bg-brand peer-checked:text-white peer-checked:border-brand peer-checked:shadow-sm">
                      {r}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <div className="border-t border-gray-100" />

          {/* ── Dates ─────────────────────────────────────────────────── */}
          <section className="space-y-3">
            <SectionLabel text="Dates" />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">From</label>
                <input
                  type="date"
                  name="start_date"
                  className="w-full rounded-lg px-4 py-2.5 border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">To</label>
                <input
                  type="date"
                  name="end_date"
                  className="w-full rounded-lg px-4 py-2.5 border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
                />
              </div>
            </div>
          </section>

          <div className="border-t border-gray-100" />

          {/* ── Buddies wanted ────────────────────────────────────────── */}
          <section className="space-y-3">
            <SectionLabel text="Travel buddies wanted" />

            {/*
              Uncontrolled number input — the browser owns and displays the value.
              stepUp/stepDown update the DOM directly; buddiesDisplay mirrors it for the label.
            */}
            <div className="flex items-center gap-5">
              <button
                type="button"
                aria-label="decrease"
                onClick={() => stepBuddies(-1)}
                className="w-10 h-10 rounded-lg border-2 border-gray-200 text-gray-600 text-xl font-bold hover:border-brand hover:text-brand transition-colors flex items-center justify-center select-none"
              >
                −
              </button>

              <div className="flex flex-col items-center min-w-[5rem]">
                <input
                  ref={buddiesRef}
                  type="number"
                  name="buddies_wanted"
                  defaultValue={1}
                  min={1}
                  max={9}
                  readOnly
                  className="w-16 text-center font-serif text-4xl font-bold text-gray-900 bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-xs text-gray-400 -mt-1">
                  {buddiesDisplay === 1 ? 'buddy' : 'buddies'}
                </p>
              </div>

              <button
                type="button"
                aria-label="increase"
                onClick={() => stepBuddies(1)}
                className="w-10 h-10 rounded-lg border-2 border-gray-200 text-gray-600 text-xl font-bold hover:border-brand hover:text-brand transition-colors flex items-center justify-center select-none"
              >
                +
              </button>
            </div>
          </section>

          <div className="border-t border-gray-100" />

          {/* ── Budget ────────────────────────────────────────────────── */}
          <section className="space-y-3">
            <SectionLabel text="Budget per day (optional)" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BUDGET_OPTIONS.map(opt => (
                <label key={opt.key} className="cursor-pointer block">
                  <input
                    type="radio"
                    name="budget_tier"
                    value={opt.key}
                    className="sr-only peer"
                  />
                  <div className="text-left rounded-xl px-4 py-3.5 border-2 transition-all select-none cursor-pointer border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 peer-checked:border-brand peer-checked:bg-orange-50">
                    <p className="font-semibold text-xs leading-snug text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <div className="border-t border-gray-100" />

          {/* ── Description ───────────────────────────────────────────── */}
          <section className="space-y-3">
            <SectionLabel text="Description (optional)" />

            <div className="relative">
              <textarea
                name="description"
                maxLength={MAX_DESC}
                onChange={e => setDescLen(e.target.value.length)}
                placeholder="What's the vibe? What do you want to do? Any requirements for your travel buddy?"
                rows={4}
                className="w-full rounded-lg px-4 py-3 border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition resize-none"
              />
              <span className={`absolute bottom-3 right-4 text-xs pointer-events-none ${descLen >= MAX_DESC ? 'text-red-400' : 'text-gray-400'}`}>
                {descLen}/{MAX_DESC}
              </span>
            </div>
          </section>

          {/* ── Error ─────────────────────────────────────────────────── */}
          {state?.error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">{state.error}</p>
          )}

          {/* ── Actions ───────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 pt-1">
            <a
              href="/dashboard"
              className="rounded-lg px-6 py-3 text-sm font-medium text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700 transition"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg py-3 bg-brand text-white text-sm font-semibold hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
            >
              {isPending ? 'Posting…' : 'Post trip'}
            </button>
          </div>

        </div>
      </div>
    </form>
  )
}
