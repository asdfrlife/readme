'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  ChevronLeft,
  ChevronRight,
  Home,
  User,
  LayoutDashboard,
  Settings
} from 'lucide-react'

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  const [profile, setProfile] = useState<{ name: string; username: string } | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return

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

  const links: any[] = [] // Empty for now, as Home is moved to the icon

  return (
    <aside
      className={`relative flex flex-col bg-black/40 backdrop-blur-md border-r border-white/10 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } h-screen`}
    >
      {/* Top Header */}
      <div className={`flex ${isCollapsed ? 'flex-col items-center justify-center py-4 space-y-4' : 'items-center justify-between p-4 h-16'} border-b border-white/10 transition-all`}>
        {/* Icon on Top Left (Now a link to Home) */}
        <Link href="/home" className={`flex items-center text-purple-400 hover:text-purple-300 transition-colors ${isCollapsed ? 'justify-center w-full' : ''}`}>
          <LayoutDashboard className="w-8 h-8" />
          {!isCollapsed && <span className="ml-3 font-bold text-lg text-white">My App</span>}
        </Link>

        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors ${isCollapsed ? 'bg-white/5' : ''}`}
          title={isCollapsed ? "Expand Menu" : "Collapse Menu"}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4">
        {links.length > 0 && (
          <ul className="space-y-2 px-3">
            {links.map((link) => {
              const isActive = pathname === link.href
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'text-white/60 hover:bg-white/10 hover:text-white'
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
      </nav>

      {/* Account Section at the Bottom */}
      <div className="p-3 border-t border-white/10">
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
  )
}
