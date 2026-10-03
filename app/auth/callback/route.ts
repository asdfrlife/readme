import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  // If the user cancelled the OAuth flow or there's an error, redirect back to signin
  if (errorParam || errorDescription) {
    // Supabase returns "Email link is invalid or has expired" if already verified.
    const message = errorDescription?.includes('expired') 
      ? 'Email link is invalid or has expired. If you already verified, please sign in.' 
      : errorDescription || 'Authentication was cancelled';
    return NextResponse.redirect(`${origin}/signin?error=${encodeURIComponent(message)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      return NextResponse.redirect(`${origin}/signin?error=${encodeURIComponent(error.message)}`)
    }
  }

  // return the user to signin page if no code is present
  return NextResponse.redirect(`${origin}/signin?error=Authentication failed or was cancelled`)
}
