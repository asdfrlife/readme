import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ReadingCalendar } from '@/components/ReadingCalendar'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  return (
    <div className="min-h-full w-full flex flex-col items-center p-4 md:p-8 bg-black">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
          <div className="flex justify-center w-full">
            <ReadingCalendar />
          </div>
        </div>

        {/* TODO: More dashboard widgets (streaks, stats, recommendations, etc.) go here */}
        <div className="w-full border border-dashed border-white/20 rounded-2xl p-10 flex flex-col items-center justify-center bg-white/5">
          <p className="text-white/40 font-medium">
            Additional dashboard widgets will appear here...
          </p>
        </div>
      </div>
    </div>
  )
}
