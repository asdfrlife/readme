import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(req: Request) {
  try {
    const { apiKey } = await req.json()
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    // Initialize the official Google GenAI SDK
    const ai = new GoogleGenAI({ apiKey })

    // Validate the key by attempting to fetch the models list.
    // If the API key is invalid, this will throw an authentication error.
    await ai.models.list()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API Key validation error:', error)
    return NextResponse.json({ 
      error: 'Invalid API key or validation failed'
    }, { status: 401 })
  }
}
