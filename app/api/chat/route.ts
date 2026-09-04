import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/utils/supabase/server'

async function generateAiResponse(provider: string, apiKey: string, model: string, messages: any[], bookTitle?: string): Promise<string> {
  let aiText = ''
  if (provider === 'openrouter') {
    const systemInstruction = bookTitle 
      ? `You are an intelligent reading assistant. The user is currently reading a book titled "${bookTitle}". Answer questions, provide context, and fact-check based on the context of this book.` 
      : ''
    
    const openRouterMessages = systemInstruction 
      ? [{ role: 'system', content: systemInstruction }, ...messages]
      : messages

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: openRouterMessages
      })
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenRouter API Error')
    }
    aiText = data.choices?.[0]?.message?.content || 'I could not generate a response.'
    
  } else {
    const ai = new GoogleGenAI({ apiKey })
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }]
    }))

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: bookTitle 
          ? `You are an intelligent reading assistant. The user is currently reading a book titled "${bookTitle}". Answer questions, provide context, and fact-check based on the context of this book.` 
          : undefined
      }
    })

    aiText = response.text || 'I could not generate a response.'
  }
  return aiText
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { apiKey, model, provider, messages, conversationId, bookTitle } = await req.json()
    
    if (!apiKey || !model || !messages || messages.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let activeConversationId = conversationId

    // If no conversation ID, create a new conversation
    if (!activeConversationId) {
      const { data: newConvo, error: convoError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: bookTitle || 'New Chat'
        })
        .select()
        .single()

      if (convoError || !newConvo) {
        throw new Error('Failed to create conversation')
      }
      activeConversationId = newConvo.id
    }

    // Get the latest user message
    const lastMessage = messages[messages.length - 1]

    // Insert user message into database
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: activeConversationId,
        role: 'user',
        content: lastMessage.content
      })

    if (userMsgError) throw new Error('Failed to save user message')

    const aiText = await generateAiResponse(provider, apiKey, model, messages, bookTitle)

    // Insert AI message into database
    const { error: aiMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: activeConversationId,
        role: 'assistant',
        content: aiText
      })

    if (aiMsgError) throw new Error('Failed to save AI message')

    return NextResponse.json({ 
      text: aiText,
      conversationId: activeConversationId
    })

  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: error.message || 'Failed to process request' }, { status: 500 })
  }
}
