"use client"

import { useState } from "react"
import { Plus, Edit2, ListVideo, Trash2, Search, Filter, Play, Users, Eye, EyeOff, Settings } from "lucide-react"
import Image from "next/image"
import UnifiedCourseEditor from "./UnifiedCourseEditor"

interface Course {
  id: string
  title: string
  description: string
  imageUrl: string | null
  level: string
  duration: number | null
  isPublished: boolean
  accessibleByPlans: string[]
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

const SUBSCRIPTION_PLANS: Record<string, { label: string, color: string }> = {
  'COMMIS': { label: 'Commis', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  'CHEF_DE_PARTIE': { label: 'Chef de P.', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  'EXECUTIVE': { label: 'Executive', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' }
}

export default function CourseManagement({ initialCourses, categories, instructors }: CourseManagementProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL")
  const [loading, setLoading] = useState<string | null>(null)

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  // New Unified Editor State
  const [showUnifiedEditor, setShowUnifiedEditor] = useState(false)

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.name?.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterStatus === "ALL") return matchesSearch
    if (filterStatus === "PUBLISHED") return matchesSearch && course.isPublished
    if (filterStatus === "DRAFT") return matchesSearch && !course.isPublished
    return matchesSearch
  })

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

  const handleCreateCourse = () => {
    setSelectedCourse(null)
    setShowUnifiedEditor(true)
  }

  const handleManageCourse = (course: Course) => {
    setSelectedCourse(course)
    setShowUnifiedEditor(true)
  }

  return (
    <div className="space-y-8">
      {/* Search & filters */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-neutral-900/50 p-4 rounded-2xl border border-white/5">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto flex-1">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <input
              type="text"
              placeholder="Kurs veya eğitmen ara..."
              className="w-full bg-black border border-gray-800 text-white pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-black border border-gray-800 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 appearance-none min-w-[140px]"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="PUBLISHED">Yayında</option>
            <option value="DRAFT">Taslak</option>
          </select>
        </div>
        <button
          onClick={handleCreateCourse}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center space-x-2 shadow-lg shadow-orange-900/20"
        >
          <Plus className="h-5 w-5" />
          <span>Yeni Kurs</span>
        </button>
      </div>

      {/* Course List */}
      <div className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left bg-black/20">
                <th className="py-4 px-6 font-semibold text-gray-400 text-sm">Kurs Bilgisi</th>
                <th className="py-4 px-6 font-semibold text-gray-400 text-sm">Eğitmen</th>
                <th className="py-4 px-6 font-semibold text-gray-400 text-sm">İstatistikler</th>
                <th className="py-4 px-6 font-semibold text-gray-400 text-sm">Durum</th>
                <th className="py-4 px-6 font-semibold text-gray-400 text-sm text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCourses.map((course) => {
                const videosCount = course.lessons.filter(l => l.videoUrl).length

                return (
                  <tr key={course.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-10 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                          {course.imageUrl ? (
                            <Image
                              src={course.imageUrl}
                              alt={course.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                              <Play className="h-4 w-4 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-orange-500 transition-colors">{course.title}</h3>
                          <p className="text-gray-500 text-xs mt-0.5">{course.category.name}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-800 rounded-full overflow-hidden relative">
                          {course.instructor.image ? (
                            <Image src={course.instructor.image} alt={course.instructor.name || ""} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                              {course.instructor.name?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-gray-300">{course.instructor.name}</span>
                      </div>
                    </td>



                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1" title="Kayıtlar">
                          <Users className="h-4 w-4" />
                          <span>{course._count.enrollments}</span>
                        </div>
                        <div className="flex items-center space-x-1" title="Dersler">
                          <Play className="h-4 w-4" />
                          <span>{videosCount}/{course._count.lessons}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <button
                        onClick={() => togglePublishStatus(course.id, course.isPublished)}
                        disabled={loading === course.id}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${course.isPublished
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20'
                          }`}
                      >
                        {loading === course.id && <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-current mr-1" />}
                        {course.isPublished ? 'Yayında' : 'Taslak'}
                      </button>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-100 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleManageCourse(course)}
                          className="bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 transition-colors flex items-center gap-2"
                        >
                          <Settings className="h-3 w-3" />
                          Yönet
                        </button>

                        <button
                          onClick={() => deleteCourse(course.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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

      {showUnifiedEditor && (
        <UnifiedCourseEditor
          course={selectedCourse}
          categories={categories}
          instructors={instructors}
          onClose={() => setShowUnifiedEditor(false)}
          onSaveSuccess={() => {
            setShowUnifiedEditor(false)
            if (typeof window !== 'undefined') window.location.reload()
          }}
        />
      )}
    </div>
  )
}
