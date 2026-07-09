"use client"

import { ChevronLeft, ChevronRight, User } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import Link from "next/link"

export interface Instructor {
  id: string;
  name: string;
  image: string | null;
  specialty?: string;
  students?: string;
  courseCount?: number;
  // Panelden yönetilen eğitmenler için: rating/kurs yerine serbest alt yazı
  subtitle?: string | null;
  // Tıklanınca gidilecek yer; yoksa kart link değildir
  href?: string | null;
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
          {instructors.map((instructor) => {
            // href açıkça verilmişse onu kullan; verilmemişse eski davranış (/instructor/[id])
            const href =
              instructor.href !== undefined ? instructor.href : `/instructor/${instructor.id}`

            const inner = (
              <>
                <div className="relative mb-3 w-full aspect-[3/4]">
                  {instructor.image ? (
                    <img
                      src={instructor.image}
                      alt={instructor.name}
                      className="w-full h-full rounded-xl object-contain border-2 border-transparent group-hover:border-orange-500 transition-colors bg-neutral-900"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center border-2 border-transparent group-hover:border-orange-500 transition-colors">
                      <span className="text-white text-3xl md:text-4xl font-bold">
                        {instructor.name
                          ? instructor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                          : <User className="h-10 w-10 text-white" />}
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="text-white font-semibold text-left text-sm md:text-base line-clamp-1 w-full px-1">{instructor.name}</h3>
                {instructor.subtitle ? (
                  <p className="text-gray-400 text-xs md:text-sm mt-1 text-left line-clamp-1 w-full px-1">
                    {instructor.subtitle}
                  </p>
                ) : (
                  instructor.courseCount !== undefined && (
                    <p className="text-gray-400 text-xs md:text-sm mt-1 text-left w-full px-1">
                      {instructor.courseCount} Kurs
                    </p>
                  )
                )}
              </>
            )

            const cls =
              "flex flex-col items-start w-[140px] md:w-[160px] p-2 hover:bg-[#111] rounded-xl transition-colors shrink-0 group"

            return href ? (
              <Link key={instructor.id} href={href} className={cls}>
                {inner}
              </Link>
            ) : (
              <div key={instructor.id} className={cls}>
                {inner}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
