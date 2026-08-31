import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  // If the user cancelled the OAuth flow or there's an error, redirect back to signup
  if (errorParam || errorDescription) {
    return NextResponse.redirect(`${origin}/signup?error=${encodeURIComponent(errorDescription || 'Authentication was cancelled')}`)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.user) {
      const user = data.user
      let redirectPath = next

      // Check if it's a new user by comparing created_at and last_sign_in_at
      const createdAt = new Date(user.created_at).getTime()
      const lastSignInAt = new Date(user.last_sign_in_at || user.created_at).getTime()
      const isNewUser = Math.abs(createdAt - lastSignInAt) < 5000 // within 5 seconds

      // If they clicked "Sign up with Google" but already have an account, route to home
      if (!isNewUser && redirectPath === '/profile') {
        redirectPath = '/home'
      }

      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // return the user to signup page if no code is present
  return NextResponse.redirect(`${origin}/signup?error=Authentication failed or was cancelled`)
}
