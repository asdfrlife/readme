import { createClient } from '@/utils/supabase/server'
import { FileText } from 'lucide-react'

export default async function NewHomePage() {
  const supabase = await createClient()
  
  // Fetch user
  const { data: { user } } = await supabase.auth.getUser()

  let epubFiles: any[] = []
  if (user) {
    const { data: files } = await supabase.storage
      .from('pdffiles')
      .list(user.id)
    
    // Filter out standard placeholder files (like .emptyFolderPlaceholder) if they exist
    epubFiles = files ? files.filter(f => f.name.endsWith('.epub')) : []
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
        <div className="w-full max-w-[943px] flex flex-col gap-4 mt-8">
          <h2 className="text-2xl font-bold text-white mb-6">Your Imported Books</h2>
          {epubFiles.map((file) => (
            <div 
              key={file.id} 
              className="w-full border border-white/20 p-6 rounded-2xl bg-[#121212] flex flex-col shadow-sm"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-white/70" />
                <span className="text-lg font-medium text-white truncate text-left">
                  {/* Remove the timestamp prefix if needed, or just display raw name */}
                  {file.name.replace(/^\d+_/, '')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
