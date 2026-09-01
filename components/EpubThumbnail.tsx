'use client'

import dynamic from 'next/dynamic'

const EpubThumbnailClient = dynamic(() => import('./EpubThumbnailClient'), {
  ssr: false,
  loading: () => (
    <div className="w-[133px] h-[252px] bg-white/5 flex items-center justify-center flex-shrink-0 relative border-r border-white/10">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

export function EpubThumbnail({ url }: { url: string }) {
  return <EpubThumbnailClient url={url} />
}
