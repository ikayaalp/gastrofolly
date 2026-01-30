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
  progress?: number
  course: {
    id: string
    title: string
    description: string
    price: number
    discountedPrice?: number
    imageUrl?: string
    duration?: string
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'in-progress' | 'completed'>('all')

  const filteredEnrollments = enrollments.filter(enrollment => {
    const progress = (enrollment as any).progress || 0
    if (activeFilter === 'in-progress') return progress > 0 && progress < 100
    if (activeFilter === 'completed') return progress >= 100
    return true
  })

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
    // Safety timeout to prevent infinite loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [session, status, router])

  // Don't block indefinitely on session loading
  const isLoading = (status === 'loading' && loading) || loading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Kurslarınız yükleniyor...</p>
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
                <span className="text-2xl font-bold text-white">Culinora</span>
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
            <span className="text-lg font-bold text-white">Culinora</span>
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-white">Kurslarım</h1>

          <div className="flex bg-[#111111] p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeFilter === 'all' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Tümü
            </button>
            <button
              onClick={() => setActiveFilter('in-progress')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeFilter === 'in-progress' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Devam Edenler
            </button>
            <button
              onClick={() => setActiveFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeFilter === 'completed' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Tamamlananlar
            </button>
          </div>
        </div>

        {filteredEnrollments.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-24 w-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">
              {activeFilter === 'completed' ? 'Henüz tamamladığınız kurs yok' :
                activeFilter === 'in-progress' ? 'Yarıda kalan kursunuz yok' : 'Henüz kursunuz yok'}
            </h2>
            <p className="text-gray-400 mb-8">
              {activeFilter === 'all' ? 'İlk kursunuzu satın alarak öğrenmeye başlayın!' : 'Yeni tarifler öğrenmeye devam edin!'}
            </p>
            <Link
              href="/home"
              className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              Kursları Keşfet
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredEnrollments.map((enrollment) => {
              const course = enrollment.course
              // API'den gelen gerçek progress değerini (veya enrollment içine maplenmiş halini) kullanıyoruz
              const progressPercentage = enrollment.progress || 0

              return (
                <Link
                  key={enrollment.id}
                  href={`/learn/${course.id}`}
                  className="group block w-full max-w-[95%] mx-auto md:max-w-none md:mx-0 transition-transform active:scale-[0.98]"
                >
                  <div className="relative rounded-2xl overflow-hidden bg-[#0a0a0a] border border-gray-800 group-hover:border-orange-500/30 transition-all duration-300 shadow-xl scroll-mt-20">
                    {/* Image Section */}
                    <div className="aspect-video relative w-full overflow-hidden">
                      {course.imageUrl ? (
                        <Image
                          src={course.imageUrl}
                          alt={course.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                          <ChefHat className="h-12 w-12 text-gray-700" />
                        </div>
                      )}

                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-900/40">
                          <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
                        </div>
                      </div>

                      {/* Floating Progress Chip for Mobile/Always Visible */}
                      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center space-x-1.5">
                        <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                        <span className="text-[10px] font-bold text-white leading-none">%{Math.round(progressPercentage)}</span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider bg-orange-500/10 px-2 py-0.5 rounded">
                          {course.category.name}
                        </span>
                      </div>

                      <h3 className="text-white font-bold text-lg mb-2 line-clamp-1 group-hover:text-orange-500 transition-colors">
                        {course.title}
                      </h3>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center text-[11px] text-gray-400">
                          <BookOpen className="w-3 h-3 mr-1" />
                          <span>{course._count.lessons} Ders</span>
                        </div>
                        <div className="flex items-center text-[11px] text-gray-400">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{course.duration || '0'} dk</span>
                        </div>
                      </div>

                      {/* Progress Visual */}
                      <div className="mt-4">
                        <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-orange-600 to-orange-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-2">
                          <span className="text-[10px] text-gray-500 font-medium tracking-tight">Eğitime devam et</span>
                          {progressPercentage >= 100 && (
                            <span className="text-[10px] text-green-500 font-bold">TAMAMLANDI</span>
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
