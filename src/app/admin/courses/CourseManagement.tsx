"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, ListVideo, Trash2, Search, Filter, Play, Users, Eye, EyeOff, Settings, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import Image from "next/image"
import UnifiedCourseEditor from "./UnifiedCourseEditor"
import ConfirmationModal from "@/components/ui/ConfirmationModal"

interface Course {
  id: string
  title: string
  description: string
  imageUrl: string | null
  thumbnailImageUrl: string | null
  posterImageUrl: string | null
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
  _count: {
    enrollments: number
    lessons: number
    payments?: number
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
  categories: Category[]
  instructors: Instructor[]
}

interface PaginationState {
  page: number
  limit: number
  total: number
  pages: number
}

const SUBSCRIPTION_PLANS: Record<string, { label: string, color: string }> = {
  'COMMIS': { label: 'Commis', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  'CHEF_DE_PARTIE': { label: 'Chef de P.', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  'EXECUTIVE': { label: 'Executive', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' }
}

export default function CourseManagement({ categories, instructors }: CourseManagementProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL")
  const [loading, setLoading] = useState<string | null>(null)
  
  const [loadingData, setLoadingData] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, limit: 20, total: 0, pages: 1 })

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const loadData = async (currentPage: number, currentSearch: string, currentStatus: string) => {
    setLoadingData(true)
    try {
      const res = await fetch(`/api/admin/courses?page=${currentPage}&limit=20&search=${encodeURIComponent(currentSearch)}&status=${currentStatus}`)
      if (res.ok) {
        const data = await res.json()
        setCourses(data.courses)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Kurslar yüklenirken hata:", error)
    } finally {
      setLoadingData(false)
    }
  }

  // Debounced search & filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(page, searchTerm, filterStatus)
    }, 300)

    return () => clearTimeout(timer)
  }, [page, searchTerm, filterStatus])

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [searchTerm, filterStatus])

  // Sub-components state
  const [showUnifiedEditor, setShowUnifiedEditor] = useState(false)

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null)

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
        // Refresh the list from the server to ensure consistency
        loadData(page, searchTerm, filterStatus)
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

  const handleDeleteClick = (courseId: string) => {
    setCourseToDelete(courseId)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return

    setLoading(courseToDelete)
    try {
      const response = await fetch(`/api/admin/courses/${courseToDelete}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Refresh the list from the server to ensure consistency
        loadData(page, searchTerm, filterStatus)
      } else {
        alert('Kurs silinemedi')
      }
    } catch (error) {
      console.error('Delete course error:', error)
      alert('Bir hata oluştu')
    } finally {
      setLoading(null)
      setShowDeleteModal(false)
      setCourseToDelete(null)
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
      {loadingData ? (
        <div className="flex justify-center items-center h-64 bg-neutral-900/50 border border-white/5 rounded-2xl">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : (
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
              {courses.map((course) => {
                const videosCount = course.lessons.filter(l => l.videoUrl).length

                return (
                  <tr key={course.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-11 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
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
                          onClick={() => handleDeleteClick(course.id)}
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
        
        {/* Pagination Controls */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Toplam <span className="font-medium text-white">{pagination.total}</span> sonuçtan <span className="font-medium text-white">{(page - 1) * pagination.limit + 1}-{Math.min(page * pagination.limit, pagination.total)}</span> arası gösteriliyor
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-white px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                  {page} / {pagination.pages}
                </span>
              </div>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="p-2 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
      )}

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

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Kursu Sil"
        message={
          (() => {
            const course = courses.find(c => c.id === courseToDelete)
            const paymentsCount = course?._count?.payments || 0
            if (paymentsCount > 0) {
              return `Bu kursu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz. Bu kursa bağlı ${paymentsCount} ödeme kaydı da kalıcı olarak silinecek.`
            }
            return "Bu kursu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
          })()
        }
        confirmText="Evet, Sil"
        isDanger={true}
        isLoading={loading === courseToDelete}
      />
    </div>
  )
}
