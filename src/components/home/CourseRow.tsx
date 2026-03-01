"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import ExpandableCourseCard from "./ExpandableCourseCard"

interface Course {
  id: string
  title: string
  description: string
  price: number
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
  reviews?: Array<{
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
  showRanking?: boolean
  largeCards?: boolean
}

export default function CourseRow({ title, courses, showProgress = false, showRanking = false, largeCards = false }: CourseRowProps) {
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

  return (
    <div className="w-full relative z-0">
      <div className="mb-4 px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{title}</h2>
      </div>

      <div
        className="group/row relative"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Sol Ok */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className={`absolute left-0 top-0 bottom-0 z-40 bg-black/50 hover:bg-black/70 text-white w-12 flex items-center justify-center transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0'}`}
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
        )}

        {/* Sağ Ok */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className={`absolute right-0 top-0 bottom-0 z-40 bg-black/50 hover:bg-black/70 text-white w-12 flex items-center justify-center transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0'}`}
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className={`flex overflow-x-auto scrollbar-hide py-8 px-4 sm:px-6 lg:px-8 ${showRanking ? 'space-x-6' : 'space-x-2'}`}
          style={{ scrollPaddingLeft: '4%', scrollPaddingRight: '4%' }}
        >
          {courses.map((course, index) => (
            <ExpandableCourseCard
              key={course.id}
              course={course}
              showProgress={showProgress}
              rank={showRanking ? index + 1 : undefined}
              large={largeCards}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
