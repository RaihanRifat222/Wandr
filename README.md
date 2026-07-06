# Wandr — Find Your Travel Buddy

A social platform for backpackers and travellers to find compatible travel buddies, post trips, get AI-matched with compatible people, and plan trips together.

## Features

### Auth & Profiles
- Email/password and Google OAuth sign-in
- 5-step onboarding (home city, bio, interests, travel style sliders, budget range)
- Public profile pages with favourite travel moment, posts grid, and stats
- Profile editing

### Social feed
- Post travel photos/videos with captions, tagged to a trip
- Likes and comments
- Feed ranked per-user by profile-embedding similarity (OpenAI `text-embedding-3-small` + cosine similarity), interest overlap, travel-style proximity, and recency

### Trips
- Post a trip: destination, region, dates, budget tier, group size, description
- Browse trips as a swipeable card deck, filterable by region
- Semantic trip search ("laid-back hiking buddy for a slow Southeast Asia trip") via vector embeddings
- Trip detail page with a host approve/decline panel for join requests

### Matching
- AI-scored compatibility between travellers (destination overlap, dates, budget, travel style, shared interests)
- Discover/connect flow with buddy requests

### Messaging
- Real-time 1:1 chat (Supabase Realtime)
- **Group chats per trip** — accepting a join request adds that person to one shared group conversation with the host and everyone else already accepted, instead of a separate 1:1 thread
- Click a group chat's name to see the full member list and jump to anyone's profile
- Markdown rendering in messages (bold, lists, links, tables, code)

### Wandr AI — trip-planning assistant
- Mention `@wandr` in any group chat to get trip-aware suggestions, itineraries, and logistics help
- Has full context of the trip (destination, dates, budget, notes) and the conversation history
- Posts as a real "Wandr AI" member of the chat, with its own avatar
- Powered by OpenAI (`gpt-4o-mini`)

### Notifications
- In-app notifications for buddy requests, trip requests/acceptances, messages, likes, and comments
- Unread badges on the navbar messages and notifications icons

### Design
- "Trailhead" visual identity — warm, light, topographic-map inspired (see `CLAUDE.md` for the full palette/design system)
- 3D cursor-tilt trip and match cards, elevation-profile progress bars, spring-animated interactions throughout

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Supabase** — Postgres, Auth, Realtime, Storage, Row Level Security
- **Tailwind CSS**
- **OpenAI** — embeddings for match/search ranking, `gpt-4o-mini` for the group-chat trip assistant
- **Framer Motion** for animation

See `CLAUDE.md` for the detailed design system, database schema notes, and progress checklist.

## Getting Started

1. Copy `.env.local.example` (or create `.env.local`) with:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
2. Run the SQL files in `supabase/` (in order: `schema.sql`, `trip_search_embeddings.sql`, `group_chats.sql`) via the Supabase SQL Editor.
3. Install dependencies and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

Demo data can be seeded via the scripts in `scripts/` (see `CLAUDE.md` for seed account credentials).
