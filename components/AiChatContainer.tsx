'use client'

import { useState, useEffect } from 'react'
import { Send, Bot } from 'lucide-react'

export function AiChatContainer() {
  const [models, setModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('connected_ai_models')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setModels(parsed)
        if (parsed.length > 0) {
          setSelectedModel(parsed[0].id)
        }
      } catch (e) {}
    }
  }, [])

  return (
    <div className="w-full h-full bg-[#121212] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-sm">
      {/* Header with Model Selector */}
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-400" />
          <span className="text-white font-bold">AI Assistant</span>
        </div>
        
        {models.length > 0 ? (
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-black border border-white/20 text-white/80 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500/50 cursor-pointer"
          >
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
            No Models Connected
          </span>
        )}
      </div>

      {/* Chat Area (Empty for now) */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
          <Bot className="w-6 h-6 text-white/40" />
        </div>
        <p className="text-white/40 text-sm text-center max-w-[80%]">
          {models.length > 0 
            ? "I'm ready to help you analyze this book. Ask me anything!"
            : "Please connect an API key in the settings to start chatting."}
        </p>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-white/5 flex-shrink-0">
        <div className="relative flex items-center">
          <input 
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask a question about the book..."
            disabled={models.length === 0}
            className="w-full bg-black border border-white/20 rounded-xl pl-4 pr-12 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setMessage('')
              }
            }}
          />
          <button 
            disabled={models.length === 0 || !message.trim()}
            onClick={() => setMessage('')}
            className="absolute right-2 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:bg-white/10 disabled:text-white/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
