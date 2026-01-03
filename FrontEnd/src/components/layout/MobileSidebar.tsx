'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LayoutDashboard, PlusCircle, LineChart, Trophy, Lightbulb, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const routes = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', color: 'text-sky-500' },
  { label: 'Track', icon: PlusCircle, href: '/track', color: 'text-violet-500' },
  { label: 'Insights', icon: LineChart, href: '/insights', color: 'text-pink-700' },
  { label: 'Achievements', icon: Trophy, href: '/achievements', color: 'text-orange-500' },
  { label: 'Recommendations', icon: Lightbulb, href: '/recommendations', color: 'text-emerald-500' },
]

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>
      
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-slate-900 p-4">
            <div className="flex items-center justify-between mb-8">
              <Link href="/dashboard" className="text-2xl font-bold text-emerald-400">
                🌱 EcoWisely
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-1">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => setIsOpen(false)}
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
            <div className="absolute bottom-4 left-4 right-4">
              <button className="flex items-center w-full p-3 text-sm font-medium text-red-400 hover:bg-white/10 rounded-lg">
                <LogOut className="h-5 w-5 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
