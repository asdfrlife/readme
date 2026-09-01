'use client'

import { useEffect, useState } from 'react'
import ePub from 'epubjs'
import { Image as ImageIcon } from 'lucide-react'

export default function EpubThumbnailClient({ url }: { url: string }) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let isMounted = true
    let extractedUrl: string | null = null

    const extractCover = async () => {
      try {
        setLoading(true)
        const book = ePub(url)
        
        await book.ready
        const cover = await book.coverUrl()
        
        if (isMounted) {
          if (cover) {
            extractedUrl = cover
            setCoverUrl(cover)
          } else {
            setError(true)
          }
          setLoading(false)
        }
      } catch (err) {
        console.error('Error extracting EPUB cover:', err)
        if (isMounted) {
          setError(true)
          setLoading(false)
        }
      }
    }

    extractCover()

    return () => {
      isMounted = false
      if (extractedUrl && extractedUrl.startsWith('blob:')) {
        URL.revokeObjectURL(extractedUrl)
      }
    }
  }, [url])

  return (
    <div className="w-[133px] h-[252px] bg-white/5 flex flex-col items-center justify-center overflow-hidden flex-shrink-0 relative border-r border-white/10">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {!loading && error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 text-white/40">
          <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-[10px] uppercase font-bold tracking-wider">No Cover</span>
        </div>
      )}
      {!loading && coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src={coverUrl} 
          alt="Book Cover"
          className="w-full h-full object-cover"
        />
      )}
    </div>
  )
}
