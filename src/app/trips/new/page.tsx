import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import CreateTripForm from './_CreateTripForm'

export default async function NewTripPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/dashboard" className="hover:text-gray-700 transition">Feed</Link>
          <span>›</span>
          <span className="text-gray-600 font-medium">New trip</span>
        </div>
        <CreateTripForm />
      </main>
    </>
  )
}
