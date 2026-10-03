import { createClient } from '@/utils/supabase/server'
import { ClientBookList } from '@/components/ClientBookList'

export default async function NewHomePage() {
  const supabase = await createClient()
  
  // Fetch user
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let epubFiles: any[] = []
  const signedUrls: Record<string, string> = {}

  if (user) {
    const { data: files } = await supabase.storage
      .from('files')
      .list(user.id)
    
    // Filter out standard placeholder files (like .emptyFolderPlaceholder) if they exist
    epubFiles = files ? files.filter(f => f.name.toLowerCase().endsWith('.epub') || f.name.toLowerCase().endsWith('.pdf')) : []
    const allFileNames = new Set(files ? files.map(f => f.name) : [])

    if (epubFiles.length > 0) {
      const pathsToSign: string[] = []
      
      epubFiles.forEach(f => {
        pathsToSign.push(`${user.id}/${f.name}`)
        if (allFileNames.has(`${f.name}.jpg`)) {
          pathsToSign.push(`${user.id}/${f.name}.jpg`)
        }
      })

      const { data: urls } = await supabase.storage.from('files').createSignedUrls(pathsToSign, 3600)
      
      if (urls) {
        urls.forEach((urlObj, idx) => {
          const fileName = pathsToSign[idx].split('/').pop()
          if (fileName) {
            signedUrls[fileName] = urlObj.signedUrl || ''
          }
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
