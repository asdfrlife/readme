import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, BookOpen } from 'lucide-react'
import { EpubViewer } from '@/components/EpubViewer'
import { ResizableViewerWrapper } from '@/components/ResizableViewerWrapper'

export default async function ViewPage(props: {
  searchParams: Promise<{ file?: string }>
}) {
  const searchParams = await props.searchParams
  const fileName = searchParams.file

  if (!fileName) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-black">
        <div className="w-full max-w-2xl border border-white/20 p-10 rounded-2xl bg-white/5 backdrop-blur-md flex flex-col items-center text-center">
          <BookOpen className="w-12 h-12 text-white/40 mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">No Book Selected</h1>
          <p className="text-white/60 mb-8">
            Please go to your dashboard and select a book to start reading.
          </p>
          <Link 
            href="/home"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
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
      <ResizableViewerWrapper fileName={fileName}>
        <div className="flex flex-col w-full h-full">
          <h1 className="text-2xl font-bold text-white truncate w-full mb-4 px-2 tracking-tight">
            {fileName.replace(/^\d+_/, '')}
          </h1>
          <EpubViewer url={signedUrlData.signedUrl} fileName={fileName} />
        </div>
      </ResizableViewerWrapper>
    </div>
  )
}
