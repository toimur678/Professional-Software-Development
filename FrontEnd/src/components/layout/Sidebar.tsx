'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, PlusCircle, LineChart, Trophy, Lightbulb, LogOut, Sprout, Medal, Flame, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const routes = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', color: 'text-sky-500' },
  { label: 'Track', icon: PlusCircle, href: '/track', color: 'text-violet-500' },
  { label: 'Insights', icon: LineChart, href: '/insights', color: 'text-pink-700' },
  { label: 'Achievements', icon: Trophy, href: '/achievements', color: 'text-orange-500' },
  { label: 'Recommendations', icon: Lightbulb, href: '/recommendations', color: 'text-emerald-500' },
  { label: 'Leaderboard', icon: Medal, href: '/leaderboard', color: 'text-amber-500' },
  { label: 'Challenges', icon: Flame, href: '/challenges', color: 'text-orange-600' },
  { label: 'Community', icon: Users, href: '/community', color: 'text-blue-500' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white">
      <div className="px-3 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center pl-3 mb-14">
          <Sprout className="h-8 w-8 text-emerald-400 mr-2" />
          <h1 className="text-2xl font-bold text-emerald-400">EcoWisely</h1>
        </Link>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="px-3 py-2">
         <button 
           onClick={handleLogout}
           className="flex items-center w-full p-3 text-sm font-medium text-red-400 hover:bg-white/10 rounded-lg transition"
         >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
         </button>
      </div>
    </div>
  )
}
