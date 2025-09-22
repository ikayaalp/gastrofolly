"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  ChefHat, 
  Play, 
  CheckCircle, 
  Clock, 
  X,
  Menu,
  ArrowLeft
} from "lucide-react"

interface CourseSidebarProps {
  course: {
    id: string
    title: string
    instructor: {
      name: string | null
      image: string | null
    }
    lessons: Array<{
      id: string
      title: string
      description: string | null
      duration: number | null
      order: number
      isFree: boolean
    }>
  }
  progress: Array<{
    lessonId: string
    isCompleted: boolean
  }>
  currentLessonId: string
}

export default function CourseSidebar({ course, progress, currentLessonId }: CourseSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const router = useRouter()

  const getLessonProgress = (lessonId: string) => {
    return progress.find(p => p.lessonId === lessonId)
  }

  const completedLessons = progress.filter(p => p.isCompleted).length
  const totalLessons = course.lessons.length
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="lg:hidden fixed top-4 right-4 z-50 bg-black/50 text-white p-2 rounded-full"
      >
        {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed lg:relative top-0 right-0 h-screen lg:h-auto bg-gray-900 border-l border-gray-800 shadow-xl z-40 transition-transform duration-300
        ${isCollapsed ? 'translate-x-full lg:translate-x-0' : 'translate-x-0'}
        w-80 lg:w-96
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Link
              href={`/course/${course.id}`}
              className="flex items-center text-orange-500 hover:text-orange-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="text-sm">Kurs Detayları</span>
            </Link>
            <button
              onClick={() => setIsCollapsed(true)}
              className="lg:hidden text-gray-400 hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center space-x-3 mb-4">
            <ChefHat className="h-8 w-8 text-orange-500" />
            <div>
              <h1 className="font-bold text-white text-sm leading-tight">
                {course.title}
              </h1>
              <p className="text-xs text-gray-400">
                {course.instructor.name}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">İlerleme</span>
              <span className="text-sm text-gray-400">
                {completedLessons}/{totalLessons}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              %{Math.round(progressPercentage)} tamamlandı
            </p>
          </div>
        </div>

        {/* Lessons List */}
        <div className="p-4">
          <h2 className="font-semibold text-white mb-4">Ders İçeriği</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide hover:overflow-y-auto">
              {course.lessons.map((lesson, index) => {
                const lessonProgress = getLessonProgress(lesson.id)
                const isCompleted = lessonProgress?.isCompleted || false
                const isCurrent = lesson.id === currentLessonId

                return (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      router.push(`/learn/${course.id}?lesson=${lesson.id}`)
                      setIsCollapsed(true)
                    }}
                    className={`
                      w-full text-left p-3 rounded-lg transition-colors
                      ${isCurrent 
                        ? 'bg-orange-500/20 border border-orange-500/50' 
                        : 'hover:bg-gray-800 border border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                          ${isCompleted 
                            ? 'bg-green-500/20 text-green-500' 
                            : isCurrent
                              ? 'bg-orange-500/20 text-orange-500'
                              : 'bg-gray-700 text-gray-400'
                          }
                        `}>
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`
                            font-medium text-sm leading-tight truncate
                            ${isCurrent ? 'text-orange-500' : 'text-white'}
                          `}>
                            {lesson.title}
                          </h3>
                          {lesson.duration && (
                            <div className="flex items-center mt-1">
                              <Clock className="h-3 w-3 text-gray-500 mr-1" />
                              <span className="text-xs text-gray-400">
                                {lesson.duration} dk
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {isCurrent && (
                        <Play className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </button>
                )
              })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">
              Kursla ilgili soru ve önerileriniz için
            </p>
            <Link
              href="/contact"
              className="text-orange-500 hover:text-orange-400 text-sm font-medium"
            >
              İletişime Geçin
            </Link>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  )
}
