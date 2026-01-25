"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ChefHat,
  Search,
  Home,
  BookOpen,
  Users,
  MessageCircle,
  Wallet
} from "lucide-react"
import CourseRow from "@/components/home/CourseRow"
import HeroSection from "@/components/home/HeroSection"
import UserDropdown from "@/components/ui/UserDropdown"
import NotificationDropdown from "@/components/ui/NotificationDropdown"
import SearchModal from "@/components/ui/SearchModal"

interface Course {
  id: string
  title: string
  description: string
  price: number
  imageUrl?: string | null
  level: string
  duration?: number | null
  instructor: {
    name?: string | null
    image?: string | null
  }
  category: {
    name: string
  }
  reviews: Array<{
    rating: number
  }>
  _count: {
    enrollments: number
    lessons: number
  }
}

interface Category {
  id: string
  name: string
  courses: Course[]
}

interface UserEnrollment {
  course: Course
}

interface HomePageClientProps {
  featuredCourses: Course[]
  popularCourses: Course[]
  recentCourses: Course[]
  categories: Category[]
  userEnrollments: UserEnrollment[]
  session: { user: { id: string; name?: string | null; email?: string | null; image?: string | null; role?: string } } | null
}

export default function HomePageClient({
  featuredCourses,
  popularCourses,
  recentCourses,
  categories,
  userEnrollments,
  session
}: HomePageClientProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Desktop Header */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/home" className="flex items-center space-x-2">
                <ChefHat className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold text-white">Culinora</span>
                {session?.user?.role === 'INSTRUCTOR' && (
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">Eğitmen</span>
                )}
                {session?.user?.role === 'ADMIN' && (
                  <span className="bg-orange-600 text-white px-2 py-1 rounded text-sm font-medium">Admin</span>
                )}
              </Link>
              <nav className="flex space-x-6">
                {session?.user?.role === 'ADMIN' ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <Link href="/home" className="text-white font-semibold">
                      Ana Sayfa
                    </Link>
                    <Link href="/my-courses" className="text-gray-300 hover:text-white transition-colors">
                      Kurslarım
                    </Link>
                    {session?.user?.role === 'INSTRUCTOR' && (
                      <Link href="/instructor-dashboard" className="text-gray-300 hover:text-white transition-colors">
                        Panelim
                      </Link>
                    )}
                    <Link href="/chef-sosyal" className="text-gray-300 hover:text-white transition-colors">
                      Chef Sosyal
                    </Link>
                    <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                      İletişim
                    </Link>
                  </>
                )}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-gray-300 hover:text-white transition-colors"
                title="Ara"
              >
                <Search className="h-5 w-5" />
              </button>
              <NotificationDropdown />
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

      {/* Ana İçerik */}
      <main className="pt-16 md:pt-20 pb-20 md:pb-0">
        {/* Hero Section */}
        {featuredCourses.length > 0 && (
          <HeroSection courses={featuredCourses} />
        )}

        {/* Kurs Satırları */}
        <div className="space-y-8 pb-12">
          {/* Devam Et */}
          {userEnrollments.length > 0 && (
            <CourseRow
              title="Kaldığın Yerden Devam Et"
              courses={userEnrollments.map(e => e.course)}
              showProgress={true}
            />
          )}

          {/* Öne Çıkan Kurslar */}
          <CourseRow
            title="Öne Çıkan Kurslar"
            courses={featuredCourses}
          />

          {/* Popüler Kurslar */}
          <CourseRow
            title="Popüler Kurslar"
            courses={popularCourses}
            showRanking={true}
          />

          {/* Yeni Kurslar */}
          <CourseRow
            title="Yeni Eklenen Kurslar"
            courses={recentCourses}
            largeCards={true}
          />

          {/* Kategorilere Göre */}
          {categories.map((category) => (
            category.courses.length > 0 && (
              <CourseRow
                key={category.id}
                title={category.name}
                courses={category.courses}
              />
            )
          ))}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-800">
        <div className="flex justify-around items-center py-2">
          {session?.user?.role === 'ADMIN' ? (
            <>
              <Link href="/admin" className="flex flex-col items-center py-2 px-3 text-orange-500">
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
            </>
          ) : (
            <>
              <Link href="/home" className="flex flex-col items-center py-2 px-3 text-orange-500">
                <Home className="h-6 w-6" />
                <span className="text-xs font-medium mt-1">Ana Sayfa</span>
              </Link>
              <Link href="/my-courses" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
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
            </>
          )}
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
