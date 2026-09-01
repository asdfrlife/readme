import { Key, Link as LinkIcon, Cpu } from 'lucide-react'

export default function ApiKeyPage() {
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
              placeholder="Enter your API key here..."
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          <button className="mt-2 w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Connect Model
          </button>
        </div>

        {/* Connected Models Container */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl p-8 shadow-sm flex flex-col gap-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-purple-400" />
            Connected Models (0)
          </h2>
          
          <div className="w-full p-8 border border-dashed border-white/20 rounded-xl bg-white/5 flex flex-col items-center justify-center text-center">
            <p className="text-white/50">
              No models connected yet. Import an API key above to get started.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
