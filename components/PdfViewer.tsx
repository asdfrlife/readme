'use client'

import dynamic from 'next/dynamic'

const PdfViewerClient = dynamic(() => import('./PdfViewerClient'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 w-full h-full bg-[#121212] flex flex-col items-center justify-center relative border border-white/10 rounded-2xl">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-white/70">Loading PDF Viewer...</p>
    </div>
  ),
})

export function PdfViewer({ url, fileName }: { url: string, fileName: string }) {
  return <PdfViewerClient url={url} fileName={fileName} />
}
