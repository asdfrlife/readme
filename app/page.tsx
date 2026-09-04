/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react'

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setPreviewUrl(URL.createObjectURL(selectedFile))
      setMessage(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setMessage(null)

    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}_${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      setMessage({ type: 'success', text: 'Image uploaded successfully!' })
    } catch (error: any) {
      console.error('Error uploading image:', error.message)
      setMessage({ type: 'error', text: error.message || 'Failed to upload image' })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 text-white">
      <div className="w-full max-w-md p-8 space-y-8 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
            Upload Image
          </h1>
          <p className="text-sm text-purple-200/70">
            Select an image to save it to your Supabase storage.
          </p>
        </div>

        <div className="space-y-6">
          <div className="relative group flex justify-center w-full">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-purple-300/40 rounded-2xl cursor-pointer bg-white/5 hover:bg-white/10 hover:border-purple-300/60 transition-all duration-300 overflow-hidden"
            >
              {previewUrl ? (
                <div className="relative w-full h-full">
                  <Image src={previewUrl} alt="Preview" fill sizes="400px" className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white font-semibold">Change Image</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-10 h-10 mb-3 text-purple-300" />
                  <p className="mb-2 text-sm text-purple-200 font-medium">
                    <span className="font-bold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-purple-300/60">SVG, PNG, JPG or GIF</p>
                </div>
              )}
              <input
                id="dropzone-file"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {message.text}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:opacity-50 disabled:hover:from-purple-500 disabled:hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0"
          >
            {isUploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : (
              'Upload to Supabase'
            )}
          </button>
        </div>
      </div>
    </main>
  )
}
