"use client"

import React, { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { Play, Heart, Star } from "lucide-react"
import { useFavorites } from "@/contexts/FavoritesContext"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

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

interface ExpandableCourseCardProps {
    course: Course
    showProgress?: boolean
    rank?: number
    large?: boolean
}

export default function ExpandableCourseCard({ course, showProgress, rank, large = false }: ExpandableCourseCardProps) {
    const [isHovered, setIsHovered] = useState(false)
    const [position, setPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
    const cardRef = useRef<HTMLDivElement>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const { addFavorite, removeFavorite, isFavorite } = useFavorites()
    const { data: session } = useSession()
    const router = useRouter()

    const isFavorited = isFavorite(course.id)

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!session) {
            router.push("/auth/signin")
            return
        }

        if (isFavorited) {
            removeFavorite(course.id)
        } else {
            addFavorite({
                id: course.id,
                title: course.title,
                price: course.price,
                imageUrl: course.imageUrl || undefined,
                instructor: { name: course.instructor.name || "Unknown" },
                category: { name: course.category.name },
                level: course.level,
                _count: course._count
            })
        }
    }

    // Calculate rating
    const averageRating = course.reviews.length > 0
        ? course.reviews.reduce((acc, r) => acc + r.rating, 0) / course.reviews.length
        : 0

    // Determine subscription package based on course level
    // Colors from subscription page: Commis=gray, Chef D party=orange, Executive=purple


    const handleCardClick = () => {
        router.push(`/course/${course.id}`)
    }

    // Handle mouse enter with delay
    const handleMouseEnter = () => {
        // Disable hover expansion on mobile (< 768px)
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            return
        }

        // Clear any pending close timer
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current)
            closeTimeoutRef.current = null
        }

        // Don't restart open timer if already hovered
        if (isHovered) return

        timeoutRef.current = setTimeout(() => {
            if (cardRef.current) {
                const rect = cardRef.current.getBoundingClientRect()
                const viewportWidth = window.innerWidth

                // Calculate target dimensions
                const expandedWidth = rect.width * 1.5

                // Calculate ideal centered position
                let newLeft = rect.left - (rect.width * 0.25)
                const newTop = rect.top - (rect.height * 0.25)

                // Boundary handling for Left edge
                if (newLeft < 24) { // 24px padding
                    newLeft = 24
                }

                // Boundary handling for Right edge
                else if (newLeft + expandedWidth > viewportWidth - 24) {
                    newLeft = viewportWidth - expandedWidth - 24
                }

                setPosition({
                    top: newTop,
                    left: newLeft,
                    width: expandedWidth,
                    height: rect.height * 1.5 // approximate expanded height
                })
                setIsHovered(true)
            }
        }, 500) // 500ms delay like Netflix
    }

    // Handle mouse leave
    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }

        // Set a grace period before closing to allow moving to the portal
        closeTimeoutRef.current = setTimeout(() => {
            setIsHovered(false)
            setPosition(null)
        }, 200) // 200ms grace period
    }

    // Close on scroll
    useEffect(() => {
        const handleScroll = () => {
            if (isHovered) {
                setIsHovered(false)
                setPosition(null)
                if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
            }
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [isHovered])

    // Base card (unexpanded) - Original Design Restored
    return (
        <>
            {/* Wrapper for ranking number + card */}
            <div className={`relative flex-shrink-0 ${rank ? 'flex items-center' : ''}`}>
                {/* Netflix-style Ranking Number - Large, partially behind */}
                {rank && (
                    <div className="relative z-0 flex items-center w-[140px] -mr-[25px]">
                        <span
                            className="text-[250px] font-black leading-none select-none"
                            style={{
                                background: 'linear-gradient(180deg, #ff8c00 0%, #ff6600 50%, #ff4500 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontFamily: 'Arial Black, Impact, sans-serif'
                            }}
                        >
                            {rank}
                        </span>
                    </div>
                )}
                <div
                    ref={cardRef}
                    className={`relative bg-black border border-gray-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 group cursor-pointer flex-shrink-0 z-10 ${large ? 'min-w-[220px] w-[220px] h-[330px]' : 'min-w-[320px] w-[320px] aspect-[1.618/1]'}`}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <Link href={`/course/${course.id}`} className="block w-full h-full relative">
                        {course.imageUrl ? (
                            <img
                                src={course.imageUrl}
                                alt={course.title}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        ) : (
                            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
                                <span className="text-xs text-zinc-500">Görsel Yok</span>
                            </div>
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>

                        {/* Progress Bar */}
                        {showProgress && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 z-10">
                                <div className="h-full bg-orange-500 w-1/3"></div>
                            </div>
                        )}

                        {/* Course Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                            <h3 className="text-base font-bold text-white mb-2 group-hover:text-orange-500 transition-colors overflow-hidden" style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                lineHeight: '1.3',
                                textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                            }}>
                                {course.title}
                            </h3>

                            <div className="flex items-center justify-between">
                                {/* Instructor */}
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
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Expanded Card Portal */}
                {isHovered && position && createPortal(
                    <div
                        className="fixed z-50 flex items-center justify-center pointer-events-auto"
                        style={{
                            top: position.top,
                            left: position.left,
                            width: position.width,
                            height: 'auto',
                            minHeight: position.height,
                            animation: 'card-expand-animation 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                            transformOrigin: 'center center'
                        }}
                        onMouseEnter={() => {
                            if (timeoutRef.current) clearTimeout(timeoutRef.current)
                            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
                            setIsHovered(true)
                        }}
                        onMouseLeave={handleMouseLeave}
                    >
                        <style jsx global>{`
                @keyframes card-expand-animation {
                    0% { opacity: 0; transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `}</style>
                        <div
                            onClick={handleCardClick}
                            className="w-full h-full bg-zinc-900 rounded-xl shadow-2xl overflow-hidden shadow-black/50 border border-zinc-800 flex flex-col cursor-pointer hover:border-zinc-700 transition-colors"
                        >
                            {/* Visual Media Area - Matches Aspect Ratio */}
                            <div className="relative w-full h-48 bg-zinc-950 flex-shrink-0">
                                {course.imageUrl && (
                                    <img
                                        src={course.imageUrl}
                                        alt={course.title}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                {/* Video would go here */}
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                            </div>

                            {/* Content Area */}
                            <div className="p-4 bg-zinc-900 text-white relative flex-grow flex flex-col">
                                <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">
                                    {course.title}
                                </h3>

                                {/* Actions Row */}
                                <div className="flex items-center space-x-2 mb-4">
                                    <Link
                                        href={`/course/${course.id}`}
                                        className="flex items-center justify-center w-10 h-10 bg-orange-500 rounded-full hover:bg-orange-600 text-white transition-colors"
                                    >
                                        <Play className="w-5 h-5 fill-white ml-1" />
                                    </Link>
                                    <button
                                        className={`flex items-center justify-center w-10 h-10 border-2 rounded-full transition-colors ${isFavorited
                                            ? "border-red-500 bg-red-500 text-white hover:bg-red-600 hover:border-red-600"
                                            : "border-zinc-500 hover:border-white hover:bg-zinc-800 text-gray-300"
                                            }`}
                                        title={isFavorited ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                                        onClick={handleToggleFavorite}
                                    >
                                        <Heart className={`w-5 h-5 ${isFavorited ? "fill-current text-white" : ""}`} />
                                    </button>
                                </div>

                                {/* Metadata Row */}
                                <div className="flex items-center space-x-3 text-sm font-semibold mb-3">


                                    {course.duration && (
                                        <span className="text-zinc-400 text-sm">
                                            {Math.round(course.duration / 60)}s {course.duration % 60}dk
                                        </span>
                                    )}
                                </div>

                                {/* Tags/Categories */}
                                <div className="flex flex-wrap gap-2 text-xs text-white">
                                    <span className="text-zinc-300">{course.category.name}</span>
                                    <span className="text-zinc-500">•</span>
                                    <span className="text-zinc-300">{course.instructor.name}</span>
                                </div>

                                {/* Description Preview */}
                                <p className="mt-3 text-xs text-zinc-400 line-clamp-3">
                                    {course.description}
                                </p>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </>
    )
}
