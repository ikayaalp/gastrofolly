"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  ChefHat, 
  Search,
  Bell
} from "lucide-react"
import CourseRow from "@/components/home/CourseRow"
import HeroSection from "@/components/home/HeroSection"
import UserDropdown from "@/components/ui/UserDropdown"
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
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 backdrop-blur-sm border-b border-gray-800">
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
                <Link href="/home" className="text-white font-semibold">
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
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="text-gray-300 hover:text-white transition-colors"
                title="Ara"
              >
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

      {/* Ana İçerik */}
      <main className="pt-20">
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
          />

          {/* Yeni Kurslar */}
          <CourseRow
            title="Yeni Eklenen Kurslar"
            courses={recentCourses}
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

      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </div>
  )
}
