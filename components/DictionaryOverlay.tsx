'use client'

import { useEffect, useState } from 'react'
import type { HoveredWordInfo } from '@/utils/wordHover'

interface DictionaryOverlayProps {
  wordInfo: HoveredWordInfo | null
}

interface DictData {
  meanings: {
    partOfSpeech: string
    definitions: { definition: string }[]
  }[]
}

export function DictionaryOverlay({ wordInfo }: Readonly<DictionaryOverlayProps>) {
  const [definition, setDefinition] = useState<DictData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [activeWord, setActiveWord] = useState<string | null>(null)

  useEffect(() => {
    if (!wordInfo?.word) {
      // False positive: we must synchronously reset activeWord to immediately hide popup on mouseleave
      // eslint-disable-next-line
      setActiveWord(null)
      return
    }

    const currentWord = wordInfo.word
    const timer = setTimeout(async () => {
      setActiveWord(currentWord)
      setLoading(true)
      setError(false)
      
      try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${currentWord}`)
        if (!res.ok) throw new Error('Not found')
        const data = await res.json()
        setDefinition(data[0])
      } catch {
        setError(true)
        setDefinition(null)
      } finally {
        setLoading(false)
      }
    }, 1200)

    return () => clearTimeout(timer)
  }, [wordInfo?.word])

  if (!wordInfo) return null

  const offsetX = wordInfo.containerOffset?.x ?? 0
  const offsetY = wordInfo.containerOffset?.y ?? 0
  
  const boxLeft = wordInfo.rect.left + offsetX
  const boxTop = wordInfo.rect.top + offsetY
  
  return (
    <>
      <div 
        className="fixed pointer-events-none z-[100] border border-black/40 bg-transparent rounded-sm transition-all duration-150"
        style={{
          left: boxLeft - 2,
          top: boxTop - 2,
          width: wordInfo.rect.width + 4,
          height: wordInfo.rect.height + 4
        }}
      />
      
      {activeWord === wordInfo.word && (
        <div 
          className="fixed z-[100] bg-[#1a1a1a] text-white p-4 rounded-xl shadow-2xl border border-white/20 w-72 animate-in fade-in zoom-in-95 pointer-events-none"
          style={{
            left: Math.min(boxLeft, typeof window !== 'undefined' ? window.innerWidth - 300 : boxLeft),
            top: boxTop + wordInfo.rect.height + 12
          }}
        >
          <div className="font-bold text-base mb-2 capitalize text-purple-400">{activeWord}</div>
          {loading ? (
            <div className="text-sm text-white/50 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              Fetching definition...
            </div>
          ) : error || !definition || !definition.meanings || definition.meanings.length === 0 ? (
            <div className="text-sm text-white/50 italic">
              No definition found for this word.
            </div>
          ) : (
            <div className="text-sm text-white/80 max-h-48 overflow-y-hidden flex flex-col gap-2">
              <div>
                <span className="text-xs text-white/40 italic mr-2">{definition.meanings[0]?.partOfSpeech}</span>
                {definition.meanings[0]?.definitions[0]?.definition || 'Definition not found.'}
              </div>
              {definition.meanings[1] && (
                <div className="border-t border-white/10 pt-2 mt-1">
                  <span className="text-xs text-white/40 italic mr-2">{definition.meanings[1]?.partOfSpeech}</span>
                  {definition.meanings[1].definitions[0]?.definition}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
