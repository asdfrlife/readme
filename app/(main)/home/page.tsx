import { createClient } from '@/utils/supabase/server'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { EpubThumbnail } from '@/components/EpubThumbnail'

export default async function NewHomePage() {
  const supabase = await createClient()
  
  // Fetch user
  const { data: { user } } = await supabase.auth.getUser()

  let epubFiles: any[] = []
  let signedUrls: Record<string, string> = {}

  if (user) {
    const { data: files } = await supabase.storage
      .from('files')
      .list(user.id)
    
    // Filter out standard placeholder files (like .emptyFolderPlaceholder) if they exist
    epubFiles = files ? files.filter(f => f.name.endsWith('.epub')) : []

    if (epubFiles.length > 0) {
      const paths = epubFiles.map(f => `${user.id}/${f.name}`)
      const { data: urls } = await supabase.storage.from('files').createSignedUrls(paths, 3600)
      
      if (urls) {
        urls.forEach((urlObj, idx) => {
          signedUrls[epubFiles[idx].name] = urlObj.signedUrl || ''
        })
      }
    }
  }

  return (
    <div className="min-h-full w-full flex flex-col items-center p-8 bg-black">
      {epubFiles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-2xl border border-white/20 p-10 rounded-2xl bg-white/5 backdrop-blur-md flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Nothing Imported</h1>
            <p className="text-white/60 mb-8">
              Click the + button in the sidebar to import an EPUB file.
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-[943px] flex flex-col gap-6 mt-8">
          <h2 className="text-2xl font-bold text-white mb-2">Your Imported Books</h2>
          {epubFiles.map((file) => (
            <Link 
              href={`/view?file=${encodeURIComponent(file.name)}`}
              key={file.id} 
              className="w-full h-[252px] border border-white/20 rounded-2xl bg-[#121212] flex flex-row shadow-sm hover:border-purple-500/50 hover:shadow-purple-500/10 transition-all overflow-hidden group cursor-pointer"
            >
              <EpubThumbnail url={signedUrls[file.name] || ''} />
              <div className="flex flex-col p-6 flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-6 h-6 text-purple-400" />
                  <span className="text-xl font-bold text-white truncate text-left group-hover:text-purple-300 transition-colors">
                    {file.name.replace(/^\d+_/, '')}
                  </span>
                </div>
                <p className="text-white/50 text-sm mt-auto">
                  Imported on {new Date(file.created_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
