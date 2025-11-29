"use client"

import Link from "next/link"
import { Star, Play, ChevronLeft, ChevronRight } from "lucide-react"
import { useRef, useState, useEffect } from "react"

interface Course {
  id: string
  title: string
  description: string
  price: number
  discountRate?: number | null
  discountedPrice?: number | null
  imageUrl?: string | null
  level: string
  duration?: number | null
  instructor: {
    name?: string | null
    image?: string | null
  }
  category: {
    name: string
  }
  reviews: Array<{
    rating: number
  }>
  _count: {
    enrollments: number
    lessons: number
  }
}

interface CourseRowProps {
  title: string
  courses: Course[]
  showProgress?: boolean
}

export default function CourseRow({ title, courses, showProgress = false }: CourseRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [showControls, setShowControls] = useState(false)

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    checkScrollability()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollability)
      return () => container.removeEventListener('scroll', checkScrollability)
    }
  }, [courses])

  if (!courses || courses.length === 0) {
    return null
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      })
    }
  }

  const calculateAverageRating = (reviews: Array<{ rating: number }>) => {
    if (!reviews || reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return sum / reviews.length
  }

  return (
    <div className="w-full">
      <div className="mb-6 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Sol Ok */}
        {canScrollLeft && showControls && (
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-all duration-200 shadow-lg"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Sağ Ok */}
        {canScrollRight && showControls && (
          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-all duration-200 shadow-lg"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide space-x-4 pb-4 px-4 sm:px-6 lg:px-8"
        >
          {courses.map((course) => {
            const averageRating = calculateAverageRating(course.reviews)
            const linkHref = showProgress ? `/learn/${course.id}` : `/course/${course.id}`

            return (
              <Link key={course.id} href={linkHref}>
                <div className="bg-black border border-gray-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 group cursor-pointer min-w-[320px] w-[320px] flex-shrink-0">
                  {/* Course Image - Büyütüldü */}
                  <div className="relative h-64 bg-black overflow-hidden">
                    {course.imageUrl ? (
                      <img
                        src={course.imageUrl}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="h-12 w-12 text-gray-500" />
                      </div>
                    )}

                    {/* Hover Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="bg-orange-500 rounded-full p-4 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg animate-pulse group-hover:animate-none">
                        <Play className="h-8 w-8 text-white fill-white" />
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {showProgress && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                        <div className="h-full bg-orange-500 w-1/3"></div>
                      </div>
                    )}
                  </div>

                  {/* Course Info - Sadeleştirilmiş */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-orange-500 transition-colors overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.4',
                      minHeight: '2.8em',
                      maxHeight: '2.8em'
                    }}>
                      {course.title}
                    </h3>

                    {/* Sadece Rating ve Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm text-gray-400">
                          {averageRating.toFixed(1)} ({course.reviews.length})
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        {course.discountedPrice && course.discountRate ? (
                          <>
                            <span className="text-lg font-bold text-green-400">
                              ₺{course.discountedPrice.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-400 line-through">
                                ₺{course.price.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </span>
                              <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded">
                                %{course.discountRate.toFixed(0)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-orange-500">
                            ₺{course.price.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
