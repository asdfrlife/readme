'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  ChevronLeft,
  ChevronRight,
  Home,
  User,
  LayoutDashboard,
  Settings,
  Plus,
  BookOpen,
  Key
} from 'lucide-react'

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<{ name: string; username: string } | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // PDF Upload State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadUser, setUploadUser] = useState<any>(null)

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return
        
        setUploadUser(user)

        const { data: profileData } = await supabase
          .from('profile')
          .select('name, username')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
        }

        const { data: files } = await supabase.storage
          .from('ppicture')
          .list(user.id)
        
        if (files && files.length > 0) {
          const profilePic = files.find(f => f.name.startsWith('profile.'))
          if (profilePic) {
            const { data: urlData } = await supabase.storage
              .from('ppicture')
              .createSignedUrl(`${user.id}/${profilePic.name}`, 60 * 60)

            if (urlData) {
              setAvatarUrl(urlData.signedUrl)
            }
          }
        }
      } catch (err) {
        console.error('Error fetching sidebar profile:', err)
      }
    }

    fetchProfileData()
  }, [supabase])

  const [uploadBytes, setUploadBytes] = useState(0)
  const [totalBytes, setTotalBytes] = useState(0)

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadUser) return

    setIsUploading(true)
    setUploadProgress(0)
    setUploadBytes(0)
    setTotalBytes(file.size)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      const filePath = `${uploadUser.id}/${Date.now()}_${file.name}`
      const url = `${supabaseUrl}/storage/v1/object/files/${filePath}`

      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(percent)
          setUploadBytes(event.loaded)
          setTotalBytes(event.total)
        }
      }

      xhr.open('POST', url, true)
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
      xhr.setRequestHeader('apikey', anonKey!)
      xhr.setRequestHeader('Cache-Control', '3600')
      xhr.setRequestHeader('Content-Type', file.type || 'application/epub+zip')

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100)
          setUploadBytes(file.size)
          setTimeout(() => {
            setIsUploading(false)
            setUploadProgress(0)
            setUploadBytes(0)
            setTotalBytes(0)
            window.dispatchEvent(new Event('book_uploaded'))
          }, 500)
        } else {
          console.error('Error uploading EPUB:', xhr.responseText)
          setIsUploading(false)
        }
        if (fileInputRef.current) fileInputRef.current.value = ''
      }

      xhr.onerror = () => {
        console.error('Unexpected error during upload')
        setIsUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }

      xhr.send(file)

    } catch (err) {
      console.error('Unexpected error setting up upload:', err)
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const [lastRead, setLastRead] = useState<string | null>(null)

  useEffect(() => {
    // Check localStorage whenever the pathname changes (e.g., after they navigate to /view)
    const saved = localStorage.getItem('lastReadBook')
    if (saved) setLastRead(saved)
  }, [pathname])

  const links = [
    { href: '/home', path: '/home', label: 'Home', icon: Home },
    { href: '/api-key', path: '/api-key', label: 'API Key', icon: Key },
    { href: lastRead ? `/view?file=${encodeURIComponent(lastRead)}` : '/view', path: '/view', label: 'Reading', icon: BookOpen }
  ]

  return (
    <>
    <aside
      className={`fixed bottom-0 md:relative flex flex-row md:flex-col bg-black/95 md:bg-black/40 backdrop-blur-md border-t md:border-t-0 md:border-r border-white/10 transition-all duration-300 ${
      isCollapsed ? 'md:w-20' : 'md:w-64'
      } w-full h-[72px] md:h-screen z-[100] justify-around md:justify-start items-center md:items-stretch pb-[safe-area-inset-bottom]`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:block absolute -right-3 top-5 p-1 bg-[#121212] border border-white/10 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all z-50 shadow-md"
        title={isCollapsed ? "Expand Menu" : "Collapse Menu"}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Top Header */}
      <div className="hidden md:flex items-center h-16 px-4 border-b border-white/10 overflow-hidden flex-shrink-0">
        <Link href="/home" className="flex items-center text-purple-400 hover:text-purple-300 transition-colors">
          <LayoutDashboard className="w-8 h-8 flex-shrink-0" />
          {!isCollapsed && <span className="ml-3 font-bold text-lg text-white whitespace-nowrap">My App</span>}
        </Link>
      </div>

      {/* Navigation Links and Mobile Actions */}
      <nav className="flex flex-row md:flex-col flex-1 md:overflow-y-auto md:py-4 justify-around md:justify-start items-center md:items-stretch px-1 md:px-0 w-full md:w-auto h-full md:h-auto">
        {links.length > 0 && (
          <ul className="flex flex-row md:flex-col w-full md:w-auto justify-around md:justify-start md:space-y-2 px-1 md:px-3">
            {links.map((link) => {
              const isActive = pathname === link.path
              return (
                <li key={link.href} className="flex-1 md:flex-none flex justify-center md:block">
                  <Link
                    href={link.href}
                    onClick={(e) => {
                      if (isActive) {
                        e.preventDefault()
                      }
                    }}
                    className={`flex flex-col md:flex-row items-center justify-center md:justify-start px-2 md:px-3 py-1.5 md:py-2.5 rounded-xl transition-all duration-200 group w-full md:w-auto ${
                      isActive
                        ? 'text-purple-300 md:bg-purple-500/20'
                        : 'text-white/60 hover:text-white md:hover:bg-white/10'
                    }`}
                    title={isCollapsed ? link.label : undefined}
                  >
                    <link.icon className={`w-6 h-6 md:w-5 md:h-5 flex-shrink-0 mb-1 md:mb-0 ${isCollapsed ? 'md:mx-auto' : ''}`} />
                    {!isCollapsed && (
                      <span className="hidden md:block ml-3 font-medium">{link.label}</span>
                    )}
                    <span className="text-[10px] font-medium md:hidden">{link.label}</span>
                  </Link>
                </li>
              )
            })}

            {/* Import PDF Button (Mobile inside list) */}
            <li className="flex md:hidden flex-1 justify-center items-center">
              <input 
                type="file" 
                accept="application/epub+zip, .epub"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center group w-full text-white/60 hover:text-white"
                title="Import EPUB"
              >
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/20 flex items-center justify-center mb-1 group-hover:bg-white/10 transition-colors">
                  <Plus className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                </div>
                <span className="text-[10px] font-medium">Import</span>
              </button>
            </li>

            {/* Account Profile (Mobile inside list) */}
            <li className="flex md:hidden flex-1 justify-center items-center">
              <Link href="/account" className="flex flex-col items-center justify-center group w-full text-white/60 hover:text-white">
                <div className="relative w-8 h-8 rounded-full bg-purple-500/30 border border-purple-500/50 flex-shrink-0 overflow-hidden flex items-center justify-center mb-1">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-purple-300" />
                  )}
                </div>
                <span className="text-[10px] font-medium">Profile</span>
              </Link>
            </li>
          </ul>
        )}

        {/* Import PDF Button (Desktop) */}
        <div className="hidden md:flex justify-center py-4 border-t border-b border-white/10 flex-shrink-0 mt-4 mb-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-full bg-white/5 hover:bg-white/10 border border-white/20 flex items-center justify-center transition-all group ${
              isCollapsed ? 'w-10 h-10' : 'w-12 h-12'
            }`}
            title="Import EPUB"
          >
            <Plus className={`${isCollapsed ? 'w-5 h-5' : 'w-6 h-6'} text-white/70 group-hover:text-white transition-colors`} />
          </button>
        </div>
      </nav>

      {/* Account Section at the Bottom (Desktop) */}
      <div className="hidden md:block p-3 border-t border-white/10">
        <Link
          href="/account"
          className="flex items-center w-full p-2 hover:bg-white/10 rounded-xl transition-colors group"
        >
          <div className="relative w-10 h-10 rounded-full bg-purple-500/30 border border-purple-500/50 flex-shrink-0 overflow-hidden flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-purple-300" />
            )}
          </div>
          
          {!isCollapsed && (
            <div className="ml-3 flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">
                {profile?.name || 'Account'}
              </p>
              <p className="text-xs text-white/50 truncate">
                {profile?.username ? `@${profile.username}` : 'View profile'}
              </p>
            </div>
          )}
        </Link>
      </div>
    </aside>
      
      {/* Upload Progress Modal */}
      {isUploading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/10 p-8 rounded-2xl flex flex-col items-center max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-white font-medium mb-6 text-lg">Uploading EPUB...</div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-white transition-all duration-300 ease-out rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="flex justify-between w-full text-white/50 text-sm font-medium">
              <span>{formatBytes(uploadBytes)} / {formatBytes(totalBytes)}</span>
              <span>{uploadProgress}%</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
