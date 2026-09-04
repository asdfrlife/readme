import { createClient } from '@/utils/supabase/client'

export interface Reflection {
  id: string
  bookname: string
  quote: string
  reflection: string
  created_at: string
  user_id: string
}

export async function saveReflection(reflection: { bookname: string, quote: string, reflection: string }): Promise<Reflection | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data, error } = await supabase
    .from('reflection')
    .insert([{
      ...reflection,
      user_id: user.id
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
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reflections:', error)
    return []
  }

  return data || []
}

export async function deleteReflection(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('reflection')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting reflection:', error)
  }
}
