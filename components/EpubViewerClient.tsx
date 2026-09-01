'use client'

import { useEffect, useRef } from 'react'
import ePub from 'epubjs'

export default function EpubViewerClient({ url }: { url: string }) {
  const viewerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!viewerRef.current) return

    let book: any = null

    const loadBook = async () => {
      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to fetch EPUB')
        const buffer = await response.arrayBuffer()
        
        book = ePub(buffer)
        
        const rendition = book.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          manager: 'continuous',
          flow: 'scrolled-doc',
        })

        // Optional: Set a dark theme to match the app
        rendition.hooks.content.register((contents: any) => {
          const css = `
            body { 
              color: #e5e7eb !important; 
              background-color: #121212 !important; 
            }
            a { color: #c084fc !important; }
          `
          contents.addStylesheetRules(css)
        })

        rendition.display()
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

  return (
    <div className="flex-1 w-full h-full bg-[#121212] relative border border-white/10 rounded-2xl">
      <div ref={viewerRef} className="w-full h-full overflow-y-auto" />
    </div>
  )
}
