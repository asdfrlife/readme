'use client'

import dynamic from 'next/dynamic'

const EpubViewerClient = dynamic(() => import('./EpubViewerClient'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 w-full h-full bg-[#121212] flex flex-col items-center justify-center relative border border-white/10 rounded-2xl">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-white/70">Loading EPUB Viewer...</p>
    </div>
  ),
})

export function EpubViewer({ url, fileName }: { url: string, fileName: string }) {
  return <EpubViewerClient url={url} fileName={fileName} />
}
