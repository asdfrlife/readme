'use client'

import { useEffect, useState } from 'react'
import ePub from 'epubjs'
import Image from 'next/image'
import { Image as ImageIcon } from 'lucide-react'

// Cache to prevent re-extracting the EPUB cover every time the page changes
const coverCache = new Map<string, string>()

export default function EpubThumbnailClient({ url, fileName }: Readonly<{ url: string, fileName: string }>) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let isMounted = true

    const extractCover = async () => {
      // Use fileName as the cache key because the signed URL changes on every page navigation
      if (coverCache.has(fileName)) {
        if (isMounted) {
          setCoverUrl(coverCache.get(fileName)!)
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)
        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to fetch EPUB')
        const buffer = await response.arrayBuffer()
        const book = ePub(buffer)
        
        await book.ready
        const cover = await book.coverUrl()
        
        if (isMounted) {
          if (cover) {
            coverCache.set(fileName, cover)
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
      // Intentionally not revoking the blob URL so it remains cached in memory across page loads
    }
  }, [url, fileName])

  return (
    <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center overflow-hidden relative">
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
        <Image 
          src={coverUrl} 
          alt="Book Cover"
          fill
          sizes="133px"
          className="object-cover"
          unoptimized
        />
      )}
    </div>
  )
}

