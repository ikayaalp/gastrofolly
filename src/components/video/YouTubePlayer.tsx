"use client"

import { useEffect, useRef } from "react"

interface YouTubePlayerProps {
  videoUrl: string
  onReady?: () => void
  onProgress?: (progress: number) => void
}

export default function YouTubePlayer({ videoUrl, onReady, onProgress }: YouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // YouTube URL'den video ID'sini çıkar
  const getVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const videoId = getVideoId(videoUrl)

  useEffect(() => {
    if (onReady) {
      onReady()
    }
  }, [onReady])

  if (!videoId) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <p>Geçersiz YouTube URL&apos;si</p>
      </div>
    )
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`

  return (
    <iframe
      ref={iframeRef}
      src={embedUrl}
      className="w-full h-full"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      title="YouTube Video Player"
    />
  )
}
