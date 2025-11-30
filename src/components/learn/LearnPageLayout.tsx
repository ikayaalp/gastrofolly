"use client"

import { useState } from "react"
import Link from "next/link"
import {
    Home,
    BookOpen,
    Users,
    MessageCircle,
    ChefHat,
    CheckCircle,
    Play,
    ChevronLeft,
    ChevronRight,
    Clock,
    Star,
    TrendingUp,
    Award,
    Bell
} from "lucide-react"
import UserDropdown from "@/components/ui/UserDropdown"
import VideoPlayer from "@/components/video/VideoPlayer"
import CourseSidebar from "@/components/learn/CourseSidebar"
import CommentsSection from "@/components/course/CommentsSection"
import RecommendedCourses from "@/components/course/RecommendedCourses"

// Types
interface LearnPageLesson {
    id: string;
    title: string;
    description: string | null;
    videoUrl: string | null;
    duration: number | null;
    order?: number;
}

interface ProgressItem {
    lessonId: string;
    isCompleted: boolean;
    lesson: LearnPageLesson;
}

interface LearnPageLayoutProps {
    course: {
        id: string;
        title: string;
        description: string;
        instructor: {
            name: string | null;
            image: string | null;
        };
        lessons: Array<{
            id: string;
            title: string;
            description: string | null;
            duration: number | null;
            order: number;
            isFree: boolean;
        }>;
        reviews: Array<{
            id: string;
            rating: number;
            comment?: string | null;
            userId: string;
            user: { name: string | null; image: string | null };
            createdAt: Date;
        }>;
    }
    currentLesson: LearnPageLesson
    session: {
        user: {
            id: string;
            role?: string;
        };
    }
    isCompleted: boolean
    previousLesson: LearnPageLesson | null
    nextLesson: LearnPageLesson | null
    recommendedCourses: Array<{
        id: string;
        title: string;
        description: string;
        price: number;
        imageUrl: string | null;
        instructor: {
            name: string | null;
            image: string | null;
        };
        category: { name: string };
        level: string;
        lessons: Array<{ id: string; duration: number | null }>;
        reviews: Array<{ rating: number }>;
        _count: { enrollments: number; lessons: number; reviews: number };
    }>
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
    const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'comments' | 'recommended'>('overview')
    const [showSidebar, setShowSidebar] = useState(false)

    const completedLessons = progress.filter(p => p.isCompleted).length
    const totalLessons = course.lessons.length
    const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

    const currentLessonIndex = course.lessons.findIndex(l => l.id === currentLesson.id)
    const averageRating = course.reviews.length > 0
        ? course.reviews.reduce((acc, r) => acc + r.rating, 0) / course.reviews.length
        : 0

