"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Play, Star } from "lucide-react"

interface Course {
  id: string
  title: string
  description: string
  price: number
  imageUrl?: string | null
  reviews: Array<{ rating: number }>
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

  const avg = (rs: Array<{ rating: number }>) => rs.length ? (rs.reduce((a, r) => a + r.rating, 0) / rs.length) : 0

  return (
    <div className="bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Öne Çıkan Kurslar</h2>
          <Link href="/courses" className="text-sm text-orange-400 hover:text-orange-300">Tümünü Gör</Link>
        </div>
        <div
          ref={containerRef}
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
          className="flex overflow-x-auto scrollbar-hide space-x-4 py-2"
        >
          {courses.map((course) => (
            <Link key={course.id} href={`/course/${course.id}`}>
              <div className="min-w-[280px] w-[280px] md:min-w-[320px] md:w-[320px] flex-shrink-0 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 group">
                <div className="relative h-44 bg-gray-800 overflow-hidden">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="h-10 w-10 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-1 line-clamp-2">{course.title}</h3>
                  <div className="flex items-center text-sm text-gray-400">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    {avg(course.reviews).toFixed(1)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}


