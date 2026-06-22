import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import TripsBrowser from './_TripsBrowser'
import TripsSidebar from './_TripsSidebar'

export default async function BrowseTripsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const [{ data: trips }, { data: myRequests }] = await Promise.all([
    supabase
      .from('trips')
      .select(`
        id, destination, region, start_date, end_date,
        group_size, budget_estimate, description, created_at,
        host:profiles!host_id ( id, username, full_name, avatar_url, home_city )
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('trip_requests')
      .select('trip_id')
      .eq('requester_id', user.id),
  ])

  const requestedIds = (myRequests ?? []).map(r => r.trip_id as string)

  const regionCounts = Object.entries(
    (trips ?? []).reduce<Record<string, number>>((acc, t) => {
      const region = t.region ?? 'Other'
      acc[region] = (acc[region] ?? 0) + 1
      return acc
    }, {})
  )
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
        <TripsBrowser trips={(trips ?? []) as any} requestedIds={requestedIds} userId={user.id} />
        <div className="hidden lg:block">
          <TripsSidebar regionCounts={regionCounts} totalTrips={trips?.length ?? 0} />
        </div>
      </main>
    </div>
  )
}
