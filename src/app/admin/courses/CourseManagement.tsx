"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Eye, EyeOff, Play, Users, Star, Upload, Search, Edit2, ListVideo } from "lucide-react"
import Image from "next/image"
import CourseEditModal from "./CourseEditModal"
import LessonManageModal from "./LessonManageModal"

interface Course {
  id: string
  title: string
  description: string
  price: number
  discountRate: number | null
  discountedPrice: number | null
  imageUrl: string | null
  level: string
  duration: number | null
  isPublished: boolean
  isFree: boolean
  instructor: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  category: {
    name: string
    id: string
  }
  lessons: Array<{
    id: string
    title: string
    description: string | null
    videoUrl: string | null
    duration: number | null
    order: number
    isFree: boolean
  }>
  reviews: Array<{
    rating: number
  }>
  _count: {
    enrollments: number
    lessons: number
    reviews: number
  }
}

interface Category {
  id: string
  name: string
  description: string | null
  slug: string
}

interface Instructor {
  id: string
  name: string | null
  email: string
  image: string | null
}


interface CourseManagementProps {
  initialCourses: Course[]
  categories: Category[]
  instructors: Instructor[]
}

export default function CourseManagement({ initialCourses, categories, instructors }: CourseManagementProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL")
  const [loading, setLoading] = useState<string | null>(null)

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.name?.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterStatus === "ALL") return matchesSearch
    if (filterStatus === "PUBLISHED") return matchesSearch && course.isPublished
    if (filterStatus === "DRAFT") return matchesSearch && !course.isPublished
    return matchesSearch
  })

  const calculateAverageRating = (reviews: Array<{ rating: number }>) => {
    if (!reviews || reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return sum / reviews.length
  }

  const togglePublishStatus = async (courseId: string, currentStatus: boolean) => {
    setLoading(courseId)
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/toggle-publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublished: !currentStatus
        })
      })

      if (response.ok) {
        setCourses(courses.map(c =>
          c.id === courseId ? { ...c, isPublished: !currentStatus } : c
        ))
      } else {
        alert('Kurs durumu değiştirilemedi')
      }
    } catch (error) {
      console.error('Toggle publish error:', error)
      alert('Bir hata oluştu')
    } finally {
      setLoading(null)
    }
  }

  const deleteCourse = async (courseId: string) => {
    if (!confirm('Bu kursu silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCourses(courses.filter(c => c.id !== courseId))
      } else {
        alert('Kurs silinemedi')
      }
    } catch (error) {
      console.error('Delete course error:', error)
      alert('Bir hata oluştu')
    }
  }

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course)
    setShowEditModal(true)
  }

  const handleManageLessons = (course: Course) => {
    setSelectedCourse(course)
    setShowLessonModal(true)
  }

  const handleCreateCourse = () => {
    setSelectedCourse(null)
    setShowCreateModal(true)
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <Play className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{courses.length}</p>
              <p className="text-gray-400">Toplam Kurs</p>
            </div>
          </div>
        </div>

        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500/20 p-3 rounded-lg">
              <Eye className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{courses.filter(c => c.isPublished).length}</p>
              <p className="text-gray-400">Yayında</p>
            </div>
          </div>
        </div>

        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-red-500/20 p-3 rounded-lg">
              <EyeOff className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{courses.filter(c => !c.isPublished).length}</p>
              <p className="text-gray-400">Taslak</p>
            </div>
          </div>
        </div>

        <div className="bg-black border border-gray-800 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-500/20 p-3 rounded-lg">
              <Users className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {courses.reduce((acc, course) => acc + course._count.enrollments, 0)}
              </p>
              <p className="text-gray-400">Toplam Kayıt</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <input
              type="text"
              placeholder="Kurs ara..."
              className="w-full bg-black border border-gray-800 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-black border border-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="PUBLISHED">Yayında</option>
            <option value="DRAFT">Taslak</option>
          </select>
        </div>
        <button
          onClick={handleCreateCourse}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Yeni Kurs</span>
        </button>
      </div>

      {/* Course List */}
      <div className="bg-black border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-300">Kurs</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-300">Kategori</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-300">Eğitmen</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-300">Fiyat</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-300">Durum</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-300">İstatistikler</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-300">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredCourses.map((course) => {
                const averageRating = calculateAverageRating(course.reviews)
                const videosCount = course.lessons.filter(l => l.videoUrl).length

                return (
                  <tr key={course.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 relative">
                          {course.imageUrl ? (
                            <Image
                              src={course.imageUrl}
                              alt={course.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{course.title}</h3>
                          <p className="text-gray-400 text-sm line-clamp-1">{course.description}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm">
                        {course.category.name}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase">
                          {course.instructor.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <div className="text-sm text-gray-300">{course.instructor.name || "İsimsiz"}</div>
                          <div className="text-xs text-gray-500">{course.instructor.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      {course.discountedPrice && course.discountRate ? (
                        <div className="flex flex-col">
                          <span className="text-lg font-bold text-green-400">
                            ₺{course.discountedPrice.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-400 line-through">
                              ₺{course.price.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded">
                              %{course.discountRate.toFixed(0)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-orange-500">
                          {course.price > 0 ? `₺${course.price.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : 'Ücretsiz'}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <button
                        onClick={() => togglePublishStatus(course.id, course.isPublished)}
                        disabled={loading === course.id}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${course.isPublished
                          ? 'bg-green-900/50 text-green-400 hover:bg-green-900'
                          : 'bg-yellow-900/50 text-yellow-400 hover:bg-yellow-900'
                          }`}
                      >
                        {loading === course.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                        ) : null}
                        {course.isPublished ? (
                          <span className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>Yayında</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1">
                            <EyeOff className="h-3 w-3" />
                            <span>Taslak</span>
                          </span>
                        )}
                      </button>
                    </td>

                    <td className="py-4 px-6">
                      <div className="space-y-1 text-sm text-gray-400">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1" title="Kayıtlar">
                            <Users className="h-3 w-3" />
                            <span>{course._count.enrollments}</span>
                          </div>
                          <div className="flex items-center space-x-1" title="Dersler">
                            <Play className="h-3 w-3" />
                            <span>{course._count.lessons}</span>
                          </div>
                          <div className="flex items-center space-x-1" title="Yüklenen Videolar">
                            <Upload className="h-3 w-3" />
                            <span>{videosCount}/{course._count.lessons}</span>
                          </div>
                        </div>
                        {averageRating > 0 && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span>{averageRating.toFixed(1)} ({course._count.reviews})</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditCourse(course)}
                          className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleManageLessons(course)}
                          className="text-purple-400 hover:text-purple-300 p-2 hover:bg-purple-900/20 rounded-lg transition-colors"
                          title="Dersleri Yönet"
                        >
                          <ListVideo className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => deleteCourse(course.id)}
                          className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {(showEditModal || showCreateModal) && (
        <CourseEditModal
          course={selectedCourse}
          categories={categories}
          instructors={instructors}
          onClose={() => {
            setShowEditModal(false)
            setShowCreateModal(false)
            setSelectedCourse(null)
          }}
        />
      )}

      {showLessonModal && selectedCourse && (
        <LessonManageModal
          course={selectedCourse}
          onClose={() => {
            setShowLessonModal(false)
            setSelectedCourse(null)
          }}
        />
      )}
    </div>
  )
}
