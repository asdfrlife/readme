import { Sidebar } from '@/components/Sidebar'

export default function MainLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-row h-[100dvh] overflow-hidden bg-black text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full pt-16 md:pt-0 pb-0">
        {children}
      </main>
    </div>
  )
}
