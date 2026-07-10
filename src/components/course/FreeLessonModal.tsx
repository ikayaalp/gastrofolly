"use client"

import { useState, useRef, useEffect } from "react"
import { Play, ChefHat } from "lucide-react"
import Hls from "hls.js"
import Modal from "@/components/ui/Modal"
import { getCloudinaryHlsUrl } from "@/lib/cloudinaryVideo"

interface FreeLessonModalProps {
    lesson: {
        id: string
        title: string
        description: string | null
        videoUrl: string | null
        duration: number | null
    }
    courseTitle: string
    customTrigger?: React.ReactNode
}

export default function FreeLessonModal({ lesson, courseTitle, customTrigger }: FreeLessonModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (!isOpen || !lesson.videoUrl || !videoRef.current) return;

        const video = videoRef.current;
        const finalUrl = getCloudinaryHlsUrl(lesson.videoUrl) || lesson.videoUrl;

        if (Hls.isSupported() && finalUrl.endsWith('.m3u8')) {
            const hls = new Hls({
                capLevelToPlayerSize: true,
                maxBufferLength: 30,
            });
            hls.loadSource(finalUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(e => { if (process.env.NODE_ENV === 'development') { console.log('Autoplay prevented:', e) } });
            });

            return () => {
                hls.destroy();
            };
        } else {
            video.src = finalUrl;
            video.addEventListener('loadedmetadata', () => {
                video.play().catch(e => { if (process.env.NODE_ENV === 'development') { console.log('Autoplay prevented:', e) } });
            });
        }
    }, [isOpen, lesson.videoUrl]);

    const titleContent = (
        <div className="flex items-center space-x-3">
            <div className="bg-orange-500/10 p-2 rounded-lg">
                <ChefHat className="h-5 w-5 text-orange-500" />
            </div>
            <div>
                <span className="block text-lg font-bold text-white">{lesson.title}</span>
                <span className="block text-sm text-zinc-400 font-normal">{courseTitle}</span>
            </div>
        </div>
    );

    const footerContent = (
        <div className="w-full flex items-center justify-between">
            <p className="text-sm text-zinc-300">
                🎓 <span className="text-orange-400 font-medium">Tüm derslere erişmek için</span> Premium üye olun.
            </p>
            <a
                href="/subscription?plan=Premium"
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            >
                Premium Ol
            </a>
        </div>
    );

    return (
        <>
            {/* Trigger Button */}
            {customTrigger ? (
                <div onClick={() => setIsOpen(true)} className="cursor-pointer">
                    {customTrigger}
                </div>
            ) : (
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
                                            <span className="text-xs text-zinc-400 whitespace-nowrap pt-0.5">
                                                {lesson.duration || 0} dk
                                            </span>
                                        )}
                                    </div>
                                    {lesson.description && (
                                        <p className="hidden sm:block text-xs sm:text-sm text-zinc-400 mt-2 line-clamp-3 sm:line-clamp-none leading-relaxed">
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
            )}

            {/* Video Modal */}
            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title={titleContent}
                size="lg"
                footer={footerContent}
            >
                <div className="relative flex-1 min-h-[40vh] bg-black flex items-center justify-center -mx-6 rounded-lg overflow-hidden">
                    {lesson.videoUrl && lesson.videoUrl.trim() !== "" ? (
                        <video
                            ref={videoRef}
                            className="w-full h-full max-h-[50vh] object-contain"
                            controls
                            controlsList="nodownload"
                            onContextMenu={(e) => e.preventDefault()}
                            playsInline
                        >
                            Tarayıcınız video oynatmayı desteklemiyor.
                        </video>
                    ) : (
                        <div className="flex items-center justify-center h-full text-white py-12">
                            <div className="text-center">
                                <Play className="h-16 w-16 mx-auto mb-4 text-zinc-600" />
                                <h2 className="text-xl font-bold mb-2">Video Hazırlanıyor</h2>
                                <p className="text-zinc-500">Bu ders için video içeriği yakında eklenecek.</p>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    )
}
