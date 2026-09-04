'use client'

import dynamic from 'next/dynamic'

const EpubThumbnailClient = dynamic(() => import('./EpubThumbnailClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[200px] sm:w-[133px] sm:h-[252px] bg-white/5 flex items-center justify-center flex-shrink-0 relative border-b sm:border-b-0 sm:border-r border-white/10">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

export function EpubThumbnail({ url, fileName }: Readonly<{ url: string, fileName: string }>) {
  return <EpubThumbnailClient url={url} fileName={fileName} />
}
