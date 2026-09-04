'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

import { AiChatContainer } from './AiChatContainer'

import { parseBookFilename } from '@/utils/bookFormat'

export function ResizableViewerWrapper({ children, fileName }: Readonly<{ children: React.ReactNode, fileName: string }>) {
  // A4 paper proportion minimum (approx 700px for typical screens)
  const [width, setWidth] = useState(700)
  const [isResizing, setIsResizing] = useState(false)
  
  const isResizingRef = useRef(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(700)

  useEffect(() => {
    if (fileName) {
      localStorage.setItem('lastReadBook', fileName)
    }
  }, [fileName])

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
    <div className="flex-1 w-full overflow-y-auto lg:overflow-hidden flex flex-col-reverse lg:flex-row relative gap-6 pb-6 lg:pb-0">
      <style>{`
        .resizable-panel { width: 100%; }
        @media (min-width: 1024px) {
          .resizable-panel { width: ${width}px; }
        }
      `}</style>

      {/* Left AI Chat Panel */}
      <div className="w-full lg:flex-1 h-[500px] lg:h-full lg:min-w-[300px] overflow-hidden flex-shrink-0">
        <AiChatContainer bookTitle={displayName} />
      </div>

      {/* Right Resizable Canvas */}
      <div 
        className="resizable-panel h-[70vh] min-h-[500px] lg:h-full relative flex-shrink-0 flex max-w-full"
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
    </div>
  )
}
