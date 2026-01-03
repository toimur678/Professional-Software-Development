import { Sidebar } from '@/components/layout/Sidebar'
import { MobileSidebar } from '@/components/layout/MobileSidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full relative bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
        <Sidebar />
      </div>
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center p-4 bg-white border-b">
        <MobileSidebar />
        <h1 className="ml-4 text-xl font-bold text-emerald-600">🌱 EcoWisely</h1>
      </div>
      
      {/* Main Content */}
      <main className="md:pl-72 pb-10">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
