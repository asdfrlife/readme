/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useRef, useState } from 'react'
import ePub from 'epubjs'
import { ChevronLeft, ChevronRight, Bot, PenLine } from 'lucide-react'
import { ReflectionModal } from './ReflectionModal'

export default function EpubViewerClient({ url, fileName }: Readonly<{ url: string, fileName: string }>) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const [rendition, setRendition] = useState<any>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const [tooltip, setTooltip] = useState<{ x: number, y: number, text: string } | null>(null)
  const [reflectionQuote, setReflectionQuote] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!viewerRef.current) return

    let book: any = null
    let isMounted = true

    const loadBook = async () => {
      try {
        setErrorMsg(null)
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Failed to fetch EPUB: ${response.statusText}`)
        const buffer = await response.arrayBuffer()
        
        if (!isMounted) return

        book = ePub(buffer)
        
        const r = book.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          manager: 'continuous',
          flow: 'scrolled',
        })

        // Optional: Set a light theme for the reader
        r.hooks.content.register((contents: any) => {
          try {
            const css = `
              body { 
                color: #1a1a1a !important; 
                background-color: #ffffff !important; 
                padding-left: 8% !important;
                padding-right: 8% !important;
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
          } catch (e: any) {
            console.error("Stylesheet error:", e)
          }
        })

        r.on('relocated', (location: any) => {
          setAtStart(location.atStart)
          setAtEnd(location.atEnd)
          setTooltip(null) // clear tooltip on scroll/change
          if (location.start?.cfi) {
            localStorage.setItem(`epub_progress_${fileName}`, location.start.cfi)
          }
        })

        r.on('selected', (cfiRange: any, contents: any) => {
          try {
            const selection = contents.window.getSelection()
            const text = selection.toString()
            if (!text.trim()) return

            const range = selection.getRangeAt(0)
            const clientRects = range.getClientRects()
            if (clientRects.length === 0) return
            
            // Get the EXACT starting rectangle (first line/word) of the selection
            const firstRect = clientRects[0]
            
            const iframe = contents.document.defaultView?.frameElement
            const iframeRect = iframe ? iframe.getBoundingClientRect() : { left: 0, top: 0 }
            const containerRect = viewerRef.current?.getBoundingClientRect() || { left: 0, top: 0 }
            
            const absoluteLeft = firstRect.left + iframeRect.left - containerRect.left
            const absoluteTop = firstRect.top + iframeRect.top - containerRect.top
            
            setTooltip({
              x: absoluteLeft, // starting point of the selection
              y: absoluteTop, // above the starting point
              text: text.trim()
            })
          } catch (e) {
            console.error("Selection error:", e)
          }
        })

        // Clear tooltip when selection is cleared
        r.on('unselected', () => {
          setTooltip(null)
        })
        
        // Fallback clear when clicking elsewhere
        r.on('click', () => {
          setTooltip(null)
        })

        const savedCfi = localStorage.getItem(`epub_progress_${fileName}`)
        if (savedCfi) {
          await r.display(savedCfi)
        } else {
          await r.display()
        }
        
        if (isMounted) {
          setRendition(r)
        }
      } catch (err: any) {
        console.error('Error rendering EPUB:', err)
        if (isMounted) setErrorMsg(err.message || 'Unknown error occurred')
      }
    }

    loadBook()

    return () => {
      isMounted = false
      if (book) {
        try {
          book.destroy()
        } catch {}
      }
    }
  }, [url, fileName])

  const next = () => {
    if (rendition) rendition.next()
  }

  const prev = () => {
    if (rendition) rendition.prev()
  }

  return (
    <div className="flex-1 w-full h-full bg-white relative border border-white/10 rounded-2xl overflow-hidden group flex">
      <div className="flex-1 h-full py-8 relative">
        {errorMsg && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 z-50">
            <div className="bg-red-500 text-white p-4 rounded-xl shadow-lg max-w-[80%] text-center">
              <h3 className="font-bold mb-2">Error Loading Book</h3>
              <p className="font-mono text-sm">{errorMsg}</p>
            </div>
          </div>
        )}
        
        <div ref={viewerRef} className="w-full h-full" style={{ overflowAnchor: 'none' }} />
        
        {/* Ask AI Tooltip Overlay */}
        {tooltip && !errorMsg && (
          <div 
            className="absolute z-50 -translate-y-full pb-1 pointer-events-auto flex items-center gap-2 shadow-2xl"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('ask-ai', { detail: tooltip.text }))
                setTooltip(null)
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#121212] hover:bg-[#1a1a1a] text-white text-sm rounded-lg border border-purple-500/50 transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              <Bot className="w-4 h-4 text-purple-400" />
              <span className="font-semibold tracking-wide text-xs">Ask AI</span>
            </button>
            <button 
              onClick={() => {
                setReflectionQuote(tooltip.text)
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#121212] hover:bg-[#1a1a1a] text-white text-sm rounded-lg border border-purple-500/50 transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              <PenLine className="w-4 h-4 text-purple-400" />
              <span className="font-semibold tracking-wide text-xs">Reflection</span>
            </button>
          </div>
        )}
        <ReflectionModal 
          isOpen={!!reflectionQuote} 
          onClose={() => {
            setReflectionQuote(null)
            setTooltip(null)
          }} 
          bookName={fileName} 
          quote={reflectionQuote || ''} 
        />
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
