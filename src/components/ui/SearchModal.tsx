"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Users, Clock } from "lucide-react"
import Link from "next/link"
import Modal from "./Modal"

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

  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return "N/A"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}s ${mins}dk`
    }
    return `${mins}dk`
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex flex-col">
        {/* Header */}
        <div className="relative flex items-center mb-6">
          <div className="relative flex-1 pr-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Kurs, eğitmen veya kategori ara..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 md:py-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        {/* Results */}
        <div className="relative flex-1 overflow-y-auto max-h-[50vh] md:max-h-96">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-t-2 border-orange-500"></div>
              <span className="ml-3 text-zinc-300 font-medium">Aranıyor...</span>
            </div>
          )}

          {!loading && hasSearched && courses.length === 0 && (
            <div className="text-center py-12 text-zinc-400">
              <div className="bg-orange-500/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Search className="h-8 w-8 text-orange-400" />
              </div>
              <p className="text-lg font-medium text-white">&quot;{query}&quot; için sonuç bulunamadı</p>
              <p className="text-sm mt-2">Farklı anahtar kelimeler deneyin</p>
            </div>
          )}

          {!loading && courses.length > 0 && (
            <div className="space-y-3">
              {courses.map((course) => {
                return (
                  <Link
                    key={course.id}
                    href={`/course/${course.id}`}
                    onClick={onClose}
                    className="block"
                  >
                    <div className="flex items-start space-x-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-900 transition-all duration-300 group">
                      {/* Course Image */}
                      <div className="w-24 h-20 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-700">
                        {course.imageUrl ? (
                          <img
                            src={course.imageUrl}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Search className="h-6 w-6 text-zinc-600" />
                          </div>
                        )}
                      </div>

                      {/* Course Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors line-clamp-1 text-lg">
                          {course.title}
                        </h3>
                        <p className="text-sm text-zinc-400 line-clamp-2 mt-1">
                          {course.description}
                        </p>

                        <div className="flex items-center flex-wrap gap-3 mt-3 text-xs text-zinc-500">
                          <span className="text-zinc-400">{course.instructor.name}</span>
                          <span className="px-2 py-1 bg-orange-500/10 text-orange-400 rounded-md border border-orange-500/20">{course.category.name}</span>

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
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {!loading && !hasSearched && query.length === 0 && (
            <div className="text-center py-12 text-zinc-400">
              <div className="bg-orange-500/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Search className="h-8 w-8 text-orange-400" />
              </div>
              <p className="text-lg font-medium text-white">Arama yapmak için yazın...</p>
              <p className="text-sm mt-2">Kurs adı, eğitmen veya kategori arayabilirsiniz</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
