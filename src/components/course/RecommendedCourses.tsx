"use client"

import Link from "next/link"
import Image from "next/image"
import { Clock, TrendingUp } from "lucide-react"

interface Course {
  id: string
  title: string
  description: string | null
  price: number
  imageUrl: string | null
  instructor: {
    name: string | null
    image: string | null
  }
  category: {
    name: string
  }
  _count: {
    enrollments: number
  }
  lessons: {
    duration: number | null
  }[]
}

interface RecommendedCoursesProps {
  courses: Course[]
  currentCourseId: string
}

export default function RecommendedCourses({ courses, currentCourseId }: RecommendedCoursesProps) {
  const recommendedCourses = courses
    .filter(course => course.id !== currentCourseId)
    .slice(0, 3)

  if (recommendedCourses.length === 0) {
    return null
  }

  const calculateTotalDuration = (lessons: { duration: number | null }[]) => {
    const totalMinutes = lessons.reduce((acc, lesson) => acc + (lesson.duration || 0), 0)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours > 0) {
      return `${hours}s ${minutes > 0 ? `${minutes}dk` : ''}`
    }
    return `${totalMinutes}dk`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="bg-orange-500/10 p-2 rounded-lg">
          <TrendingUp className="h-6 w-6 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-white">Önerilen Kurslar</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendedCourses.map((course) => {
          const totalDuration = calculateTotalDuration(course.lessons)

          return (
            <Link
              key={course.id}
              href={`/course/${course.id}`}
              className="group block"
            >
              <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 overflow-hidden hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10">
                {/* Kurs Resmi */}
                <div className="relative h-48 bg-gray-900 overflow-hidden">
                  {course.imageUrl ? (
                    <Image
                      src={course.imageUrl}
                      alt={course.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center">
                      <span className="text-white text-5xl font-bold">
                        {course.title.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Kategori Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                      {course.category.name}
                    </span>
                  </div>
                </div>

                {/* Kurs Bilgileri */}
                <div className="p-5">
                  <h3 className="font-bold text-white text-lg mb-2 group-hover:text-orange-500 transition-colors line-clamp-2 leading-tight">
                    {course.title}
                  </h3>

                  <p className="text-gray-400 text-sm mb-3">
                    {course.instructor.name}
                  </p>

                  {course.description && (
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-end text-sm">
                    {/* Süre */}
                    {totalDuration && (
                      <div className="flex items-center space-x-1 text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{totalDuration}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
