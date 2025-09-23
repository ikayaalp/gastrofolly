import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ChefHat, Play, Clock, BookOpen, Star, ArrowRight } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"

async function getUserCourses(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          instructor: true,
          category: true,
          lessons: true,
          reviews: true,
          _count: { select: { lessons: true, enrollments: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Her enrollment için progress bilgisini ayrı ayrı çek
  const enrollmentsWithProgress = await Promise.all(
    enrollments.map(async (enrollment) => {
      const progress = await prisma.progress.findMany({
        where: {
          userId,
          courseId: enrollment.courseId
        },
        include: {
          lesson: true
        }
      })

      return {
        ...enrollment,
        progress
      }
    })
  )

  return enrollmentsWithProgress
}

export default async function MyCoursesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const enrollments = await getUserCourses(session.user.id)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900/30 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
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
                <Link href="/my-courses" className="text-white font-semibold">
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
              <UserDropdown />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Kurslarım</h1>
          <p className="text-gray-400">
            Kayıtlı olduğunuz kurslar ve ilerleme durumunuz
          </p>
        </div>

        {enrollments.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              Henüz hiç kurs almamışsınız
            </h3>
            <p className="text-gray-500 mb-6">
              Gastronomi yolculuğunuza başlamak için kurslarımızı keşfedin
            </p>
            <Link
              href="/home"
              className="inline-flex items-center bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Kursları Keşfet
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => {
              const course = enrollment.course
              const completedLessons = enrollment.progress.length
              const totalLessons = course.lessons.length
              const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
              
              const averageRating = course.reviews && course.reviews.length > 0
                ? course.reviews.reduce((acc, review) => acc + review.rating, 0) / course.reviews.length
                : 0

              return (
                <div key={enrollment.id} className="bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-800 hover:border-orange-500 transition-colors">
                  <div className="relative h-48 w-full">
                    <Image
                      src={course.imageUrl || "/api/placeholder/400/240"}
                      alt={course.title}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-t-xl"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                      <Link
                        href={`/learn/${course.id}`}
                        className="bg-orange-600 rounded-full p-4 hover:bg-orange-700 transition-colors"
                      >
                        <Play className="h-8 w-8 text-white" />
                      </Link>
                    </div>

                    {/* Progress Badge */}
                    <div className="absolute top-3 right-3">
                      <div className="bg-black/70 text-white text-xs px-3 py-1 rounded-full">
                        %{Math.round(progressPercentage)} Tamamlandı
                      </div>
                    </div>

                    {/* Category Badge */}
                    {course.category && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded">
                          {course.category.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3">
                      {course.instructor.name}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span>{averageRating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.duration ? `${Math.floor(course.duration / 60)}s ${course.duration % 60}dk` : 'N/A'}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>İlerleme</span>
                        <span>{completedLessons}/{totalLessons} Ders</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-orange-500 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        href={`/learn/${course.id}`}
                        className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg text-center font-semibold hover:bg-orange-700 transition-colors"
                      >
                        {progressPercentage > 0 ? 'Devam Et' : 'Başla'}
                      </Link>
                      <Link
                        href={`/course/${course.id}`}
                        className="flex-1 border border-gray-600 text-gray-300 py-2 px-4 rounded-lg text-center font-semibold hover:border-orange-500 hover:text-orange-500 transition-colors"
                      >
                        Detaylar
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 border-t border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p>&copy; 2024 Chef2.0. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  )
}
