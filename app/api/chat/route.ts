import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(req: Request) {
  try {
    const { apiKey, model, messages } = await req.json()
    
    if (!apiKey || !model || !messages) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const ai = new GoogleGenAI({ apiKey })

    // Format messages for the Google GenAI SDK
    // The SDK expects 'user' and 'model' roles.
    const contents = messages.map((m: any) => ({
      role: m.role,
      parts: [{ text: m.content }]
    }))

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
    })

    return NextResponse.json({ 
      text: response.text 
    })

  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate response' }, { status: 500 })
  }
}
