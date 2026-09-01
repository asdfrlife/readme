'use client'

import { useEffect, useRef, useState } from 'react'
import ePub from 'epubjs'
import { ChevronLeft, ChevronRight, Bot } from 'lucide-react'

export default function EpubViewerClient({ url, fileName }: { url: string, fileName: string }) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const [rendition, setRendition] = useState<any>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const [tooltip, setTooltip] = useState<{ x: number, y: number, text: string } | null>(null)

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

        // Optional: Set a light theme for the reader
        r.hooks.content.register((contents: any) => {
          const css = `
            body { 
              color: #1a1a1a !important; 
              background-color: #ffffff !important; 
              padding-left: 180px !important;
              padding-right: 180px !important;
              box-sizing: border-box !important;
              margin: 0 auto !important;
              max-width: 100% !important;
            }
            p, div {
              text-align: justify !important;
            }
            a { color: #8b5cf6 !important; }
          `
          contents.addStylesheetRules(css)
        })

        r.on('relocated', (location: any) => {
          setAtStart(location.atStart)
          setAtEnd(location.atEnd)
          setTooltip(null) // clear tooltip on scroll/change
          if (location.start && location.start.cfi) {
            localStorage.setItem(`epub_progress_${fileName}`, location.start.cfi)
          }
        })

        r.on('selected', (cfiRange: any, contents: any) => {
          try {
            const selection = contents.window.getSelection()
            const text = selection.toString()
            if (!text.trim()) return

            const range = selection.getRangeAt(0)
            const rect = range.getBoundingClientRect()
            
            setTooltip({
              x: rect.left + (rect.width / 2),
              y: Math.max(0, rect.top - 10), // slightly above
              text: text.trim()
            })
          } catch (e) {
            console.error("Selection error:", e)
          }
        })

        // Clear tooltip when clicking elsewhere
        r.on('click', () => {
          setTooltip(null)
        })

        const savedCfi = localStorage.getItem(`epub_progress_${fileName}`)
        if (savedCfi) {
          await r.display(savedCfi)
        } else {
          await r.display()
        }
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
    <div className="flex-1 w-full h-full bg-white relative border border-white/10 rounded-2xl overflow-hidden group flex">
      <div className="flex-1 h-full py-8 relative">
        <div ref={viewerRef} className="w-full h-full" style={{ overflowAnchor: 'none' }} />
        
        {/* Ask AI Tooltip Overlay */}
        {tooltip && (
          <div 
            className="absolute z-50 -translate-x-1/2 -translate-y-full pb-2 pointer-events-auto shadow-2xl"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <button 
              onClick={() => {
                // Placeholder action for now
                console.log("Ask AI about:", tooltip.text)
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#121212] hover:bg-[#1a1a1a] text-white text-sm rounded-lg border border-purple-500/50 transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              <Bot className="w-4 h-4 text-purple-400" />
              <span className="font-semibold tracking-wide text-xs">Ask AI</span>
            </button>
          </div>
        )}
      </div>
      
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
