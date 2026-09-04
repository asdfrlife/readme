export interface Reflection {
  id: string
  bookName: string
  quote: string
  reflectionText: string
  createdAt: string
}

export function saveReflection(reflection: Omit<Reflection, 'id' | 'createdAt'>): Reflection {
  const newReflection: Reflection = {
    ...reflection,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  }

  const saved = getReflections()
  saved.unshift(newReflection) // Add to the top
  localStorage.setItem('user_reflections', JSON.stringify(saved))
  
  return newReflection
}

export function getReflections(): Reflection[] {
  if (typeof window === 'undefined') return []
  const saved = localStorage.getItem('user_reflections')
  if (!saved) return []
  try {
    return JSON.parse(saved)
  } catch {
    return []
  }
}

export function deleteReflection(id: string): void {
  const saved = getReflections()
  const updated = saved.filter(r => r.id !== id)
  localStorage.setItem('user_reflections', JSON.stringify(updated))
}
