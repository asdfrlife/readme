import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { apiKey, model, messages, conversationId, bookTitle } = await req.json()
    
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

    // Prepare Google GenAI request
    const ai = new GoogleGenAI({ apiKey })
    
    // Map existing messages correctly for Google GenAI ('user' and 'model' roles)
    // We expect the frontend to pass the full history up to the latest user message
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }]
    }))

    const actualModel = model === 'gemini-3.1-flash-lite' ? 'gemini-1.5-flash' : model

    // Generate AI response
    const response = await ai.models.generateContent({
      model: actualModel,
      contents: contents,
    })

    const aiText = response.text || 'I could not generate a response.'

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
