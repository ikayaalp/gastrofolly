"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw, RotateCw, SkipBack, SkipForward, Loader2, AlertTriangle, Gauge, X, Layers } from "lucide-react"
import YouTubePlayer from "./YouTubePlayer"
import Hls from "hls.js"

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

interface QualityLevel {
  index: number;      // hls.js level index, -1 = Auto
  label: string;
  height: number;
}
const AUTO_NEXT_SECONDS = 5

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
  userEmail?: string | null
  isCompleted: boolean
  previousLesson?: Lesson | null
  nextLesson?: Lesson | null
  hasFullAccess?: boolean // Kullanıcının diğer derslere erişimi var mı?
}

export default function VideoPlayer({ lesson, course, userId, userEmail, isCompleted, previousLesson, nextLesson, hasFullAccess = true }: VideoPlayerProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false)


  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCenterPlay, setShowCenterPlay] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [autoNextSeconds, setAutoNextSeconds] = useState<number | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const wasPlayingRef = useRef(false);
  const isSeekingRef = useRef(false);
  const seekTimeRef = useRef<number>(0);
  // HLS kalite seçimi
  const hlsRef = useRef<Hls | null>(null);
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1); // -1 = Auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);

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

    const updateTime = () => {
      if (!isSeekingRef.current) {
        setCurrentTime(video.currentTime)
      }
    }
    const updateDuration = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleCanPlay = () => setIsLoading(false)
    const handleLoadStart = () => {
      setIsLoading(true)
      setHasError(false)
    }
    const handleError = () => {
      if (process.env.NODE_ENV === 'development') { console.log('Video error:', video.error) }
      setIsPlaying(false)
      setIsLoading(false)
      setHasError(true)
    }
    // iOS Safari, requestFullscreen yerine webkitEnterFullscreen kullanır ve
    // document 'fullscreenchange' event'i tetiklemez; state'i senkron tutmak
    // için bu iOS'a özel event'leri de dinlememiz gerekiyor.
    const handleIOSFullscreenBegin = () => setIsFullscreen(true)
    const handleIOSFullscreenEnd = () => setIsFullscreen(false)
    const handleEnded = () => {
      if (nextLesson && hasFullAccess) {
        setAutoNextSeconds(AUTO_NEXT_SECONDS)
      }
    }

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('durationchange', updateDuration)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('error', handleError)
    video.addEventListener('webkitbeginfullscreen', handleIOSFullscreenBegin)
    video.addEventListener('webkitendfullscreen', handleIOSFullscreenEnd)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('loadedmetadata', updateDuration)
      video.removeEventListener('durationchange', updateDuration)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('error', handleError)
      video.removeEventListener('webkitbeginfullscreen', handleIOSFullscreenBegin)
      video.removeEventListener('webkitendfullscreen', handleIOSFullscreenEnd)
      video.removeEventListener('ended', handleEnded)
    }
  }, [nextLesson, hasFullAccess])

  // İmzalı playback URL'ini sunucudan al. lesson.videoUrl artık Bunny GUID'i tutar;
  // oynatılabilir/imzalı URL yalnızca /api/lessons/{id}/video-url üzerinden, erişim
  // kontrolünden geçerek gelir. Legacy YouTube dersleri imza gerektirmez.
  useEffect(() => {
    let cancelled = false;
    setPlaybackUrl(null);
    if (!lesson.videoUrl) return;
    // Legacy tam URL (Cloudinary/YouTube) imza gerektirmez, doğrudan kullanılır.
    // Bunny GUID'i "http" ile başlamaz → imzalı URL endpoint'ten alınır.
    if (lesson.videoUrl.startsWith('http')) {
      setPlaybackUrl(lesson.videoUrl);
      return;
    }
    fetch(`/api/lessons/${lesson.id}/video-url`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => { if (!cancelled && data?.url) setPlaybackUrl(data.url); })
      .catch((err) => { if (!cancelled) { console.error("video-url error", err); setHasError(true); } });
    return () => { cancelled = true; };
  }, [lesson.id, lesson.videoUrl, retryKey]);

  // Video Kaynak Kurulumu.
  // Bunny HLS (.m3u8) → Chrome/Firefox native HLS oynatamaz, hls.js gerekir; Safari
  // native HLS oynatır; eski Cloudinary MP4 native oynatılır. retryKey artışında
  // (süresi dolan imza) kaynak yenilenir. (YouTube ayrı bileşende.)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackUrl || isYouTubeUrl(playbackUrl)) return;

    const isHls = playbackUrl.endsWith('.m3u8') || playbackUrl.includes('/bcdn_token=');

    // Eski hls instance'ını temizle
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    setQualityLevels([]);
    setSelectedQuality(-1);

    if (isHls && Hls.isSupported() && !video.canPlayType('application/vnd.apple.mpegurl')) {
      const hls = new Hls({ capLevelToPlayerSize: true, maxBufferLength: 30 });
      hlsRef.current = hls;
      hls.loadSource(playbackUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        video.play().catch(() => {});
        // Mevcut kalite seviyelerini state'e aktar
        const levels: QualityLevel[] = [
          { index: -1, label: 'Otomatik', height: 9999 },
          ...data.levels.map((lvl: { height: number }, i: number) => ({
            index: i,
            label: lvl.height ? `${lvl.height}p` : `Seviye ${i + 1}`,
            height: lvl.height ?? 0,
          })).sort((a: QualityLevel, b: QualityLevel) => b.height - a.height),
        ];
        setQualityLevels(levels);
      });
    } else {
      // Safari native HLS veya legacy MP4
      video.src = playbackUrl;
      video.load();
      if (retryKey > 0) video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playbackUrl, retryKey]);

  // Kalite değiştiğinde hls.js level'ını güncelle
  const changeQuality = (levelIndex: number) => {
    setSelectedQuality(levelIndex);
    setShowQualityMenu(false);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex; // -1 = auto
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = document.fullscreenElement === playerContainerRef.current;
      setIsFullscreen(isFs);
      // Fullscreen geçişinden sonra video durmuşsa tekrar oynat
      const video = videoRef.current;
      if (video && video.paused && wasPlayingRef.current) {
        setTimeout(() => {
          video.play().catch(() => { });
        }, 150);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Ders linklerinde tam sayfa yenilemesi yerine Next.js client-side routing kullan
  const navigateToLesson = (lessonId: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('lesson', lessonId)
    router.push(`${url.pathname}${url.search}`)
  }

  // lesson değiştiğinde progress'i çek ve otomatik oynat
  useEffect(() => {
    setAutoNextSeconds(null);
    const video = videoRef.current;
    if (video && lesson.videoUrl) {
      // Önce süreyi çek
      fetch(`/api/video-progress?lessonId=${lesson.id}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.timeWatched > 0 && videoRef.current) {
            videoRef.current.currentTime = data.timeWatched;
          }
          video.play().catch(() => { });
          setShowCenterPlay(false);
          setIsPlaying(true);
        })
        .catch(err => {
          console.error("Progress load error", err);
          video.play().catch(() => { });
          setShowCenterPlay(false);
          setIsPlaying(true);
        });
    }
  }, [lesson.id, lesson.videoUrl]);

  useEffect(() => {
    // Eğer büyük play açıkken video oynatmaya başlarsa ikon hemen kaybolsun
    if (isPlaying && showCenterPlay) {
      setShowCenterPlay(false);
    }
  }, [isPlaying]);

  const saveProgress = async (timeWatched: number, isCompletedOverride?: boolean) => {
    if (!lesson.id || !course.id || timeWatched <= 0) return
    try {
      await fetch('/api/video-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.id,
          courseId: course.id,
          timeWatched,
          ...(isCompletedOverride ? { isCompleted: true } : {}),
        }),
        keepalive: true,
      })
    } catch (error) {
      console.error("Progress save error", error);
    }
  }

  const togglePlay = async () => {
    const video = videoRef.current
    if (!video) return

    try {
      if (isPlaying) {
        video.pause()
        setIsPlaying(false)
        saveProgress(video.currentTime)
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
      if (process.env.NODE_ENV === 'development') { console.log('Video play/pause error:', error) }
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
      isSeekingRef.current = true;
      seekTimeRef.current = video.currentTime;
      setIsSeeking(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    seekTimeRef.current = newTime;
    setCurrentTime(newTime);
  };

  const handleSeekEnd = () => {
    const video = videoRef.current;
    isSeekingRef.current = false;
    setIsSeeking(false);
    if (video) {
      video.currentTime = seekTimeRef.current;
      if (wasPlayingRef.current) {
        video.play().catch(() => {});
        setShowCenterPlay(false);
      }
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

  const toggleFullscreen = async () => {
    const video = videoRef.current;
    const playerContainer = playerContainerRef.current;

    // Videonun o anki oynatma durumunu kaydet
    const wasPlaying = video ? !video.paused : false;
    wasPlayingRef.current = wasPlaying;

    // iOS Safari native fullscreen support
    if (video && (video as any).webkitEnterFullscreen) {
      (video as any).webkitEnterFullscreen();
      return;
    }

    if (!playerContainer) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await playerContainer.requestFullscreen();
    }

    // Fullscreen geçişinden sonra önceki oynatma durumunu koru
    if (video && wasPlaying) {
      // Kısa bir gecikme ile videonun oynamaya devam etmesini sağla
      setTimeout(() => {
        video.play().catch(() => { });
      }, 100);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Video %80'i izlendiğinde tamamlandı olarak işaretle
  useEffect(() => {
    if (duration > 0 && currentTime / duration >= 0.8 && !isCompleted) {
      saveProgress(videoRef.current?.currentTime || currentTime, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, duration, isCompleted, lesson.id, course.id])

  // Periyodik izleme süresi kaydetme (her 30 saniyede, oynatılırken)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isPlaying && lesson.id && course.id) {
      intervalId = setInterval(() => {
        const video = videoRef.current;
        if (!video) return;
        saveProgress(video.currentTime);
      }, 30000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, lesson.id, course.id]);

  // Dersten ayrılırken (unmount/ders değişimi) veya sekme kapatılırken son konumu kaydet
  useEffect(() => {
    const handleBeforeUnload = () => {
      const video = videoRef.current
      if (!video || video.currentTime <= 0) return
      const payload = JSON.stringify({
        lessonId: lesson.id,
        courseId: course.id,
        timeWatched: video.currentTime,
      })
      navigator.sendBeacon?.('/api/video-progress', new Blob([payload], { type: 'application/json' }))
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      handleBeforeUnload()
    }
  }, [lesson.id, course.id])

  // Video oynatma hızını uygula (ders değişse de kullanıcının seçtiği hız korunsun)
  useEffect(() => {
    const video = videoRef.current
    if (video) video.playbackRate = playbackRate
  }, [playbackRate, lesson.id])

  // Video bittiğinde otomatik sonraki derse geçiş için geri sayım
  useEffect(() => {
    if (autoNextSeconds === null) return
    if (autoNextSeconds <= 0) {
      if (nextLesson) navigateToLesson(nextLesson.id)
      return
    }
    const timeoutId = setTimeout(() => {
      setAutoNextSeconds((s) => (s !== null ? s - 1 : null))
    }, 1000)
    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoNextSeconds, nextLesson])

  // YouTube URL kontrolü
  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be')
  }

  // Kalite seçici UI bileşeni — web'de hız butonunun yanında, mobilin fullscreen'inde tam ekran butonunun yanında render edilir
  const QualitySelector = () => (
    qualityLevels.length > 1 ? (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowQualityMenu((v) => !v);
            setShowSpeedMenu(false);
          }}
          className="text-white hover:text-orange-400 transition-colors flex items-center gap-1"
          title="Video kalitesi"
        >
          <Layers className="h-5 w-5" />
          <span className="text-xs font-semibold">
            {selectedQuality === -1 ? 'Auto' : `${qualityLevels.find(q => q.index === selectedQuality)?.label ?? 'Auto'}`}
          </span>
        </button>
        {showQualityMenu && (
          <div className="absolute bottom-full right-0 mb-2 bg-[#1a1a1a] border border-gray-700 rounded-lg overflow-hidden shadow-lg z-10 min-w-[80px]">
            {qualityLevels.map((q) => (
              <button
                key={q.index}
                onClick={(e) => { e.stopPropagation(); changeQuality(q.index); }}
                className={`block w-full text-center px-3 py-1.5 text-sm transition-colors ${
                  q.index === selectedQuality ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        )}
      </div>
    ) : null
  );

  // Video alanına tıklama için div-click ile, ortadaki büyük play için button-click ile iki ayrı fonksiyon tanımla
  const handleVideoAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (showSpeedMenu) {
      setShowSpeedMenu(false);
    }
    if (showQualityMenu) {
      setShowQualityMenu(false);
    }
    if (
      e.target instanceof HTMLElement &&
      (e.target.closest('.video-control-buttons') || e.target.closest('button') || e.target.closest('input'))
    ) {
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setShowCenterPlay(true);
    } else {
      video.play().catch(() => {});
      setShowCenterPlay(false);
    }
  };

  const handleCenterPlayClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Üst div'e tıklamayı tetiklemesin
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
    setShowCenterPlay(false);
  };

  return (
    <div
      ref={playerContainerRef}
      className={`relative w-full aspect-video max-h-[85dvh] bg-black group flex-shrink-0 select-none ${isFullscreen ? 'w-screen h-screen max-w-none max-h-none !aspect-auto !rounded-none fullscreen-active z-[10000]' : ''}`}
      style={isFullscreen ? { minHeight: '100vh', minWidth: '100vw' } : {}}
      onClick={handleVideoAreaClick}
      onContextMenu={(e) => e.preventDefault()} // Sağ tık kapat (Anti-Download)
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
              playsInline
              webkit-playsinline="true"
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
              onMouseMove={() => {
                setShowControls(true)
                setTimeout(() => setShowControls(false), 3000)
              }}
            >
              Tarayıcınız video oynatmayı desteklemiyor.
            </video>

            {/* Yükleniyor göstergesi */}
            {isLoading && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <Loader2 className="h-10 w-10 md:h-14 md:w-14 text-orange-500 animate-spin" />
              </div>
            )}

            {/* Hata durumu */}
            {hasError && (
              <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/80">
                <div className="text-center px-4">
                  <AlertTriangle className="h-10 w-10 md:h-14 md:w-14 text-orange-500 mx-auto mb-3" />
                  <p className="text-white text-sm md:text-base mb-4">Video yüklenirken bir sorun oluştu.</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setHasError(false)
                      setIsLoading(true)
                      // HLS.js kaynakları video.src ile değil hls.attachMedia ile bağlı
                      // olduğundan video.load() yeterli değil; oynatıcıyı tamamen
                      // yeniden kurmak için HLS setup effect'ini retryKey ile tetikle.
                      setRetryKey((k) => k + 1)
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Tekrar Dene
                  </button>
                </div>
              </div>
            )}

            {/* Video Controls */}
            <div
              className={`video-control-buttons absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls || showCenterPlay ? 'opacity-100' : 'opacity-0'}`}
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
                <div className="flex items-center space-x-2 md:space-x-4">
                  {/* Önceki Ders (SkipBack) - İlk derse her zaman dönebilir */}
                  <button
                    onClick={() => {
                      if (previousLesson) navigateToLesson(previousLesson.id)
                    }}
                    disabled={!previousLesson}
                    className={`text-white hover:text-orange-400 transition-colors rounded-full p-2 ${!previousLesson ? 'opacity-40 cursor-not-allowed' : ''}`}
                    title="Önceki ders"
                  >
                    <SkipBack className="h-5 w-5 md:h-7 md:w-7" />
                  </button>

                  {/* 10sn geri sar */}
                  <button
                    onClick={(e) => { e.stopPropagation(); skip(-10); }}
                    className="text-white hover:text-orange-400 transition-colors rounded-full p-2"
                    title="10 saniye geri"
                  >
                    <RotateCcw className="h-5 w-5 md:h-6 md:w-6" />
                  </button>

                  {/* Play/Pause */}
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    className="bg-orange-600 hover:bg-orange-700 text-white p-2 md:p-3 rounded-full transition-colors mx-1 md:mx-2"
                    title={isPlaying ? "Duraklat" : "Oynat"}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5 md:h-7 md:w-7" />
                    ) : (
                      <Play className="h-5 w-5 md:h-7 md:w-7 ml-1" />
                    )}
                  </button>

                  {/* 10sn ileri sar */}
                  <button
                    onClick={(e) => { e.stopPropagation(); skip(10); }}
                    className="text-white hover:text-orange-400 transition-colors rounded-full p-2"
                    title="10 saniye ileri"
                  >
                    <RotateCw className="h-5 w-5 md:h-6 md:w-6" />
                  </button>

                  {/* Sonraki Ders (SkipForward) - Sadece hasFullAccess varsa çalışır */}
                  <button
                    onClick={() => {
                      if (nextLesson && hasFullAccess) navigateToLesson(nextLesson.id)
                    }}
                    disabled={!nextLesson || !hasFullAccess}
                    className={`text-white hover:text-orange-400 transition-colors rounded-full p-2 ${(!nextLesson || !hasFullAccess) ? 'opacity-40 cursor-not-allowed' : ''}`}
                    title={!hasFullAccess ? "Premium abonelik gerekli" : "Sonraki ders"}
                  >
                    <SkipForward className="h-5 w-5 md:h-7 md:w-7" />
                  </button>

                  {/* Ses kontrolü */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                    className="text-white hover:text-orange-400 transition-colors ml-2 md:ml-4"
                    title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
                  >
                    {isMuted ? (
                      <VolumeX className="h-5 w-5 md:h-6 md:w-6" />
                    ) : (
                      <Volume2 className="h-5 w-5 md:h-6 md:w-6" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 md:w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer block"
                  />
                </div>
                {/* Oynatma hızı + Kalite + Tam ekran */}
                <div className="flex items-center space-x-3 relative">
                  {/* Oynatma hızı */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowSpeedMenu((v) => !v)
                        setShowQualityMenu(false)
                      }}
                      className="text-white hover:text-orange-400 transition-colors flex items-center gap-1"
                      title="Oynatma hızı"
                    >
                      <Gauge className="h-5 w-5" />
                      <span className="text-xs font-semibold">{playbackRate}x</span>
                    </button>
                    {showSpeedMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-[#1a1a1a] border border-gray-700 rounded-lg overflow-hidden shadow-lg z-10 min-w-[72px]">
                        {PLAYBACK_RATES.map((rate) => (
                          <button
                            key={rate}
                            onClick={(e) => {
                              e.stopPropagation()
                              setPlaybackRate(rate)
                              setShowSpeedMenu(false)
                            }}
                            className={`block w-full text-center px-3 py-1.5 text-sm transition-colors ${rate === playbackRate ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-white/10'}`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Kalite seçici — oynatma hızının yanında */}
                  <QualitySelector />
                  {/* Tam ekran */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                    className="text-white hover:text-orange-400 transition-colors"
                    title={isFullscreen ? "Tam ekrandan çık" : "Tam ekran"}
                  >
                    {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Lesson Info Overlay */}
            {/* Tam ekran değilse ve video OYNAMIYORKEN başlık/açıklama overlay göster */}
            {!isFullscreen && !isPlaying && (
              <div className="absolute top-4 left-4 text-white z-20 max-w-[80%] pointer-events-none">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 md:p-4">
                  <h1 className="text-lg md:text-2xl font-bold mb-1 md:mb-2">{lesson.title}</h1>
                  <p className="text-orange-500 text-sm md:text-base mb-1 md:mb-2">{course.title}</p>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="bg-orange-500/20 text-orange-500 px-2 py-1 rounded text-xs">
                      Culinora
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
                  className="bg-orange-600 bg-opacity-90 rounded-full p-4 md:p-7 shadow-lg flex items-center justify-center border-2 border-orange-700 animate-pop pointer-events-auto hover:bg-orange-700 transition"
                  style={{ pointerEvents: 'auto' }}
                  onClick={handleCenterPlayClick}
                >
                  <Play className="h-10 w-10 md:h-20 md:w-20 text-white drop-shadow-md" style={{ color: '#fff6e3' }} />
                </button>
              </div>
            )}

            {/* Otomatik sonraki derse geçiş kartı */}
            {autoNextSeconds !== null && nextLesson && (
              <div className="absolute bottom-20 md:bottom-24 right-4 z-40 bg-[#141414] border border-gray-700 rounded-xl p-4 w-64 shadow-2xl">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-gray-400 text-xs">Sonraki ders {autoNextSeconds} saniye içinde başlıyor</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setAutoNextSeconds(null)
                    }}
                    className="text-gray-500 hover:text-white transition-colors -mt-1 -mr-1"
                    title="İptal"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-white text-sm font-semibold mb-3 line-clamp-2">{nextLesson.title}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateToLesson(nextLesson.id)
                  }}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                >
                  Şimdi İzle
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
