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
                <div className="flex items-center justify-between p-4 border border-black rounded-lg transition-colors hover:border-orange-500/50 cursor-pointer">
                    <div className="flex items-center">
                        <div className="bg-orange-500/20 text-orange-500 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mr-4">
                            1
                        </div>
                        <div className="flex items-center">
                            <Play className="h-4 w-4 text-green-500 mr-2" />
                            <div>
                                <h3 className="font-semibold text-white">
                                    {lesson.title}
                                </h3>
                                {lesson.description && (
                                    <p className="text-sm text-gray-400">
                                        {lesson.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {lesson.duration && (
                            <span className="text-sm text-gray-400">
                                {lesson.duration} dk
                            </span>
                        )}
                        <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs font-semibold">
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
                        <div className="p-4 border-t border-gray-800 bg-gradient-to-r from-orange-500/10 to-transparent">
                            <p className="text-sm text-gray-300">
                                🎓 <span className="text-orange-400 font-medium">Tüm derslere erişmek için</span> Premium üye olun.
                            </p>
                        </div>
                    </div>
                </div >
            )
            }
        </>
    )
}
