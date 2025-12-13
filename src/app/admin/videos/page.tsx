import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import VideoManagement from "./VideoManagement"
import Link from "next/link"
import { ChefHat, Home, BookOpen, Users, Wallet } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"

async function getLessonsWithoutVideos() {
  const lessons = await prisma.lesson.findMany({
    where: {
      OR: [
        { videoUrl: null },
        { videoUrl: "" }
      ]
    },
    include: {
      course: {
        select: {
          title: true,
          id: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return lessons
}

async function getAllLessons() {
  const lessons = await prisma.lesson.findMany({
    include: {
      course: {
        select: {
          title: true,
          id: true
        }
      }
    },
    orderBy: [
      { course: { title: 'asc' } },
      { order: 'asc' }
    ]
  })

  return lessons
}

export default async function VideoManagementPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect("/auth/signin")
  }

  const [lessonsWithoutVideos, allLessons] = await Promise.all([
    getLessonsWithoutVideos(),
    getAllLessons()
  ])

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/admin" className="flex items-center space-x-2">
                <ChefHat className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold text-white">Chef2.0</span>
                <span className="bg-orange-600 text-white px-2 py-1 rounded text-sm font-medium">Admin</span>
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">
                  Admin Paneli
                </Link>
                <Link href="/admin/courses" className="text-gray-300 hover:text-white transition-colors">
                  Kurs Yönetimi
                </Link>
                <Link href="/admin/users" className="text-gray-300 hover:text-white transition-colors">
                  Kullanıcı Yönetimi
                </Link>
                <Link href="/admin/pool" className="text-gray-300 hover:text-white transition-colors">
                  Havuz Yönetimi
                </Link>
                <Link href="/admin/notifications" className="text-gray-300 hover:text-white transition-colors">
                  Bildirimler
                </Link>
                <Link href="/admin/videos" className="text-white font-semibold">
                  Video Yönetimi
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <UserDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Page Title */}
      <div className="pt-20 bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white">Video Yönetimi</h1>
          <p className="text-gray-400 mt-2">Derslere video yükleyin ve yönetin</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <VideoManagement
          lessonsWithoutVideos={lessonsWithoutVideos}
          allLessons={allLessons}
        />
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-t border-gray-800">
        <div className="flex justify-around items-center py-2">
          <Link href="/admin" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <Home className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Panel</span>
          </Link>
          <Link href="/admin/courses" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <BookOpen className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Kurslar</span>
          </Link>
          <Link href="/admin/users" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <Users className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Kullanıcılar</span>
          </Link>
          <Link href="/admin/pool" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <Wallet className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Havuz</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
