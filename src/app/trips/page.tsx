import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import TripCards from './_TripCards'

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <TripCards trips={(trips ?? []) as any} requestedIds={requestedIds} userId={user.id} />
      </main>
    </div>
  )
}
