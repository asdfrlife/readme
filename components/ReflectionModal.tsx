'use client'

import { useState } from 'react'
import { saveReflection } from '@/utils/reflections'
import { X, Save } from 'lucide-react'

interface ReflectionModalProps {
  isOpen: boolean
  onClose: () => void
  bookName: string
  quote: string
}

export function ReflectionModal({ isOpen, onClose, bookName, quote }: Readonly<ReflectionModalProps>) {
  const [reflectionText, setReflectionText] = useState('')

  if (!isOpen) return null

  const handleSave = () => {
    if (!reflectionText.trim()) return
    
    saveReflection({
      bookName: bookName.replace(/^\d+_/, ''), // Clean timestamp prefix if present
      quote: quote.trim(),
      reflectionText: reflectionText.trim()
    })
    
    setReflectionText('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1a1a1a] border border-white/20 p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-4">New Reflection</h2>

        <div className="bg-white/5 border-l-4 border-purple-500 p-4 rounded-r-lg mb-6 max-h-32 overflow-y-auto custom-scrollbar">
          <p className="text-white/80 italic text-sm font-serif">
            &quot;{quote}&quot;
          </p>
        </div>

        <textarea
          value={reflectionText}
          onChange={(e) => setReflectionText(e.target.value)}
          placeholder="Write what you felt about this quote..."
          className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 min-h-[150px] focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all resize-y mb-6"
        />

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={!reflectionText.trim()}
            className="flex items-center gap-2 px-6 py-2.5 text-sm bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all font-medium shadow-lg shadow-purple-500/20 active:scale-95"
          >
            <Save className="w-4 h-4" />
            Save Reflection
          </button>
        </div>
      </div>
    </div>
  )
}
