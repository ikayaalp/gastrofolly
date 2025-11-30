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
  ArrowLeft,
  Circle
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
  const [isCollapsed, setIsCollapsed] = useState(true)
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
        className="lg:hidden fixed top-20 right-4 z-50 bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-full shadow-lg transition-colors"
      >
        {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed lg:relative top-0 right-0 h-screen bg-[#0a0a0a] border-l border-gray-800 shadow-2xl z-40 transition-transform duration-300
        ${isCollapsed ? 'translate-x-full lg:translate-x-0' : 'translate-x-0'}
        w-80 lg:w-96 flex flex-col
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-800 bg-gradient-to-b from-gray-900/50 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <Link
              href={`/course/${course.id}`}
              className="flex items-center text-orange-500 hover:text-orange-400 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Kurs Detayları</span>
            </Link>
            <button
              onClick={() => setIsCollapsed(true)}
              className="lg:hidden text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-start space-x-3 mb-6">
            <div className="bg-orange-500/10 p-2 rounded-lg flex-shrink-0">
              <ChefHat className="h-6 w-6 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-white text-base leading-tight mb-1 line-clamp-2">
                {course.title}
              </h1>
              <p className="text-xs text-gray-400">
                {course.instructor.name}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-black border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white">Kurs İlerlemesi</span>
              <span className="text-lg font-bold text-orange-500">
                %{Math.round(progressPercentage)}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2.5 mb-3">
              <div
                className="bg-gradient-to-r from-orange-600 to-orange-500 h-2.5 rounded-full transition-all duration-500 shadow-lg shadow-orange-500/50"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">
                {completedLessons} / {totalLessons} ders
              </span>
              <span className="text-gray-400">
                {totalLessons - completedLessons} kaldı
              </span>
            </div>
          </div>
        </div>

        {/* Lessons List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white text-sm">Ders İçeriği</h2>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
              {totalLessons} ders
            </span>
          </div>

          <div className="space-y-2">
            {course.lessons.map((lesson, index) => {
              const lessonProgress = getLessonProgress(lesson.id)
              const isLessonCompleted = lessonProgress?.isCompleted || false
              const isCurrent = lesson.id === currentLessonId

              return (
                <button
                  key={lesson.id}
                  onClick={() => {
                    router.push(`/learn/${course.id}?lesson=${lesson.id}`)
                    setIsCollapsed(true)
                  }}
                  className={`
                    w-full text-left p-3 rounded-lg transition-all group
                    ${isCurrent
                      ? 'bg-orange-500/10 border border-orange-500/50 shadow-lg shadow-orange-500/10'
                      : 'hover:bg-gray-900 border border-transparent hover:border-gray-800'
                    }
                  `}
                >
                  <div className="flex items-start space-x-3">
                    {/* Lesson Number/Status Icon */}
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all
                      ${isLessonCompleted
                        ? 'bg-green-500/10 border border-green-500/30'
                        : isCurrent
                          ? 'bg-orange-500/10 border border-orange-500/30'
                          : 'bg-gray-800 border border-gray-700'
                      }
                    `}>
                      {isLessonCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : isCurrent ? (
                        <Play className="h-5 w-5 text-orange-500" />
                      ) : (
                        <span className="text-sm font-bold text-gray-400">{index + 1}</span>
                      )}
                    </div>

                    {/* Lesson Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`
                        font-semibold text-sm leading-tight mb-1 line-clamp-2
                        ${isCurrent ? 'text-orange-500' : 'text-white group-hover:text-orange-400'}
                        transition-colors
                      `}>
                        {lesson.title}
                      </h3>

                      <div className="flex items-center space-x-3 mt-2">
                        {lesson.duration && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-400">
                              {lesson.duration} dk
                            </span>
                          </div>
                        )}

                        {isLessonCompleted && (
                          <span className="text-xs text-green-500 font-medium">
                            ✓ Tamamlandı
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Current Indicator */}
                    {isCurrent && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gradient-to-t from-gray-900/50 to-transparent">
          <div className="bg-black border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-3">
              Kursla ilgili soru ve önerileriniz için
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              İletişime Geçin
            </Link>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-30"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  )
}
