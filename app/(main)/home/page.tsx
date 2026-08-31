export default function NewHomePage() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-black">
      <div className="w-full max-w-2xl border border-white/20 p-10 rounded-2xl bg-white/5 backdrop-blur-md flex flex-col items-center text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Welcome Home</h1>
        <p className="text-white/60 mb-8">
          This is your new dashboard homepage. The sidebar is now managing navigation!
        </p>
      </div>
    </div>
  )
}
