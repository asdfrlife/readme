'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  ChevronLeft,
  ChevronRight,
  Home,
  User,
  LayoutDashboard,
  Plus,
  BookOpen,
  Key,
  Menu,
  PenLine
} from 'lucide-react'
import { cleanFileName } from '@/utils/bookFormat'

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const [supabase] = useState(() => createClient())

  const [profile, setProfile] = useState<{ name: string; username: string } | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Mobile Menu State
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const mobileTimerRef = useRef<NodeJS.Timeout | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const openMobileMenu = () => {
    setIsMobileOpen(true)
    if (mobileTimerRef.current) clearTimeout(mobileTimerRef.current)
    mobileTimerRef.current = setTimeout(() => {
      setIsMobileOpen(false)
    }, 4000)
  }


  useEffect(() => {
    return () => {
      if (mobileTimerRef.current) clearTimeout(mobileTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobileOpen])

  // PDF Upload State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null)
  const [customCategory, setCustomCategory] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadUser, setUploadUser] = useState<{ id: string } | null>(null)

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
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadUser) return
    setPendingUploadFile(file)
    setCustomTitle(cleanFileName(file.name))
  }

  const performUpload = async (category: string) => {
    if (!pendingUploadFile || !uploadUser) return
    const file = pendingUploadFile
    setPendingUploadFile(null)

    setIsUploading(true)
    setUploadProgress(0)
    setUploadBytes(0)
    setTotalBytes(file.size)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      // Extract extension from original file
      const extension = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
      
      // Encode category and title in filename: [timestamp]___[category]___[title.ext]
      const safeCategory = category.trim() || 'Uncategorized'
      const finalTitle = customTitle.trim() || file.name
      // Ensure the title still has the correct extension for the viewer to parse
      const titleWithExt = finalTitle.endsWith(extension) ? finalTitle : `${finalTitle}${extension}`;
      
      const filePath = `${uploadUser.id}/${Date.now()}___${safeCategory}___${titleWithExt}`
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
      xhr.setRequestHeader('Content-Type', file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/epub+zip'))

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
    const saved = localStorage.getItem('lastReadBook')
    // eslint-disable-next-line
    if (saved) setLastRead(saved)
  }, [pathname])

  const links = [
    { href: '/home', path: '/home', label: 'Home', icon: Home },
    { href: '/reflections', path: '/reflections', label: 'Reflections', icon: PenLine },
    { href: '/api-key', path: '/api-key', label: 'API Key', icon: Key },
    { href: lastRead ? `/view?file=${encodeURIComponent(lastRead)}` : '/view', path: '/view', label: 'Reading', icon: BookOpen }
  ]

  return (
    <>
      {/* Mobile Floating Button */}
      <div className="md:hidden fixed top-4 left-4 z-[110]">
        <button
          ref={buttonRef}
          onClick={() => isMobileOpen ? setIsMobileOpen(false) : openMobileMenu()}
          className="w-12 h-12 rounded-full bg-purple-600/90 hover:bg-purple-500 backdrop-blur-md shadow-lg shadow-purple-500/20 flex items-center justify-center text-white border border-white/20 transition-all"
        >
          {isMobileOpen ? <ChevronLeft className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Hovering Dropdown Menu */}
      <div
        ref={menuRef}
        className={`md:hidden fixed top-20 left-4 z-[100] flex flex-col gap-3 transition-all duration-300 ease-in-out ${isMobileOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
      >
        <div className="flex flex-col gap-2 p-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
          {links.map((link) => {
            const isActive = pathname === link.path
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  if (isActive) e.preventDefault()
                  setIsMobileOpen(false)
                }}
                className={`flex items-center p-3 rounded-xl transition-all duration-200 group ${isActive
                    ? 'text-purple-300 bg-purple-500/20'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                title={link.label}
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                <span className="ml-3 font-medium pr-4">{link.label}</span>
              </Link>
            )
          })}

          <div className="h-px bg-white/10 w-full my-1" />

          {/* Import Button (Mobile) */}
          <button
            onClick={() => {
              fileInputRef.current?.click()
              setIsMobileOpen(false)
            }}
            className="flex items-center p-3 rounded-xl transition-all duration-200 group text-white/80 hover:text-white hover:bg-white/10 w-full text-left"
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            <span className="ml-3 font-medium pr-4">Import Book/PDF</span>
          </button>

          {/* Account Profile (Mobile) */}
          <Link
            href="/account"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center p-3 rounded-xl transition-all duration-200 group text-white/80 hover:text-white hover:bg-white/10 w-full text-left"
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" width={20} height={20} className="w-5 h-5 rounded-full object-cover" unoptimized />
            ) : (
              <User className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="ml-3 font-medium pr-4">Profile</span>
          </Link>
        </div>
      </div>

      <input
        type="file"
        accept="application/epub+zip, .epub, application/pdf, .pdf"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex relative flex-col bg-black/40 backdrop-blur-md border-r border-white/10 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'
          } h-[100dvh] z-50`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-5 p-1 bg-[#121212] border border-white/10 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all z-50 shadow-md"
          title={isCollapsed ? "Expand Menu" : "Collapse Menu"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Top Header */}
        <div className="flex items-center h-16 px-4 border-b border-white/10 overflow-hidden flex-shrink-0">
          <Link href="/home" className="flex items-center text-purple-400 hover:text-purple-300 transition-colors">
            <LayoutDashboard className="w-8 h-8 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3 font-bold text-lg text-white whitespace-nowrap">My App</span>}
          </Link>
        </div>

        {/* Navigation Links (Desktop) */}
        <nav className="flex-1 overflow-y-auto py-4">
          {links.length > 0 && (
            <ul className="flex flex-col space-y-2 px-3">
              {links.map((link) => {
                const isActive = pathname === link.path
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={(e) => {
                        if (isActive) e.preventDefault()
                      }}
                      className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                          ? 'text-purple-300 bg-purple-500/20'
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      title={isCollapsed ? link.label : undefined}
                    >
                      <link.icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''}`} />
                      {!isCollapsed && (
                        <span className="ml-3 font-medium">{link.label}</span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Import PDF Button (Desktop) */}
          <div className="flex justify-center py-4 border-t border-b border-white/10 flex-shrink-0 mt-4 mb-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-full bg-white/5 hover:bg-white/10 border border-white/20 flex items-center justify-center transition-all group ${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'
                }`}
              title="Import Book/PDF"
            >
              <Plus className={`${isCollapsed ? 'w-5 h-5' : 'w-6 h-6'} text-white/70 group-hover:text-white transition-colors`} />
            </button>
          </div>
        </nav>

        {/* Account Section at the Bottom (Desktop) */}
        <div className="p-3 border-t border-white/10">
          <Link
            href="/account"
            className="flex items-center w-full p-2 hover:bg-white/10 rounded-xl transition-colors group"
          >
            <div className="relative w-10 h-10 rounded-full bg-purple-500/30 border border-purple-500/50 flex-shrink-0 overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" fill sizes="40px" className="object-cover" unoptimized />
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
            <div className="text-white font-medium mb-6 text-lg">Uploading File...</div>
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

      {/* Category Selection Modal */}
      {pendingUploadFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/10 p-8 rounded-2xl flex flex-col max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Import Book</h2>
            <p className="text-white/60 text-sm mb-6">Review the title and select a category for this book.</p>
            
            <div className="flex flex-col gap-2 mb-6">
              <label className="text-sm text-white/80 font-medium">Book Title</label>
              <input 
                type="text" 
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="Enter book title"
                className="w-full bg-black border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <label className="text-sm text-white/80 font-medium mb-2">Select a Category</label>
            <div className="flex flex-wrap gap-2 mb-6">
              {['Fiction', 'Non-Fiction', 'Sci-Fi', 'Biography', 'Fantasy', 'Romance', 'Self-Help'].map(cat => (
                <button
                  key={cat}
                  onClick={() => performUpload(cat)}
                  className="px-4 py-2 rounded-xl border border-white/20 hover:border-purple-500 hover:bg-purple-500/20 text-white text-sm transition-all"
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-white/80 font-medium">Or enter a custom category:</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  placeholder="e.g. Cookbooks"
                  className="flex-1 bg-black border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => performUpload(customCategory)}
                  disabled={!customCategory.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                >
                  Upload
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => {
                setPendingUploadFile(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className="mt-6 text-white/50 hover:text-white transition-colors text-sm self-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
