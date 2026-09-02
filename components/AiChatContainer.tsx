import { useState, useEffect } from 'react'
import { Send, Bot, MessageSquarePlus, History, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/utils/supabase/client'

export function AiChatContainer({ bookTitle }: { bookTitle?: string }) {
  const supabase = createClient()
  
  const [models, setModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [quotedText, setQuotedText] = useState<string | null>(null)

  // Load models and fetch history
  useEffect(() => {
    const fetchModelsAndUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const saved = localStorage.getItem(`connected_ai_models_${user.id}`)
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            setModels(parsed)
            if (parsed.length > 0) {
              setSelectedModel(parsed[0].id)
            }
          } catch (e) {}
        }
      }
    }
    fetchModelsAndUser()
    
    fetchHistory()

    // Supabase Realtime: Live stream checking for new conversations
    const channel = supabase
      .channel('realtime-conversations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          fetchHistory() // Refresh the list automatically if a convo is added/updated
        }
      )
      .subscribe()

    const handleAskAi = (e: CustomEvent) => {
      setQuotedText(e.detail)
    }
    window.addEventListener('ask-ai', handleAskAi as EventListener)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('ask-ai', handleAskAi as EventListener)
    }
  }, [])

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
    
    if (data) setHistory(data)
  }

  const loadConversation = async (id: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
      
    if (data) {
      setMessages(data as any[])
      setConversationId(id)
      setIsHistoryOpen(false)
    }
  }

  const startNewChat = () => {
    setMessages([])
    setConversationId(null)
    setIsHistoryOpen(false)
  }

  const deleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    // Optimistic UI update without rebuilding the page
    setHistory(prev => prev.filter(h => h.id !== id))
    
    // If the user deleted the chat they are currently viewing, reset the chat view
    if (conversationId === id) {
      startNewChat()
    }

    // Delete from database (messages cascade automatically)
    await supabase.from('conversations').delete().eq('id', id)
  }

  const handleSend = async (quickActionText?: string) => {
    let finalMessage = message.trim()
    
    if (quickActionText && quotedText) {
      finalMessage = `${quickActionText}:\n> ${quotedText}`
    } else if (quotedText && finalMessage) {
      finalMessage = `${finalMessage}\n\n> ${quotedText}`
    } else if (quotedText && !finalMessage) {
      finalMessage = `> ${quotedText}`
    }
    
    if (!finalMessage || models.length === 0 || isGenerating) return

    const selectedModelObj = models.find(m => m.id === selectedModel)
    const apiKey = selectedModelObj?.key
    const provider = selectedModelObj?.provider || 'google'
    
    if (!apiKey) {
      alert("No API key found for this model.")
      return
    }

    const newMessages = [...messages, { role: 'user' as const, content: finalMessage }]
    setMessages(newMessages)
    setMessage('')
    setQuotedText(null)
    setIsGenerating(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          model: selectedModel,
          provider,
          messages: newMessages,
          conversationId,
          bookTitle
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate response')
      }

      setMessages([...newMessages, { role: 'assistant' as const, content: data.text }])
      
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId)
        fetchHistory() // Refresh history since we created a new one
      }
    } catch (err: any) {
      console.error(err)
      setMessages([...newMessages, { role: 'assistant' as const, content: `Error: ${err.message}` }])
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="w-full h-full bg-[#121212] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-sm relative">
      {/* Header with Model Selector & Actions */}
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5 text-purple-400" />
          <span className="text-white font-bold hidden sm:inline">AI Assistant</span>
          
          <div className="flex items-center gap-1 ml-2">
            <button 
              onClick={startNewChat}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="New Chat"
            >
              <MessageSquarePlus className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                if (!isHistoryOpen) fetchHistory()
                setIsHistoryOpen(!isHistoryOpen)
              }}
              className={`p-1.5 rounded-lg transition-colors ${isHistoryOpen ? 'text-purple-400 bg-purple-500/20' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
              title="Chat History"
            >
              <History className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {models.length > 0 ? (
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-black border border-white/20 text-white/80 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500/50 cursor-pointer max-w-[150px] truncate"
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

      {/* History Dropdown Overlay */}
      {isHistoryOpen && (
        <div className="absolute top-[65px] left-4 right-4 z-50 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl max-h-[300px] overflow-y-auto flex flex-col p-2">
          <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-white/10">
            <span className="text-white/70 text-sm font-semibold">Past Conversations</span>
            <button onClick={() => setIsHistoryOpen(false)} className="text-white/40 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          {history.length === 0 ? (
            <p className="text-white/40 text-sm p-4 text-center">No history found.</p>
          ) : (
            history.map(h => (
              <div key={h.id} className="relative group">
                <button 
                  onClick={() => loadConversation(h.id)}
                  className={`w-full text-left p-3 pr-10 rounded-lg transition-colors text-sm truncate ${h.id === conversationId ? 'bg-purple-500/20 text-purple-300' : 'hover:bg-white/5 text-white/80'}`}
                >
                  {h.title}
                </button>
                <button
                  onClick={(e) => deleteConversation(e, h.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete Conversation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Chat Area */}
      <div 
        className="flex-1 p-4 overflow-y-auto flex flex-col"
        onClick={() => {
          if (window.innerWidth < 768) {
            const input = document.getElementById('chat-input') as HTMLInputElement
            if (input) input.focus()
          }
        }}
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
              <Bot className="w-6 h-6 text-white/40" />
            </div>
            <p className="text-white/40 text-sm text-center max-w-[80%]">
              {models.length > 0 
                ? `I'm ready to help you analyze ${bookTitle ? `'${bookTitle}'` : 'this book'}. Ask me anything!`
                : "Please connect an API key in the settings to start chatting."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
                <div className={`max-w-[85%] px-4 py-3 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-2xl rounded-tr-sm'
                    : 'bg-white/10 border border-white/10 text-white rounded-2xl rounded-tl-sm'
                }`}>
                  <div className={`text-sm leading-relaxed ${msg.role === 'assistant' ? 'prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:p-2 prose-pre:rounded-lg prose-code:text-purple-300' : 'whitespace-pre-wrap'}`}>
                    <ReactMarkdown
                      components={msg.role === 'user' ? {
                        blockquote: ({node, ...props}) => (
                          <blockquote 
                            className="mt-2 mb-1 pl-3 border-l-[3px] border-white/50 italic bg-black/20 py-2 pr-3 rounded-r-lg text-white/90 text-sm shadow-inner" 
                            {...props} 
                          />
                        )
                      } : undefined}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            
            {isGenerating && (
              <div className="flex w-full justify-start mb-2">
                <div className="max-w-[85%] bg-white/10 border border-white/10 text-white rounded-2xl rounded-tl-sm px-4 py-4 shadow-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-white/5 flex-shrink-0 flex flex-col gap-3">
        {quotedText && (
          <div className="relative bg-black/40 backdrop-blur-md border border-purple-500/30 rounded-xl p-3 shadow-lg">
            <button 
              onClick={() => setQuotedText(null)}
              className="absolute top-2 right-2 text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-white/80 text-xs italic line-clamp-3 pr-6 border-l-2 border-purple-500 pl-2">
              "{quotedText}"
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button 
                onClick={() => handleSend("Please fact check this quote")}
                className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/30 text-purple-200 text-xs rounded-lg transition-colors font-medium shadow-sm"
              >
                Fact check
              </button>
              <button 
                onClick={() => handleSend("Please provide short context for this quote")}
                className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/30 text-blue-200 text-xs rounded-lg transition-colors font-medium shadow-sm"
              >
                Short context
              </button>
            </div>
          </div>
        )}

        <div className="relative flex items-center">
          <input 
            id="chat-input"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={quotedText ? "Ask about this quote..." : "Ask a question about the book..."}
            disabled={models.length === 0 || isGenerating}
            className="w-full bg-black border border-white/20 rounded-xl pl-4 pr-12 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSend()
              }
            }}
          />
          <button 
            disabled={models.length === 0 || (!message.trim() && !quotedText) || isGenerating}
            onClick={() => handleSend()}
            className="absolute right-2 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:bg-white/10 disabled:text-white/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
