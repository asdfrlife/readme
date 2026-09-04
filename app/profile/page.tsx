/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Plus } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/signin')
      } else {
        setUserId(user.id)
        
        // Safety check: if they already have a profile, bounce them to home
        const { data } = await supabase
          .from('profile')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()
          
        if (data) {
          router.push('/home')
        }
      }
    }
    getUser()
  }, [router, supabase])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setPreviewUrl(URL.createObjectURL(selectedFile))
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!userId) {
      setError('You must be logged in to create a profile.')
      return
    }

    if (!file) {
      setError('Profile picture is mandatory. Please upload an image.')
      return
    }

    if (!name.trim() || !username.trim()) {
      setError('Name and Username are required.')
      return
    }

    setLoading(true)

    try {
      // 1. Check if username is unique
      const { data: existingUser, error: checkError } = await supabase
        .from('profile')
        .select('id')
        .eq('username', username.trim())
        .maybeSingle()

      if (checkError) throw checkError

      if (existingUser && existingUser.id !== userId) {
        setError('Username is already taken. Please choose another.')
        setLoading(false)
        return
      }

      // 2. Upload Profile Picture
      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/profile.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('ppicture')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // 3. Create Profile Entry
      const { error: profileError } = await supabase
        .from('profile')
        .insert({
          id: userId,
          name: name.trim(),
          username: username.trim(),
        })

      if (profileError) {
         if (profileError.code === '23505') { // unique violation
             // It could be the 'id' (primary key) or 'username' (unique constraint).
             const errorString = `${profileError.message} ${profileError.details}`.toLowerCase()
             
             if (errorString.includes('username')) {
               setError('This username already exists. Please choose another.')
             } else {
               // Fallback if we can't determine the exact constraint
               setError('This username is taken or you already have a profile.')
             }
             setLoading(false)
             return
         }
         throw profileError
      }

      // 4. Redirect to Home
      router.push('/home')
      
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md border border-white/20 p-8 rounded-lg bg-black/50 backdrop-blur-md">
        <h1 className="text-3xl font-bold mb-8 text-center">Set up your profile</h1>
        
        {error && (
          <div className="bg-white/10 border border-red-500/50 text-red-200 p-3 rounded mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col items-center w-full space-y-6">
          
          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center">
            <label 
              htmlFor="profile-upload" 
              className="relative flex items-center justify-center w-32 h-32 rounded-full border-2 border-dashed border-white/40 cursor-pointer overflow-hidden hover:border-white transition-colors bg-white/5"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Plus className="w-8 h-8 text-white/60" />
              )}
              <input 
                id="profile-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </label>
            <span className="mt-3 text-sm text-white/70">upload your image</span>
          </div>

          <div className="w-full space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent border border-white/30 rounded px-4 py-2 text-white focus:outline-none focus:border-white transition-colors"
                placeholder="e.g. John Doe"
              />
            </div>

            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent border border-white/30 rounded px-4 py-2 text-white focus:outline-none focus:border-white transition-colors"
                placeholder="e.g. johndoe123"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !userId}
            className="w-full bg-white text-black font-semibold py-3 rounded hover:bg-white/90 transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>

        </form>
      </div>
    </div>
  )
}
