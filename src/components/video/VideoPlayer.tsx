"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw } from "lucide-react"
import YouTubePlayer from "./YouTubePlayer"

interface VideoPlayerProps {
  lesson: {
    id: string
    title: string
    description: string | null
    videoUrl: string | null
    duration: number | null
  }
  course: {
    id: string
    title: string
    instructor: {
      name: string | null
      image: string | null
    }
  }
  userId: string
  isCompleted: boolean
}

export default function VideoPlayer({ lesson, course, userId, isCompleted }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Debug için
  console.log("VideoPlayer - lesson:", lesson)
  console.log("VideoPlayer - videoUrl:", lesson.videoUrl)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleCanPlay = () => setIsLoading(false)
    const handleLoadStart = () => setIsLoading(true)
    const handleError = () => {
      console.log('Video error occurred')
      setIsPlaying(false)
      setIsLoading(false)
    }

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('loadedmetadata', updateDuration)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('error', handleError)
    }
  }, [])

  const togglePlay = async () => {
    const video = videoRef.current
    if (!video) return

    try {
      if (isPlaying) {
        video.pause()
        setIsPlaying(false)
      } else {
        // Video yüklenene kadar bekle
        if (video.readyState < 2) {
          await new Promise((resolve) => {
            video.addEventListener('canplay', resolve, { once: true })
          })
        }
        
        await video.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.log('Video play/pause error:', error)
      // Hata durumunda state'i güncelle
      setIsPlaying(video.paused === false)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const newTime = parseFloat(e.target.value)
    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = parseFloat(e.target.value)
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.volume = volume
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }

  const skip = (seconds: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds))
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      video.requestFullscreen()
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const markAsCompleted = async () => {
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId: lesson.id,
          courseId: course.id,
          isCompleted: true,
        }),
      })
    } catch (error) {
      console.error('Error marking lesson as completed:', error)
    }
  }

  // Video %80'i izlendiğinde tamamlandı olarak işaretle
  useEffect(() => {
    if (duration > 0 && currentTime / duration >= 0.8 && !isCompleted) {
      markAsCompleted()
    }
  }, [currentTime, duration, isCompleted, lesson.id, course.id])

  // YouTube URL kontrolü
  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be')
  }

  return (
    <div className="relative w-full h-[75vh] bg-black group flex-shrink-0">
      {lesson.videoUrl && lesson.videoUrl.trim() !== "" ? (
        isYouTubeUrl(lesson.videoUrl) ? (
          // YouTube Player
          <YouTubePlayer 
            videoUrl={lesson.videoUrl}
            onReady={() => setIsLoading(false)}
          />
        ) : (
          // Regular Video Player
          <>
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            onMouseMove={() => {
              setShowControls(true)
              setTimeout(() => setShowControls(false), 3000)
            }}
            onError={(e) => {
              console.log('Video error:', e)
              setIsPlaying(false)
            }}
          >
            <source src={lesson.videoUrl} type="video/mp4" />
            Tarayıcınız video oynatmayı desteklemiyor.
          </video>

          {/* Video Controls */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Progress Bar */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-white text-sm mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => skip(-10)}
                  className="text-white hover:text-orange-400 transition-colors"
                >
                  <RotateCcw className="h-6 w-6" />
                </button>

                <button
                  onClick={togglePlay}
                  className="bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-full transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-1" />
                  )}
                </button>

                <button
                  onClick={() => skip(10)}
                  className="text-white hover:text-orange-400 transition-colors"
                >
                  <RotateCw className="h-6 w-6" />
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    className="text-white hover:text-orange-400 transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:text-orange-400 transition-colors"
                >
                  <Maximize className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Lesson Info Overlay */}
          <div className="absolute top-4 left-4 text-white">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4">
              <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
              <p className="text-orange-500 mb-2">{course.title}</p>
              <div className="flex items-center space-x-2 text-sm">
                <span className="bg-orange-500/20 text-orange-500 px-2 py-1 rounded text-xs">
                  Chef2.0
                </span>
                {isCompleted && (
                  <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs">
                    ✓ Tamamlandı
                  </span>
                )}
              </div>
            </div>
          </div>
          </>
        )
      ) : (
        // Video yoksa placeholder
        <div className="flex items-center justify-center h-full text-white">
          <div className="text-center">
            <Play className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold mb-2">Video Hazırlanıyor</h2>
            <p className="text-gray-400">Bu ders için video içeriği yakında eklenecek.</p>
          </div>
        </div>
      )}
    </div>
  )
}
