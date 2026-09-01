'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export function DeleteBookButton({ fileName }: { fileName: string }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm('Are you sure you want to delete this book?')) return

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
      } else {
        // Also clean up local storage progress if it exists
        localStorage.removeItem(`epub_progress_${fileName}`)
        // If this was the last read book, clear it from the link logic
        if (localStorage.getItem('lastReadBook') === fileName) {
          localStorage.removeItem('lastReadBook')
        }
        router.refresh()
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Failed to delete book')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="absolute bottom-4 right-4 p-3 bg-red-500/10 hover:bg-red-500/30 text-red-500 hover:text-red-400 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50 z-10 flex items-center justify-center border border-transparent hover:border-red-500/30 shadow-md backdrop-blur-sm"
      title="Delete Book"
    >
      <Trash2 className="w-5 h-5 transition-transform hover:scale-110" />
    </button>
  )
}
