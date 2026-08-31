import Link from 'next/link'

export default function ConfirmedPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md border border-white/20 p-8 rounded-lg bg-black/50 backdrop-blur-md text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-green-500/20 p-3 rounded-full">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-4 text-white">Email is confirmed!</h1>
        <p className="text-white/70 mb-8">
          Your account has been successfully verified. You can now access all features.
        </p>
        <Link 
          href="/signin" 
          className="inline-block w-full bg-white text-black font-semibold py-2 rounded hover:bg-white/90 transition-colors"
        >
          Go back to sign in page
        </Link>
      </div>
    </div>
  )
}
