"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  BookOpen, 
  Users, 
  Star, 
  Calendar,
  Play,
  Settings,
  BarChart3,
  MoreVertical,
  Search,
  Filter
} from "lucide-react"

interface Category {
  id: string
  name: string
}

interface Lesson {
  id: string
  title: string
  order: number
  duration: number
  isPublished: boolean
}

interface Course {
  id: string
  title: string
  description: string
  price: number
  imageUrl?: string
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  category: Category
  lessons: Lesson[]
  reviews: Array<{ rating: number }>
  _count: {
    enrollments: number
    lessons: number
  }
}

interface Session {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

interface Props {
  courses: Course[]
  categories: Category[]
  session: Session
}

export default function InstructorCoursesClient({ courses, categories, session }: Props) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "published" && course.isPublished) ||
                         (filterStatus === "draft" && !course.isPublished)
    
    const matchesCategory = filterCategory === "all" || course.category.id === filterCategory
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Bu kursu silmek istediğinizden emin misiniz?")) return

    try {
      const response = await fetch(`/api/instructor/courses/${courseId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error deleting course:', error)
    }
  }

  const handleTogglePublish = async (courseId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/toggle-publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublished: !currentStatus
        }),
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error toggling publish status:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Kurs Yönetimi</h1>
              <p className="text-gray-400">Kurslarınızı oluşturun ve yönetin</p>
            </div>
            <Link
              href="/instructor-dashboard/courses/new"
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Yeni Kurs</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Kurslarda ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="published">Yayında</option>
              <option value="draft">Taslak</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
            >
              <option value="all">Tüm Kategoriler</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Toplam Kurs</p>
                <p className="text-2xl font-bold text-white">{courses.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Yayında</p>
                <p className="text-2xl font-bold text-white">{courses.filter(c => c.isPublished).length}</p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Taslak</p>
                <p className="text-2xl font-bold text-white">{courses.filter(c => !c.isPublished).length}</p>
              </div>
              <Edit className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Toplam Öğrenci</p>
                <p className="text-2xl font-bold text-white">{courses.reduce((acc, c) => acc + c._count.enrollments, 0)}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Course Image */}
              <div className="relative h-48 bg-gray-700">
                {course.imageUrl ? (
                  <Image
                    src={course.imageUrl}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen className="h-16 w-16 text-gray-500" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    course.isPublished 
                      ? 'bg-green-600 text-white' 
                      : 'bg-yellow-600 text-white'
                  }`}>
                    {course.isPublished ? 'Yayında' : 'Taslak'}
                  </span>
                </div>
              </div>

              {/* Course Content */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-semibold text-lg line-clamp-1">{course.title}</h3>
                  <div className="relative">
                    <button className="text-gray-400 hover:text-white">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <span>{course.category.name}</span>
                  <span>₺{course.price}</span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{course._count.enrollments}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Play className="h-3 w-3" />
                      <span>{course._count.lessons}</span>
                    </span>
                  </div>
                  {course.reviews.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span>
                        {(course.reviews.reduce((acc, r) => acc + r.rating, 0) / course.reviews.length).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Link
                    href={`/instructor-dashboard/courses/${course.id}`}
                    className="flex-1 bg-orange-600 text-white text-center py-2 rounded hover:bg-orange-700 transition-colors text-sm"
                  >
                    Düzenle
                  </Link>
                  <Link
                    href={`/course/${course.id}`}
                    className="flex-1 bg-gray-600 text-white text-center py-2 rounded hover:bg-gray-700 transition-colors text-sm"
                  >
                    Görüntüle
                  </Link>
                  <button
                    onClick={() => handleTogglePublish(course.id, course.isPublished)}
                    className={`px-3 py-2 rounded text-sm transition-colors ${
                      course.isPublished
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {course.isPublished ? 'Gizle' : 'Yayınla'}
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Kurs Bulunamadı</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || filterStatus !== "all" || filterCategory !== "all"
                ? "Arama kriterlerinize uygun kurs bulunamadı."
                : "Henüz hiç kurs oluşturmamışsınız."}
            </p>
            <Link
              href="/instructor-dashboard/courses/new"
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>İlk Kursunuzu Oluşturun</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
