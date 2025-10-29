"use client"

import React, { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, SkipBack, SkipForward } from "lucide-react"
import YouTubePlayer from "./YouTubePlayer"

// Lesson tipi interface olarak tanımlanıyor
interface Lesson {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  duration: number | null;
}

interface VideoPlayerProps {
  lesson: Lesson
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
  previousLesson?: Lesson | null
  nextLesson?: Lesson | null
}

export default function VideoPlayer({ lesson, course, userId, isCompleted, previousLesson, nextLesson }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null);
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCenterPlay, setShowCenterPlay] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const wasPlayingRef = useRef(false);

  // Kontrol barı için auto-hide id
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  // Kontrol barını 3sn gösterip sonra gizle (center play açıkken hep açık bırak)
  const triggerControls = () => {
    if (showCenterPlay) return;
    setShowControls(true);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    // cleanup timer on unmount
    return () => {
      if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    };
  }, []);

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

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = document.fullscreenElement === playerContainerRef.current;
      setIsFullscreen(isFs);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Video değiştiğinde otomatik oynat
  useEffect(() => {
    const video = videoRef.current;
    if (video && lesson.videoUrl) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
      setIsPlaying(true);
    }
  }, [lesson.id, lesson.videoUrl]);

  useEffect(() => {
    // Eğer büyük play açıkken video oynatmaya başlarsa ikon hemen kaybolsun
    if (isPlaying && showCenterPlay) {
      setShowCenterPlay(false);
    }
  }, [isPlaying]);

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

  // Seek işlemi için eventler
  const handleSeekStart = () => {
    const video = videoRef.current;
    if (video) {
      wasPlayingRef.current = !video.paused;
      video.pause();
      setIsSeeking(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeekEnd = () => {
    const video = videoRef.current;
    setIsSeeking(false);
    if (video && wasPlayingRef.current) {
      video.play();
      setShowCenterPlay(false);
    }
  };

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
    const playerContainer = playerContainerRef.current;
    if (!playerContainer) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      playerContainer.requestFullscreen();
    }
  };

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
  }, [currentTime, duration, isCompleted, lesson.id, course.id, markAsCompleted])

  // YouTube URL kontrolü
  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be')
  }

  // Video alanına tıklandığında oynat/duraklat (ve büyük ikon göster)
  const handleVideoAreaClick = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setShowCenterPlay(true);
    } else {
      video.play();
      setShowCenterPlay(false);
    }
  };

  return (
    <div
      ref={playerContainerRef}
      className={`relative w-full h-[75vh] bg-black group flex-shrink-0 ${isFullscreen ? 'w-screen h-screen max-w-none max-h-none !rounded-none fullscreen-active z-[10000]' : ''}`}
      style={isFullscreen ? { minHeight: '100vh', minWidth: '100vw' } : {}}
      onClick={handleVideoAreaClick}
      onMouseMove={triggerControls}
      onTouchMove={triggerControls}
    >
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
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls || showCenterPlay ? 'opacity-100' : 'opacity-0'}`}
          >
            {/* Progress Bar */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                onMouseDown={handleSeekStart}
                onMouseUp={handleSeekEnd}
                onTouchStart={handleSeekStart}
                onTouchEnd={handleSeekEnd}
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
                {/* Önceki Ders (SkipBack) */}
                <button
                  onClick={() => {
                    if (previousLesson) {
                      const url = new URL(window.location.href)
                      url.searchParams.set('lesson', previousLesson.id)
                      window.location.href = url.toString()
                    }
                  }}
                  disabled={!previousLesson}
                  className={`text-white hover:text-orange-400 transition-colors rounded-full p-2 ${!previousLesson ? 'opacity-40 cursor-not-allowed' : ''}`}
                  title="Önceki ders"
                >
                  <SkipBack className="h-7 w-7" />
                </button>

                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-full transition-colors mx-2"
                  title={isPlaying ? "Duraklat" : "Oynat"}
                >
                  {isPlaying ? (
                    <Pause className="h-7 w-7" />
                  ) : (
                    <Play className="h-7 w-7 ml-1" />
                  )}
                </button>

                {/* Sonraki Ders (SkipForward) */}
                <button
                  onClick={() => {
                    if (nextLesson) {
                      const url = new URL(window.location.href)
                      url.searchParams.set('lesson', nextLesson.id)
                      window.location.href = url.toString()
                    }
                  }}
                  disabled={!nextLesson}
                  className={`text-white hover:text-orange-400 transition-colors rounded-full p-2 ${!nextLesson ? 'opacity-40 cursor-not-allowed' : ''}`}
                  title="Sonraki ders"
                >
                  <SkipForward className="h-7 w-7" />
                </button>

                {/* Ses kontrolü */}
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-orange-400 transition-colors ml-4"
                  title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
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
              {/* Tam ekran */}
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
          {/* Tam ekran değilse başlık/açıklama overlay göster */}
          {!isFullscreen && (
            <div className="absolute top-4 left-4 text-white z-20">
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
          )}
          {/* Ortada büyük Play butonu */}
          {showCenterPlay && (
            <div className="absolute inset-0 flex justify-center items-center z-30 pointer-events-none">
              <button
                className="bg-orange-600 bg-opacity-90 rounded-full p-7 shadow-lg flex items-center justify-center border-2 border-orange-700 animate-pop pointer-events-auto hover:bg-orange-700 transition"
                style={{ pointerEvents: 'auto' }}
                onClick={handleVideoAreaClick}
              >
                <Play className="h-20 w-20 text-white drop-shadow-md" style={{ color: '#fff6e3' }}/> 
              </button>
            </div>
          )}
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
