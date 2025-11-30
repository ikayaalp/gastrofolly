"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Home, BookOpen, Users, MessageCircle, ChefHat, CheckCircle, GripHorizontal } from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"
import VideoPlayer from "@/components/video/VideoPlayer"
import CourseSidebar from "@/components/learn/CourseSidebar"
import CommentsSection from "@/components/course/CommentsSection"
import RecommendedCourses from "@/components/course/RecommendedCourses"

// Types copied/adapted from page.tsx
interface LearnPageLesson {
    id: string;
    title: string;
    description: string | null;
    videoUrl: string | null;
    duration: number | null;
    order?: number;
}

interface ReviewItem {
    id: string;
    rating: number;
    user: { name: string | null; image: string | null };
    createdAt: string;
    comment?: string | null;
}

interface ProgressItem {
    lessonId: string;
    isCompleted: boolean;
    lesson: LearnPageLesson;
}

interface LearnPageLayoutProps {
    course: any // Using any for complex nested types to avoid duplication, or we can define them properly if needed
    currentLesson: LearnPageLesson
    session: any
    isCompleted: boolean
    previousLesson: LearnPageLesson | null
    nextLesson: LearnPageLesson | null
    recommendedCourses: any[]
    progress: ProgressItem[]
    successParam?: string
    fraudBypassedParam?: string
}

export default function LearnPageLayout({
    course,
    currentLesson,
    session,
    isCompleted,
    previousLesson,
    nextLesson,
    recommendedCourses,
    progress,
    successParam,
    fraudBypassedParam
}: LearnPageLayoutProps) {
    // State for video height percentage (default 65%)
    const [videoHeight, setVideoHeight] = useState(65)
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !containerRef.current) return

            const containerRect = containerRef.current.getBoundingClientRect()
            const containerHeight = containerRect.height
            const relativeY = e.clientY - containerRect.top

            // Calculate percentage
            let newHeightPercentage = (relativeY / containerHeight) * 100

            // Limits (min 20%, max 80%)
            if (newHeightPercentage < 20) newHeightPercentage = 20
            if (newHeightPercentage > 80) newHeightPercentage = 80

            setVideoHeight(newHeightPercentage)
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging])

    return (
        <div className="min-h-screen bg-black flex flex-col md:flex-row overflow-hidden">
            {/* Mobile Top Bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
                <div className="flex justify-between items-center py-3 px-4">
                    <Link href="/home" className="flex items-center space-x-2">
                        <ChefHat className="h-6 w-6 text-orange-500" />
                        <span className="text-lg font-bold text-white">Chef2.0</span>
                    </Link>
                    <UserDropdown />
                </div>
            </div>

            {/* Success Alert */}
            {successParam && (
                <div className="fixed top-20 left-4 right-4 z-40 md:top-4 md:left-auto md:right-4 md:w-96">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                        <div className="flex items-center">
                            <div className="bg-green-500 rounded-full p-2 mr-3">
                                <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-green-400 font-semibold text-lg">Ödeme Başarılı!</h3>
                                <p className="text-gray-300 text-sm">
                                    {fraudBypassedParam
                                        ? "Ödeme tamamlandı. Kursunuza hoş geldiniz!"
                                        : "Kursunuz başarıyla satın alındı. İyi öğrenmeler!"
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen pt-16 md:pt-0 overflow-hidden relative" ref={containerRef}>

                {/* Video Player Area */}
                <div
                    className="w-full bg-black relative flex items-center justify-center"
                    style={{ height: `${videoHeight}%` }}
                >
                    <VideoPlayer
                        lesson={currentLesson}
                        course={course}
                        userId={session.user.id}
                        isCompleted={isCompleted}
                        previousLesson={previousLesson}
                        nextLesson={nextLesson}
                    />
                </div>

                {/* Resizer Handle */}
                <div
                    className="h-2 bg-[#1a1a1a] hover:bg-orange-500/50 cursor-row-resize flex items-center justify-center transition-colors z-20 group"
                    onMouseDown={handleMouseDown}
                >
                    <div className="w-16 h-1 bg-gray-700 rounded-full group-hover:bg-orange-500 transition-colors"></div>
                </div>

                {/* Content Tabs Area */}
                <div
                    className="flex-1 bg-[#0a0a0a] overflow-y-auto"
                    style={{ height: `calc(${100 - videoHeight}% - 8px)` }} // 8px is handle height
                >
                    <div className="max-w-5xl mx-auto">
                        {/* Comments Section */}
                        <div className="p-6">
                            <CommentsSection
                                reviews={course.reviews}
                                courseId={course.id}
                                canComment={true}
                                userId={session.user.id}
                            />

                            {/* Recommended Courses */}
                            <RecommendedCourses
                                courses={recommendedCourses}
                                currentCourseId={course.id}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar - Fixed width, full height */}
            <CourseSidebar
                course={course}
                progress={progress}
                currentLessonId={currentLesson.id}
            />

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-t border-gray-800">
                <div className="flex justify-around items-center py-2">
                    <Link href="/home" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
                        <Home className="h-6 w-6" />
                        <span className="text-xs font-medium mt-1">Ana Sayfa</span>
                    </Link>
                    <Link href="/my-courses" className="flex flex-col items-center py-2 px-3 text-orange-500">
                        <BookOpen className="h-6 w-6" />
                        <span className="text-xs font-medium mt-1">Kurslarım</span>
                    </Link>
                    <Link href="/chef-sosyal" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
                        <Users className="h-6 w-6" />
                        <span className="text-xs font-medium mt-1">Sosyal</span>
                    </Link>
                    <Link href="/messages" className="flex flex-col items-center py-2 px-3 text-gray-300 hover:text-white transition-colors">
                        <MessageCircle className="h-6 w-6" />
                        <span className="text-xs font-medium mt-1">Mesajlar</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
