export default function Loading() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin shadow-lg" />
        <span className="text-white/50 text-sm font-medium animate-pulse">Loading...</span>
      </div>
    </div>
  )
}
