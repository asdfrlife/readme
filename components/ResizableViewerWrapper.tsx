'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Bot, X } from 'lucide-react'

import { AiChatContainer } from './AiChatContainer'

import { parseBookFilename } from '@/utils/bookFormat'

export function ResizableViewerWrapper({ children, fileName }: Readonly<{ children: React.ReactNode, fileName: string }>) {
  // A4 paper proportion minimum (approx 700px for typical screens)
  const [width, setWidth] = useState(700)
  const [isResizing, setIsResizing] = useState(false)
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false)
  
  const isResizingRef = useRef(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(700)

  useEffect(() => {
    if (fileName) {
      localStorage.setItem('lastReadBook', fileName)
    }
  }, [fileName])

  useEffect(() => {
    const handleAskAi = () => {
      if (window.innerWidth < 1024) {
        setIsMobileChatOpen(true)
      }
    }
    window.addEventListener('ask-ai', handleAskAi)
    return () => window.removeEventListener('ask-ai', handleAskAi)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizingRef.current = true
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = width
    
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [width])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return
      
      const deltaX = startXRef.current - e.clientX
      // Set 700px as the strict minimum for A4 proportion & preserving the 360px total padding
      // Bound the max width to 1000px so it only resizes "a little bit" and leaves room for chat
      const newWidth = Math.min(1000, Math.max(700, startWidthRef.current + deltaX))
      setWidth(newWidth)
    }

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false
        setIsResizing(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const { displayName } = parseBookFilename(fileName)

  return (
    <div className="flex-1 w-full overflow-hidden flex flex-row relative h-full">
      <style>{`
        .resizable-panel { width: 100%; }
        @media (min-width: 1024px) {
          .resizable-panel { width: ${width}px; }
        }
      `}</style>

      {/* Left AI Chat Panel (Desktop) */}
      <div className="hidden lg:flex lg:flex-1 lg:h-full lg:min-w-[300px] overflow-hidden flex-shrink-0">
        <AiChatContainer bookTitle={displayName} />
      </div>

      {/* Right Resizable Canvas */}
      <div 
        className="resizable-panel h-full relative flex-shrink-0 flex max-w-full"
      >
        <div 
          onMouseDown={handleMouseDown}
          className="hidden lg:flex absolute -left-3 top-0 bottom-0 w-6 cursor-col-resize z-50 items-center justify-center group"
          title="Drag to resize"
        >
          <div className="w-1.5 h-16 bg-white/10 group-hover:bg-purple-500 rounded-full transition-colors" />
        </div>
        
        <div className="flex-1 w-full h-full relative">
          {children}
          {/* Transparent overlay that catches mouse events while dragging, preventing the iframe from swallowing them */}
          {isResizing && (
            <div className="hidden lg:block absolute inset-0 z-50 cursor-col-resize" />
          )}
        </div>
      </div>

      {/* Mobile Chat Floating Button */}
      <div className="lg:hidden absolute bottom-6 left-4 right-4 z-40">
        <button 
          onClick={() => setIsMobileChatOpen(true)}
          className="w-full bg-[#121212]/90 backdrop-blur-md border border-white/20 hover:border-purple-500/50 rounded-xl px-4 py-3.5 text-white/60 text-left shadow-2xl flex items-center gap-3 transition-all active:scale-[0.98]"
        >
          <Bot className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-medium">Ask a question about the book...</span>
        </button>
      </div>

      {/* Mobile Chat Modal Sheet */}
      {isMobileChatOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileChatOpen(false)} 
          />
          
          {/* Sheet */}
          <div className="h-[85vh] bg-[#121212] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden border-t border-white/10 relative animate-in slide-in-from-bottom-full duration-300">
            <div className="absolute top-3 right-4 z-10">
              <button 
                onClick={() => setIsMobileChatOpen(false)} 
                className="p-2 bg-black/50 hover:bg-black rounded-full text-white/70 hover:text-white transition-colors border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden pt-4 pb-2 px-2 flex flex-col">
              <AiChatContainer bookTitle={displayName} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
