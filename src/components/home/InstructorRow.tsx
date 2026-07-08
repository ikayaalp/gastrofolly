"use client"

import { ChevronLeft, ChevronRight, User } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import Link from "next/link"

export interface Instructor {
  id: string;
  name: string;
  image: string | null;
  specialty: string;
  rating: string;
  students: string;
  courseCount: number;
}

interface InstructorRowProps {
  title: string
  instructors: Instructor[]
}

export default function InstructorRow({ title, instructors }: InstructorRowProps) {
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
  }, [instructors])

  if (!instructors || instructors.length === 0) {
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
          className="flex overflow-x-auto scrollbar-hide py-4 px-4 sm:px-6 lg:px-8 space-x-4"
          style={{ scrollPaddingLeft: '4%', scrollPaddingRight: '4%' }}
        >
          {instructors.map((instructor) => (
            <Link
              key={instructor.id}
              href={`/instructor/${instructor.id}`}
              className="flex flex-col items-center justify-center min-w-[120px] p-4 hover:bg-[#111] rounded-xl transition-colors shrink-0"
            >
              <div className="relative mb-3">
                {instructor.image ? (
                  <img
                    src={instructor.image}
                    alt={instructor.name}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-transparent group-hover:border-orange-500 transition-colors"
                  />
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center border-2 border-transparent group-hover:border-orange-500 transition-colors">
                    <span className="text-white text-xl md:text-2xl font-bold">
                      {instructor.name
                        ? instructor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                        : <User className="h-8 w-8 text-white" />}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="text-white font-semibold text-center text-sm md:text-base line-clamp-1">{instructor.name}</h3>
              <p className="text-gray-400 text-xs md:text-sm mt-1 text-center flex items-center justify-center gap-1">
                <span className="text-orange-500">★</span> {instructor.rating} &bull; {instructor.courseCount} Kurs
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
