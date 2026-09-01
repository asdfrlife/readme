'use client'

import { useState, useEffect } from 'react'
import { Key, Link as LinkIcon, Cpu, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ApiKeyPage() {
  const [apiKey, setApiKey] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState('')
  const [connectedModels, setConnectedModels] = useState<any[]>([])

  useEffect(() => {
    // Load connected models from localStorage on mount
    const saved = localStorage.getItem('connected_ai_models')
    if (saved) {
      try {
        setConnectedModels(JSON.parse(saved))
      } catch (e) {}
    }
  }, [])

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key')
      return
    }

    setIsValidating(true)
    setError('')

    try {
      const res = await fetch('/api/models/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to connect')
      }

      // Success! Save to localStorage for BYOK (Bring Your Own Key) usage
      const newModel = {
        id: 'gemini-3.1-flash-lite',
        name: 'Gemini 3.1 Flash Lite',
        key: apiKey,
        addedAt: new Date().toISOString()
      }

      // Overwrite for now since we only support one model slot
      const updatedModels = [newModel]
      
      setConnectedModels(updatedModels)
      localStorage.setItem('connected_ai_models', JSON.stringify(updatedModels))
      setApiKey('')
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemove = (modelId: string) => {
    const updated = connectedModels.filter(m => m.id !== modelId)
    setConnectedModels(updated)
    localStorage.setItem('connected_ai_models', JSON.stringify(updated))
  }

  return (
    <div className="h-full w-full flex flex-col items-center p-8 bg-black overflow-y-auto">
      <div className="w-full max-w-3xl flex flex-col gap-8 mt-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Key className="w-8 h-8 text-purple-400" />
            AI API Settings
          </h1>
          <p className="text-white/50 text-lg">
            Connect AI models by providing your API keys to enable smart features.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-8 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-white font-medium">Select Model</label>
            <div className="relative">
              <select className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-purple-500/50 transition-colors cursor-pointer">
                <option value="gemini-3.1-flash-lite" className="bg-[#1a1a1a]">Gemini 3.1 Flash Lite</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/50">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-white font-medium">API Key</label>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key here..."
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            {error && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>

          <button 
            onClick={handleConnect}
            disabled={isValidating || !apiKey.trim()}
            className="mt-2 w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LinkIcon className="w-5 h-5" />
                Connect Model
              </>
            )}
          </button>
        </div>

        {/* Connected Models Container */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-8 shadow-sm flex flex-col gap-6 mb-12">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-purple-400" />
            Connected Models ({connectedModels.length})
          </h2>
          
          {connectedModels.length === 0 ? (
            <div className="w-full p-8 border border-dashed border-white/20 rounded-xl bg-white/5 flex flex-col items-center justify-center text-center">
              <p className="text-white/50">
                No models connected yet. Import an API key above to get started.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {connectedModels.map((model) => (
                <div key={model.id} className="w-full p-4 border border-green-500/30 rounded-xl bg-green-500/5 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold">{model.name}</p>
                      <p className="text-white/40 text-sm">
                        Added {new Date(model.addedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemove(model.id)}
                    className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove API Key"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
