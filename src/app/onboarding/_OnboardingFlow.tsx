'use client'

import { useState, useTransition } from 'react'
import { saveOnboardingProfile } from '@/lib/actions/onboarding'

// ─── Constants ────────────────────────────────────────────────────────────────

const INTERESTS = [
  'Hiking', 'Diving', 'Street food', 'Photography', 'Nightlife',
  'Culture', 'Adventure', 'Budget travel', 'Luxury', 'Slow travel',
  'Wildlife', 'Backpacking', 'City breaks', 'Road trips', 'Volunteering',
]

const BUDGET_OPTIONS = [
  { key: 'backpacker', label: 'Backpacker', desc: 'Under €50 / day',  min: 0,   max: 50   },
  { key: 'budget',     label: 'Budget',     desc: '€50–100 / day',    min: 50,  max: 100  },
  { key: 'mid-range',  label: 'Mid-range',  desc: '€100–200 / day',   min: 100, max: 200  },
  { key: 'comfort',    label: 'Comfort',    desc: '€200+ / day',       min: 200, max: 9999 },
] as const

const SLIDERS = [
  { key: 'budget'  as const, left: 'Budget',  right: 'Luxury'      },
  { key: 'planned' as const, left: 'Planned', right: 'Spontaneous' },
  { key: 'solo'    as const, left: 'Solo',    right: 'Group'       },
  { key: 'relaxed' as const, left: 'Relaxed', right: 'Active'      },
]

const TOTAL_STEPS = 5

// ─── Types ────────────────────────────────────────────────────────────────────

type TravelStyle = { budget: number; planned: number; solo: number; relaxed: number }

type FormData = {
  homeCity: string
  bio: string
  interests: string[]
  travelStyle: TravelStyle
  budgetRange: string
}

// ─── SVG icons ────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-bold text-gray-800">Where are you based?</h2>
        <p className="mt-2 text-sm text-gray-500">This helps us find buddies near you</p>
      </div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g. Lisbon, Portugal"
        autoFocus
        className="w-full rounded-lg px-4 py-3 border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
      />
    </div>
  )
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function Step2({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const MAX = 200
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-bold text-gray-800">Tell us about yourself</h2>
        <p className="mt-2 text-sm text-gray-500">Give other travellers a feel for who you are</p>
      </div>
      <div className="relative">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value.slice(0, MAX))}
          placeholder="I'm a solo traveller who loves street food and sunrise hikes..."
          rows={4}
          autoFocus
          className="w-full rounded-lg px-4 py-3 border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition resize-none"
        />
        <span
          className={`absolute bottom-3 right-4 text-xs ${
            value.length >= MAX ? 'text-red-400' : 'text-gray-400'
          }`}
        >
          {value.length}/{MAX}
        </span>
      </div>
    </div>
  )
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────

function Step3({
  selected,
  onToggle,
}: {
  selected: string[]
  onToggle: (interest: string) => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-bold text-gray-800">What are you into?</h2>
        <p className="mt-2 text-sm text-gray-500">
          Pick at least 3 — the more you choose, the better your matches
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {INTERESTS.map(interest => {
          const active = selected.includes(interest)
          return (
            <button
              key={interest}
              type="button"
              onClick={() => onToggle(interest)}
              className={`rounded-full px-4 py-2 text-sm font-medium border transition-all ${
                active
                  ? 'bg-brand text-white border-brand shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-brand/40 hover:bg-gray-50'
              }`}
            >
              {interest}
            </button>
          )
        })}
      </div>
      {selected.length > 0 && selected.length < 3 && (
        <p className="text-xs text-amber-600 font-medium">
          Select {3 - selected.length} more to continue
        </p>
      )}
    </div>
  )
}

// ─── Step 4 ───────────────────────────────────────────────────────────────────

