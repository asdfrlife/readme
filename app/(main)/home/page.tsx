import { createClient } from '@/utils/supabase/server'
import { ClientBookList } from '@/components/ClientBookList'

export default async function NewHomePage() {
  const supabase = await createClient()
  
  // Fetch user
  const { data: { user } } = await supabase.auth.getUser()

  let epubFiles: any[] = []
  let signedUrls: Record<string, string> = {}

  if (user) {
    const { data: files } = await supabase.storage
      .from('files')
      .list(user.id)
    
    // Filter out standard placeholder files (like .emptyFolderPlaceholder) if they exist
    epubFiles = files ? files.filter(f => f.name.toLowerCase().endsWith('.epub') || f.name.toLowerCase().endsWith('.pdf')) : []

    if (epubFiles.length > 0) {
      const paths = epubFiles.map(f => `${user.id}/${f.name}`)
      const { data: urls } = await supabase.storage.from('files').createSignedUrls(paths, 3600)
      
      if (urls) {
        urls.forEach((urlObj, idx) => {
          signedUrls[epubFiles[idx].name] = urlObj.signedUrl || ''
        })
      }
    }
  }

  return (
    <div className="min-h-full w-full flex flex-col items-center p-4 md:p-8 bg-black">
      <ClientBookList initialFiles={epubFiles} initialUrls={signedUrls} />
    </div>
  )
}
