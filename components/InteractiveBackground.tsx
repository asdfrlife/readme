'use client'

import { useEffect, useState } from 'react'

export function InteractiveBackground() {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // False positive: setting state on mount is required to prevent hydration mismatch for client-only dynamic positioning
    // eslint-disable-next-line
    setIsMounted(true)
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      // Use requestAnimationFrame for smoother performance
      requestAnimationFrame(() => {
        setMousePos({ x, y })
      })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="fixed inset-0 z-[-1] bg-black overflow-hidden pointer-events-none">
      {/* Base dark gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/40 via-black to-black" />
      
      {/* Interactive mouse glow (only renders after mount to avoid hydration mismatch) */}
      {isMounted && (
        <div 
          className="absolute w-[800px] h-[800px] rounded-full blur-[120px] bg-purple-700/15 transition-transform duration-1000 ease-out will-change-transform"
          style={{
            left: `${mousePos.x}%`,
            top: `${mousePos.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      )}
      
      {/* Decorative slow moving orbs */}
      <div 
        className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] bg-fuchsia-600/10 animate-[pulse_8s_ease-in-out_infinite]" 
      />
      <div 
        className="absolute -bottom-1/4 -right-1/4 w-[800px] h-[800px] rounded-full blur-[150px] bg-purple-800/15 animate-[pulse_12s_ease-in-out_infinite]" 
      />
    </div>
  )
}
