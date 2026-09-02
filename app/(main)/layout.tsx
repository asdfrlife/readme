import { Sidebar } from '@/components/Sidebar'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col-reverse md:flex-row h-[100dvh] overflow-hidden bg-black text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full pb-[safe-area-inset-bottom]">
        {children}
      </main>
    </div>
  )
}
