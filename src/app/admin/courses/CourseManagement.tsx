"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Eye, EyeOff, Play, Users, Star, Upload } from "lucide-react"
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
  courses: Course[]
  categories: Category[]
  instructors: Instructor[]
}

export default function CourseManagement({ courses, categories, instructors }: CourseManagementProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const calculateAverageRating = (reviews: Array<{ rating: number }>) => {
    if (!reviews || reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return sum / reviews.length
  }

  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return "N/A"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}s ${mins}dk`
    }
    return `${mins}dk`
  }

  const togglePublishStatus = async (courseId: string, currentStatus: boolean) => {
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
        window.location.reload()
      } else {
        alert('Kurs durumu değiştirilemedi')
      }
    } catch (error) {
      console.error('Toggle publish error:', error)
      alert('Bir hata oluştu')
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
        window.location.reload()
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
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
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

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
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

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
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

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Kurslar</h2>
        <button
          onClick={handleCreateCourse}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Yeni Kurs</span>
        </button>
      </div>

      {/* Course List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
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
            <tbody>
              {courses.map((course) => {
                const averageRating = calculateAverageRating(course.reviews)
                const videosCount = course.lessons.filter(l => l.videoUrl).length
                
                return (
                  <tr key={course.id} className="border-t border-gray-700 hover:bg-gray-800/50">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                          {course.imageUrl ? (
                            <Image
                              src={course.imageUrl}
                              alt={course.title}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
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
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {course.instructor.name?.charAt(0) || "?"}
                          </span>
                        </div>
                        <span className="text-gray-300">{course.instructor.name}</span>
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
                          ₺{course.price.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      )}
                    </td>
                    
                    <td className="py-4 px-6">
                      <button
                        onClick={() => togglePublishStatus(course.id, course.isPublished)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          course.isPublished
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}
                      >
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
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{course._count.enrollments}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Play className="h-3 w-3" />
                            <span>{course._count.lessons}</span>
                          </div>
                          <div className="flex items-center space-x-1">
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
                    
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditCourse(course)}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                          title="Kursu Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleManageLessons(course)}
                          className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"
                          title="Dersleri Yönet"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => deleteCourse(course.id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                          title="Kursu Sil"
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

      {/* Course Edit Modal */}
      {showEditModal && selectedCourse && (
        <CourseEditModal
          course={selectedCourse}
          categories={categories}
          instructors={instructors}
          onClose={() => {
            setShowEditModal(false)
            setSelectedCourse(null)
          }}
        />
      )}

      {/* Course Create Modal */}
      {showCreateModal && (
        <CourseEditModal
          course={null}
          categories={categories}
          instructors={instructors}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Lesson Management Modal */}
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
