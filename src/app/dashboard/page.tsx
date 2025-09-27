import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { 
  ChefHat, 
  BookOpen, 
  Clock, 
  Award, 
  Play,
  BarChart3,
  Settings,
  LogOut,
  Home,
  Users,
  MessageCircle
} from "lucide-react"
import { signOut } from "next-auth/react"
import SignOutButton from "@/components/auth/SignOutButton"
import UserDropdown from "@/components/ui/UserDropdown"

async function getUserData(userId: string) {
  const [enrollments, progress] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: true,
            category: true,
            lessons: true,
            _count: {
              select: {
                lessons: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.progress.findMany({
      where: { userId },
      include: {
        lesson: true,
        course: true
      }
    })
  ])

  return { enrollments, progress }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const { enrollments, progress } = await getUserData(session.user.id)

  // İstatistikleri hesapla
  const totalCourses = enrollments.length
  const completedLessons = progress.filter(p => p.isCompleted).length
  const totalLessons = enrollments.reduce((acc, enrollment) => 
    acc + enrollment.course._count.lessons, 0
  )
  const completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

  return (
    <div className="min-h-screen bg-black">
      {/* Desktop Header */}
      <header className="hidden md:block bg-gray-900/30 border-b border-gray-800">
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
                <Link href="/dashboard" className="text-white font-semibold">
                  Dashboard
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
                <Link href="/chef-sor" className="text-gray-300 hover:text-white transition-colors">
                  Mesajlar
                </Link>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  İletişim
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <UserDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="flex justify-between items-center py-3 px-4">
          <Link href="/home" className="flex items-center space-x-2">
            <ChefHat className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-bold text-white">Chef2.0</span>
            {session?.user?.role === 'ADMIN' && (
              <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium">Admin</span>
            )}
          </Link>
          <UserDropdown />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 md:pt-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Hoş geldin, {session.user.name}!
          </h1>
          <p className="text-gray-300">
            Gastronomi yolculuğuna devam et ve becerilerini geliştir.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-orange-500/20 p-3 rounded-full mr-4">
                <BookOpen className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalCourses}</p>
                <p className="text-sm text-gray-400">Kayıtlı Kurs</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-green-500/20 p-3 rounded-full mr-4">
                <Play className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{completedLessons}</p>
                <p className="text-sm text-gray-400">Tamamlanan Ders</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-blue-500/20 p-3 rounded-full mr-4">
                <BarChart3 className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {completionRate.toFixed(0)}%
                </p>
                <p className="text-sm text-gray-400">Tamamlama Oranı</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-orange-500/20 p-3 rounded-full mr-4">
                <Award className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-sm text-gray-400">Sertifika</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Courses */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Kurslarım</h2>
                <Link
                  href="/home"
                  className="text-orange-500 hover:text-orange-400 font-medium"
                >
                  Kursları Keşfet
                </Link>
              </div>

              {enrollments.length > 0 ? (
                <div className="space-y-4">
                  {enrollments.map((enrollment) => {
                    const courseProgress = progress.filter(p => 
                      p.courseId === enrollment.course.id
                    )
                    const completedCount = courseProgress.filter(p => p.isCompleted).length
                    const totalLessonsCount = enrollment.course._count.lessons
                    const progressPercentage = totalLessonsCount > 0 
                      ? (completedCount / totalLessonsCount) * 100 
                      : 0

                    return (
                      <div
                        key={enrollment.id}
                        className="border border-gray-700 rounded-lg p-4 hover:border-orange-500/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {enrollment.course.imageUrl ? (
                              <img
                                src={enrollment.course.imageUrl}
                                alt={enrollment.course.title}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                                <ChefHat className="h-8 w-8 text-white" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-white">
                                {enrollment.course.title}
                              </h3>
                              <p className="text-sm text-gray-400">
                                {enrollment.course.instructor.name}
                              </p>
                              <div className="flex items-center mt-2">
                                <div className="w-32 bg-gray-700 rounded-full h-2 mr-2">
                                  <div
                                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-400">
                                  {completedCount}/{totalLessonsCount} ders
                                </span>
                              </div>
                            </div>
                          </div>
                          <Link
                            href={`/learn/${enrollment.course.id}`}
                            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                          >
                            Devam Et
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Henüz kurs kaydın yok
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Gastronomi yolculuğuna başlamak için bir kursa kaydol.
                  </p>
                  <Link
                    href="/home"
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Kursları Keşfet
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Hızlı Erişim
              </h3>
              <div className="space-y-3">
                <Link
                  href="/home"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <BookOpen className="h-5 w-5 text-orange-500 mr-3" />
                  <span className="text-gray-300">Ana Sayfa</span>
                </Link>
                <Link
                  href="/dashboard/certificates"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Award className="h-5 w-5 text-orange-500 mr-3" />
                  <span className="text-gray-300">Sertifikalarım</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Settings className="h-5 w-5 text-orange-500 mr-3" />
                  <span className="text-gray-300">Ayarlar</span>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Son Aktiviteler
              </h3>
              {progress.length > 0 ? (
                <div className="space-y-3">
                  {progress
                    .sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime())
                    .slice(0, 5)
                    .map((item) => (
                        <div key={item.id} className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">
                              {item.lesson.title}
                            </p>
                            <p className="text-xs text-gray-400">
                              {item.course.title}
                            </p>
                          </div>
                        </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">
                  Henüz aktivite bulunmuyor.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-t border-gray-800">
        <div className="flex justify-around items-center py-2">
          <Link href="/home" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <Home className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Ana Sayfa</span>
          </Link>
          <Link href="/my-courses" className="flex flex-col items-center py-2 px-3 text-orange-500">
            <BookOpen className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Kurslarım</span>
          </Link>
          <Link href="/chef-sosyal" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <Users className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Sosyal</span>
          </Link>
          <Link href="/chef-sor" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">Mesajlar</span>
          </Link>
          <Link href="/contact" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">İletişim</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
