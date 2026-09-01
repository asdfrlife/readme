import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { EpubViewer } from '@/components/EpubViewer'

export default async function ViewPage(props: {
  searchParams: Promise<{ file?: string }>
}) {
  const searchParams = await props.searchParams
  const fileName = searchParams.file

  if (!fileName) {
    redirect('/home')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  const { data: signedUrlData, error } = await supabase.storage
    .from('files')
    .createSignedUrl(`${user.id}/${fileName}`, 3600)

  if (error || !signedUrlData) {
    return (
      <div className="min-h-full w-full flex flex-col items-center justify-center p-8 bg-black">
        <div className="w-full max-w-2xl border border-white/20 p-10 rounded-2xl bg-white/5 backdrop-blur-md flex flex-col items-center text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Error Loading EPUB</h1>
          <p className="text-white/60 mb-8">
            Could not retrieve the file. It may have been deleted or the link expired.
          </p>
          <Link 
            href="/home"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          >
            Go Back
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col p-6 bg-black overflow-hidden">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <Link 
          href="/home"
          className="flex items-center text-white/60 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-xl font-bold text-white truncate max-w-lg">
          {fileName.replace(/^\d+_/, '')}
        </h1>
        <div className="w-24" /> {/* Spacer for centering title */}
      </div>

      <div className="flex-1 w-full overflow-hidden flex justify-center">
        <div className="h-full aspect-[1/1.414] max-w-full">
          <EpubViewer url={signedUrlData.signedUrl} />
        </div>
      </div>
    </div>
  )
}