    return (
        <div className="min-h-screen bg-black">
            {/* Desktop Header */}
            <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-8">
                            <Link href="/home" className="flex items-center space-x-2">
                                <ChefHat className="h-8 w-8 text-orange-500" />
                                <span className="text-2xl font-bold text-white">Chef2.0</span>
                                {session?.user?.role === 'INSTRUCTOR' && (
                                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">Eğitmen</span>
                                )}
                                {session?.user?.role === 'ADMIN' && (
                                    <span className="bg-orange-600 text-white px-2 py-1 rounded text-sm font-medium">Admin</span>
                                )}
                            </Link>
                            <nav className="flex space-x-6">
                                <Link href="/home" className="text-gray-300 hover:text-white transition-colors">
                                    Ana Sayfa
                                </Link>
                                <Link href="/my-courses" className="text-white font-semibold">
                                    Kurslarım
                                </Link>
                                {session?.user?.role === 'INSTRUCTOR' && (
                                    <>
                                        <Link href="/instructor-dashboard" className="text-gray-300 hover:text-white transition-colors">
                                            Eğitmen Paneli
                                        </Link>
                                        <Link href="/instructor-dashboard/courses" className="text-gray-300 hover:text-white transition-colors">
                                            Kurslarımı Yönet
                                        </Link>
                                    </>
                                )}
                                {session?.user?.role === 'ADMIN' && (
                                    <>
                                        <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">
                                            Admin Paneli
                                        </Link>
                                        <Link href="/admin/courses" className="text-gray-300 hover:text-white transition-colors">
                                            Kurs Yönetimi
                                        </Link>
                                    </>
                                )}
                                <Link href="/chef-sosyal" className="text-gray-300 hover:text-white transition-colors">
                                    Chef Sosyal
                                </Link>
                                <Link href="/messages" className="text-gray-300 hover:text-white transition-colors">
                                    Mesajlar
                                </Link>
                                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                                    İletişim
                                </Link>
                            </nav>
                        </div>

                        <div className="flex items-center space-x-4">
                            <button className="text-gray-300 hover:text-white">
                                <Bell className="h-5 w-5" />
                            </button>
                            <UserDropdown />
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Top Bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/30 backdrop-blur-sm border-b border-gray-800">
                <div className="flex justify-between items-center py-3 px-4">
                    <Link href="/home" className="flex items-center space-x-2">
                        <ChefHat className="h-6 w-6 text-orange-500" />
                        <span className="text-lg font-bold text-white">Chef2.0</span>
                        {session?.user?.role === 'INSTRUCTOR' && (
                            <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">Eğitmen</span>
                        )}
                        {session?.user?.role === 'ADMIN' && (
                            <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium">Admin</span>
                        )}
                    </Link>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="text-gray-300 hover:text-white"
                        >
                            <BookOpen className="h-5 w-5" />
                        </button>
                        <UserDropdown />
                    </div>
                </div>
            </div>

            {/* Success Alert */}
            {successParam && (
                <div className="fixed top-20 left-4 right-4 z-40 md:top-4 md:left-auto md:right-4 md:w-96">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 backdrop-blur-sm">
                        <div className="flex items-center">
                            <div className="bg-green-500 rounded-full p-2 mr-3">
                                <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-green-400 font-semibold text-lg">Ödeme Başarılı!</h3>
                                <p className="text-gray-300 text-sm">
                                    {fraudBypassedParam
                                        ? "Ödeme tamamlandı. Kursunuza hoş geldiniz!"
                                        : "Kursunuz başarıyla satın alındı. İyi öğrenmeler!"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex pt-16 md:pt-0">
                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                    {/* Video Player */}
                    <div className="w-full bg-black aspect-video">
                        <VideoPlayer
                            lesson={currentLesson}
                            course={course}
                            userId={session.user.id}
                            isCompleted={isCompleted}
                            previousLesson={previousLesson}
                            nextLesson={nextLesson}
                        />
                    </div>

                    {/* Course Info Header */}
                    <div className="bg-[#0a0a0a] border-b border-gray-800">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                            {/* Course Title & Info */}
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                                <div className="flex-1">
                                    <Link
                                        href={`/course/${course.id}`}
                                        className="inline-flex items-center text-orange-500 hover:text-orange-400 text-sm mb-3 transition-colors"
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Kurs Detaylarına Dön
                                    </Link>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                        {course.title}
                                    </h1>
                                    <p className="text-gray-400 text-sm mb-3">
                                        Eğitmen: <span className="text-orange-500">{course.instructor.name}</span>
                                    </p>

                                    {/* Stats */}
                                    <div className="flex flex-wrap items-center gap-4 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <div className="bg-orange-500/10 p-1.5 rounded">
                                                <BookOpen className="h-4 w-4 text-orange-500" />
                                            </div>
                                            <span className="text-gray-300">{totalLessons} Ders</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="bg-green-500/10 p-1.5 rounded">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            </div>
                                            <span className="text-gray-300">{completedLessons} Tamamlandı</span>
                                        </div>
                                        {averageRating > 0 && (
                                            <div className="flex items-center space-x-2">
                                                <div className="bg-yellow-500/10 p-1.5 rounded">
                                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                </div>
                                                <span className="text-gray-300">{averageRating.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Progress Card */}
                                <div className="bg-black border border-gray-800 rounded-xl p-4 md:w-64">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-300">İlerleme</span>
                                        <span className="text-sm text-orange-500 font-bold">
                                            %{Math.round(progressPercentage)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                                        <div
                                            className="bg-gradient-to-r from-orange-600 to-orange-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${progressPercentage}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        {completedLessons} / {totalLessons} ders tamamlandı
                                    </p>
                                </div>
                            </div>

                            {/* Current Lesson Info */}
                            <div className="bg-gradient-to-r from-gray-900/50 to-transparent border border-gray-800 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className="bg-orange-500/10 text-orange-500 text-xs font-semibold px-2 py-1 rounded">
                                                Ders {currentLessonIndex + 1}
                                            </span>
                                            {isCompleted && (
                                                <span className="bg-green-500/10 text-green-500 text-xs font-semibold px-2 py-1 rounded flex items-center space-x-1">
                                                    <CheckCircle className="h-3 w-3" />
                                                    <span>Tamamlandı</span>
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-lg font-semibold text-white mb-1">
                                            {currentLesson.title}
                                        </h2>
                                        {currentLesson.description && (
                                            <p className="text-sm text-gray-400 line-clamp-2">
                                                {currentLesson.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Navigation Buttons */}
                                    <div className="flex items-center space-x-2 ml-4">
                                        {previousLesson && (
                                            <Link
                                                href={`/learn/${course.id}?lesson=${previousLesson.id}`}
                                                className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors"
                                                title="Önceki Ders"
                                            >
                                                <ChevronLeft className="h-5 w-5" />
                                            </Link>
                                        )}
                                        {nextLesson && (
                                            <Link
                                                href={`/learn/${course.id}?lesson=${nextLesson.id}`}
                                                className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg transition-colors"
                                                title="Sonraki Ders"
                                            >
                                                <ChevronRight className="h-5 w-5" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="bg-[#0a0a0a] border-b border-gray-800 sticky top-0 z-30">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-all ${activeTab === 'overview'
                                        ? 'text-orange-500 border-b-2 border-orange-500'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Genel Bakış
                                </button>
                                <button
                                    onClick={() => setActiveTab('lessons')}
                                    className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-all ${activeTab === 'lessons'
                                        ? 'text-orange-500 border-b-2 border-orange-500'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Dersler ({totalLessons})
                                </button>
                                <button
                                    onClick={() => setActiveTab('comments')}
                                    className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-all ${activeTab === 'comments'
                                        ? 'text-orange-500 border-b-2 border-orange-500'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Yorumlar ({course.reviews.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('recommended')}
                                    className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-all ${activeTab === 'recommended'
                                        ? 'text-orange-500 border-b-2 border-orange-500'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Önerilen Kurslar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 bg-black overflow-y-auto pb-20 md:pb-6">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
                                        <h3 className="text-xl font-bold text-white mb-4">Kurs Hakkında</h3>
                                        <p className="text-gray-300 leading-relaxed">
                                            {course.description}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
                                            <div className="bg-orange-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                                <TrendingUp className="h-6 w-6 text-orange-500" />
                                            </div>
                                            <h4 className="text-white font-semibold mb-2">İlerleme</h4>
                                            <p className="text-2xl font-bold text-orange-500 mb-1">
                                                %{Math.round(progressPercentage)}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {completedLessons} / {totalLessons} ders
                                            </p>
                                        </div>

                                        <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
                                            <div className="bg-blue-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                                <Clock className="h-6 w-6 text-blue-500" />
                                            </div>
                                            <h4 className="text-white font-semibold mb-2">Toplam Süre</h4>
                                            <p className="text-2xl font-bold text-blue-500 mb-1">
                                                {course.lessons.reduce((acc, l) => acc + (l.duration || 0), 0)} dk
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                Video içeriği
                                            </p>
                                        </div>

                                        <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6">
                                            <div className="bg-green-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                                <Award className="h-6 w-6 text-green-500" />
                                            </div>
                                            <h4 className="text-white font-semibold mb-2">Tamamlama</h4>
                                            <p className="text-2xl font-bold text-green-500 mb-1">
                                                {completedLessons}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                Tamamlanan ders
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'lessons' && (
                                <div className="space-y-3">
                                    {course.lessons.map((lesson, index) => {
                                        const lessonProgress = progress.find(p => p.lessonId === lesson.id)
                                        const isLessonCompleted = lessonProgress?.isCompleted || false
                                        const isCurrent = lesson.id === currentLesson.id

                                        return (
                                            <Link
                                                key={lesson.id}
                                                href={`/learn/${course.id}?lesson=${lesson.id}`}
                                                className={`block bg-[#0a0a0a] border rounded-xl p-4 transition-all hover:border-orange-500/50 ${isCurrent
                                                    ? 'border-orange-500 bg-orange-500/5'
                                                    : 'border-gray-800'
                                                    }`}
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${isLessonCompleted
                                                        ? 'bg-green-500/10'
                                                        : isCurrent
                                                            ? 'bg-orange-500/10'
                                                            : 'bg-gray-800'
                                                        }`}>
                                                        {isLessonCompleted ? (
                                                            <CheckCircle className="h-6 w-6 text-green-500" />
                                                        ) : isCurrent ? (
                                                            <Play className="h-6 w-6 text-orange-500" />
                                                        ) : (
                                                            <span className="text-gray-400 font-semibold">{index + 1}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={`font-semibold mb-1 ${isCurrent ? 'text-orange-500' : 'text-white'
                                                            }`}>
                                                            {lesson.title}
                                                        </h4>
                                                        {lesson.description && (
                                                            <p className="text-sm text-gray-400 line-clamp-1">
                                                                {lesson.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {lesson.duration && (
                                                        <div className="flex items-center space-x-1 text-gray-400">
                                                            <Clock className="h-4 w-4" />
                                                            <span className="text-sm">{lesson.duration} dk</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}

                            {activeTab === 'comments' && (
                                <CommentsSection
                                    reviews={course.reviews}
                                    courseId={course.id}
                                    canComment={true}
                                    userId={session.user.id}
                                />
                            )}

                            {activeTab === 'recommended' && (
                                <RecommendedCourses
                                    courses={recommendedCourses}
                                    currentCourseId={course.id}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Desktop Sidebar */}
                <div className="hidden lg:block">
                    <CourseSidebar
                        course={course}
                        progress={progress}
                        currentLessonId={currentLesson.id}
                    />
                </div>

                {/* Mobile Sidebar */}
                {showSidebar && (
                    <div className="lg:hidden fixed inset-0 z-50">
                        <div className="absolute inset-0 bg-black/80" onClick={() => setShowSidebar(false)} />
                        <div className="absolute right-0 top-0 bottom-0">
                            <CourseSidebar
                                course={course}
                                progress={progress}
                                currentLessonId={currentLesson.id}
                            />
                        </div>
                    </div>
                )}
            </div>

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
