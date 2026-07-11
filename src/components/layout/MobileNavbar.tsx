"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Home, BookOpen, Users, User, ChefHat, Sparkles } from "lucide-react"

import { Session } from "next-auth"

function CuliIcon({ className, strokeWidth }: { className?: string; strokeWidth?: number }) {
    return (
        <span className="relative inline-flex items-center justify-center">
            <ChefHat className={className} strokeWidth={strokeWidth} />
            <Sparkles className="absolute -top-1 -right-1.5 h-2.5 w-2.5" strokeWidth={strokeWidth} />
        </span>
    )
}

export default function MobileNavbar({ initialSession }: { initialSession?: Session | null }) {
    const pathname = usePathname()
    const { data: session, status } = useSession()

    // Use initialSession to show navbar immediately if available, avoiding flicker
    const activeSession = session || initialSession
    const isLoading = status === 'loading' && !initialSession

    if (isLoading || !activeSession) return null

    // Helper to check active state
    const isActive = (path: string) => {
        if (path === '/home' && pathname === '/') return true
        return pathname?.startsWith(path)
    }

    const tabs = [
        {
            name: 'Ana Sayfa',
            path: '/home',
            icon: Home
        },
        {
            name: 'Kurslarım',
            path: '/my-courses',
            icon: BookOpen
        },
        {
            name: 'Culi',
            path: '/chef-ai',
            icon: CuliIcon
        },
        {
            name: 'Sosyal',
            path: '/chef-sosyal',
            icon: Users
        },

    ]

    return (
        <div id="mobile-bottom-nav" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-[#1a1a1a] transition-transform duration-200">
            <div className="flex justify-around items-center py-2 pb-safe">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const active = isActive(tab.path)

                    return (
                        <Link
                            key={tab.path}
                            href={tab.path}
                            className={`flex flex-col items-center py-2 px-1 min-w-[64px] transition-colors ${active ? 'text-orange-500' : 'text-gray-400 hover:text-gray-300'
                                }`}
                        >
                            <Icon
                                className={`h-6 w-6 mb-1 ${active ? 'stroke-current' : 'stroke-current'}`}
                                strokeWidth={active ? 2.5 : 2}
                            />
                            <span className={`text-[10px] font-medium ${active ? 'text-orange-500' : 'text-gray-400'}`}>
                                {tab.name}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
