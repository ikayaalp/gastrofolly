"use client"

import { useState } from "react"
import { X, Play, ChefHat } from "lucide-react"
import YouTubePlayer from "@/components/video/YouTubePlayer"

interface FreeLessonModalProps {
    lesson: {
        id: string
        title: string
        description: string | null
        videoUrl: string | null
        duration: number | null
    }
    courseTitle: string
}

export default function FreeLessonModal({ lesson, courseTitle }: FreeLessonModalProps) {
    const [isOpen, setIsOpen] = useState(false)

    // YouTube URL kontrolü
    const isYouTubeUrl = (url: string) => {
        return url.includes('youtube.com') || url.includes('youtu.be')
    }

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="w-full text-left"
            >
                <div className="flex flex-col sm:flex-row justify-between p-4 border border-black rounded-lg transition-colors gap-3 hover:border-orange-500/50 cursor-pointer">
                    <div className="flex items-start flex-1 min-w-0">
                        <div className="bg-orange-500/20 text-orange-500 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mr-3 shrink-0 mt-0.5">
                            1
                        </div>
                        <div className="flex items-start flex-1 min-w-0">
                            <div className="shrink-0 mr-2 mt-1">
                                <Play className="h-4 w-4 text-green-500" />
                            </div>
                            <div className="flex-1 min-w-0 pr-0 sm:pr-4">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-semibold text-white text-sm sm:text-base leading-snug break-words">
                                        {lesson.title}
                                    </h3>
                                    {lesson.duration && (
                                        <span className="text-xs text-gray-400 whitespace-nowrap pt-0.5">
                                            {lesson.duration || 0} dk
                                        </span>
                                    )}
                                </div>
                                {lesson.description && (
                                    <p className="hidden sm:block text-xs sm:text-sm text-gray-400 mt-2 line-clamp-3 sm:line-clamp-none leading-relaxed">
                                        {lesson.description}
                                    </p>
                                )}
                                {/* Mobile only badge */}
                                <div className="flex sm:hidden mt-2">
                                    <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-[10px] font-semibold whitespace-nowrap">
                                        Ücretsiz Önizleme
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Desktop only badge */}
                    <div className="hidden sm:flex flex-col justify-center shrink-0">
                        <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                            Ücretsiz Önizleme
                        </span>
                    </div>
                </div>
            </button>

            {/* Video Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl w-full max-w-4xl shadow-2xl shadow-orange-500/10 overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="bg-orange-500/10 p-2 rounded-lg">
                                    <ChefHat className="h-5 w-5 text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{lesson.title}</h3>
                                    <p className="text-sm text-gray-400">{courseTitle}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-all"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Video Content */}
                        <div className="relative aspect-video bg-black">
                            {lesson.videoUrl && lesson.videoUrl.trim() !== "" ? (
                                isYouTubeUrl(lesson.videoUrl) ? (
                                    <YouTubePlayer
                                        videoUrl={lesson.videoUrl}
                                        onReady={() => { }}
                                    />
                                ) : (
                                    <video
                                        className="w-full h-full object-contain"
                                        controls
                                        controlsList="nodownload"
                                        onContextMenu={(e) => e.preventDefault()}
                                        autoPlay
                                    >
                                        <source src={lesson.videoUrl} type="video/mp4" />
                                        Tarayıcınız video oynatmayı desteklemiyor.
                                    </video>
                                )
                            ) : (
                                <div className="flex items-center justify-center h-full text-white">
                                    <div className="text-center">
                                        <Play className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                        <h2 className="text-xl font-bold mb-2">Video Hazırlanıyor</h2>
                                        <p className="text-gray-400">Bu ders için video içeriği yakında eklenecek.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-800 bg-gradient-to-r from-orange-500/10 to-transparent flex items-center justify-between">
                            <p className="text-sm text-gray-300">
                                🎓 <span className="text-orange-400 font-medium">Tüm derslere erişmek için</span> Premium üye olun.
                            </p>
                            <a
                                href="/subscription?plan=Premium"
                                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                            >
                                Premium Ol
                            </a>
                        </div>
                    </div>
                </div >
            )
            }
        </>
    )
}