function Step4({
  value,
  onChange,
}: {
  value: TravelStyle
  onChange: (key: keyof TravelStyle, v: number) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-gray-800">How do you travel?</h2>
        <p className="mt-2 text-sm text-gray-500">Drag each slider to your sweet spot</p>
      </div>
      <div className="space-y-8">
        {SLIDERS.map(({ key, left, right }) => (
          <div key={key}>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-gray-600 font-medium">{left}</span>
              <span className="text-gray-600 font-medium">{right}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={value[key]}
              onChange={e => onChange(key, Number(e.target.value))}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step 5 ───────────────────────────────────────────────────────────────────

function Step5({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (key: string) => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-bold text-gray-800">
          What&apos;s your budget range?
        </h2>
        <p className="mt-2 text-sm text-gray-500">Per day, including accommodation</p>
      </div>
      <div className="space-y-3">
        {BUDGET_OPTIONS.map(opt => {
          const active = selected === opt.key
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onSelect(opt.key)}
              className={`w-full text-left rounded-lg px-5 py-4 border-2 transition-all flex items-center gap-4 ${
                active
                  ? 'border-brand bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex-1">
                <p className={`font-semibold text-sm ${active ? 'text-brand' : 'text-gray-800'}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
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
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OnboardingFlow() {
  const [step, setStep] = useState(1)
  const [visible, setVisible] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState<FormData>({
    homeCity: '',
    bio: '',
    interests: [],
    travelStyle: { budget: 50, planned: 50, solo: 50, relaxed: 50 },
    budgetRange: '',
  })

  // ── Step transition ──────────────────────────────────────────────────────

  function goTo(next: number) {
    setVisible(false)
    setError(null)
    setTimeout(() => {
      setStep(next)
      setVisible(true)
    }, 150)
  }

  const canProceed = (() => {
    if (step === 1) return formData.homeCity.trim().length > 0
    if (step === 3) return formData.interests.length >= 3
    if (step === 5) return formData.budgetRange !== ''
    return true
  })()

  // ── Data helpers ─────────────────────────────────────────────────────────

  function toggleInterest(interest: string) {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  function setSlider(key: keyof TravelStyle, val: number) {
    setFormData(prev => ({
      ...prev,
      travelStyle: { ...prev.travelStyle, [key]: val },
    }))
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  function handleFinish() {
    const opt = BUDGET_OPTIONS.find(o => o.key === formData.budgetRange)!
    startTransition(async () => {
      const result = await saveOnboardingProfile({
        homeCity: formData.homeCity,
        bio: formData.bio,
        interests: formData.interests,
        travelStyle: formData.travelStyle,
        budgetMin: opt.min,
        budgetMax: opt.max,
      })
      if (result?.error) setError(result.error)
    })
  }

  function handleNext() {
    if (!canProceed) return
    if (step < TOTAL_STEPS) goTo(step + 1)
    else handleFinish()
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-brand transition-all duration-500 ease-out"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <div className="px-8 py-10">
        {/* Step counter */}
        <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-7">
          Step {step} of {TOTAL_STEPS}
        </p>

        {/* Animated step content */}
        <div
          className={`transition-all duration-150 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          {step === 1 && (
            <Step1
              value={formData.homeCity}
              onChange={v => setFormData(p => ({ ...p, homeCity: v }))}
            />
          )}
          {step === 2 && (
            <Step2
              value={formData.bio}
              onChange={v => setFormData(p => ({ ...p, bio: v }))}
            />
          )}
          {step === 3 && (
            <Step3 selected={formData.interests} onToggle={toggleInterest} />
          )}
          {step === 4 && (
            <Step4 value={formData.travelStyle} onChange={setSlider} />
          )}
          {step === 5 && (
            <Step5
              selected={formData.budgetRange}
              onSelect={v => setFormData(p => ({ ...p, budgetRange: v }))}
            />
          )}
        </div>

        {/* Save error */}
        {error && (
          <p className="mt-5 text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            className={`text-sm text-gray-400 hover:text-gray-700 transition font-medium ${
              step === 1 ? 'invisible pointer-events-none' : ''
            }`}
          >
            Back
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed || isPending}
            className="rounded-lg px-7 py-2.5 bg-brand text-white text-sm font-semibold hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {isPending
              ? 'Saving…'
              : step === TOTAL_STEPS
              ? 'Finish'
              : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
