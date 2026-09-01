'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

export function ResizableViewerWrapper({ children }: { children: React.ReactNode }) {
  const [width, setWidth] = useState(920)
  const isResizingRef = useRef(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(920)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizingRef.current = true
    startXRef.current = e.clientX
    startWidthRef.current = width
    
    // Add global body class to prevent text selection while dragging
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [width])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return
      
      const deltaX = startXRef.current - e.clientX
      // Moving mouse left increases width (deltaX is positive)
      // Min width 660px guarantees 300px of text between the 180px paddings
      const newWidth = Math.max(660, startWidthRef.current + deltaX)
      setWidth(newWidth)
    }

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false
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

  return (
    <div className="flex-1 w-full overflow-hidden flex justify-end relative">
      <div 
        style={{ width: `${width}px` }} 
        className="h-full relative flex-shrink-0 flex max-w-full"
      >
        <div 
          onMouseDown={handleMouseDown}
          className="absolute -left-2 top-0 bottom-0 w-4 cursor-col-resize z-50 flex items-center justify-center group"
          title="Drag to resize"
        >
          <div className="w-1 h-12 bg-white/10 group-hover:bg-purple-500 rounded-full transition-colors" />
        </div>
        <div className="flex-1 w-full h-full">
          {children}
        </div>
      </div>
    </div>
  )
}
