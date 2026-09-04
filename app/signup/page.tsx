'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

function isValidEmail(email: string) {
  const atIndex = email.indexOf("@");
  if (atIndex < 1 || atIndex !== email.lastIndexOf("@")) return false;
  const [local, domain] = email.split("@");
  return local.length > 0 && domain.includes(".") && !domain.startsWith(".") && !domain.endsWith(".");
}

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Read error from URL if redirected from OAuth callback
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const urlError = searchParams.get('error')
      if (urlError) {
        // eslint-disable-next-line
        setError(decodeURIComponent(urlError))
      }
    }
  }, [])

  const supabase = createClient()
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/confirmed`,
      }
    })

    if (signUpError) {
      // Supabase typically returns this message if the email is already in use
      // or if it automatically linked the identity, it might return success.
      if (signUpError.message.includes('User already registered') || signUpError.message.includes('already exists')) {
        setError('This email is already registered. Please sign in instead.')
      } else {
        setError(signUpError.message)
      }
      setLoading(false)
      return
    }

    // If signup is successful but there is no session, it means Email Confirmations are turned ON in Supabase
    if (signUpData.user && !signUpData.session) {
      router.push(`/signin?message=${encodeURIComponent('Success! Please check your email to confirm your account before signing in.')}`)
      return
    }

    // Check if Supabase auto-linked this to an existing account that already has a profile
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: existingProfile } = await supabase
        .from('profile')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (existingProfile) {
        router.push('/home')
        return
      }
    }

    router.push('/profile')
  }

  const handleGoogleSignUp = async () => {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
      },
    })

    if (error) {
      setError(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md border border-white/20 p-8 rounded-lg bg-black/50 backdrop-blur-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Sign Up</h1>

        {error && (
          <div className="bg-white/10 border border-white/30 text-white p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-white/30 rounded px-4 py-2 text-white focus:outline-none focus:border-white transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-white/30 rounded px-4 py-2 text-white focus:outline-none focus:border-white transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-transparent border border-white/30 rounded px-4 py-2 text-white focus:outline-none focus:border-white transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-semibold py-2 rounded hover:bg-white/90 transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center">
          <div className="border-t border-white/20 flex-grow"></div>
          <span className="px-3 text-white/50 text-sm">OR</span>
          <div className="border-t border-white/20 flex-grow"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignUp}
          className="w-full mt-6 bg-transparent border border-white text-white font-semibold py-2 rounded flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign up with Google
        </button>

        <p className="mt-8 text-center text-sm text-white/70">
          Already have an account?{' '}
          <Link href="/signin" className="text-white font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
