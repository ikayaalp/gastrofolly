"use client"

import { useState } from "react"
import Link from "next/link"
import { Play, ChevronLeft, ChevronRight } from "lucide-react"

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
  reviews: Array<{
    rating: number
  }>
  _count: {
    enrollments: number
    lessons: number
  }
}

interface HeroSectionProps {
  courses: Course[]
}

export default function HeroSection({ courses }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left')
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Minimum swipe mesafesi
  const minSwipeDistance = 50

  // Manuel geçiş fonksiyonları
  const goToPrevious = () => {
    if (courses.length <= 1 || isTransitioning) return
    setSlideDirection('right')
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + courses.length) % courses.length)
      setIsTransitioning(false)
    }, 400)
  }

  const goToNext = () => {
    if (courses.length <= 1 || isTransitioning) return
    setSlideDirection('left')
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % courses.length)
      setIsTransitioning(false)
    }, 400)
  }

  // Nokta tıklama
  const goToSlide = (index: number) => {
    if (courses.length <= 1 || isTransitioning) return
    setSlideDirection(index > currentIndex ? 'left' : 'right')
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex(index)
      setIsTransitioning(false)
    }, 400)
  }

  // Touch event handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      goToNext()
    } else if (isRightSwipe) {
      goToPrevious()
    }
  }

  if (courses.length === 0) return null

  const course = courses[currentIndex]

  // Animasyon sınıfları
  const getSlideClass = () => {
    if (!isTransitioning) return 'translate-x-0 opacity-100'
    return slideDirection === 'left'
      ? '-translate-x-full opacity-0'
      : 'translate-x-full opacity-0'
  }

  return (
    <div
      className="relative h-[70vh] min-h-[500px] overflow-hidden group"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <div className={`w-full h-full transition-all duration-400 ease-out ${getSlideClass()}`}>
          {course.imageUrl ? (
            <img
              src={course.imageUrl}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-400 via-red-500 to-red-600" />
          )}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Navigation Arrows */}
      {courses.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {courses.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
          {courses.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentIndex
                ? 'bg-orange-500 scale-125'
                : 'bg-white/50 hover:bg-white/70'
                }`}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative h-full flex items-center justify-center text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className={`max-w-4xl mx-auto -mt-16 transition-all duration-500 ease-in-out ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>

            {/* Başlık */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-3 leading-tight drop-shadow-lg">
              {course.title}
            </h1>

            {/* Eğitmen Adı */}
            <p className="text-lg md:text-xl text-gray-300 mb-6 drop-shadow-md">
              Şef {course.instructor.name}
            </p>

            {/* Level Badge */}
            <div className="flex justify-center mb-8">
              {course.level === 'BEGINNER' && (
                <span className="bg-gray-800 text-gray-300 border border-gray-700 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide uppercase backdrop-blur-sm">
                  Commis
                </span>
              )}
              {course.level === 'INTERMEDIATE' && (
                <span className="bg-orange-600/90 text-white px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide uppercase backdrop-blur-sm">
                  Chef D party
                </span>
              )}
              {course.level === 'ADVANCED' && (
                <span className="bg-purple-600/90 text-white px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide uppercase backdrop-blur-sm">
                  Executive
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center">
              <Link
                href={`/course/${course.id}`}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-orange-600/20 flex items-center justify-center gap-2"
              >
                <Play className="h-5 w-5 fill-current" />
                Kursa Başla
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent" />
    </div>
  )
}

