/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { FileText } from 'lucide-react'
import { EpubThumbnail } from '@/components/EpubThumbnail'
import { DeleteBookButton } from '@/components/DeleteBookButton'
import { parseBookFilename } from '@/utils/bookFormat'

export function ClientBookList({ 
  initialFiles, 
  initialUrls 
}: Readonly<{ 
  initialFiles: any[], 
  initialUrls: Record<string, string> 
}>) {
  const [files, setFiles] = useState(initialFiles)
  const [urls, setUrls] = useState(initialUrls)

  const [supabase] = useState(() => createClient())

  useEffect(() => {
    const handleBookUploaded = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: rawFiles } = await supabase.storage
        .from('files')
        .list(user.id)
      
      const newEpubFiles = rawFiles ? rawFiles.filter(f => f.name.toLowerCase().endsWith('.epub') || f.name.toLowerCase().endsWith('.pdf')) : []

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
            Click the + button in the sidebar to import a book.
          </p>
        </div>
      </div>
    )
  }

  // Group files by category
  const groupedFiles = files.reduce((acc, file) => {
    const { category } = parseBookFilename(file.name)
    if (!acc[category]) acc[category] = []
    acc[category].push(file)
    return acc
  }, {} as Record<string, typeof files>)

  return (
    <div className="w-full max-w-[943px] flex flex-col gap-8 mt-8 pb-12">
      {(Object.entries(groupedFiles) as [string, any[]][]).map(([category, categoryFiles]) => (
        <div key={category} className="flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-white/10 pb-2">
            <div className="w-2 h-6 bg-purple-500 rounded-full" />
            <h2 className="text-2xl font-bold text-white">{category}</h2>
            <span className="text-white/40 text-sm font-medium bg-white/5 px-2 py-0.5 rounded-md">
              {categoryFiles.length}
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {categoryFiles.map((file) => {
              const { displayName } = parseBookFilename(file.name)
              return (
                <Link 
                  href={`/view?file=${encodeURIComponent(file.name)}`}
                  key={file.id} 
                  className="relative w-full h-auto sm:h-[252px] border border-white/20 rounded-2xl bg-[#121212] flex flex-col sm:flex-row shadow-sm hover:border-purple-500/50 hover:shadow-purple-500/10 transition-all overflow-hidden group cursor-pointer"
                >
                  {file.name.toLowerCase().endsWith('.pdf') ? (
                    <div className="w-full h-[200px] sm:w-[133px] sm:h-[252px] bg-white/5 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-white/10 flex-shrink-0 relative overflow-hidden">
                      <Image src="/pdf-icon.jpg" alt="PDF" fill sizes="133px" className="object-cover" />
                    </div>
                  ) : (
                    <EpubThumbnail url={urls[file.name] || ''} fileName={file.name} />
                  )}
                  <div className="flex flex-col p-6 flex-1 relative">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-6 h-6 text-purple-400" />
                      <span className="text-xl font-bold text-white truncate text-left group-hover:text-purple-300 transition-colors pr-12">
                        {displayName}
                      </span>
                    </div>
                    <p className="text-white/50 text-sm mt-auto">
                      Imported on {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <DeleteBookButton fileName={file.name} />
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
