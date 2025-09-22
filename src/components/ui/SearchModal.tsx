"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Star, Users, Clock } from "lucide-react"
import Link from "next/link"

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

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("")
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const searchCourses = async () => {
      if (query.trim().length < 2) {
        setCourses([])
        setHasSearched(false)
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        
        if (response.ok) {
          setCourses(data.courses || [])
          setHasSearched(true)
        } else {
          console.error("Search error:", data.error)
          setCourses([])
          setHasSearched(true)
        }
      } catch (error) {
        console.error("Search error:", error)
        setCourses([])
        setHasSearched(true)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchCourses, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  const calculateAverageRating = (reviews: Array<{ rating: number }>) => {
    if (!reviews || reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return sum / reviews.length
  }

  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return "N/A"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}s ${mins}dk`
    }
    return `${mins}dk`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center p-4 pt-16">
        <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center border-b border-gray-700 p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Kurs, eğitmen veya kategori ara..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <span className="ml-3 text-gray-400">Aranıyor...</span>
              </div>
            )}

            {!loading && hasSearched && courses.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>&quot;{query}&quot; için sonuç bulunamadı</p>
                <p className="text-sm mt-2">Farklı anahtar kelimeler deneyin</p>
              </div>
            )}

            {!loading && courses.length > 0 && (
              <div className="p-4 space-y-4">
                {courses.map((course) => {
                  const averageRating = calculateAverageRating(course.reviews)
                  
                  return (
                    <Link
                      key={course.id}
                      href={`/course/${course.id}`}
                      onClick={onClose}
                      className="block"
                    >
                      <div className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-800 transition-colors group">
                        {/* Course Image */}
                        <div className="w-20 h-16 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                          {course.imageUrl ? (
                            <img
                              src={course.imageUrl}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Search className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                        </div>

                        {/* Course Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white group-hover:text-orange-500 transition-colors line-clamp-1">
                            {course.title}
                          </h3>
                          <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                            {course.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{course.instructor.name}</span>
                            <span>{course.category.name}</span>
                            
                            {averageRating > 0 && (
                              <div className="flex items-center">
                                <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                                <span>{averageRating.toFixed(1)}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              <span>{course._count.enrollments}</span>
                            </div>
                            
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{formatDuration(course.duration)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right flex-shrink-0">
                          <span className="text-lg font-bold text-orange-500">
                            ₺{course.price}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {!loading && !hasSearched && query.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Arama yapmak için yazın...</p>
                <p className="text-sm mt-2">Kurs adı, eğitmen veya kategori arayabilirsiniz</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
