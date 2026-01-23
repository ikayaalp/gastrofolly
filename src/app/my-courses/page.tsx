"use client"

import { useEffect, useState } from 'react'
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ChefHat, Play, Clock, BookOpen, Star, Home, Users, MessageCircle, Search } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"
import NotificationDropdown from "@/components/ui/NotificationDropdown"
import SearchModal from "@/components/ui/SearchModal"

interface Enrollment {
  id: string
  userId: string
  courseId: string
  createdAt: Date
  hasProgress: boolean
  course: {
    id: string
    title: string
    description: string
    price: number
    discountedPrice?: number
    imageUrl?: string
    instructor: {
      name: string
    }
    category: {
      name: string
    }
    lessons: Array<{
      id: string
      title: string
      duration?: number
    }>
    reviews: Array<{
      id: string
      rating: number
    }>
    _count: {
      lessons: number
      enrollments: number
    }
  }
}

export default function MyCoursesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user?.id) {
      router.push("/auth/signin")
      return
    }

    // Kursları API'den al
    fetch('/api/user/courses')
      .then(res => res.json())
      .then(data => {
        setEnrollments(data.enrollments || [])
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching courses:', error)
        setLoading(false)
      })
  }, [session, status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!session?.user?.id) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Desktop Header */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm border-b border-black">
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
              <nav className="flex space-x-6">
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
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-gray-300 hover:text-white transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
              <UserDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-sm border-b border-black">
        <div className="flex justify-between items-center py-3 px-4">
          <Link href="/home" className="flex items-center space-x-2">
            <ChefHat className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-bold text-white">Chef2.0</span>
          </Link>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-gray-300 hover:text-white transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
            <NotificationDropdown />
            <UserDropdown />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 md:pt-24 pb-20 md:pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Kurslarım</h1>
        </div>

        {enrollments.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-24 w-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Henüz kursunuz yok</h2>
            <p className="text-gray-400 mb-8">
              İlk kursunuzu satın alarak öğrenmeye başlayın!
            </p>
            <Link
              href="/home"
              className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              Kursları Keşfet
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {enrollments.map((enrollment) => {
              const course = enrollment.course
              const totalLessons = course._count.lessons
              const completedLessons = 0 // Bu değer gerçek uygulamada veritabanından gelecek
              const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

              // Rating hesaplama
              const averageRating = course.reviews.length > 0
                ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
                : 0

              return (
                <Link
                  key={enrollment.id}
                  href={`/learn/${course.id}`}
                  className="group block"
                >
                  <div className="relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 group-hover:border-orange-500/30 transition-all duration-500 shadow-xl">
                    {/* Aspect Ratio Container */}
                    <div className="aspect-[1.618/1] relative w-full">
                      {course.imageUrl ? (
                        <Image
                          src={course.imageUrl}
                          alt={course.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <ChefHat className="h-12 w-12 text-gray-600" />
                        </div>
                      )}

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />

                      {/* Content Overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col justify-end h-full">
                        <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                          {/* Play Icon on Hover */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <div className="w-12 h-12 rounded-full bg-orange-600/90 flex items-center justify-center backdrop-blur-sm shadow-lg">
                              <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                            </div>
                          </div>

                          <h3 className="text-white font-bold text-lg leading-tight mb-2 group-hover:text-orange-50 transition-colors line-clamp-2">
                            {course.title}
                          </h3>

                          <div className="flex items-center space-x-2 mb-3">
                            <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                              <ChefHat className="h-3 w-3 text-white" />
                            </div>
                            <p className="text-gray-300 text-xs font-medium">{course.instructor.name}</p>
                          </div>

                          {/* Progress Bar */}
                          {enrollment.hasProgress && progressPercentage > 0 ? (
                            <div className="w-full bg-gray-700/50 rounded-full h-1 backdrop-blur-sm overflow-hidden">
                              <div
                                className="bg-orange-500 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                              ></div>
                            </div>
                          ) : (
                            <div className="w-full h-1"></div> /* Spacer to keep height consistent */
                          )}

                          {enrollment.hasProgress && progressPercentage > 0 && (
                            <p className="text-[10px] text-gray-400 mt-1 text-right">
                              %{Math.round(progressPercentage)} tamamlandı
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-t border-black">
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
            <span className="text-xs font-medium mt-1">Chef&apos;e Sor</span>
          </Link>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  )
}
