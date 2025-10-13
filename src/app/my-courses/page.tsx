"use client"

import { useEffect, useState } from 'react'
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ChefHat, Play, Clock, BookOpen, Star, ArrowRight, Home, Users, MessageCircle, Search } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"

interface Enrollment {
  id: string
  userId: string
  courseId: string
  createdAt: Date
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
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
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
              <button className="p-2 text-gray-300 hover:text-white transition-colors">
                <Search className="h-5 w-5" />
              </button>
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
          </Link>
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-300 hover:text-white transition-colors">
              <Search className="h-5 w-5" />
            </button>
            <UserDropdown />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16 md:pt-8 pb-20 md:pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Kurslarım</h1>
          <p className="text-gray-400">
            Kayıtlı olduğunuz kurslar ve ilerleme durumunuz
          </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => {
              const course = enrollment.course
              const totalLessons = course._count.lessons
              const completedLessons = 0 // Bu değer gerçek uygulamada veritabanından gelecek
              const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

              return (
                <div
                  key={enrollment.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-colors"
                >
                  {/* Course Image */}
                  <div className="relative mb-4">
                    {course.imageUrl ? (
                      <Image
                        src={course.imageUrl}
                        alt={course.title}
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                        <ChefHat className="h-16 w-16 text-white" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium">
                        {course.category.name}
                      </span>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">
                      Eğitmen: {course.instructor.name}
                    </p>
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {course.description}
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>İlerleme</span>
                      <span>{completedLessons}/{totalLessons} ders</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      %{Math.round(progressPercentage)} tamamlandı
                    </p>
                  </div>

                  {/* Course Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.lessons.length} ders</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{course._count.enrollments} öğrenci</span>
                    </div>
                  </div>

                  {/* Continue Button */}
                  <Link
                    href={`/learn/${course.id}`}
                    className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Devam Et
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800">
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
        </div>
      </div>
    </div>
  )
}