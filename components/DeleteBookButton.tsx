'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trash2, AlertTriangle } from 'lucide-react'

export function DeleteBookButton({ fileName }: Readonly<{ fileName: string }>) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [supabase] = useState(() => createClient())

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowConfirm(true)
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowConfirm(false)
  }

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsDeleting(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.storage
        .from('files')
        .remove([`${user.id}/${fileName}`])

      if (error) {
        console.error('Error deleting book:', error)
        alert('Failed to delete book')
        setIsDeleting(false)
        setShowConfirm(false)
      } else {
        localStorage.removeItem(`epub_progress_${fileName}`)
        if (localStorage.getItem('lastReadBook') === fileName) {
          localStorage.removeItem('lastReadBook')
        }
        
        // Instantly hide the parent link container without a full page rebuild
        if (buttonRef.current) {
          const linkContainer = buttonRef.current.closest('a')
          if (linkContainer) {
            linkContainer.style.display = 'none'
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Failed to delete book')
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleDeleteClick}
        disabled={isDeleting}
        className="absolute bottom-4 right-4 p-3 bg-red-500/10 hover:bg-red-500/30 text-red-500 hover:text-red-400 rounded-full transition-all duration-200 opacity-100 md:opacity-0 group-hover:opacity-100 disabled:opacity-50 z-10 flex items-center justify-center border border-transparent hover:border-red-500/30 shadow-md backdrop-blur-sm"
        title="Delete Book"
      >
        <Trash2 className="w-5 h-5 transition-transform hover:scale-110" />
      </button>

      {showConfirm && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm" 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <div 
            className="bg-[#1a1a1a] border border-red-500/20 p-8 rounded-3xl flex flex-col items-center max-w-sm w-full mx-4 shadow-2xl relative overflow-hidden"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500/50 to-orange-500/50" />
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 text-center">Delete Book?</h3>
            <p className="text-white/60 text-center mb-8">
              Are you sure you want to permanently delete this book? This action cannot be undone.
            </p>
            
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={handleCancel}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors flex items-center justify-center disabled:opacity-50 shadow-lg shadow-red-500/20"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
