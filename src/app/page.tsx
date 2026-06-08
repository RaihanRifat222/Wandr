import { redirect } from 'next/navigation'

// The proxy (src/proxy.ts) handles the redirect at the edge.
// This fallback handles any case where the proxy doesn't run.
export default function RootPage() {
  redirect('/login')
}
