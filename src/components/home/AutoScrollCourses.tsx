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
    <div className="bg-black w-full py-12 border-t border-gray-900">
      {/* Başlık satırı */}
      <div className="max-w-[1400px] mx-auto px-6 mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Öne Çıkan Eğitimler</h2>
        </div>
      </div>

      {/* Full-bleed yatay şerit */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className="flex overflow-x-auto scrollbar-hide space-x-6 md:space-x-8 py-4 px-6 w-full"
      >
        {courses.map((course) => (
          <Link key={course.id} href={`/course/${course.id}`} className="block group">
            <div className="min-w-[310px] w-[310px] md:min-w-[460px] md:w-[460px] relative rounded-2xl md:rounded-[2rem] overflow-hidden bg-gray-900 border border-gray-800 group-hover:border-orange-500/30 transition-all duration-500 shadow-2xl shadow-black/50 group-hover:shadow-orange-900/10">

              {/* Golden Ratio Aspect Container */}
              <div className="aspect-[1.618/1] relative overflow-hidden">
                {/* Yakında Ribbon */}
                <div className="absolute top-4 left-4 z-20 bg-orange-600 text-white text-[10px] md:text-xs font-bold px-3 py-1 rounded shadow-lg uppercase tracking-wider">
                  Yakında
                </div>
                {course.imageUrl ? (
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Play className="h-12 w-12 text-gray-600" />
                  </div>
                )}

                {/* Modern Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

                {/* Content */}
                <div className="absolute inset-0 p-5 md:p-8 flex flex-col justify-end">
                  <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    {course.instructor?.name && (
                      <div className="flex items-center gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                        <span className="w-6 h-[1px] bg-orange-500"></span>
                        <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest">{course.instructor.name}</p>
                      </div>
                    )}
                    <h3 className="text-white font-bold text-xl md:text-2xl leading-tight mb-2 md:mb-3 group-hover:text-orange-50 transition-colors">
                      {course.title}
                    </h3>
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


