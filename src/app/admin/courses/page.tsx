import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ChefHat, Home, BookOpen, Users, MessageCircle } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"
import CourseManagement from "./CourseManagement"

async function getAllCourses() {
  const courses = await prisma.course.findMany({
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      category: {
        select: {
          name: true,
          id: true
        }
      },
      lessons: {
        select: {
          id: true,
          title: true,
          description: true,
          videoUrl: true,
          duration: true,
          order: true,
          isFree: true
        },
        orderBy: {
          order: 'asc'
        }
      },
      reviews: {
        select: {
          rating: true
        }
      },
      _count: {
        select: {
          enrollments: true,
          lessons: true,
          reviews: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return courses
}

async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: 'asc'
    }
  })

  return categories
}

async function getInstructors() {
  const instructors = await prisma.user.findMany({
    where: {
      role: 'INSTRUCTOR'
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  return instructors
}

export default async function CourseManagementPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect("/auth/signin")
  }

  const [courses, categories, instructors] = await Promise.all([
    getAllCourses(),
    getCategories(),
    getInstructors()
  ])

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
                <span className="bg-orange-600 text-white px-2 py-1 rounded text-sm font-medium">Admin</span>
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link href="/home" className="text-gray-300 hover:text-white transition-colors">
                  Ana Sayfa
                </Link>
                <Link href="/my-courses" className="text-gray-300 hover:text-white transition-colors">
                  Kurslarım
                </Link>
                <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">
                  Admin Paneli
                </Link>
                <Link href="/admin/courses" className="text-white font-semibold">
                  Kurs Yönetimi
                </Link>
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

      {/* Page Title */}
      <div className="pt-20 bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white">Kurs Yönetimi</h1>
          <p className="text-gray-400 mt-2">Kursları oluşturun, düzenleyin ve yönetin</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CourseManagement 
          courses={courses}
          categories={categories}
          instructors={instructors}
        />
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-t border-gray-800">
        <div className="flex justify-around items-center py-2">
          <Link href="/home" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
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
          <Link href="/contact" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
            <MessageCircle className="h-6 w-6" />
            <span className="text-xs font-medium mt-1">İletişim</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
