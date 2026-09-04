'use client'
import { useState, useEffect } from 'react'
import { Timer, X } from 'lucide-react'

export function ReadingTimer() {
  const [isOpen, setIsOpen] = useState(false)
  const [minutesInput, setMinutesInput] = useState('30')
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : 0))
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      // We use setTimeout to allow state to settle before alert blocks the thread
      setTimeout(() => alert("Time's up! Great reading session."), 10)
    }
    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  const handleStart = () => {
    const mins = parseInt(minutesInput)
    if (isNaN(mins) || mins <= 0) return
    setTimeLeft(mins * 60)
    setIsRunning(true)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setTimeLeft(null)
    setIsRunning(false)
    setIsOpen(false)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="hidden md:block relative z-50">
      {timeLeft === null ? (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20 shadow-sm hover:shadow-purple-500/20"
        >
          <Timer className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium">Set Timer</span>
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-lg font-mono text-lg font-bold border shadow-lg ${timeLeft <= 60 ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse' : 'bg-white/10 text-white border-white/20'}`}>
            {formatTime(timeLeft)}
          </div>
          <button 
            onClick={handleCancel}
            className="p-2 bg-white/10 hover:bg-red-500/20 text-white/50 hover:text-red-400 border border-white/20 hover:border-red-500/30 rounded-lg transition-all"
            title="Cancel Timer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-64 bg-[#1a1a1a] border border-white/20 rounded-xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <Timer className="w-4 h-4 text-purple-400" />
            Reading Timer
          </h3>
          <div className="flex items-center gap-3 mb-5">
            <input 
              type="number" 
              min="1"
              max="999"
              value={minutesInput}
              onChange={(e) => setMinutesInput(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/60 transition-all font-mono"
              placeholder="Min"
            />
            <span className="text-white/50 text-sm font-medium">minutes</span>
          </div>
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              onClick={handleStart}
              className="px-5 py-2 text-sm bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:opacity-90 text-white rounded-lg transition-all font-medium shadow-lg shadow-purple-500/20 active:scale-95"
            >
              Start
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
