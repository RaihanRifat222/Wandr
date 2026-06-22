import OpenAI from 'openai'

// Server-only — never import this in client components.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── Profile text ──────────────────────────────────────────────────────────────
// Converts a profile into a short paragraph the embedding model can understand.
// Keep it consistent — changing this format invalidates all stored embeddings.

type ProfileInput = {
  interests?:       string[]
  travel_style?:    Record<string, number>
  budget_min?:      number | null
  bio?:             string | null
  tagline?:         string | null
  looking_for?:     string | null
  home_city?:       string | null
  languages_spoken?: string[]
  countries_visited?: number | null
}

const BUDGET_LABEL: Record<number, string> = {
  0:   'backpacker ($0–50/day)',
  50:  'budget ($50–100/day)',
  100: 'mid-range ($100–200/day)',
  200: 'comfort ($200+/day)',
}

function styleLabel(key: string, val: number): string {
  const map: Record<string, [string, string]> = {
    budget:  ['budget-focused',  'luxury-focused'],
    planned: ['likes planning',  'spontaneous'],
    solo:    ['prefers solo',    'prefers group travel'],
    relaxed: ['relaxed pace',    'active pace'],
  }
  const [low, high] = map[key] ?? [key, key]
  if (val < 35) return low
  if (val > 65) return high
  return `balanced ${low.split(' ')[0]}/${high.split(' ')[0]}`
}

export function buildProfileText(p: ProfileInput): string {
  const lines: string[] = []

  if (p.interests?.length)
    lines.push(`Travel interests: ${p.interests.join(', ')}`)

  const style = p.travel_style ?? {}
  const styleDesc = (['budget', 'planned', 'solo', 'relaxed'] as const)
    .filter(k => style[k] != null)
    .map(k => styleLabel(k, style[k]))
  if (styleDesc.length)
    lines.push(`Travel style: ${styleDesc.join(', ')}`)

  const budgetLabel = p.budget_min != null ? BUDGET_LABEL[p.budget_min] : null
  if (budgetLabel)
    lines.push(`Budget: ${budgetLabel}`)

  if (p.home_city)
    lines.push(`Home city: ${p.home_city}`)

  if (p.bio?.trim())
    lines.push(`About: ${p.bio.trim()}`)

  if (p.tagline?.trim())
    lines.push(`Travel vibe: ${p.tagline.trim()}`)

  if (p.looking_for?.trim())
    lines.push(`Looking for: ${p.looking_for.trim()}`)

  if (p.languages_spoken?.length)
    lines.push(`Languages: ${p.languages_spoken.join(', ')}`)

  if (p.countries_visited != null)
    lines.push(`Countries visited: ${p.countries_visited}`)

  return lines.join('\n')
}

// ── OpenAI call ───────────────────────────────────────────────────────────────

export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8_000), // well within the 8192 token limit
  })
  return res.data[0].embedding
}

// ── Similarity ────────────────────────────────────────────────────────────────
// OpenAI normalises embeddings to unit vectors so dot product = cosine similarity.

export function cosineSim(a: number[], b: number[]): number {
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return dot // range: -1 to 1, typically 0.5–0.99 for similar profiles
}
