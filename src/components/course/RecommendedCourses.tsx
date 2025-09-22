"use client"

import Link from "next/link"
import { Star, Users, Clock } from "lucide-react"

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
    reviews: number
  }
  reviews: {
    rating: number
  }[]
  lessons: {
    duration: number | null
  }[]
}

interface RecommendedCoursesProps {
  courses: Course[]
  currentCourseId: string
}

export default function RecommendedCourses({ courses, currentCourseId }: RecommendedCoursesProps) {
  // Mevcut kursu hariç tut ve maksimum 3 kurs göster
  const recommendedCourses = courses
    .filter(course => course.id !== currentCourseId)
    .slice(0, 3)

  if (recommendedCourses.length === 0) {
    return null
  }

  const calculateAverageRating = (reviews: { rating: number }[]) => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return sum / reviews.length
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-6 mt-8">
      <h2 className="text-xl font-bold text-white mb-6">Önerilen Kurslar</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendedCourses.map((course) => {
          const averageRating = calculateAverageRating(course.reviews)
          const totalDuration = calculateTotalDuration(course.lessons)

          return (
            <Link
              key={course.id}
              href={`/course/${course.id}`}
              className="group"
            >
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-orange-500/50 transition-colors">
                {/* Kurs Resmi */}
                <div className="relative h-48 bg-gray-700 overflow-hidden">
                  {course.imageUrl ? (
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center">
                      <span className="text-white text-4xl font-bold">
                        {course.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  
                  {/* Kategori Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-orange-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                      {course.category.name}
                    </span>
                  </div>

                  {/* Fiyat Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-black/70 text-white px-2 py-1 rounded-full text-sm font-bold">
                      ₺{course.price.toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>

                {/* Kurs Bilgileri */}
                <div className="p-4">
                  <h3 className="font-bold text-white text-lg mb-2 group-hover:text-orange-500 transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  
                  <p className="text-gray-400 text-sm mb-3">
                    {course.instructor.name}
                  </p>

                  {course.description && (
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center space-x-4">
                      {/* Rating */}
                      {course.reviews.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span>{averageRating.toFixed(1)}</span>
                          <span>({course._count.reviews})</span>
                        </div>
                      )}

                      {/* Öğrenci Sayısı */}
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{course._count.enrollments}</span>
                      </div>
                    </div>

                    {/* Süre */}
                    {totalDuration && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{totalDuration}</span>
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
