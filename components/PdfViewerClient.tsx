'use client'

import { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, Bot } from 'lucide-react'
import { useInView } from 'react-intersection-observer'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// IMPORTANT: Bypass Next.js worker issues by using unpkg
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

function VirtualizedPage({ pageNumber, width }: { pageNumber: number, width: number }) {
  const { ref, inView } = useInView({
    rootMargin: '100% 0px', // Pre-render 1 viewport above and below
    triggerOnce: false
  })
  
  // A4 paper aspect ratio is roughly 1:1.414
  const scale = typeof window !== 'undefined' && window.innerWidth < 768 ? 1.2 : 0.85
  const scaledWidth = width * scale
  const estimatedHeight = scaledWidth * 1.414

  return (
    <div ref={ref} className="w-full flex justify-center mb-4 min-h-[400px]" style={{ minHeight: inView ? 'auto' : estimatedHeight }}>
      {inView ? (
        <Page 
          pageNumber={pageNumber} 
          width={width}
          scale={scale}
          className="shadow-xl"
        />
      ) : (
        <div 
          className="bg-white/5 animate-pulse rounded-xl" 
          style={{ width: scaledWidth, height: estimatedHeight }} 
        />
      )}
    </div>
  )
}

export default function PdfViewerClient({ url, fileName }: { url: string, fileName: string }) {
  const [numPages, setNumPages] = useState<number>(0)
  const [tooltip, setTooltip] = useState<{ x: number, y: number, text: string } | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  // Handle text selection to show Ask AI tooltip
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection()
      if (!selection) return
      
      const text = selection.toString()
      if (!text.trim()) {
        setTooltip(null)
        return
      }

      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const rects = range.getClientRects()
        
        if (rects.length > 0) {
          const rect = rects[0] // get the exact bounding box of the first selected word
          const containerRect = containerRef.current?.getBoundingClientRect()
          const container = containerRef.current

          if (containerRect && container && rect.width > 0 && rect.height > 0) {
            setTooltip({
              x: rect.left - containerRect.left + container.scrollLeft,
              y: rect.top - containerRect.top + container.scrollTop,
              text: text.trim()
            })
          }
        }
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      if (container) {
        container.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [])

  return (
    <div className="flex-1 w-full h-full bg-[#f4f4f5] relative border border-white/10 rounded-2xl overflow-hidden group flex">
      <div 
        ref={containerRef}
        className="flex-1 h-full py-8 relative overflow-y-auto overflow-x-hidden flex flex-col items-center custom-scrollbar"
      >
        <Document 
          file={url} 
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center mt-20">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-black/50">Parsing PDF...</p>
            </div>
          }
          error={
            <div className="bg-red-500/10 text-red-500 p-4 rounded-xl shadow-lg mt-20 text-center">
              <h3 className="font-bold mb-2">Error Loading PDF</h3>
            </div>
          }
        >
          {numPages > 0 && Array.from(new Array(numPages), (el, index) => (
            <VirtualizedPage 
              key={`page_${index + 1}`}
              pageNumber={index + 1} 
              width={typeof window !== 'undefined' ? Math.min(window.innerWidth - (window.innerWidth < 768 ? 16 : 60), 800) : 800}
            />
          ))}
        </Document>

        {/* Ask AI Tooltip Overlay */}
        {tooltip && (
          <div 
            className="absolute z-50 -translate-y-full pb-1 pointer-events-auto shadow-2xl"
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
          </div>
        )}
      </div>


      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  )
}
