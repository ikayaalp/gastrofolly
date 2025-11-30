"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Play } from "lucide-react"

interface Course {
  id: string
  title: string
  description: string
  price: number
  imageUrl?: string | null
  level: string
  reviews: Array<{ rating: number }>
  instructor?: { name?: string | null }
}

interface AutoScrollCoursesProps {
  courses: Course[]
  speed?: number // px per step
  intervalMs?: number
}

export default function AutoScrollCourses({ courses, speed = 1, intervalMs = 16 }: AutoScrollCoursesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHover, setIsHover] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current

    const timer = setInterval(() => {
      if (isHover) return
      if (!el) return
      // auto scroll right; loop back when reaching end
      if (el.scrollLeft + el.clientWidth + 2 >= el.scrollWidth) {
        el.scrollTo({ left: 0, behavior: 'auto' })
      } else {
        el.scrollTo({ left: el.scrollLeft + speed, behavior: 'auto' })
      }
    }, intervalMs)

    return () => clearInterval(timer)
  }, [isHover, speed, intervalMs])

  if (!courses || courses.length === 0) return null

  return (
    <div className="bg-black w-full">
      {/* Başlık satırı */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-1">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Öne Çıkan Kurslar</h2>
        </div>
      </div>

      {/* Full-bleed yatay şerit */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className="flex overflow-x-auto scrollbar-hide space-x-4 py-1 px-4 sm:px-6 lg:px-8 w-full mb-6"
      >
        {courses.map((course) => (
          <Link key={course.id} href={`/auth/signin?redirect=/course/${course.id}`}>
            <div className="min-w-[280px] w-[280px] md:min-w-[320px] md:w-[320px] flex-shrink-0 bg-black border border-gray-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 group">
              <div className="relative h-56 md:h-64 bg-black overflow-hidden">
                {course.imageUrl ? (
                  <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="h-10 w-10 text-gray-500" />
                  </div>
                )}

                {/* Overlay: Sadece başlık ve level */}
                <div className="absolute inset-x-0 bottom-0 p-3 md:p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                  <h3 className="text-white font-semibold text-base md:text-lg leading-snug line-clamp-2 mb-2">{course.title}</h3>

                  {/* Level Badge */}
                  <div>
                    {course.level === 'BEGINNER' && (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700 rounded">
                        Commis
                      </span>
                    )}
                    {course.level === 'INTERMEDIATE' && (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-orange-900/40 text-orange-400 border border-orange-500/30 rounded">
                        Chef D party
                      </span>
                    )}
                    {course.level === 'ADVANCED' && (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-purple-900/40 text-purple-400 border border-purple-500/30 rounded">
                        Executive
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}


