'use client'

import { useEffect, useRef, useState } from 'react'
import ePub from 'epubjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function EpubViewerClient({ url }: { url: string }) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const [rendition, setRendition] = useState<any>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  useEffect(() => {
    if (!viewerRef.current) return

    let book: any = null

    const loadBook = async () => {
      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to fetch EPUB')
        const buffer = await response.arrayBuffer()
        
        book = ePub(buffer)
        
        const r = book.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          manager: 'continuous',
          flow: 'scrolled',
        })

        // Optional: Set a dark theme to match the app
        r.hooks.content.register((contents: any) => {
          const css = `
            body { 
              color: #e5e7eb !important; 
              background-color: #121212 !important; 
            }
            a { color: #c084fc !important; }
          `
          contents.addStylesheetRules(css)
        })

        r.on('relocated', (location: any) => {
          setAtStart(location.atStart)
          setAtEnd(location.atEnd)
        })

        await r.display()
        setRendition(r)
      } catch (err) {
        console.error('Error rendering EPUB:', err)
      }
    }

    loadBook()

    return () => {
      if (book) {
        book.destroy()
      }
    }
  }, [url])

  const next = () => {
    if (rendition) {
      rendition.next()
    }
  }

  const prev = () => {
    if (rendition) {
      rendition.prev()
    }
  }

  return (
    <div className="flex-1 w-full h-full bg-[#121212] relative border border-white/10 rounded-2xl overflow-hidden group">
      <div ref={viewerRef} className="w-full h-full" style={{ overflowAnchor: 'none' }} />
      
      {/* Navigation Overlays */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={prev}
          disabled={atStart}
          className="p-3 bg-black/80 hover:bg-black text-white rounded-full backdrop-blur-md border border-white/10 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="Previous Page/Chapter"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={next}
          disabled={atEnd}
          className="p-3 bg-black/80 hover:bg-black text-white rounded-full backdrop-blur-md border border-white/10 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="Next Page/Chapter"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}
