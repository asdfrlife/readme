'use client'

import { useState, useEffect } from 'react'
import { getReflections, deleteReflection, type Reflection } from '@/utils/reflections'
import { BookOpen, PenLine, Trash2 } from 'lucide-react'

export default function ReflectionsPage() {
  const [reflections, setReflections] = useState<Reflection[]>([])

  useEffect(() => {
    // False positive: we must initialize state from localStorage synchronously on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReflections(getReflections())
  }, [])

  const handleDelete = (id: string) => {
    deleteReflection(id)
    setReflections(getReflections())
  }

  if (reflections.length === 0) {
    return (
      <div className="min-h-full w-full flex flex-col items-center justify-center p-4 md:p-8 bg-black">
        <div className="w-full max-w-[943px] border border-white/20 p-10 rounded-2xl bg-white/5 backdrop-blur-md flex flex-col items-center text-center">
          <PenLine className="w-12 h-12 text-white/40 mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">No Reflections Yet</h1>
          <p className="text-white/60 mb-8">
            Highlight text while reading and click &quot;Reflection&quot; to save your thoughts here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full w-full flex flex-col items-center p-4 md:p-8 bg-black">
      <div className="w-full max-w-[943px] flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-2">
          <PenLine className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">Your Reflections</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reflections.map((ref) => (
            <div key={ref.id} className="bg-[#121212] border border-white/20 rounded-2xl p-6 flex flex-col shadow-sm hover:border-purple-500/50 hover:shadow-purple-500/10 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 text-white/80">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-lg">{ref.bookName}</span>
                </div>
                <button 
                  onClick={() => handleDelete(ref.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-white/40 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
                  title="Delete Reflection"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="bg-white/5 border-l-4 border-purple-500 p-4 rounded-r-lg mb-4">
                <p className="text-white/70 italic text-sm font-serif">
                  &quot;{ref.quote}&quot;
                </p>
              </div>
              
              <div className="flex-1">
                <p className="text-white/90 whitespace-pre-wrap leading-relaxed">{ref.reflectionText}</p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10 text-xs text-white/40 font-mono">
                {new Date(ref.createdAt).toLocaleDateString()} at {new Date(ref.createdAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
