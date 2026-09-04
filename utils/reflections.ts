import { createClient } from '@/utils/supabase/client'

export interface Reflection {
  id: string // This stores the user ID in the database
  bookname: string
  quote: string
  reflection: string
  created_at: string
}

export async function saveReflection(reflection: { bookname: string, quote: string, reflection: string }): Promise<Reflection | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data, error } = await supabase
    .from('reflection')
    .insert([{
      ...reflection,
      id: user.id
    }])
    .select()
    .single()

  if (error) {
    console.error('Error saving reflection:', error)
    return null
  }

  return data
}

export async function getReflections(): Promise<Reflection[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const { data, error } = await supabase
    .from('reflection')
    .select('*')
    .eq('id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reflections:', error)
    return []
  }

  return data || []
}

export async function deleteReflection(createdAt: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  const { error } = await supabase
    .from('reflection')
    .delete()
    .eq('id', user.id) // Ensure we only delete for the current user
    .eq('created_at', createdAt)

  if (error) {
    console.error('Error deleting reflection:', error)
  }
}
