"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    BookOpen,
    Users,
    CreditCard,

    Bell,
    ChefHat,
    LogOut,
    Camera,
    MessageCircle,
    Star
} from "lucide-react"

const sidebarItems = [
    {
        title: "Panel",
        href: "/admin",
        icon: LayoutDashboard,
        exact: true
    },
    {
        title: "Kurs Yönetimi",
        href: "/admin/courses",
        icon: BookOpen
    },
    {
        title: "Chef Sosyal",
        href: "/admin/social",
        icon: MessageCircle
    },

    {
        title: "Hikayeler",
        href: "/admin/stories",
        icon: Camera
    },
    {
        title: "Kullanıcılar",
        href: "/admin/users",
        icon: Users
    },
    {
        title: "Fenomenler",
        href: "/admin/influencers",
        icon: Star
    },
    {
        title: "Havuz & Finans",
        href: "/admin/pool",
        icon: CreditCard
    },
    {
        title: "Bildirimler",
        href: "/admin/notifications",
        icon: Bell
    }
]

interface AdminSidebarProps {
    className?: string
    onClose?: () => void
}

export default function AdminSidebar({ className, onClose }: AdminSidebarProps) {
    const pathname = usePathname()
    const { data: session } = useSession()

    return (
        <div className={cn("flex flex-col h-full bg-black border-r border-gray-800 w-64", className)}>
            <div className="p-6 flex items-center gap-1 border-b border-gray-800">
                <div className="relative w-10 h-10">
                    <Image
                        src="/logo.jpeg"
                        alt="C"
                        fill
                        className="object-contain"
                    />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight">
                        <span className="text-orange-500">ulin</span>
                        <span className="text-white">ora</span>
                    </h1>
                    <p className="text-xs text-gray-500">Yönetim Paneli</p>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {sidebarItems.filter(item => {
                        // @ts-ignore - session type extension might be missing in some setups, safe to ignore for now
                        if (session?.user?.role === 'INSTRUCTOR') {
                            return item.href === '/admin/pool'
                        }
                        return true
                    }).map((item) => {
                        const isActive = item.exact
                            ? pathname === item.href
                            : pathname.startsWith(item.href)

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-orange-600 text-white shadow-lg shadow-orange-900/20"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-400 group-hover:text-white")} />
                                <span className="font-medium">{item.title}</span>
                            </Link>
                        )
                    })}
                </nav>
            </nav>

            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center space-x-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 w-full px-4 py-3 rounded-xl transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Çıkış Yap</span>
                </button>
            </div>
        </div>
    )
}
