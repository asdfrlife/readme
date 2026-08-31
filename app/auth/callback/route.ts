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

      const { data: profile } = await supabase
        .from('profile')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      const hasProfile = !!profile

      // If they clicked "Sign in with Google" but have no profile, they haven't signed up
      if (redirectPath === '/home' && !hasProfile) {
        // Sign them out so they aren't logged in
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/signin?error=${encodeURIComponent('Account does not exist. Please sign up first.')}`)
      }

      // If they clicked "Sign up with Google" but already have a profile, route to home
      if (redirectPath === '/profile' && hasProfile) {
        redirectPath = '/home'
      }

      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // return the user to signup page if no code is present
  return NextResponse.redirect(`${origin}/signup?error=Authentication failed or was cancelled`)
}
