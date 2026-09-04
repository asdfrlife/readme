/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<{ name: string; username: string } | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // 1. Get current authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          router.push('/signin')
          return
        }

        // 2. Fetch Profile Info
        const { data: profileData, error: profileError } = await supabase
          .from('profile')
          .select('name, username')
          .eq('id', user.id)
          .single()

        if (profileError) {
          // If no profile found, maybe they skipped it. Redirect to profile setup.
          if (profileError.code === 'PGRST116') {
            router.push('/profile')
            return
          }
          throw profileError
        }

        setProfile(profileData)

        // 3. Fetch Profile Picture
        // List files in the user's directory to find the exact filename and extension
        const { data: files, error: filesError } = await supabase.storage
          .from('ppicture')
          .list(user.id)

        if (!filesError && files && files.length > 0) {
          const profilePic = files.find(f => f.name.startsWith('profile.'))

          if (profilePic) {
            // Get a signed URL (safer if bucket is private)
            const { data: urlData, error: urlError } = await supabase.storage
              .from('ppicture')
              .createSignedUrl(`${user.id}/${profilePic.name}`, 60 * 60) // valid for 1 hour

            if (!urlError && urlData) {
              setAvatarUrl(urlData.signedUrl)
            }
          }
        }

      } catch (err: any) {
        console.error('Error fetching profile:', err.message)
        setError('Failed to load profile data.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/signin')
  }

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md border border-white/20 p-8 rounded-2xl bg-white/5 backdrop-blur-md flex flex-col items-center text-center">

        {error && (
          <p className="text-red-400">{error}</p>
        )}
        
        {!error && profile && (
          <>
            <div className="relative w-32 h-32 rounded-full border-4 border-white/20 overflow-hidden mb-6 shadow-2xl">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" fill sizes="128px" className="object-cover" />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/50 text-sm">
                  No Image
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
            <p className="text-white/60 mb-8">@{profile.username}</p>

            <button
              onClick={handleSignOut}
              className="px-6 py-2 border border-white/30 rounded-lg hover:bg-white hover:text-black transition-colors font-medium"
            >
              Sign Out
            </button>
          </>
        )}

      </div>
    </div>
  )
}
