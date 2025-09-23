import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ChefHat, Search, Bell } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"
import SettingsClient from "./SettingsClient"

async function getUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          enrollments: true,
          reviews: true,
          payments: true
        }
      }
    }
  })

  return user
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const user = await getUserData(session.user.id)

  if (!user) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/home" className="flex items-center space-x-2">
                <ChefHat className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold text-white">Chef2.0</span>
                {session?.user?.role === 'ADMIN' && (
                  <span className="bg-orange-600 text-white px-2 py-1 rounded text-sm font-medium">Admin</span>
                )}
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link href="/home" className="text-gray-300 hover:text-white transition-colors">
                  Ana Sayfa
                </Link>
                <Link href="/my-courses" className="text-gray-300 hover:text-white transition-colors">
                  Kurslarım
                </Link>
                {session?.user?.role === 'ADMIN' && (
                  <>
                    <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">
                      Admin Paneli
                    </Link>
                    <Link href="/admin/courses" className="text-gray-300 hover:text-white transition-colors">
                      Kurs Yönetimi
                    </Link>
                  </>
                )}
                <Link href="/chef-sosyal" className="text-gray-300 hover:text-white transition-colors">
                  Chef Sosyal
                </Link>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  İletişim
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="text-gray-300 hover:text-white transition-colors">
                <Search className="h-5 w-5" />
              </button>
              <button className="text-gray-300 hover:text-white">
                <Bell className="h-5 w-5" />
              </button>
              <UserDropdown />
            </div>
          </div>
        </div>
      </header>


      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <SettingsClient user={user} />
      </main>
    </div>
  )
}
