'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { EpubThumbnail } from '@/components/EpubThumbnail'
import { DeleteBookButton } from '@/components/DeleteBookButton'
import { createClient } from '@/utils/supabase/client'

export function ClientBookList({ 
  initialFiles, 
  initialUrls 
}: { 
  initialFiles: any[], 
  initialUrls: Record<string, string> 
}) {
  const [files, setFiles] = useState(initialFiles)
  const [urls, setUrls] = useState(initialUrls)

  useEffect(() => {
    const handleBookUploaded = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: rawFiles } = await supabase.storage
        .from('files')
        .list(user.id)
      
      const newEpubFiles = rawFiles ? rawFiles.filter(f => f.name.endsWith('.epub')) : []

      if (newEpubFiles.length > 0) {
        const paths = newEpubFiles.map(f => `${user.id}/${f.name}`)
        const { data: urlData } = await supabase.storage.from('files').createSignedUrls(paths, 3600)
        
        const newUrls: Record<string, string> = {}
        if (urlData) {
          urlData.forEach((urlObj, idx) => {
            newUrls[newEpubFiles[idx].name] = urlObj.signedUrl || ''
          })
        }
        setUrls(newUrls)
      }
      setFiles(newEpubFiles)
    }

    window.addEventListener('book_uploaded', handleBookUploaded)
    return () => window.removeEventListener('book_uploaded', handleBookUploaded)
  }, [])

  if (files.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl border border-white/20 p-10 rounded-2xl bg-white/5 backdrop-blur-md flex flex-col items-center text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Nothing Imported</h1>
          <p className="text-white/60 mb-8">
            Click the + button in the sidebar to import an EPUB file.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[943px] flex flex-col gap-6 mt-8">
      <h2 className="text-2xl font-bold text-white mb-2">Your Imported Books</h2>
      {files.map((file) => (
        <Link 
          href={`/view?file=${encodeURIComponent(file.name)}`}
          key={file.id} 
          className="relative w-full h-[252px] border border-white/20 rounded-2xl bg-[#121212] flex flex-row shadow-sm hover:border-purple-500/50 hover:shadow-purple-500/10 transition-all overflow-hidden group cursor-pointer"
        >
          <EpubThumbnail url={urls[file.name] || ''} />
          <div className="flex flex-col p-6 flex-1 relative">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-purple-400" />
              <span className="text-xl font-bold text-white truncate text-left group-hover:text-purple-300 transition-colors pr-12">
                {file.name.replace(/^\d+_/, '')}
              </span>
            </div>
            <p className="text-white/50 text-sm mt-auto">
              Imported on {new Date(file.created_at).toLocaleDateString()}
            </p>
          </div>
          <DeleteBookButton fileName={file.name} />
        </Link>
      ))}
    </div>
  )
}
