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
                <div className="relative bg-black border border-gray-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 group cursor-pointer min-w-[320px] w-[320px] h-[400px] flex-shrink-0">
                  {/* Course Image - Tam kart boyutunda */}
                  {course.imageUrl ? (
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
                    </div>
                  )}

                  {/* Gradient Overlay - Alt kısımda koyu */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>

                  {/* Hover Overlay - Açıklama ile */}
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-6">
                    {/* Play Button */}
                    <div className="bg-orange-500 rounded-full p-4 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg mb-4">
                      <Play className="h-8 w-8 text-white fill-white" />
                    </div>

                    {/* Açıklama Metni */}
                    <p className="text-white/90 text-sm text-center leading-relaxed overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                    }}>
                      {course.description}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  {showProgress && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 z-10">
                      <div className="h-full bg-orange-500 w-1/3"></div>
                    </div>
                  )}

                  {/* Course Info - Görselin üstünde overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    {/* Başlık - 2 satır max */}
                    <h3 className="text-base font-bold text-white mb-2 group-hover:text-orange-500 transition-colors overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.3',
                      textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                    }}>
                      {course.title}
                    </h3>

                    {/* Alt bilgiler - Eğitmen ve Puan */}
                    <div className="flex items-center justify-between">
                      {/* Eğitmen */}
                      <div className="flex items-center overflow-hidden">
                        <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center mr-2 flex-shrink-0">
                          <span className="text-xs font-bold text-white">
                            {course.instructor.name?.charAt(0) || "?"}
                          </span>
                        </div>
                        <span className="text-xs text-white/90 truncate" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                          {course.instructor.name || "Bilinmeyen Eğitmen"}
                        </span>
                      </div>

                      {/* Puan */}
                      <div className="flex items-center flex-shrink-0 ml-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm text-white/90 font-semibold whitespace-nowrap" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                          {averageRating.toFixed(1)}
                        </span>
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
